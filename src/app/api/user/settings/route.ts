import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  auto_pilot: z.boolean(),
});

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

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = createDb();
    await db
      .update(users)
      .set({ autoPilot: parsed.data.auto_pilot })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
