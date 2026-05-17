-- Supabase schema snippets for AlphaAI
-- Create a profiles table that links to Supabase auth users

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamptz default now()
);

-- Simple watchlists table
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  owner uuid references public.profiles(id) on delete cascade,
  name text not null,
  symbols text[] default array[]::text[],
  created_at timestamptz default now()
);

-- Portfolios table
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner uuid references public.profiles(id) on delete cascade,
  name text not null,
  data jsonb,
  created_at timestamptz default now()
);

-- Alerts table
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  alert_type text not null check (alert_type in ('price_above', 'price_below')),
  threshold numeric not null,
  note text,
  is_triggered boolean default false,
  created_at timestamptz default now()
);

alter table if exists public.alerts
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists alert_type text,
  add column if not exists note text,
  add column if not exists threshold numeric,
  add column if not exists is_triggered boolean default false,
  add column if not exists created_at timestamptz default now();

alter table if exists public.alerts
  alter column symbol set not null;

alter table if exists public.alerts
  drop constraint if exists alerts_alert_type_check;

alter table if exists public.alerts
  add constraint alerts_alert_type_check check (alert_type in ('price_above', 'price_below'));

alter table public.alerts enable row level security;
drop policy if exists "users_own_alerts" on public.alerts;
create policy "users_own_alerts" on public.alerts
  using (auth.uid() = user_id);

create table if not exists public.portfolio_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  symbol text not null,
  quantity numeric not null,
  entry_price numeric not null,
  entry_date timestamptz default now(),
  notes text,
  market text default 'US',
  created_at timestamptz default now()
);

create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  symbol text not null,
  market text default 'US',
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

-- PSX / Local Exchange table for Pakistan Stock Exchange listings
create table if not exists public.psx_stocks (
  id uuid default gen_random_uuid() primary key,
  symbol text not null,
  name text,
  isin text,
  market text default 'PSX',
  last_price numeric,
  last_date timestamptz,
  market_cap numeric,
  metadata jsonb,
  created_at timestamptz default now()
);
create table if not exists public.portfolio_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  portfolio_value numeric not null,
  recorded_at timestamptz default now()
);
