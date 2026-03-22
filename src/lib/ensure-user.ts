/**
 * Ensures the app user exists in public.users. Creates row on first access.
 * Called from dashboard/protected routes so recordings and extractions can reference user_id.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export async function ensureUserExists(user: User): Promise<void> {
  const admin = createAdminClient();
  await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? null,
    },
    { onConflict: "id" }
  );
}
