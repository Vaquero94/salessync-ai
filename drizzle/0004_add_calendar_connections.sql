-- Recall.ai calendar integration: stores one calendar connection per user
DO $$ BEGIN
  CREATE TYPE "calendar_provider" AS ENUM ('google', 'microsoft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recall_calendar_id" text NOT NULL,
  "calendar_provider" "calendar_provider" NOT NULL,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
