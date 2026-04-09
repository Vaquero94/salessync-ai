/**
 * Recall.ai calendar OAuth callback.
 * Exchanges the Recall.ai code for a calendar connection and stores it.
 */
export const dynamic = "force-dynamic";

import { getPublicAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { calendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createCalendarConnection } from "@/lib/recall";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

function verifyState(stateB64: string): string | null {
  try {
    const secret = process.env.CRM_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
    if (!secret) return null;
    const { payload, sig } = JSON.parse(
      Buffer.from(stateB64, "base64url").toString("utf8")
    );
    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    if (sig !== expectedSig) return null;
    const [userId, , expStr] = payload.split(":");
    if (Date.now() > parseInt(expStr, 10)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const appOrigin = getPublicAppUrl();
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const provider = url.searchParams.get("provider");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?error=${encodeURIComponent(error)}`,
          appOrigin
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=missing_code", appOrigin)
      );
    }

    const calendarProvider =
      provider === "microsoft" ? "microsoft" : "google";

    const userId = verifyState(state);
    if (!userId) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=invalid_state", appOrigin)
      );
    }

    // Verify the authenticated user matches the state userId
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL("/login", appOrigin));
    }

    const webhookUrl = `${appOrigin}/api/recall/webhook`;

    // Reconstruct the redirect_uri we passed to Recall.ai (must match exactly)
    const redirectUri = new URL(`${appOrigin}/api/recall/calendar/callback`);
    redirectUri.searchParams.set("state", state);
    redirectUri.searchParams.set("provider", calendarProvider);

    const recallCalendarId = await createCalendarConnection({
      provider: calendarProvider,
      oauthCode: code,
      redirectUri: redirectUri.toString(),
      userId,
      webhookUrl,
    });

    const db = createDb();

    // Upsert: one calendar connection per user
    const existing = await db
      .select({ id: calendarConnections.id })
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(calendarConnections)
        .set({ recallCalendarId, calendarProvider })
        .where(eq(calendarConnections.id, existing[0].id));
    } else {
      await db.insert(calendarConnections).values({
        userId,
        recallCalendarId,
        calendarProvider,
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/settings?calendar=connected", appOrigin)
    );
  } catch (err) {
    console.error("Recall calendar callback error:", err);
    try {
      const origin = getPublicAppUrl();
      return NextResponse.redirect(
        new URL(
          "/dashboard/settings?error=calendar_callback_failed",
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
