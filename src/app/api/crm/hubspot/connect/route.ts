/**
 * Initiates HubSpot OAuth: redirects user to HubSpot consent page.
 * User must be authenticated. State contains signed userId for callback.
 */
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

const HUBSPOT_AUTH_URL = "https://app.hubspot.com/oauth/authorize";

const SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.objects.deals.read",
  "crm.objects.deals.write",
].join(" ");

function getRedirectUri(): string {
  return (
    process.env.HUBSPOT_REDIRECT_URI ??
    "https://zeroentryai.co/api/crm/hubspot/callback"
  );
}

function createState(userId: string): string {
  const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("CRM_ENCRYPTION_KEY or ENCRYPTION_KEY required for OAuth state");
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 10 * 60 * 1000; // 10 min
  const payload = `${userId}:${nonce}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    if (!clientId) {
      console.error("HUBSPOT_CLIENT_ID not configured");
      return NextResponse.redirect(new URL("/dashboard/settings?error=hubspot_not_configured", request.url));
    }

    const redirectUri = getRedirectUri();
    const state = createState(user.id);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    });

    return NextResponse.redirect(`${HUBSPOT_AUTH_URL}?${params}`);
  } catch (err) {
    console.error("HubSpot connect error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=connect_failed", request.url));
  }
}
