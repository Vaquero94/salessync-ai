/**
 * Initiates Recall.ai calendar OAuth flow.
 * Redirects user to Google/Microsoft consent page via Recall.ai.
 * ?provider=google|microsoft (defaults to google)
 */
export const dynamic = "force-dynamic";

import { getPublicAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { getCalendarAuthUrl } from "@/lib/recall";
import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

function buildRedirectUri(
  appOrigin: string,
  state: string,
  provider: string
): string {
  const uri = new URL(`${appOrigin}/api/recall/calendar/callback`);
  uri.searchParams.set("state", state);
  uri.searchParams.set("provider", provider);
  return uri.toString();
}

function createState(userId: string): string {
  const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("CRM_ENCRYPTION_KEY required for OAuth state");
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 10 * 60 * 1000; // 10 min
  const payload = `${userId}:${nonce}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export async function GET(request: Request) {
  try {
    const appOrigin = getPublicAppUrl();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(new URL("/login", appOrigin));
    }

    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") === "microsoft"
      ? "microsoft"
      : "google";

    const apiKey = process.env.RECALL_API_KEY;
    if (!apiKey) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=recall_not_configured", appOrigin)
      );
    }

    const state = createState(user.id);
    const redirectUri = buildRedirectUri(appOrigin, state, provider);
    const authUrl = await getCalendarAuthUrl(provider, redirectUri);

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Recall calendar connect error:", err);
    try {
      const origin = getPublicAppUrl();
      return NextResponse.redirect(
        new URL(
          "/dashboard/settings?error=calendar_connect_failed",
          origin
        )
      );
    } catch {
      return new NextResponse(
        "Set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL for redirects.",
        { status: 500 }
      );
    }
  }
}
