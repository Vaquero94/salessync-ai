import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserExists } from "@/lib/ensure-user";
import { createDeepgramClient } from "@/lib/deepgram";
import { createOpenAIClient } from "@/lib/openai";
import { eq, and } from "drizzle-orm";
import { createDb } from "@/db";
import { recordings, extractions, users, crmConnections } from "@/db/schema";
import { NextResponse } from "next/server";
import { pushExtractionToHubSpot } from "@/lib/crm/hubspot";
import { hasExtractableSalesData } from "@/lib/crm/extraction-qualify";
import type { ExtractionData } from "@/components/ReviewCard";

const EXTRACTION_SYSTEM_PROMPT = `You are a sales call data extractor. Given a transcript, extract: contacts (name, role, company, email), deal info (value, stage change, close date), action items (owner, task, due date), objections, a 2-sentence summary, and sentiment. Return valid JSON only. If a field was not mentioned, set it to null. Never guess.

Return JSON with this exact structure:
{
  "contacts": [{"name": null, "role": null, "company": null, "email": null}],
  "dealInfo": {"value": null, "stageChange": null, "closeDate": null},
  "actionItems": [{"owner": null, "task": null, "dueDate": null}],
  "objections": [],
  "summary": null,
  "sentiment": null
}`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await ensureUserExists(user);

    const admin = createAdminClient();
    const { data: appUser } = await admin
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();
    const status = appUser?.subscription_status ?? "free";
    if (status === "free") {
      return NextResponse.json(
        { error: "Active subscription required. Please subscribe at /pricing" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Support both direct audioUrl and Recall.ai webhook payload
    const audioUrl =
      body.audioUrl ??
      body.recording_url ??
      body.recording?.url;

    if (!audioUrl || typeof audioUrl !== "string") {
      return NextResponse.json(
        { error: "Missing audioUrl or recording_url" },
        { status: 400 }
      );
    }

    const source = body.source ?? body.platform ?? "zoom";
    const validSource = ["zoom", "meet", "voice_note"].includes(source)
      ? source
      : "zoom";
    const durationMinutes = body.durationMinutes ?? body.duration ?? null;

    const db = createDb();

    // Create recording (status: processing)
    const [recording] = await db
      .insert(recordings)
      .values({
        userId: user.id,
        source: validSource,
        durationMinutes:
          typeof durationMinutes === "number" ? durationMinutes : null,
        status: "processing",
      })
      .returning();

    if (!recording) {
      return NextResponse.json(
        { error: "Failed to create recording" },
        { status: 500 }
      );
    }

    let transcriptText: string;

    try {
      const deepgram = createDeepgramClient();
      const response = await deepgram.listen.v1.media.transcribeUrl({
        url: audioUrl,
        model: "nova-3",
        diarize: true,
        punctuate: true,
        utterances: true,
      });

      // Sync response has results; callback mode returns request_id only
      const channel =
        "results" in response
          ? response.results?.channels?.[0]
          : undefined;
      const transcript = channel?.alternatives?.[0]?.transcript ?? "";

      if (!transcript?.trim()) {
        throw new Error("Empty transcript from Deepgram");
      }

      transcriptText = transcript;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(recordings)
        .set({
          status: "failed",
          errorDetails: `Transcription failed: ${message}`,
        })
        .where(eq(recordings.id, recording.id));
      return NextResponse.json(
        { error: "Transcription failed", details: message },
        { status: 500 }
      );
    }

    try {
      await db
        .update(recordings)
        .set({ transcriptText, status: "complete" })
        .where(eq(recordings.id, recording.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(recordings)
        .set({
          status: "failed",
          errorDetails: `DB update failed: ${message}`,
        })
        .where(eq(recordings.id, recording.id));
      return NextResponse.json(
        { error: "Failed to save transcript" },
        { status: 500 }
      );
    }

    let extractionJson: unknown;

    try {
      const openai = createOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: transcriptText },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty OpenAI response");
      }

      extractionJson = JSON.parse(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(recordings)
        .set({
          status: "failed",
          errorDetails: `Extraction failed: ${message}`,
        })
        .where(eq(recordings.id, recording.id));
      return NextResponse.json(
        { error: "Extraction failed", details: message },
        { status: 500 }
      );
    }

    try {
      const insertedExtraction = await db
        .insert(extractions)
        .values({
        recordingId: recording.id,
        userId: user.id,
        rawJson: extractionJson as Record<string, unknown>,
        approved: false,
        pushedToCrm: false,
        })
        .returning({ id: extractions.id });

      const extractionId = insertedExtraction[0]?.id;
      if (!extractionId) {
        throw new Error("Failed to retrieve inserted extraction id");
      }

      const userSettings = await db
        .select({
          autoPilot: users.autoPilot,
          autoPilotUnlocked: users.autoPilotUnlocked,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (userSettings[0]?.autoPilot && userSettings[0]?.autoPilotUnlocked) {
        const extractionPayload = extractionJson as ExtractionData;
        if (!hasExtractableSalesData(extractionPayload)) {
          console.info("Skipped HubSpot push — no extractable sales data found.");
          await db
            .update(extractions)
            .set({ approved: true })
            .where(and(eq(extractions.id, extractionId), eq(extractions.userId, user.id)));
        } else {
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
              extractionPayload,
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
              console.error("Auto-pilot HubSpot push failed:", result.error);
              return NextResponse.json(
                {
                  error: "Auto-pilot HubSpot push failed",
                  details: result.error ?? "Unknown HubSpot push error",
                },
                { status: 500 }
              );
            }

            await db
              .update(extractions)
              .set({ approved: true, pushedToCrm: true, pushedAt: new Date() })
              .where(and(eq(extractions.id, extractionId), eq(extractions.userId, user.id)));
            console.info("Auto-pilot: pushed to HubSpot without review");
          } else {
            await db
              .update(extractions)
              .set({ approved: true })
              .where(and(eq(extractions.id, extractionId), eq(extractions.userId, user.id)));
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(recordings)
        .set({
          status: "failed",
          errorDetails: `Failed to save extraction: ${message}`,
        })
        .where(eq(recordings.id, recording.id));
      return NextResponse.json(
        { error: "Failed to save extraction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      message: "Recording processed. Review extraction in dashboard.",
    });
  } catch (err) {
    console.error("Process error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
