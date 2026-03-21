import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Creates a Drizzle client for server-side use.
 * Requires DATABASE_URL in environment (Supabase connection string).
 */
export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}
