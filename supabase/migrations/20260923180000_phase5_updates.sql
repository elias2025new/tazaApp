-- Phase 5 DB Updates

-- 1. Add phone_number to profiles
alter table public.profiles add column phone_number text;

-- 2. Add scheduled_for to orders
alter table public.orders add column scheduled_for timestamptz;

-- 3. Create store_settings table (Singleton)
create table public.store_settings (
  id integer primary key check (id = 1), -- Ensure only one row exists
  is_open boolean not null default true,
  updated_at timestamptz default now()
);

-- Enable RLS (Read for everyone, Write only for service role/staff)
alter table public.store_settings enable row level security;
create policy "Anyone can read store settings" on public.store_settings
  for select using (true);

-- Insert the default singleton row
insert into public.store_settings (id, is_open) values (1, true);
