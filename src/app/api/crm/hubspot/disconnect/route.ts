/**
 * Disconnects HubSpot by deleting the crm_connection.
 */
import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { crmConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const connectionId = body.connectionId as string | undefined;

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId required" },
        { status: 400 }
      );
    }

    const db = createDb();
    await db
      .delete(crmConnections)
      .where(
        and(
          eq(crmConnections.id, connectionId),
          eq(crmConnections.userId, user.id),
          eq(crmConnections.crmType, "hubspot")
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("HubSpot disconnect error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
