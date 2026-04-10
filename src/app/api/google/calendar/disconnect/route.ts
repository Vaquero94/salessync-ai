/**
 * Removes the user's direct Google Calendar connection (encrypted tokens).
 */
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { googleCalendarBotDispatches, googleCalendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createDb();
    await db
      .delete(googleCalendarBotDispatches)
      .where(eq(googleCalendarBotDispatches.userId, user.id));

    const deleted = await db
      .delete(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, user.id))
      .returning({ id: googleCalendarConnections.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "No Google Calendar connection found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Google Calendar disconnect error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 }
    );
  }
}
