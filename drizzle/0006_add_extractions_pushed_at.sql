alter table extractions
add column if not exists pushed_at timestamp with time zone;
