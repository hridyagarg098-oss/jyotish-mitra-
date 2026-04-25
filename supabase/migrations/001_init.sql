-- ═══════════════════════════════════════════════════
-- JYOTISH MITRA — SUPABASE MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- 1. USERS TABLE (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT,
  email          TEXT NOT NULL,
  dob            DATE,
  tob            TIME,
  pob            TEXT,
  lat            DECIMAL(9, 6),
  lng            DECIMAL(9, 6),
  gender         TEXT,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  chat_count_today  INTEGER NOT NULL DEFAULT 0,
  chat_reset_at  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only read/update their own row
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything (for admin client)
CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 2. KUNDLIS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kundlis (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rashi             TEXT NOT NULL,
  rashi_num         INTEGER NOT NULL,
  lagna             TEXT NOT NULL,
  lagna_num         INTEGER NOT NULL,
  nakshatra         TEXT NOT NULL,
  nakshatra_pada    INTEGER NOT NULL,
  planet_positions  JSONB NOT NULL DEFAULT '{}',
  dasha_periods     JSONB NOT NULL DEFAULT '[]',
  current_dasha     JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundlis_user_id ON public.kundlis(user_id);

-- RLS
ALTER TABLE public.kundlis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kundlis"
  ON public.kundlis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to kundlis"
  ON public.kundlis FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 3. CHAT MESSAGES TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to chat"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 4. DAILY RASHIFAL CACHE TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_rashifal (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rashi      TEXT NOT NULL,
  date       DATE NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rashi, date)
);

-- Public read access for rashifal (no auth needed)
ALTER TABLE public.daily_rashifal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rashifal"
  ON public.daily_rashifal FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to rashifal"
  ON public.daily_rashifal FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 5. MILAN RESULTS TABLE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.milan_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_name      TEXT NOT NULL,
  partner_dob       DATE NOT NULL,
  partner_tob       TIME,
  partner_pob       TEXT,
  partner_rashi     TEXT,
  partner_nakshatra TEXT,
  total_gunas       INTEGER NOT NULL,
  guna_breakdown    JSONB NOT NULL DEFAULT '{}',
  verdict           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milan_user_id ON public.milan_results(user_id);

-- RLS
ALTER TABLE public.milan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milan"
  ON public.milan_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to milan"
  ON public.milan_results FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────
-- 6. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────

-- Increment chat count atomically
CREATE OR REPLACE FUNCTION increment_chat_count(user_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    chat_count_today = chat_count_today + 1,
    chat_reset_at = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-insert into users on new Supabase auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────
-- 7. UPDATED_AT AUTO-UPDATE TRIGGER
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
