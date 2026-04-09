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
 * @param redirectUri — Must match connect route; built from NEXT_PUBLIC_APP_URL only (see getOAuthPublicBaseUrl).
 */
export async function getCalendarAuthUrl(
  provider: "google" | "microsoft",
  redirectUri: string
): Promise<string> {
  const res = await recallFetch(
    `/v2/calendar-auth/${provider}/?redirect_uri=${encodeURIComponent(redirectUri)}`
  );
  if (!res.ok) {
    const body = await res.text();
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
}): Promise<string> {
  const res = await recallFetch("/v2/calendars/", {
    method: "POST",
    body: JSON.stringify({
      platform: opts.provider,
      oauth_code: opts.oauthCode,
      redirect_uri: opts.redirectUri,
      webhook_url: opts.webhookUrl,
      bot_config: {
        bot_name: "Sale Sync Notetaker",
        recording_mode: "audio_only",
        metadata: { userId: opts.userId },
        transcription_options: { provider: "default" },
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
 * Header format: "sha256=<hex_digest>"
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const secret = process.env.RECALL_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  return signatureHeader === expected;
}
