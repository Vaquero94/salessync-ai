import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_CAPTURE_PREFERENCES,
  mergeCapturePreferences,
  normalizeCapturePreferences,
  type CapturePreferences,
} from "@/lib/capture-preferences";

const patchSchema = z.object({
  preferences: z.record(z.string(), z.boolean()),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createDb();
    const row = await db
      .select({ capturePreferences: users.capturePreferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const prefs = normalizeCapturePreferences(row[0]?.capturePreferences ?? null);
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    console.error("GET preferences:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = createDb();
    const current = await db
      .select({ capturePreferences: users.capturePreferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const merged = mergeCapturePreferences(
      current[0]?.capturePreferences ?? null,
      parsed.data.preferences as Partial<CapturePreferences>
    );

    await db
      .update(users)
      .set({ capturePreferences: merged as unknown as Record<string, unknown> })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, preferences: merged });
  } catch (e) {
    console.error("PATCH preferences:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
