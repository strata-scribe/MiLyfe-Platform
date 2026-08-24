-- MiLyfe MVP — Add missing tables to live Supabase
-- Only creates tables that don't exist yet (wallets, transactions, standing, 
-- attestations, votes, forum_replies, health_resources, connections, rewards, 
-- apps, community_treasury)

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  spending_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (spending_balance >= 0),
  savings_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (savings_balance >= 0),
  community_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (community_balance >= 0),
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_ubi_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.profiles(id),
  to_user_id UUID REFERENCES public.profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('ubi','transfer','reward','spend','burn','community_contribution')),
  pot TEXT NOT NULL DEFAULT 'spending' CHECK (pot IN ('spending','savings','community')),
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON public.transactions(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON public.transactions(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type, created_at DESC);

-- STANDING
CREATE TABLE IF NOT EXISTS public.standing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  neighbor NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (neighbor BETWEEN 0 AND 100),
  carer NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (carer BETWEEN 0 AND 100),
  maker NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (maker BETWEEN 0 AND 100),
  teacher NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (teacher BETWEEN 0 AND 100),
  keeper NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (keeper BETWEEN 0 AND 100),
  voice NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (voice BETWEEN 0 AND 100),
  shop NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (shop BETWEEN 0 AND 100),
  helper NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (helper BETWEEN 0 AND 100),
  overall NUMERIC(4,2) GENERATED ALWAYS AS (
    (neighbor + carer + maker + teacher + keeper + voice + shop + helper) / 8
  ) STORED,
  last_decay_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ATTESTATIONS
CREATE TABLE IF NOT EXISTS public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),
  facet TEXT NOT NULL CHECK (facet IN ('neighbor','carer','maker','teacher','keeper','voice','shop','helper')),
  weight NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0.1 AND 5.0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attestations_to ON public.attestations(to_user_id, created_at DESC);

-- VOTES
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  direction TEXT NOT NULL CHECK (direction IN ('for','against','abstain')),
  weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- FORUM_REPLIES
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  parent_reply_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON public.forum_replies(post_id, created_at ASC);

-- HEALTH_RESOURCES
CREATE TABLE IF NOT EXISTS public.health_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clinic','mental_health','crisis','harm_reduction','wellness','pharmacy')),
  description TEXT DEFAULT '',
  address TEXT,
  phone TEXT,
  url TEXT,
  accepts_mly BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONNECTIONS
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON public.connections(addressee_id, status);

-- REWARDS
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ubi','quest','attestation','contribution','milestone','welcome')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON public.rewards(user_id, claimed, created_at DESC);

-- APPS
CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT,
  url TEXT,
  category TEXT NOT NULL DEFAULT 'utility' CHECK (category IN ('utility','social','economy','governance','health','education','safety','media')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','suspended')),
  install_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apps_category ON public.apps(category, status);

-- COMMUNITY_TREASURY
CREATE TABLE IF NOT EXISTS public.community_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_burned NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_distributed NUMERIC(14,2) NOT NULL DEFAULT 0,
  citizen_count INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== RLS POLICIES =====

-- WALLETS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallets_select' AND tablename = 'wallets') THEN
    CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallets_all' AND tablename = 'wallets') THEN
    CREATE POLICY "wallets_all" ON public.wallets FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transactions_select' AND tablename = 'transactions') THEN
    CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transactions_insert' AND tablename = 'transactions') THEN
    CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = from_user_id OR from_user_id IS NULL);
  END IF;
END $$;

-- STANDING
ALTER TABLE public.standing ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'standing_select' AND tablename = 'standing') THEN
    CREATE POLICY "standing_select" ON public.standing FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'standing_update' AND tablename = 'standing') THEN
    CREATE POLICY "standing_update" ON public.standing FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ATTESTATIONS
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attestations_select' AND tablename = 'attestations') THEN
    CREATE POLICY "attestations_select" ON public.attestations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attestations_insert' AND tablename = 'attestations') THEN
    CREATE POLICY "attestations_insert" ON public.attestations FOR INSERT WITH CHECK (auth.uid() = from_user_id AND auth.uid() != to_user_id);
  END IF;
END $$;

-- VOTES
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'votes_select' AND tablename = 'votes') THEN
    CREATE POLICY "votes_select" ON public.votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'votes_insert' AND tablename = 'votes') THEN
    CREATE POLICY "votes_insert" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- FORUM_REPLIES
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'forum_replies_select' AND tablename = 'forum_replies') THEN
    CREATE POLICY "forum_replies_select" ON public.forum_replies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'forum_replies_insert' AND tablename = 'forum_replies') THEN
    CREATE POLICY "forum_replies_insert" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- HEALTH_RESOURCES
ALTER TABLE public.health_resources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'health_resources_select' AND tablename = 'health_resources') THEN
    CREATE POLICY "health_resources_select" ON public.health_resources FOR SELECT USING (true);
  END IF;
END $$;

-- CONNECTIONS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'connections_select' AND tablename = 'connections') THEN
    CREATE POLICY "connections_select" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'connections_insert' AND tablename = 'connections') THEN
    CREATE POLICY "connections_insert" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'connections_update' AND tablename = 'connections') THEN
    CREATE POLICY "connections_update" ON public.connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
END $$;

-- REWARDS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rewards_select' AND tablename = 'rewards') THEN
    CREATE POLICY "rewards_select" ON public.rewards FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rewards_update' AND tablename = 'rewards') THEN
    CREATE POLICY "rewards_update" ON public.rewards FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- APPS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'apps_select' AND tablename = 'apps') THEN
    CREATE POLICY "apps_select" ON public.apps FOR SELECT USING (status = 'published' OR auth.uid() = developer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'apps_insert' AND tablename = 'apps') THEN
    CREATE POLICY "apps_insert" ON public.apps FOR INSERT WITH CHECK (auth.uid() = developer_id);
  END IF;
END $$;

-- COMMUNITY_TREASURY
ALTER TABLE public.community_treasury ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'treasury_select' AND tablename = 'community_treasury') THEN
    CREATE POLICY "treasury_select" ON public.community_treasury FOR SELECT USING (true);
  END IF;
END $$;

-- ===== FUNCTIONS =====

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'wallets_updated_at') THEN
    CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'standing_updated_at') THEN
    CREATE TRIGGER standing_updated_at BEFORE UPDATE ON public.standing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- ===== SEED DATA FOR NEW TABLES =====

-- Initial treasury
INSERT INTO public.community_treasury (balance, citizen_count) VALUES (10000, 1) ON CONFLICT DO NOTHING;
