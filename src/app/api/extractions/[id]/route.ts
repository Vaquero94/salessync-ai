import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { extractions, crmConnections, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { pushExtractionToHubSpot } from "@/lib/crm/hubspot";
import { hasExtractableSalesData } from "@/lib/crm/extraction-qualify";
import type { ExtractionData } from "@/components/ReviewCard";

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

    const action = body.action as "approve" | "dismiss" | "update";
    const rawJson = body.rawJson as Record<string, unknown> | undefined;

    if (!["approve", "dismiss", "update"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve', 'dismiss', or 'update'" },
        { status: 400 }
      );
    }

    const db = createDb();

    if (action === "approve") {
      const currentExtraction = await db
        .select({ id: extractions.id, rawJson: extractions.rawJson })
        .from(extractions)
        .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)))
        .limit(1);

      if (currentExtraction.length === 0) {
        return NextResponse.json({ error: "Extraction not found" }, { status: 404 });
      }

      const approvedRawJson =
        (rawJson as ExtractionData | undefined) ??
        (currentExtraction[0].rawJson as ExtractionData | undefined);

      if (!approvedRawJson) {
        return NextResponse.json(
          { error: "rawJson required for approve" },
          { status: 400 }
        );
      }

      await db
        .update(extractions)
        .set({
          rawJson: approvedRawJson as Record<string, unknown>,
          approved: true,
          pushedToCrm: false,
          pushedAt: null,
        })
        .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)));

      const updatedUser = await db
        .update(users)
        .set({
          approvedExtractionCount: sql`${users.approvedExtractionCount} + 1`,
          autoPilotUnlocked: sql`CASE WHEN ${users.approvedExtractionCount} + 1 >= 10 THEN true ELSE ${users.autoPilotUnlocked} END`,
        })
        .where(eq(users.id, user.id))
        .returning({
          approvedExtractionCount: users.approvedExtractionCount,
          autoPilotUnlocked: users.autoPilotUnlocked,
        });

      if (!hasExtractableSalesData(approvedRawJson)) {
        console.info("Skipped HubSpot push — no extractable sales data found.");
        return NextResponse.json({
          success: true,
          pushedToCrm: false,
          approvedExtractionCount: updatedUser[0]?.approvedExtractionCount,
          autoPilotUnlocked: updatedUser[0]?.autoPilotUnlocked,
        });
      }

      const hubspotConn = await db
        .select()
        .from(crmConnections)
        .where(and(eq(crmConnections.userId, user.id), eq(crmConnections.crmType, "hubspot")))
        .limit(1);

      if (hubspotConn.length === 0) {
        return NextResponse.json({
          success: true,
          pushedToCrm: false,
          approvedExtractionCount: updatedUser[0]?.approvedExtractionCount,
          autoPilotUnlocked: updatedUser[0]?.autoPilotUnlocked,
        });
      }

      const redirectUri = `${new URL(request.url).origin}/api/crm/hubspot/callback`;
      const result = await pushExtractionToHubSpot(
        {
          id: hubspotConn[0].id,
          accessToken: hubspotConn[0].accessToken,
          refreshToken: hubspotConn[0].refreshToken,
        },
        approvedRawJson,
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

      if (!result.success) {
        console.error("HubSpot push failed after approval:", result.error);
        return NextResponse.json(
          {
            error: "HubSpot push failed after approval",
            details: result.error ?? "Unknown HubSpot push error",
          },
          { status: 500 }
        );
      }

      await db
        .update(extractions)
        .set({ pushedToCrm: true, pushedAt: new Date() })
        .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)));

      return NextResponse.json({
        success: true,
        pushedToCrm: true,
        approvedExtractionCount: updatedUser[0]?.approvedExtractionCount,
        autoPilotUnlocked: updatedUser[0]?.autoPilotUnlocked,
      });
    }

    if (action === "update") {
      if (!rawJson) {
        return NextResponse.json(
          { error: "rawJson required for update" },
          { status: 400 }
        );
      }
      await db
        .update(extractions)
        .set({ rawJson: rawJson as Record<string, unknown> })
        .where(and(eq(extractions.id, id), eq(extractions.userId, user.id)));
      return NextResponse.json({ success: true });
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
