/**
 * Manual quick-join: sends a Recall.ai bot to a live Zoom or Meet URL.
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserExists } from "@/lib/ensure-user";
import { createDb } from "@/db";
import { recordings } from "@/db/schema";
import { apiRateLimit, getClientIp } from "@/lib/rate-limit";

const RECALL_BOT_URL =
  `${process.env.RECALL_API_BASE?.replace(/\/$/, "") ?? "https://us-west-2.recall.ai/api"}/v1/bot/`;

function isAllowedMeetingUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "meet.google.com") return true;
    if (host === "zoom.us" || host.endsWith(".zoom.us")) return true;
    return false;
  } catch {
    return false;
  }
}

const joinBodySchema = z.object({
  meeting_url: z
    .string()
    .min(1)
    .refine(isAllowedMeetingUrl, {
      message:
        "URL must start with https://meet.google.com or https://zoom.us (including regional subdomains)",
    }),
});

function sourceFromUrl(meetingUrl: string): "meet" | "zoom" {
  try {
    const host = new URL(meetingUrl).hostname.toLowerCase();
    return host === "meet.google.com" ? "meet" : "zoom";
  } catch {
    return "zoom";
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = apiRateLimit(`recordings-join:${ip}`, 10);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(user);

    const admin = createAdminClient();
    const { data: appUser } = await admin
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();
    const subStatus = appUser?.subscription_status ?? "free";
    if (subStatus === "free") {
      return NextResponse.json(
        { error: "Active subscription required. Please subscribe at /pricing" },
        { status: 403 }
      );
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = joinBodySchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.meeting_url?.[0] ?? "Invalid body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { meeting_url } = parsed.data;

    if (!process.env.RECALL_API_KEY) {
      return NextResponse.json({ error: "Recall.ai is not configured" }, { status: 500 });
    }

    const recallRes = await fetch(RECALL_BOT_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url,
        bot_name: "zeroentryai Notetaker",
        metadata: { userId: user.id },
        recording_config: {
          audio_mixed_mp4: {},
        },
      }),
    });

    const recallText = await recallRes.text();
    let recallJson: { id?: string; detail?: string; error?: string; message?: string } = {};
    try {
      recallJson = JSON.parse(recallText) as typeof recallJson;
    } catch {
      /* plain-text error */
    }

    if (!recallRes.ok) {
      const errMsg =
        (typeof recallJson.detail === "string" && recallJson.detail) ||
        (typeof recallJson.error === "string" && recallJson.error) ||
        (typeof recallJson.message === "string" && recallJson.message) ||
        recallText ||
        "Recall.ai request failed";
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const botId = recallJson.id;
    if (!botId) {
      return NextResponse.json(
        { error: "Recall.ai did not return a bot id" },
        { status: 502 }
      );
    }

    const db = createDb();
    const source = sourceFromUrl(meeting_url);

    await db.insert(recordings).values({
      userId: user.id,
      source,
      status: "processing",
      recallBotId: botId,
    });

    return NextResponse.json({ success: true, bot_id: botId });
  } catch (err) {
    console.error("[recordings/join]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
