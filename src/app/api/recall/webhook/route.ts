/**
 * Recall.ai webhook receiver.
 * Handles audio completion events: transcribes audio and extracts sales data.
 * This endpoint is called by Recall.ai (no user auth cookie — uses service role).
 */
export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { createDeepgramClient } from "@/lib/deepgram";
import { createOpenAIClient } from "@/lib/openai";
import { createDb } from "@/db";
import { recordings, extractions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/recall";
import { NextResponse } from "next/server";

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

interface RecallWebhookPayload {
  event: string;
  data: {
    id?: string;
    metadata?: Record<string, unknown>;
    bot?: {
      id: string;
      metadata?: Record<string, unknown>;
      meeting_url?: string;
      platform?: string;
    };
    recordings?: Array<{
      media_shortcuts?: {
        audio_mixed?: { data?: { download_url?: string } };
        video_mixed?: { data?: { download_url?: string } };
      };
    }>;
    calendar_meetings?: Array<{
      calendar_user?: {
        external_id?: string;
      };
    }>;
    bot_id?: string;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!process.env.RECALL_WEBHOOK_SECRET) {
    console.error("RECALL_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const signatureHeader = request.headers.get("webhook-signature") ?? "";
  const signature = signatureHeader.startsWith("v1,")
    ? signatureHeader.slice(3)
    : signatureHeader;
  console.log("[Recall webhook] timestamp:", request.headers.get("webhook-timestamp"));
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[Recall webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: RecallWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event;

  // Process events that can carry mixed audio/video output links.
  if (eventType !== "audio_mixed.done" && eventType !== "bot.done") {
    return NextResponse.json({ received: true });
  }

  const botData = payload.data;
  const bot = botData.bot;
  const botId = bot?.id ?? botData.bot_id ?? botData.id;

  if (!botId) {
    console.error("Recall webhook: missing bot id", payload);
    return NextResponse.json({ error: "Missing bot id" }, { status: 400 });
  }

  // Try audio_mixed first; fallback to video_mixed for older test calls.
  const audioUrl =
    botData.recordings?.[0]?.media_shortcuts?.audio_mixed?.data?.download_url ??
    botData.recordings?.[0]?.media_shortcuts?.video_mixed?.data?.download_url;
  if (!audioUrl) {
    console.log("[Webhook] No audio URL found");
    return NextResponse.json({ received: true });
  }

  const metadataUserId =
    (botData.metadata?.userId as string | undefined) ??
    (bot?.metadata?.userId as string | undefined);
  const calendarUserEmail =
    botData.calendar_meetings?.[0]?.calendar_user?.external_id;

  const admin = createAdminClient();

  let userId = metadataUserId;
  if (!userId && calendarUserEmail) {
    const { data: calendarUser } = await admin
      .from("users")
      .select("id")
      .eq("email", calendarUserEmail)
      .single();
    userId = calendarUser?.id;
  }

  if (!userId) {
    console.error("Recall webhook: missing userId (metadata + calendar lookup)", botId);
    return NextResponse.json({ received: true, skipped: "missing_user" });
  }

  // Check user exists and has an active subscription
  const { data: appUser } = await admin
    .from("users")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  if (!appUser || appUser.subscription_status === "free") {
    console.warn(`Recall webhook: user ${userId} has no active subscription — skipping`);
    return NextResponse.json({ received: true, skipped: "no_subscription" });
  }

  const platform = (bot?.platform ?? "zoom").toLowerCase();
  const source = platform.includes("meet")
    ? "meet"
    : "zoom";

  const db = createDb();

  const existingByBot = await db
    .select()
    .from(recordings)
    .where(eq(recordings.recallBotId, botId))
    .limit(1);

  let recording = existingByBot[0];

  if (recording) {
    if (recording.userId !== userId) {
      console.error("Recall webhook: bot userId mismatch", botId);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    const [inserted] = await db
      .insert(recordings)
      .values({
        userId,
        source,
        status: "processing",
        recallBotId: botId,
      })
      .returning();
    if (!inserted) {
      return NextResponse.json({ error: "Failed to create recording" }, { status: 500 });
    }
    recording = inserted;
  }

  // Transcribe
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

    const channel =
      "results" in response ? response.results?.channels?.[0] : undefined;
    const transcript = channel?.alternatives?.[0]?.transcript ?? "";

    if (!transcript.trim()) throw new Error("Empty transcript from Deepgram");
    transcriptText = transcript;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(recordings)
      .set({ status: "failed", errorDetails: `Transcription failed: ${message}` })
      .where(eq(recordings.id, recording.id));
    console.error(`Recall webhook: transcription failed for bot ${botId}:`, message);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  await db
    .update(recordings)
    .set({ transcriptText, status: "complete" })
    .where(eq(recordings.id, recording.id));

  // Extract sales data
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
    if (!content) throw new Error("Empty OpenAI response");
    extractionJson = JSON.parse(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(recordings)
      .set({ status: "failed", errorDetails: `Extraction failed: ${message}` })
      .where(eq(recordings.id, recording.id));
    console.error(`Recall webhook: extraction failed for bot ${botId}:`, message);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }

  await db.insert(extractions).values({
    recordingId: recording.id,
    userId,
    rawJson: extractionJson as Record<string, unknown>,
    approved: false,
    pushedToCrm: false,
  });

  console.log(`Recall webhook: processed recording ${recording.id} for user ${userId}`);
  return NextResponse.json({ success: true, recordingId: recording.id });
}
