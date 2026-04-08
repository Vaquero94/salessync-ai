/**
 * Disconnects the user's Recall.ai calendar connection.
 * Deletes the calendar from Recall.ai and removes the DB record.
 */
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteCalendarConnection } from "@/lib/recall";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createDb();
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, user.id))
      .limit(1);

    if (!connection) {
      return NextResponse.json(
        { error: "No calendar connection found" },
        { status: 404 }
      );
    }

    await deleteCalendarConnection(connection.recallCalendarId);

    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.id, connection.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Recall calendar disconnect error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
