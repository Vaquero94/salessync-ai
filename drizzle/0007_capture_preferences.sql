alter table users
add column if not exists capture_preferences jsonb default '{
  "contact": true,
  "deal": true,
  "action_items": true,
  "summary": true,
  "sentiment": false,
  "objections": false,
  "next_meeting": false
}'::jsonb;
