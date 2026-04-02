import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles auth callback from Supabase (email confirmation, magic links).
 * Exchanges code for session and redirects to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error; redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
