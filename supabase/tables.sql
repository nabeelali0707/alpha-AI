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
