import { createClient } from "@/lib/supabase/server";
import { createStripeServerClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to subscribe" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const planId = body.planId as string;

    if (!planId || !PLAN_PRICE_IDS[planId]) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'starter' or 'pro'" },
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
          price: PLAN_PRICE_IDS[planId],
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
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
