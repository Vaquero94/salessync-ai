-- Links app recording rows to Recall.ai bots (manual quick-join + webhook handoff)
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS recall_bot_id text;
CREATE UNIQUE INDEX IF NOT EXISTS recordings_recall_bot_id_unique ON recordings (recall_bot_id);
