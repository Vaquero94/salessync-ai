/**
 * Recall.ai API client helpers for calendar integration.
 * Docs: https://docs.recall.ai/docs/regions — use the regional host for your workspace.
 * api.recall.ai resolves to us-east-1; us-west-2 keys must use https://us-west-2.recall.ai/api
 *
 * Override with RECALL_API_BASE (no trailing slash), e.g. https://eu-central-1.recall.ai/api
 */
import { createHmac } from "node:crypto";

const DEFAULT_RECALL_API_BASE = "https://us-west-2.recall.ai/api";

function getRecallApiBase(): string {
  const fromEnv = process.env.RECALL_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_RECALL_API_BASE;
}

function getApiKey(): string {
  const key = process.env.RECALL_API_KEY;
  if (!key) throw new Error("Missing RECALL_API_KEY");
  return key;
}

async function recallFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${getRecallApiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${getApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

/**
 * Returns the Recall.ai OAuth URL for connecting a user's calendar.
 * Provider: 'google' | 'microsoft'
 */
export async function getCalendarAuthUrl(
  provider: "google" | "microsoft",
  redirectUri: string
): Promise<string> {
  const path = `/v2/calendar-auth/${provider}/?redirect_uri=${encodeURIComponent(redirectUri)}`;
  const fullUrl = `${getRecallApiBase()}${path}`;

  const res = await recallFetch(path);
  if (!res.ok) {
    const body = await res.text();
    console.error("[Recall calendar-auth] Recall.ai request failed", {
      endpoint: "GET calendar-auth (OAuth start)",
      requestUrl: fullUrl,
      httpStatus: res.status,
      httpStatusText: res.statusText,
      responseBody: body,
    });
    throw new Error(`Recall.ai auth URL fetch failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { auth_url: string };
  return data.auth_url;
}

/**
 * Creates a Recall.ai calendar connection after the user completes OAuth.
 * Returns the calendar ID assigned by Recall.ai.
 */
export async function createCalendarConnection(opts: {
  provider: "google" | "microsoft";
  oauthCode: string;
  redirectUri: string;
  userId: string;
  webhookUrl: string;
  recordingConfig?: {
    audio_mixed_mp4?: Record<string, never>;
  };
}): Promise<string> {
  const res = await recallFetch("/v2/calendars/", {
    method: "POST",
    body: JSON.stringify({
      platform: opts.provider,
      oauth_code: opts.oauthCode,
      redirect_uri: opts.redirectUri,
      webhook_url: opts.webhookUrl,
      bot_config: {
        bot_name: "Zero Entry AI Notetaker",
        recording_mode: "audio_only",
        metadata: { userId: opts.userId },
        recording_config: opts.recordingConfig ?? {
          audio_mixed_mp4: {},
        },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Recall.ai calendar creation failed (${res.status}): ${body}`
    );
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Deletes a Recall.ai calendar connection.
 */
export async function deleteCalendarConnection(
  recallCalendarId: string
): Promise<void> {
  const res = await recallFetch(`/v2/calendars/${recallCalendarId}/`, {
    method: "DELETE",
  });
  // 204 = success, 404 = already gone — both are acceptable
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(
      `Recall.ai calendar deletion failed (${res.status}): ${body}`
    );
  }
}

/**
 * Fetches the audio URL for a completed bot recording.
 * Returns null if not yet available.
 */
/**
 * Sends a Recall.ai bot to a meeting URL (Zoom, Meet, Teams, etc.).
 * Metadata.userId is required for the recording webhook pipeline.
 */
export async function createBotForMeeting(opts: {
  meetingUrl: string;
  userId: string;
  /** ISO 8601 — Recall recommends ~10+ minutes ahead for scheduled joins */
  joinAtIso?: string | null;
}): Promise<string> {
  const body: Record<string, unknown> = {
    meeting_url: opts.meetingUrl,
    bot_name: "Zero Entry AI Notetaker",
    recording_mode: "audio_only",
    metadata: { userId: opts.userId },
    transcription_options: { provider: "default" },
  };
  if (opts.joinAtIso) {
    body.join_at = opts.joinAtIso;
  }
  const res = await recallFetch("/v1/bot/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Recall.ai bot create failed (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function getBotAudioUrl(botId: string): Promise<string | null> {
  const res = await recallFetch(`/v1/bot/${botId}/`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    video_url?: string | null;
    media_shortcuts?: {
      audio_mixed?: { data?: { url?: string } };
    };
  };
  return (
    data.media_shortcuts?.audio_mixed?.data?.url ??
    data.video_url ??
    null
  );
}

/**
 * Verifies a Recall.ai webhook HMAC-SHA256 signature.
 * Header format (Recall.ai): "v1,<base64_signature>".
 * Caller should pass only the base64 signature part.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RECALL_WEBHOOK_SECRET;

  console.log(
    "[Recall sig] secret first 10 chars:",
    secret ? secret.substring(0, 10) : "MISSING"
  );
  console.log("[Recall sig] secret last 4 chars:", secret ? secret.slice(-4) : "MISSING");

  if (!secret) {
    console.error("[Recall sig] RECALL_WEBHOOK_SECRET is not set");
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  console.log("[Recall sig] received:", signature);
  console.log("[Recall sig] expected:", expected);
  console.log("[Recall sig] secret length:", secret.length);
  console.log("[Recall sig] body length:", rawBody.length);
  console.log("[Recall sig] match:", signature === expected);

  return signature === expected;
}
