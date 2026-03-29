import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeServerClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_BY_PRICE_ID: Record<string, "starter" | "pro"> = {};

function initPlanMap() {
  const starter = process.env.STRIPE_STARTER_PRICE_ID;
  const pro = process.env.STRIPE_PRO_PRICE_ID;
  if (starter) PLAN_BY_PRICE_ID[starter] = "starter";
  if (pro) PLAN_BY_PRICE_ID[pro] = "pro";
}

initPlanMap();

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  // Stripe requires the raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = createStripeServerClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!customerId || !subscriptionId) break;

        const stripe = createStripeServerClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const item = subscription.items.data[0];
        const priceId = item?.price.id;
        const status = PLAN_BY_PRICE_ID[priceId ?? ""] ?? "starter";
        const periodEnd = item?.current_period_end;
        const endDate = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        const userId = session.client_reference_id as string | null;
        const email =
          (session.customer_email as string) ??
          (session.customer_details as Stripe.Checkout.Session["customer_details"])?.email;

        if (!email) break;

        const payload = {
          stripe_customer_id: customerId,
          subscription_status: status,
          ...(endDate && { subscription_end_date: endDate }),
        };

        if (userId) {
          await supabase.from("users").upsert(
            { id: userId, email, ...payload },
            { onConflict: "id" }
          );
        } else {
          const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();
          if (existing) {
            await supabase.from("users").update(payload).eq("id", existing.id);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive =
          subscription.status === "active" || subscription.status === "trialing";
        const item = subscription.items.data[0];
        const priceId = item?.price.id;
        const status =
          isActive ? (PLAN_BY_PRICE_ID[priceId ?? ""] ?? "starter") : "free";
        const periodEnd = item?.current_period_end;
        const endDate = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await supabase
          .from("users")
          .update({
            subscription_status: status,
            subscription_end_date: status === "free" ? null : (endDate ?? null),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("users")
          .update({
            subscription_status: "free",
            subscription_end_date: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
