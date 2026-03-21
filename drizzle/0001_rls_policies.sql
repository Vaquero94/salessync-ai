-- Enable Row Level Security on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "crm_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recordings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extractions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_syncs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- users: users can only access their own row (id = auth.uid())
CREATE POLICY "users_select_own" ON "users" FOR SELECT USING (auth.uid() = "id");--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users" FOR INSERT WITH CHECK (auth.uid() = "id");--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users" FOR UPDATE USING (auth.uid() = "id");--> statement-breakpoint
CREATE POLICY "users_delete_own" ON "users" FOR DELETE USING (auth.uid() = "id");--> statement-breakpoint

-- crm_connections: users can only access their own connections
CREATE POLICY "crm_connections_select_own" ON "crm_connections" FOR SELECT USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "crm_connections_insert_own" ON "crm_connections" FOR INSERT WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "crm_connections_update_own" ON "crm_connections" FOR UPDATE USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "crm_connections_delete_own" ON "crm_connections" FOR DELETE USING (auth.uid() = "user_id");--> statement-breakpoint

-- recordings: users can only access their own recordings
CREATE POLICY "recordings_select_own" ON "recordings" FOR SELECT USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "recordings_insert_own" ON "recordings" FOR INSERT WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "recordings_update_own" ON "recordings" FOR UPDATE USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "recordings_delete_own" ON "recordings" FOR DELETE USING (auth.uid() = "user_id");--> statement-breakpoint

-- extractions: users can only access their own extractions
CREATE POLICY "extractions_select_own" ON "extractions" FOR SELECT USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "extractions_insert_own" ON "extractions" FOR INSERT WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "extractions_update_own" ON "extractions" FOR UPDATE USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "extractions_delete_own" ON "extractions" FOR DELETE USING (auth.uid() = "user_id");--> statement-breakpoint

-- email_syncs: users can only access their own email syncs
CREATE POLICY "email_syncs_select_own" ON "email_syncs" FOR SELECT USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "email_syncs_insert_own" ON "email_syncs" FOR INSERT WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "email_syncs_update_own" ON "email_syncs" FOR UPDATE USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "email_syncs_delete_own" ON "email_syncs" FOR DELETE USING (auth.uid() = "user_id");
