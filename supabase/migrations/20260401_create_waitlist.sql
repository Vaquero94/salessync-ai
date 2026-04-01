-- Create waitlist table for landing page signups
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Allow anyone to insert (public waitlist signup)
create policy "Anyone can join waitlist"
  on public.waitlist
  for insert
  with check (true);

-- Only service role can read (no public read access)
