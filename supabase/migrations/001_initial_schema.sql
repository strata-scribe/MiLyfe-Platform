-- MiLyfe Platform — Complete Database Schema
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/zoallvovubchvxllglbs/sql

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  mly_balance NUMERIC(12,2) NOT NULL DEFAULT 100.00,
  city TEXT NOT NULL DEFAULT 'Jacksonville',
  neighborhood TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'business', 'advocate', 'admin')),
  safety_mode BOOLEAN NOT NULL DEFAULT FALSE,
  health_streak INTEGER NOT NULL DEFAULT 0,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MLY TRANSACTIONS (community currency ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mly_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID REFERENCES public.profiles(id),
  to_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'transfer', 'ubi')),
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mly_transactions_to ON public.mly_transactions(to_id, created_at DESC);
CREATE INDEX idx_mly_transactions_from ON public.mly_transactions(from_id, created_at DESC);

-- ============================================
-- CITY ISSUES (civic reporting)
-- ============================================
CREATE TABLE IF NOT EXISTS public.city_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('infrastructure', 'safety', 'environment', 'community', 'transit')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  address TEXT,
  image_url TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_city_issues_status ON public.city_issues(status, created_at DESC);
CREATE INDEX idx_city_issues_reporter ON public.city_issues(reporter_id);

-- Issue upvotes (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.issue_upvotes (
  issue_id UUID NOT NULL REFERENCES public.city_issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);

-- ============================================
-- CITY EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.city_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  mly_reward NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.city_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- HEALTH CHECK-INS
-- ============================================
CREATE TABLE IF NOT EXISTS public.health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  sleep_hours NUMERIC(4,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  notes TEXT,
  mly_earned NUMERIC(12,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_checkins_user ON public.health_checkins(user_id, created_at DESC);

-- One check-in per day per user (immutable wrapper for date cast)
CREATE OR REPLACE FUNCTION public.to_date_immutable(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT ts::date;
$$ LANGUAGE sql IMMUTABLE;

CREATE UNIQUE INDEX idx_health_checkins_daily ON public.health_checkins(user_id, to_date_immutable(created_at));

-- ============================================
-- SHOP LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_mly NUMERIC(12,2) NOT NULL CHECK (price_mly > 0),
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shop_listings_available ON public.shop_listings(available, created_at DESC);
CREATE INDEX idx_shop_listings_seller ON public.shop_listings(seller_id);

-- Shop orders
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.shop_listings(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_mly NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ============================================
-- VAULT DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.vault_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('id', 'certificate', 'record', 'credential')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vault_documents_user ON public.vault_documents(user_id);

-- Document shares (revocable)
CREATE TABLE IF NOT EXISTS public.vault_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.vault_documents(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES public.profiles(id),
  shared_by_id UUID NOT NULL REFERENCES public.profiles(id),
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- ============================================
-- COMMUNITY VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vote_responses (
  vote_id UUID NOT NULL REFERENCES public.community_votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vote_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mly_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_responses ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- MLY: users can see their own transactions
CREATE POLICY "Users see own transactions" ON public.mly_transactions FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE POLICY "System can insert transactions" ON public.mly_transactions FOR INSERT WITH CHECK (true);

-- CITY ISSUES: everyone can read, authenticated can create
CREATE POLICY "Issues are viewable by everyone" ON public.city_issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON public.city_issues FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporters can update own issues" ON public.city_issues FOR UPDATE USING (auth.uid() = reporter_id);

-- UPVOTES
CREATE POLICY "Upvotes viewable by everyone" ON public.issue_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated can upvote" ON public.issue_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvote" ON public.issue_upvotes FOR DELETE USING (auth.uid() = user_id);

-- EVENTS
CREATE POLICY "Events viewable by everyone" ON public.city_events FOR SELECT USING (true);
CREATE POLICY "Authenticated can create events" ON public.city_events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- RSVPs
CREATE POLICY "RSVPs viewable by everyone" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- HEALTH: private to user
CREATE POLICY "Users see own checkins" ON public.health_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create checkins" ON public.health_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SHOP: listings visible to all, sellers manage their own
CREATE POLICY "Listings viewable by everyone" ON public.shop_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON public.shop_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.shop_listings FOR UPDATE USING (auth.uid() = seller_id);

-- ORDERS
CREATE POLICY "Users see own orders" ON public.shop_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON public.shop_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON public.shop_orders FOR UPDATE USING (auth.uid() = seller_id);

-- CONVERSATIONS & MESSAGES
CREATE POLICY "Conversations accessible to authenticated" ON public.conversations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Members see all memberships in their convos" ON public.conversation_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Can add members" ON public.conversation_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update own membership" ON public.conversation_members FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Members see messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- VAULT: strictly private
CREATE POLICY "Users see own documents" ON public.vault_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload documents" ON public.vault_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.vault_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see shares involving them" ON public.vault_shares FOR SELECT USING (auth.uid() = shared_by_id OR auth.uid() = shared_with_id);
CREATE POLICY "Users can share own documents" ON public.vault_shares FOR INSERT WITH CHECK (auth.uid() = shared_by_id);
CREATE POLICY "Sharers can revoke" ON public.vault_shares FOR UPDATE USING (auth.uid() = shared_by_id);

-- VOTES
CREATE POLICY "Votes viewable by everyone" ON public.community_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can create votes" ON public.community_votes FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Responses viewable by everyone" ON public.vote_responses FOR SELECT USING (true);
CREATE POLICY "Users can vote once" ON public.vote_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REALTIME (enable for messages and issues)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_checkins;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('issues', 'issues', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('shop', 'shop', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vault', 'vault', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Issue images are public" ON storage.objects FOR SELECT USING (bucket_id = 'issues');
CREATE POLICY "Users can upload issue images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'issues' AND auth.role() = 'authenticated');

CREATE POLICY "Shop images are public" ON storage.objects FOR SELECT USING (bucket_id = 'shop');
CREATE POLICY "Sellers can upload shop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop' AND auth.role() = 'authenticated');

CREATE POLICY "Vault files are private" ON storage.objects FOR SELECT USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload to vault" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own vault files" ON storage.objects FOR DELETE USING (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);
