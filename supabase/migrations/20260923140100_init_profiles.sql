-- Enable pgcrypto for UUIDs
create extension if not exists "pgcrypto";

-- Create profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text,
  last_name text,
  username text,
  phone text,
  language_code text default 'en',
  bot_blocked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" 
  on public.profiles 
  for select 
  using (id = auth.uid());

-- Create staff role enum
create type public.staff_role as enum ('kitchen', 'rider', 'manager', 'owner');

-- Create staff_roles table
create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) not null,
  role public.staff_role not null,
  created_at timestamptz default now()
);

-- Enable RLS on staff_roles
alter table public.staff_roles enable row level security;

-- Policy: Staff can view their own role
create policy "Staff can view own role"
  on public.staff_roles 
  for select
  using (profile_id = auth.uid());

-- Trigger to automatically update the updated_at column on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
