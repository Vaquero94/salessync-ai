/**
 * HubSpot OAuth callback: exchanges code for tokens, stores encrypted in crm_connections.
 */
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { crmConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";

function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/crm/hubspot/callback`;
}

function verifyState(stateB64: string): string | null {
  try {
    const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
    if (!secret) return null;
    const { payload, sig } = JSON.parse(Buffer.from(stateB64, "base64url").toString("utf8"));
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    const [userId, , expStr] = payload.split(":");
    const exp = parseInt(expStr, 10);
    if (Date.now() > exp) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("HubSpot OAuth error:", error);
      return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=missing_code", request.url));
    }

    const userId = verifyState(state);
    if (!userId) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=invalid_state", request.url));
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=hubspot_not_configured", request.url));
    }

    const redirectUri = getRedirectUri(request);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(HUBSPOT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("HubSpot token exchange failed:", tokenRes.status, errBody);
      return NextResponse.redirect(new URL("/dashboard/settings?error=token_exchange_failed", request.url));
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    const db = createDb();

    // Upsert: one HubSpot connection per user
    const existing = await db
      .select()
      .from(crmConnections)
      .where(and(eq(crmConnections.userId, userId), eq(crmConnections.crmType, "hubspot")))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(crmConnections)
        .set({
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          lastSyncAt: null,
        })
        .where(eq(crmConnections.id, existing[0].id));
    } else {
      await db.insert(crmConnections).values({
        userId,
        crmType: "hubspot",
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
      });
    }

    return NextResponse.redirect(new URL("/dashboard/settings?hubspot=connected", request.url));
  } catch (err) {
    console.error("HubSpot callback error:", err);
    return NextResponse.redirect(new URL("/dashboard/settings?error=callback_failed", request.url));
  }
}
