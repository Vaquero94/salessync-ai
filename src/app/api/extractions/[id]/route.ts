import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { extractions, crmConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { pushExtractionToHubSpot } from "@/lib/crm/hubspot";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const action = body.action as "approve" | "dismiss";
    const rawJson = body.rawJson as Record<string, unknown> | undefined;

    if (!["approve", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'dismiss'" },
        { status: 400 }
      );
    }

    const db = createDb();

    if (action === "approve") {
      if (!rawJson) {
        return NextResponse.json(
          { error: "rawJson required for approve" },
          { status: 400 }
        );
      }

      let pushedToCrm = false;

      // Push to HubSpot if connected
      const hubspotConn = await db
        .select()
        .from(crmConnections)
        .where(and(eq(crmConnections.userId, user.id), eq(crmConnections.crmType, "hubspot")))
        .limit(1);

      if (hubspotConn.length > 0) {
        const redirectUri = `${new URL(request.url).origin}/api/crm/hubspot/callback`;
        const result = await pushExtractionToHubSpot(
          {
            id: hubspotConn[0].id,
            accessToken: hubspotConn[0].accessToken,
            refreshToken: hubspotConn[0].refreshToken,
          },
          rawJson as Parameters<typeof pushExtractionToHubSpot>[1],
          redirectUri,
          async (newAccess, newRefresh) => {
            await db
              .update(crmConnections)
              .set({
                accessToken: newAccess,
                refreshToken: newRefresh ?? hubspotConn[0].refreshToken,
              })
              .where(eq(crmConnections.id, hubspotConn[0].id));
          }
        );
        pushedToCrm = result.success;
        if (!result.success && result.error) {
          console.error("HubSpot push error:", result.error);
        }
      }

      await db
        .update(extractions)
        .set({
          rawJson,
          approved: true,
          pushedToCrm,
        })
        .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)));

      return NextResponse.json({
        success: true,
        pushedToCrm,
        pushError: pushedToCrm ? undefined : hubspotConn?.length ? "Push to CRM failed" : undefined,
      });
    }

    await db
      .update(extractions)
      .set({ dismissed: true })
      .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Extraction update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
