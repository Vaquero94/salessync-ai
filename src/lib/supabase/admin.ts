import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service role for server-side admin operations.
 * Bypasses RLS - use only in trusted server contexts (e.g. webhooks).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin env vars");
  }

  return createClient(url, serviceRoleKey);
}
