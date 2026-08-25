-- ============================================================================
-- Street Tab — Marketplace, Quests, Surplus, Community Resources
-- Migration 004
-- ============================================================================

-- ============================================================================
-- 1. MARKETPLACE_LISTINGS — Buy/sell/trade
-- ============================================================================
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'food', 'services', 'rides', 'goods', 'education', 'housing', 'jobs'
  )),
  price_mly NUMERIC(12,2) NOT NULL CHECK (price_mly >= 0),
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable', 'free', 'trade')),
  images TEXT[] DEFAULT '{}',
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'parts')),
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'expired', 'removed')),
  accepts_mly BOOLEAN NOT NULL DEFAULT TRUE,
  views INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_category ON public.marketplace_listings(category, status, created_at DESC);
CREATE INDEX idx_listings_seller ON public.marketplace_listings(seller_id, status);
CREATE INDEX idx_listings_status ON public.marketplace_listings(status, expires_at);
CREATE INDEX idx_listings_location ON public.marketplace_listings(latitude, longitude)
  WHERE latitude IS NOT NULL;

-- ============================================================================
-- 2. QUESTS — Community tasks with $MLY rewards
-- ============================================================================
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'community' CHECK (category IN (
    'community', 'cleanup', 'repair', 'delivery', 'teaching', 'caregiving',
    'verification', 'safety', 'gardening', 'tech_support'
  )),
  reward_mly NUMERIC(12,2) NOT NULL CHECK (reward_mly > 0),
  reward_source TEXT NOT NULL DEFAULT 'creator' CHECK (reward_source IN ('creator', 'treasury', 'sponsor')),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_estimate_minutes INTEGER,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_completions INTEGER NOT NULL DEFAULT 1,
  current_completions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'expired', 'cancelled')),
  requires_verification BOOLEAN NOT NULL DEFAULT TRUE,
  verifier_id UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quests_status ON public.quests(status, created_at DESC);
CREATE INDEX idx_quests_category ON public.quests(category, status);
CREATE INDEX idx_quests_creator ON public.quests(creator_id);
CREATE INDEX idx_quests_location ON public.quests(latitude, longitude)
  WHERE latitude IS NOT NULL;

-- ============================================================================
-- 3. QUEST_CLAIMS — Who is working on / completed a quest
-- ============================================================================
CREATE TABLE public.quest_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  claimer_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'submitted', 'verified', 'rejected', 'expired')),
  evidence_text TEXT,
  evidence_images TEXT[] DEFAULT '{}',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  UNIQUE(quest_id, claimer_id)
);

CREATE INDEX idx_quest_claims_quest ON public.quest_claims(quest_id, status);
CREATE INDEX idx_quest_claims_claimer ON public.quest_claims(claimer_id, status);

-- ============================================================================
-- 4. COMMUNITY_RESOURCES — Shelters, food banks, clinics, legal aid
-- ============================================================================
CREATE TABLE public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'shelter', 'food', 'legal', 'clinic', 'transit', 'jobs', 'housing',
    'mental_health', 'substance_recovery', 'childcare', 'clothing', 'financial'
  )),
  description TEXT NOT NULL DEFAULT '',
  address TEXT,
  phone TEXT,
  url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  hours JSONB DEFAULT '{}',
  accepts_mly BOOLEAN NOT NULL DEFAULT FALSE,
  accessibility TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"en"}',
  -- MiSource freshness fields
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  verification_method TEXT CHECK (verification_method IN ('human_visit', 'phone_call', 'web_scrape', 'api_check', 'community_report', 'official_feed', 'unverified')),
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  stale_behavior TEXT DEFAULT 'show_with_warning' CHECK (stale_behavior IN ('show_with_warning', 'hide', 'show_last_known', 'redirect_to_call')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stale', 'closed', 'unverified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON public.community_resources(category, status);
CREATE INDEX idx_resources_location ON public.community_resources(latitude, longitude)
  WHERE latitude IS NOT NULL;
CREATE INDEX idx_resources_freshness ON public.community_resources(expires_at, status);

-- ============================================================================
-- 5. SURPLUS_ITEMS — Food/goods about to expire (time-limited)
-- ============================================================================
CREATE TABLE public.surplus_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'food' CHECK (category IN ('food', 'goods', 'clothing', 'furniture', 'other')),
  quantity TEXT NOT NULL DEFAULT '1',
  pickup_location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  available_until TIMESTAMPTZ NOT NULL,
  claimed_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'picked_up', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surplus_status ON public.surplus_items(status, available_until);
CREATE INDEX idx_surplus_category ON public.surplus_items(category, status);
CREATE INDEX idx_surplus_donor ON public.surplus_items(donor_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surplus_items ENABLE ROW LEVEL SECURITY;

-- MARKETPLACE: public read active, seller writes
CREATE POLICY "listings_select" ON public.marketplace_listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "listings_insert" ON public.marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_update" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "listings_delete" ON public.marketplace_listings
  FOR DELETE USING (auth.uid() = seller_id);

-- QUESTS: public read open, creator writes
CREATE POLICY "quests_select" ON public.quests
  FOR SELECT USING (status IN ('open', 'in_progress', 'completed') OR creator_id = auth.uid());
CREATE POLICY "quests_insert" ON public.quests
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "quests_update" ON public.quests
  FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = verifier_id);

-- QUEST_CLAIMS: participants see own, quest creator sees all for their quest
CREATE POLICY "claims_select" ON public.quest_claims
  FOR SELECT USING (
    claimer_id = auth.uid()
    OR quest_id IN (SELECT id FROM public.quests WHERE creator_id = auth.uid())
  );
CREATE POLICY "claims_insert" ON public.quest_claims
  FOR INSERT WITH CHECK (auth.uid() = claimer_id);
CREATE POLICY "claims_update" ON public.quest_claims
  FOR UPDATE USING (
    auth.uid() = claimer_id
    OR auth.uid() = verified_by
    OR quest_id IN (SELECT id FROM public.quests WHERE creator_id = auth.uid())
  );

-- RESOURCES: public read
CREATE POLICY "resources_select" ON public.community_resources
  FOR SELECT USING (status IN ('active', 'stale'));
CREATE POLICY "resources_insert" ON public.community_resources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "resources_update" ON public.community_resources
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- SURPLUS: public read available, donor writes
CREATE POLICY "surplus_select" ON public.surplus_items
  FOR SELECT USING (status = 'available' OR donor_id = auth.uid() OR claimed_by = auth.uid());
CREATE POLICY "surplus_insert" ON public.surplus_items
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "surplus_update" ON public.surplus_items
  FOR UPDATE USING (auth.uid() = donor_id OR auth.uid() = claimed_by);

-- ============================================================================
-- SEED: Sample community resources for Jacksonville
-- ============================================================================
INSERT INTO public.community_resources (name, category, description, address, phone, verification_method, confidence, status) VALUES
  ('Clara White Mission', 'shelter', 'Emergency shelter and meals for individuals experiencing homelessness.', '613 W Ashley St, Jacksonville, FL 32202', '(904) 354-4162', 'human_visit', 0.9, 'active'),
  ('Sulzbacher Center', 'shelter', 'Comprehensive services including shelter, healthcare, and workforce development.', '611 E Adams St, Jacksonville, FL 32202', '(904) 359-0457', 'human_visit', 0.9, 'active'),
  ('Feeding Northeast Florida', 'food', 'Food bank serving Duval, Nassau, Baker, Clay, St. Johns, and Flagler counties.', '1116 Edgewood Ave N, Jacksonville, FL 32254', '(904) 513-1232', 'phone_call', 0.85, 'active'),
  ('Jacksonville Area Legal Aid', 'legal', 'Free civil legal services for low-income residents.', '126 W Adams St, Jacksonville, FL 32202', '(904) 356-8371', 'web_scrape', 0.8, 'active'),
  ('Agape Community Health Center', 'clinic', 'Sliding-scale primary care, dental, and behavioral health.', '1760 Edgewood Ave W, Jacksonville, FL 32208', '(904) 265-8346', 'phone_call', 0.85, 'active'),
  ('JTA (Jacksonville Transportation)', 'transit', 'Public bus and Skyway. First Coast Flyer rapid transit.', 'Downtown Jacksonville', '(904) 630-3100', 'api_check', 0.95, 'active'),
  ('CareerSource Northeast Florida', 'jobs', 'Job search assistance, training programs, and career counseling.', '1845 Town Center Blvd, Fleming Island, FL 32003', '(904) 213-3888', 'web_scrape', 0.8, 'active'),
  ('Mental Health Resource Center', 'mental_health', 'Crisis services, counseling, and case management.', '1650 Memorial Park Rd, Jacksonville, FL 32204', '(904) 695-9145', 'phone_call', 0.85, 'active')
ON CONFLICT DO NOTHING;
