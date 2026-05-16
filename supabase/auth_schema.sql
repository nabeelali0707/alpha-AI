-- [ignoring loop detection]
-- ============================================================
-- AlphaAI — Portfolio Management Schema
-- ============================================================

-- 1. Portfolio Holdings
DROP TABLE IF EXISTS public.portfolio_holdings CASCADE;
CREATE TABLE public.portfolio_holdings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  company_name TEXT,
  quantity     NUMERIC(18, 6) NOT NULL DEFAULT 0,
  average_buy_price NUMERIC(18, 4) NOT NULL,
  market       TEXT DEFAULT 'US',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own holdings" ON public.portfolio_holdings FOR ALL USING (auth.uid() = user_id);

-- 2. Portfolio History (for performance tracking)
DROP TABLE IF EXISTS public.portfolio_history CASCADE;
CREATE TABLE public.portfolio_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value  NUMERIC(18, 4) NOT NULL,
  cash_balance NUMERIC(18, 4) DEFAULT 0,
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.portfolio_history FOR SELECT USING (auth.uid() = user_id);

-- 3. Watchlists
DROP TABLE IF EXISTS public.watchlists CASCADE;
CREATE TABLE public.watchlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  name        TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlists FOR ALL USING (auth.uid() = user_id);

-- 4. Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.portfolio_holdings TO authenticated;
GRANT ALL ON public.portfolio_history TO authenticated;
GRANT ALL ON public.watchlists TO authenticated;
