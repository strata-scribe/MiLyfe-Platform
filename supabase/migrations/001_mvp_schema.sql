-- ============================================================================
-- MiLyfe MVP Schema — 25 Tables
-- Covers: auth/profiles, wallet/economy, standing, governance, forum,
--         wiki, health, news, connect, rewards, apps
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES — Core identity
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  neighborhood TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen','moderator','steward','admin')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_neighborhood ON public.profiles(neighborhood);

-- ============================================================================
-- 2. WALLETS — $MLY three-pot system
-- ============================================================================
CREATE TABLE public.wallets (
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

-- ============================================================================
-- 3. TRANSACTIONS — $MLY ledger
-- ============================================================================
CREATE TABLE public.transactions (
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

CREATE INDEX idx_transactions_from ON public.transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to ON public.transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(type, created_at DESC);

-- ============================================================================
-- 4. STANDING — 8-facet reputation
-- ============================================================================
CREATE TABLE public.standing (
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

-- ============================================================================
-- 5. ATTESTATIONS — Standing evidence
-- ============================================================================
CREATE TABLE public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),
  facet TEXT NOT NULL CHECK (facet IN ('neighbor','carer','maker','teacher','keeper','voice','shop','helper')),
  weight NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0.1 AND 5.0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attestations_to ON public.attestations(to_user_id, created_at DESC);

-- ============================================================================
-- 6. PROPOSALS — Governance
-- ============================================================================
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','treasury','policy','amendment','recall')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','passed','rejected','expired')),
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  quorum_required INTEGER NOT NULL DEFAULT 10,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_status ON public.proposals(status, created_at DESC);

-- ============================================================================
-- 7. VOTES — Governance votes
-- ============================================================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  direction TEXT NOT NULL CHECK (direction IN ('for','against','abstain')),
  weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- ============================================================================
-- 8. FORUM_SPACES — Discussion categories
-- ============================================================================
CREATE TABLE public.forum_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '💬',
  post_count INTEGER NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. FORUM_POSTS — Discussion threads
-- ============================================================================
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.forum_spaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_space ON public.forum_posts(space_id, pinned DESC, created_at DESC);

-- ============================================================================
-- 10. FORUM_REPLIES — Post replies
-- ============================================================================
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  parent_reply_id UUID REFERENCES public.forum_replies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_replies_post ON public.forum_replies(post_id, created_at ASC);

-- ============================================================================
-- 11. WIKI_PAGES — Community knowledge base
-- ============================================================================
CREATE TABLE public.wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  last_editor_id UUID REFERENCES public.profiles(id),
  revision_count INTEGER NOT NULL DEFAULT 1,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wiki_pages_slug ON public.wiki_pages(slug);
CREATE INDEX idx_wiki_pages_category ON public.wiki_pages(category);

-- ============================================================================
-- 12. WIKI_REVISIONS — Edit history
-- ============================================================================
CREATE TABLE public.wiki_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wiki_revisions_page ON public.wiki_revisions(page_id, created_at DESC);

-- ============================================================================
-- 13. HEALTH_CHECKINS — Wellness tracking
-- ============================================================================
CREATE TABLE public.health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  sleep_hours NUMERIC(3,1),
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_checkins_user ON public.health_checkins(user_id, created_at DESC);

-- ============================================================================
-- 14. HEALTH_RESOURCES — Community health directory
-- ============================================================================
CREATE TABLE public.health_resources (
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

-- ============================================================================
-- 15. NEWS_ARTICLES — Community journalism
-- ============================================================================
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'community' CHECK (category IN ('community','governance','economy','safety','culture','events')),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_news_articles_published ON public.news_articles(published, published_at DESC);
CREATE INDEX idx_news_articles_category ON public.news_articles(category, published_at DESC);

-- ============================================================================
-- 16. NEWS_COMMENTS — Article comments
-- ============================================================================
CREATE TABLE public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_comments_article ON public.news_comments(article_id, created_at ASC);

-- ============================================================================
-- 17. CONNECTIONS — Social graph
-- ============================================================================
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_connections_addressee ON public.connections(addressee_id, status);

-- ============================================================================
-- 18. MESSAGES — Direct messaging
-- ============================================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
CREATE INDEX idx_messages_receiver_unread ON public.messages(receiver_id, read) WHERE NOT read;

-- ============================================================================
-- 19. REWARDS — Achievement/reward distribution
-- ============================================================================
CREATE TABLE public.rewards (
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

CREATE INDEX idx_rewards_user ON public.rewards(user_id, claimed, created_at DESC);

-- ============================================================================
-- 20. BADGES — Achievement badges
-- ============================================================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','standing','economy','governance','social','health')),
  criteria JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 21. USER_BADGES — Earned badges junction
-- ============================================================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================================
-- 22. NOTIFICATIONS — In-app notifications
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','ubi','social','safety','governance','reward','system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================================================
-- 23. APPS — Community app directory
-- ============================================================================
CREATE TABLE public.apps (
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

CREATE INDEX idx_apps_category ON public.apps(category, status);

-- ============================================================================
-- 24. APP_REVIEWS — App ratings
-- ============================================================================
CREATE TABLE public.app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_id, user_id)
);

-- ============================================================================
-- 25. COMMUNITY_TREASURY — Transparency ledger
-- ============================================================================
CREATE TABLE public.community_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_burned NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_distributed NUMERIC(14,2) NOT NULL DEFAULT 0,
  citizen_count INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_treasury ENABLE ROW LEVEL SECURITY;

-- PROFILES: public read, own write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- WALLETS: own only
CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_all" ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- TRANSACTIONS: see own
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id OR from_user_id IS NULL);

-- STANDING: public read, system write
CREATE POLICY "standing_select" ON public.standing FOR SELECT USING (true);
CREATE POLICY "standing_update" ON public.standing FOR UPDATE USING (auth.uid() = user_id);

-- ATTESTATIONS: public read, authenticated write
CREATE POLICY "attestations_select" ON public.attestations FOR SELECT USING (true);
CREATE POLICY "attestations_insert" ON public.attestations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id AND auth.uid() != to_user_id);

-- PROPOSALS: public read, auth write
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE USING (auth.uid() = author_id);

-- VOTES: own read/write
CREATE POLICY "votes_select" ON public.votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FORUM: public read, auth write
CREATE POLICY "forum_spaces_select" ON public.forum_spaces FOR SELECT USING (true);
CREATE POLICY "forum_posts_select" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "forum_posts_insert" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "forum_replies_select" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies_insert" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- WIKI: public read, auth write
CREATE POLICY "wiki_pages_select" ON public.wiki_pages FOR SELECT USING (published = true);
CREATE POLICY "wiki_pages_insert" ON public.wiki_pages FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "wiki_pages_update" ON public.wiki_pages FOR UPDATE USING (auth.uid() = author_id OR auth.uid() = last_editor_id);
CREATE POLICY "wiki_revisions_select" ON public.wiki_revisions FOR SELECT USING (true);
CREATE POLICY "wiki_revisions_insert" ON public.wiki_revisions FOR INSERT WITH CHECK (auth.uid() = editor_id);

-- HEALTH: own only
CREATE POLICY "health_checkins_select" ON public.health_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_checkins_insert" ON public.health_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_resources_select" ON public.health_resources FOR SELECT USING (true);

-- NEWS: public read published, auth write
CREATE POLICY "news_articles_select" ON public.news_articles FOR SELECT USING (published = true);
CREATE POLICY "news_articles_insert" ON public.news_articles FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "news_articles_update" ON public.news_articles FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "news_comments_select" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY "news_comments_insert" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- CONNECTIONS: own
CREATE POLICY "connections_select" ON public.connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "connections_insert" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "connections_update" ON public.connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- MESSAGES: participants only
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- REWARDS: own
CREATE POLICY "rewards_select" ON public.rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rewards_update" ON public.rewards FOR UPDATE USING (auth.uid() = user_id);

-- BADGES: public read
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (true);
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (true);

-- NOTIFICATIONS: own
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- APPS: public read published
CREATE POLICY "apps_select" ON public.apps FOR SELECT USING (status = 'published' OR auth.uid() = developer_id);
CREATE POLICY "apps_insert" ON public.apps FOR INSERT WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "apps_update" ON public.apps FOR UPDATE USING (auth.uid() = developer_id);
CREATE POLICY "app_reviews_select" ON public.app_reviews FOR SELECT USING (true);
CREATE POLICY "app_reviews_insert" ON public.app_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TREASURY: public read
CREATE POLICY "treasury_select" ON public.community_treasury FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-create profile + wallet + standing on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'citizen_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New Citizen')
  );

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  INSERT INTO public.standing (user_id) VALUES (NEW.id);

  -- Welcome reward
  INSERT INTO public.rewards (user_id, type, amount, title, description)
  VALUES (NEW.id, 'welcome', 50, 'Welcome to MiLyfe!', 'Your first $MLY to get started');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER standing_updated_at BEFORE UPDATE ON public.standing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default forum spaces
INSERT INTO public.forum_spaces (name, slug, description, icon) VALUES
  ('General', 'general', 'Open discussion for the community', '💬'),
  ('Governance', 'governance', 'Proposals, voting, and civic discussion', '🏛️'),
  ('Economy', 'economy', '$MLY, tokenomics, and community commerce', '💰'),
  ('Neighborhood', 'neighborhood', 'Local issues and neighborhood coordination', '🏘️'),
  ('Help & Support', 'help', 'Ask questions and help fellow citizens', '🤝'),
  ('Builders', 'builders', 'For developers and contributors building MiLyfe', '🔨')
ON CONFLICT (slug) DO NOTHING;

-- Default badges
INSERT INTO public.badges (name, description, icon, category) VALUES
  ('First Steps', 'Completed onboarding', '👋', 'general'),
  ('Connected', 'Made first connection', '🤝', 'social'),
  ('First Vote', 'Voted on a proposal', '🗳️', 'governance'),
  ('Contributor', 'Made a forum post', '✍️', 'general'),
  ('Good Neighbor', 'Neighbor standing > 50', '🏘️', 'standing'),
  ('Healthy Streak', '7-day check-in streak', '💚', 'health'),
  ('Builder', 'Published an app', '🔨', 'general'),
  ('Generous', 'Community contribution > 100 $MLY', '💛', 'economy')
ON CONFLICT (name) DO NOTHING;

-- Initial treasury snapshot
INSERT INTO public.community_treasury (balance, citizen_count)
VALUES (0, 0)
ON CONFLICT DO NOTHING;
