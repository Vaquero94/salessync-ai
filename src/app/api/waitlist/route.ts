import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    const { name, email } = parsed.data;
    // Keep DB constraints satisfied when name is omitted from the email-only form.
    const fallbackName = email.split("@")[0]?.trim() || "Waitlist User";
    const safeName = name?.trim() || fallbackName;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("waitlist")
      .insert({ name: safeName, email });

    if (error) {
      // Duplicate email — treat as success so we don't leak existence
      if (error.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
