-- ============================================================================
-- MiLyfe Platform — Phase 2+3 Tables
-- Forum, Social, News, Calls, Academia, Market, Civic Ops, Nav, Auto
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════
-- MIFORUM — Reddit-style community spaces
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.forum_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  banner_url TEXT,
  icon TEXT DEFAULT '💬',
  rules TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  member_count INTEGER NOT NULL DEFAULT 1,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_spaces_slug ON public.forum_spaces(slug);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.forum_spaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','link','image','poll')),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  image_url TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_space ON public.forum_posts(space_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_hot ON public.forum_posts(space_id, upvotes DESC);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.forum_comments(id),
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  depth INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS public.forum_memberships (
  space_id UUID NOT NULL REFERENCES public.forum_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','mod','creator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (space_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id UUID NOT NULL,
  direction INTEGER NOT NULL CHECK (direction IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- MISOCIAL — Full social media
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.social_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT DEFAULT '',
  website TEXT,
  banner_url TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  media_url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
  text_overlay TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reels_recent ON public.reels(created_at DESC);

CREATE TABLE IF NOT EXISTS public.social_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post','reel','story','comment')),
  target_id UUID NOT NULL,
  reaction TEXT NOT NULL DEFAULT '❤️' CHECK (reaction IN ('❤️','🔥','💪','🤝','👑','😂')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- MINEWS — News aggregation
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_feed TEXT,
  bias_rating TEXT DEFAULT 'center' CHECK (bias_rating IN ('left','center-left','center','center-right','right','independent')),
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('local','national','world','tech','economy','justice','community')),
  relevance_score INTEGER DEFAULT 50,
  upvotes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category, created_at DESC);

CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- VOICE & VIDEO CALLS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES public.profiles(id),
  callee_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL DEFAULT 'voice' CHECK (type IN ('voice','video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','active','ended','missed','declined')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calls_participants ON public.call_sessions(caller_id, callee_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- MIACADEMIA — R&D + Education
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'proposal' CHECK (status IN ('proposal','active','completed','archived')),
  category TEXT NOT NULL DEFAULT 'general',
  funding_goal NUMERIC(12,2) DEFAULT 0,
  funding_raised NUMERIC(12,2) NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_members (
  project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead','researcher','contributor','observer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT DEFAULT '',
  schedule TEXT,
  meeting_url TEXT,
  max_members INTEGER DEFAULT 20,
  member_count INTEGER NOT NULL DEFAULT 1,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  abstract TEXT NOT NULL DEFAULT '',
  pdf_url TEXT,
  doi TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.research_projects(id),
  amount NUMERIC(12,2) NOT NULL,
  funder_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged','funded','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MIMARKET — Unified marketplace
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('product','service','classified','housing','auto','gig')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','hourly','negotiable','free')),
  category TEXT NOT NULL DEFAULT 'other',
  subcategory TEXT,
  images TEXT[] DEFAULT '{}',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','sold','expired','removed')),
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON public.marketplace_listings(type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_listings(category, status);

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC(12,2),
  urgency TEXT NOT NULL DEFAULT 'scheduled' CHECK (urgency IN ('asap','today','scheduled')),
  scheduled_at TIMESTAMPTZ,
  matched_provider_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','in_progress','completed','cancelled')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  listing_id UUID REFERENCES public.marketplace_listings(id),
  service_request_id UUID REFERENCES public.service_requests(id),
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','released','disputed','refunded')),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MICITY — GitHub-style civic operations
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.civic_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  neighborhood TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','completed','archived')),
  budget NUMERIC(12,2) DEFAULT 0,
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 1,
  issue_count INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.civic_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.civic_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed')),
  issue_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.civic_repair_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.city_issues(id),
  claimer_id UUID NOT NULL REFERENCES public.profiles(id),
  claimer_type TEXT NOT NULL DEFAULT 'citizen' CHECK (claimer_type IN ('citizen','business','organization')),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  before_photo TEXT,
  after_photo TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_verified BOOLEAN NOT NULL DEFAULT FALSE,
  reward_mly NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','in_progress','submitted','verified','paid','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.repair_certifications (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  course_completed BOOLEAN NOT NULL DEFAULT FALSE,
  insurance_verified BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MINAV — Maps & Navigation
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.map_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('hazard','police','construction','flood','accident','closure','speed_trap')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_map_reports_geo ON public.map_reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_map_reports_active ON public.map_reports(expires_at) WHERE expires_at > NOW();

CREATE TABLE IF NOT EXISTS public.map_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  mode TEXT NOT NULL DEFAULT 'drive' CHECK (mode IN ('drive','walk','transit','bike')),
  distance_meters INTEGER,
  duration_seconds INTEGER,
  saved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transit_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  routes TEXT[] DEFAULT '{}',
  agency TEXT DEFAULT 'JTA',
  wheelchair_accessible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MIAUTO — Automobile platform
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  plate TEXT,
  mileage INTEGER DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'gas' CHECK (type IN ('gas','electric','hybrid','diesel')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','for_sale','shared','inactive')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON public.vehicles(owner_id);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('oil_change','tire','brakes','inspection','battery','transmission','other')),
  description TEXT,
  mileage INTEGER,
  cost NUMERIC(10,2) DEFAULT 0,
  provider_id UUID REFERENCES public.businesses(id),
  notes TEXT,
  next_due_date DATE,
  next_due_mileage INTEGER,
  performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.car_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 5,
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 30,
  available_from TIMESTAMPTZ,
  available_to TIMESTAMPTZ,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','unavailable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL DEFAULT 'free' CHECK (type IN ('free','metered','lot','garage','ev_charger')),
  description TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_parking_geo ON public.parking_spots(lat, lng);

-- ═══════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.forum_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_repair_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (content that's publicly viewable)
CREATE POLICY IF NOT EXISTS "Public read" ON public.forum_spaces FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.forum_memberships FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.social_profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.follows FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY IF NOT EXISTS "Public read" ON public.reels FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.social_reactions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.research_projects FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.research_members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.academic_papers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.research_grants FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "Public read" ON public.civic_projects FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.civic_milestones FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.civic_repair_claims FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.repair_certifications FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.map_reports FOR SELECT USING (expires_at > NOW());
CREATE POLICY IF NOT EXISTS "Public read" ON public.transit_stops FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.car_shares FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.parking_spots FOR SELECT USING (true);

-- USER-SPECIFIC READ
CREATE POLICY IF NOT EXISTS "Own calls" ON public.call_sessions FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY IF NOT EXISTS "Own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
CREATE POLICY IF NOT EXISTS "Own escrow" ON public.escrow_holds FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY IF NOT EXISTS "Own routes" ON public.map_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Own maintenance" ON public.maintenance_records FOR SELECT USING (EXISTS(SELECT 1 FROM vehicles WHERE id = maintenance_records.vehicle_id AND owner_id = auth.uid()));

-- AUTHENTICATED INSERT policies
CREATE POLICY IF NOT EXISTS "Create space" ON public.forum_spaces FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Create post" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY IF NOT EXISTS "Create comment" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY IF NOT EXISTS "Join space" ON public.forum_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Vote" ON public.forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "Unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "Post story" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Post reel" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "React" ON public.social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Unreact" ON public.social_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Submit article" ON public.news_articles FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY IF NOT EXISTS "Comment news" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Start call" ON public.call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY IF NOT EXISTS "Update call" ON public.call_sessions FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY IF NOT EXISTS "Create project" ON public.research_projects FOR INSERT WITH CHECK (auth.uid() = lead_id);
CREATE POLICY IF NOT EXISTS "Join research" ON public.research_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create study group" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Submit paper" ON public.academic_papers FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY IF NOT EXISTS "Fund research" ON public.research_grants FOR INSERT WITH CHECK (auth.uid() = funder_id);
CREATE POLICY IF NOT EXISTS "Create listing" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY IF NOT EXISTS "Update listing" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY IF NOT EXISTS "Request service" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY IF NOT EXISTS "Update service" ON public.service_requests FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
CREATE POLICY IF NOT EXISTS "Create escrow" ON public.escrow_holds FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY IF NOT EXISTS "Create civic project" ON public.civic_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Create milestone" ON public.civic_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Claim repair" ON public.civic_repair_claims FOR INSERT WITH CHECK (auth.uid() = claimer_id);
CREATE POLICY IF NOT EXISTS "Update repair" ON public.civic_repair_claims FOR UPDATE USING (auth.uid() = claimer_id);
CREATE POLICY IF NOT EXISTS "Report map" ON public.map_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Save route" ON public.map_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Add vehicle" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Update vehicle" ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Log maintenance" ON public.maintenance_records FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Share car" ON public.car_shares FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Update share" ON public.car_shares FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Report parking" ON public.parking_spots FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_reports;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('social', 'social', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('forum', 'forum', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', true) ON CONFLICT DO NOTHING;

CREATE POLICY IF NOT EXISTS "Social media public" ON storage.objects FOR SELECT USING (bucket_id = 'social');
CREATE POLICY IF NOT EXISTS "Upload social" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Forum media public" ON storage.objects FOR SELECT USING (bucket_id = 'forum');
CREATE POLICY IF NOT EXISTS "Upload forum" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Vehicle media public" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');
CREATE POLICY IF NOT EXISTS "Upload vehicle" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

-- TRIGGERS: Auto-update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    UPDATE social_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
    UPDATE social_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_follow_change
CREATE TRIGGER 
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Auto-update forum space member count
CREATE OR REPLACE FUNCTION update_space_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_spaces SET member_count = member_count + 1 WHERE id = NEW.space_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_spaces SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.space_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_membership_change
CREATE TRIGGER 
AFTER INSERT OR DELETE ON public.forum_memberships
FOR EACH ROW EXECUTE FUNCTION update_space_member_count();
