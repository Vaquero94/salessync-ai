/**
 * Scheduled job: scan Google Calendars for meetings that invite the notetaker bot, dispatch Recall.ai bots.
 * Protect with CRON_SECRET: Authorization: Bearer <CRON_SECRET>.
 * Schedule every 15 minutes (e.g. Vercel Cron, Railway cron, or external scheduler).
 */
export const dynamic = "force-dynamic";

import { createDb } from "@/db";
import { runGoogleCalendarBotSync } from "@/lib/googleCalendarSync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization");
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createDb();
    const result = await runGoogleCalendarBotSync(db);

    return NextResponse.json({
      ok: true,
      usersProcessed: result.usersProcessed,
      botsScheduled: result.botsScheduled,
      errors: result.errors,
    });
  } catch (err) {
    console.error("google-calendar-sync cron error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
