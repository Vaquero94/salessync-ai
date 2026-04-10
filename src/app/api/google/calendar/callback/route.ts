/**
 * Google OAuth callback: exchanges code for tokens and stores encrypted tokens in Supabase.
 */
export const dynamic = "force-dynamic";

import { createDb } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { exchangeGoogleAuthCode } from "@/lib/googleCalendar";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

function verifyState(stateB64: string): string | null {
  try {
    const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
    if (!secret) return null;
    const { payload, sig } = JSON.parse(
      Buffer.from(stateB64, "base64url").toString("utf8")
    );
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
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_code", request.url)
      );
    }

    const userId = verifyState(state);
    if (!userId) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=invalid_state", request.url)
      );
    }

    const tokens = await exchangeGoogleAuthCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=google_no_refresh_token", request.url)
      );
    }

    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = encrypt(tokens.refresh_token);

    const db = createDb();
    const existing = await db
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(googleCalendarConnections)
        .set({
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
        })
        .where(eq(googleCalendarConnections.id, existing[0].id));
    } else {
      await db.insert(googleCalendarConnections).values({
        userId,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/settings?google_calendar=connected", request.url)
    );
  } catch (err) {
    console.error("Google Calendar callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_token_exchange_failed", request.url)
    );
  }
}
