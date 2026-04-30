import { createClient } from "@/lib/supabase/server";
import { createStripeServerClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch stripe_customer_id from our users table
    const admin = createAdminClient();
    const { data: appUser, error: fetchError } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (fetchError || !appUser?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const stripe = createStripeServerClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: appUser.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
