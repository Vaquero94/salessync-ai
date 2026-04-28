alter table users
add column if not exists auto_pilot boolean default false;

alter table users
add column if not exists auto_pilot_unlocked boolean default false;

alter table users
add column if not exists approved_extraction_count integer default 0;
