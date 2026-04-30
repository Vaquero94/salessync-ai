import { createClient } from "@/lib/supabase/server";
import { createStripeServerClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Read price IDs at request time so .env.local changes apply without rebuild.
 */
function getPlanPriceIds(): Record<string, string> {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID?.trim() ?? "",
    pro: process.env.STRIPE_PRO_PRICE_ID?.trim() ?? "",
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = body.planId as string | undefined;
    const planPriceIds = getPlanPriceIds();
    const priceId = planId ? planPriceIds[planId] : undefined;

    if (!planId || !(planId in planPriceIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const stripe = createStripeServerClient();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing`,
      customer_email: user.email,
      client_reference_id: user.id,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[stripe/checkout] Stripe error:", err.type, err.code);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    console.error("[stripe/checkout] Non-Stripe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
