-- MmediCompannion - Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jsccrvbqikypddwrexdv/sql

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  practice_name text default 'My Practice',
  hpcsa_number text,
  trial_start date,
  trial_end date,
  subscription_status text default 'none' check (subscription_status in ('none', 'trial', 'active', 'cancelled', 'expired')),
  subscription_tier text default 'professional' check (subscription_tier in ('professional', 'practice')),
  payment_reference text,
  payment_gateway text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Trigger to auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, practice_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'practice_name', 'My Practice'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_modified_column();
