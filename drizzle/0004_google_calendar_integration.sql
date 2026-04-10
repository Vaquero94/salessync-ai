-- Direct Google Calendar OAuth (encrypted tokens) + Recall bot dispatch deduplication
CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "google_calendar_connections_user_id_unique" UNIQUE ("user_id")
);

CREATE TABLE IF NOT EXISTS "google_calendar_bot_dispatches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "google_event_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "google_calendar_bot_dispatches_user_event_unique" UNIQUE ("user_id", "google_event_id")
);

ALTER TABLE "google_calendar_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "google_calendar_bot_dispatches" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_calendar_connections_select_own" ON "google_calendar_connections" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "google_calendar_connections_insert_own" ON "google_calendar_connections" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "google_calendar_connections_update_own" ON "google_calendar_connections" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "google_calendar_connections_delete_own" ON "google_calendar_connections" FOR DELETE USING (auth.uid() = "user_id");

CREATE POLICY "google_calendar_bot_dispatches_select_own" ON "google_calendar_bot_dispatches" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "google_calendar_bot_dispatches_insert_own" ON "google_calendar_bot_dispatches" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "google_calendar_bot_dispatches_update_own" ON "google_calendar_bot_dispatches" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "google_calendar_bot_dispatches_delete_own" ON "google_calendar_bot_dispatches" FOR DELETE USING (auth.uid() = "user_id");
