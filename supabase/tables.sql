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
  owner uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  threshold numeric,
  comparison text,
  enabled boolean default true,
  created_at timestamptz default now()
);

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
