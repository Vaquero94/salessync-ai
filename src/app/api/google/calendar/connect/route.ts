/**
 * Starts Google OAuth for Calendar read access. Redirect URI must match Google Cloud console.
 */
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getGoogleCalendarRedirectUri } from "@/lib/googleCalendar";
import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ");

function createState(userId: string): string {
  const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CRM_ENCRYPTION_KEY or ENCRYPTION_KEY required for OAuth state");
  }
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${userId}:${nonce}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=google_not_configured", request.url)
      );
    }

    const redirectUri = getGoogleCalendarRedirectUri();
    const state = createState(user.id);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return NextResponse.redirect(`${GOOGLE_AUTH}?${params}`);
  } catch (err) {
    console.error("Google Calendar connect error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_calendar_connect_failed", request.url)
    );
  }
}
