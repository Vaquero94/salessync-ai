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
    } = await supabase.auth.getUser();

    console.log("[stripe/checkout] Session:", {
      hasUser: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });

    if (!user?.email) {
      console.log("[stripe/checkout] Rejecting: no user or email");
      return NextResponse.json(
        { error: "You must be logged in to subscribe" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planId = body.planId as string | undefined;
    const planPriceIds = getPlanPriceIds();
    const priceId = planId ? planPriceIds[planId] : undefined;

    console.log("[stripe/checkout] Plan resolution:", {
      planIdFromBody: planId,
      STRIPE_STARTER_PRICE_ID: planPriceIds.starter
        ? `${planPriceIds.starter.slice(0, 8)}…`
        : "(empty)",
      STRIPE_PRO_PRICE_ID: planPriceIds.pro
        ? `${planPriceIds.pro.slice(0, 8)}…`
        : "(empty)",
      resolvedPriceId: priceId
        ? `${priceId.slice(0, 12)}… (len ${priceId.length})`
        : "(none)",
    });

    if (!planId || !(planId in planPriceIds)) {
      console.log("[stripe/checkout] 400: unknown planId");
      return NextResponse.json(
        {
          error: "Invalid plan. Use 'starter' or 'pro'",
          receivedPlanId: planId ?? null,
        },
        { status: 400 }
      );
    }

    if (!priceId) {
      console.log(
        "[stripe/checkout] 400: price ID missing for plan — set STRIPE_STARTER_PRICE_ID / STRIPE_PRO_PRICE_ID (use price_xxx from Stripe Dashboard)"
      );
      return NextResponse.json(
        {
          error: `Missing Stripe price ID for plan "${planId}". Set STRIPE_${planId.toUpperCase()}_PRICE_ID in environment (must be a Price ID like price_..., not prod_...).`,
          planId,
        },
        { status: 400 }
      );
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

    console.log("[stripe/checkout] Calling Stripe checkout.sessions.create with:", {
      mode: sessionParams.mode,
      line_items: sessionParams.line_items,
      success_url: sessionParams.success_url,
      cancel_url: sessionParams.cancel_url,
      customer_email: user.email,
      client_reference_id: user.id,
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[stripe/checkout] Stripe success, session id:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[stripe/checkout] Stripe error (full):", {
        type: err.type,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        raw: err.raw,
        param: err.param,
      });
      return NextResponse.json(
        {
          error: "Stripe rejected checkout session",
          stripeMessage: err.message,
          stripeType: err.type,
          stripeCode: err.code,
          stripeParam: err.param,
          stripeStatusCode: err.statusCode,
          stripeRaw: err.raw,
        },
        { status: err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 502 }
      );
    }

    console.error("[stripe/checkout] Non-Stripe error:", err);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
