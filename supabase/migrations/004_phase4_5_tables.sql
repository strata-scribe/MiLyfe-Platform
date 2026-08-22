-- ============================================================================
-- MiLyfe Platform — Phase 4+5 Tables
-- AI, Developer Portal, Digital Twin, Privacy, Federation
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════
-- MI AI — Memory, conversations, function calls
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New conversation',
  messages JSONB NOT NULL DEFAULT '[]',
  agent_type TEXT NOT NULL DEFAULT 'general' CHECK (agent_type IN ('general','legal','health','finance','career','civic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_function_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  conversation_id UUID REFERENCES public.ai_conversations(id),
  function_name TEXT NOT NULL,
  arguments JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- DEVELOPER PORTAL
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.developer_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT,
  website_url TEXT,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  oauth_redirect_uri TEXT,
  permissions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending_review')),
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_mly NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'feature' CHECK (category IN ('feature','bug','design','content','research')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','in_progress','completed','cancelled')),
  posted_by UUID NOT NULL REFERENCES public.profiles(id),
  claimed_by UUID REFERENCES public.profiles(id),
  github_issue_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bounties_status ON public.bounties(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.developer_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('pr','issue','bounty','app','docs')),
  title TEXT NOT NULL,
  url TEXT,
  reward_mly NUMERIC(10,2) DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- DIGITAL TWIN
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.digital_twins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_config JSONB NOT NULL DEFAULT '{"style":"default","skinTone":"medium","hairStyle":"short","outfit":"casual"}',
  personality TEXT NOT NULL DEFAULT 'friendly',
  automation JSONB NOT NULL DEFAULT '{"auto_vote_delegated":false,"auto_checkin":false,"auto_respond_messages":false}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.twin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('vote','checkin','message','post','invest')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','executed','rejected')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.twin_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('spending','health','social','civic','growth')),
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_twin_insights_user ON public.twin_insights(user_id, generated_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- PRIVACY & CONSENT
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('analytics','push_notifications','email','data_sharing','ai_training','location')),
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_consent_user_category ON public.consent_records(user_id, category);

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','expired')),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','grace_period','completed','cancelled')),
  grace_period_ends TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- FEDERATION (ActivityPub readiness)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ap_actors (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_username TEXT NOT NULL,
  ap_id TEXT NOT NULL UNIQUE,
  inbox_url TEXT NOT NULL,
  outbox_url TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  followers_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ap_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.ap_actors(user_id) ON DELETE CASCADE,
  follower_ap_id TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(actor_id, follower_ap_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- FEATURE FLAGS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some default feature flags
INSERT INTO public.feature_flags (key, name, description, enabled) VALUES
('federation', 'ActivityPub Federation', 'Enable federation with Mastodon/Threads', false),
('ai_function_calling', 'AI Function Calling', 'Allow Mi AI to execute platform actions', true),
('digital_twin', 'Digital Twin', 'Enable digital twin features', true),
('video_calls', 'Video Calls', 'Enable WebRTC video calls', true),
('car_sharing', 'Car Sharing', 'Enable community car sharing marketplace', true),
('citizen_repair', 'Citizen Repair Program', 'Allow citizens to claim city repairs', true)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_function_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twin_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- User-specific
CREATE POLICY "Own AI conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create AI conversation" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update AI conversation" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own function calls" ON public.ai_function_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own twin" ON public.digital_twins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create twin" ON public.digital_twins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update twin" ON public.digital_twins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own twin actions" ON public.twin_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own insights" ON public.twin_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own consent" ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manage consent" ON public.consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update consent" ON public.consent_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own export requests" ON public.data_export_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Request export" ON public.data_export_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own deletion" ON public.deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Request deletion" ON public.deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cancel deletion" ON public.deletion_requests FOR UPDATE USING (auth.uid() = user_id);

-- Public read
CREATE POLICY "Public apps" ON public.developer_apps FOR SELECT USING (status = 'active');
CREATE POLICY "Public reviews" ON public.app_reviews FOR SELECT USING (true);
CREATE POLICY "Public bounties" ON public.bounties FOR SELECT USING (true);
CREATE POLICY "Public contributions" ON public.developer_contributions FOR SELECT USING (true);
CREATE POLICY "Public feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Public AP actors" ON public.ap_actors FOR SELECT USING (true);
CREATE POLICY "Public AP followers" ON public.ap_followers FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Create app" ON public.developer_apps FOR INSERT WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "Update own app" ON public.developer_apps FOR UPDATE USING (auth.uid() = developer_id);
CREATE POLICY "Review app" ON public.app_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post bounty" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Claim bounty" ON public.bounties FOR UPDATE USING (true);
CREATE POLICY "Log contribution" ON public.developer_contributions FOR INSERT WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "Create AI func call" ON public.ai_function_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create twin action" ON public.twin_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
