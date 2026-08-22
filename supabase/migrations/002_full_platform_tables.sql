-- ============================================================================
-- MiLyfe Platform — Full Table Expansion Migration
-- Creates all missing tables for existing routes + Phase 0/1 features
-- Run AFTER 001_initial_schema.sql
-- ============================================================================

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','ubi','system','social','safety','governance','reward','warning')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  email_digest TEXT DEFAULT 'daily' CHECK (email_digest IN ('off','instant','daily','weekly')),
  quiet_hours_start INTEGER DEFAULT 22,
  quiet_hours_end INTEGER DEFAULT 7,
  categories JSONB DEFAULT '{"ubi":true,"social":true,"safety":true,"governance":true,"reward":true,"warning":true,"system":true}'
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HOUSING
-- ============================================
CREATE TABLE IF NOT EXISTS public.housing_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('rental','roommate','sublet','room')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_monthly NUMERIC(10,2),
  beds INTEGER DEFAULT 1,
  baths NUMERIC(3,1) DEFAULT 1,
  address TEXT,
  neighborhood TEXT,
  available_date DATE,
  images TEXT[] DEFAULT '{}',
  anonymous BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','filled','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_housing_status ON public.housing_listings(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.housing_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RIDESHARE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rideshare_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('offer','request')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  departure_at TIMESTAMPTZ NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  price_per_seat NUMERIC(10,2) NOT NULL DEFAULT 5,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','completed','cancelled')),
  matched_user_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rideshare_status ON public.rideshare_rides(status, departure_at);

-- ============================================
-- JOBS & CAREER
-- ============================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  type TEXT NOT NULL DEFAULT 'full-time' CHECK (type IN ('full-time','part-time','gig','contract','volunteer')),
  pay_mly NUMERIC(10,2),
  pay_type TEXT DEFAULT 'fixed' CHECK (pay_type IN ('fixed','hourly','daily')),
  remote BOOLEAN DEFAULT FALSE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','viewed','interview','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  experience JSONB NOT NULL DEFAULT '[]',
  education JSONB NOT NULL DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MILEARN — COURSES & MODULES
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  mly_reward NUMERIC(10,2) NOT NULL DEFAULT 10,
  thumbnail_url TEXT,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category, published);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  quiz JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.course_modules(course_id, position);

CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  current_module INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.course_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MIFAMILY
-- ============================================
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  pool_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('parent','co_parent','guardian','child','elder','extended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('school','medical','custody','work','bill','general')),
  event_date TIMESTAMPTZ NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BUSINESS HUB
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  accepts_mly BOOLEAN NOT NULL DEFAULT TRUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  mly_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);

CREATE TABLE IF NOT EXISTS public.business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ============================================
-- MIGUILD
-- ============================================
CREATE TABLE IF NOT EXISTS public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('block_keeper','mediator','member','youth','elder')),
  block_area TEXT,
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guild_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  block_area TEXT,
  reward_mly NUMERIC(10,2) NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','completed','verified')),
  claimed_by UUID REFERENCES public.profiles(id),
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_guild_tasks_status ON public.guild_tasks(status);

CREATE TABLE IF NOT EXISTS public.guild_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  description TEXT NOT NULL,
  location TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low','normal','high','critical')),
  anonymous BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mediating','resolved')),
  mediator_id UUID REFERENCES public.profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guild_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  earned_mly NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guild_checkins_user ON public.guild_checkins(user_id, created_at DESC);

-- ============================================
-- MEDIA CONTENT
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('video','music','podcast_episode')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','removed')),
  plays INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON public.media_content(type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_content_creator ON public.media_content(creator_id);

CREATE TABLE IF NOT EXISTS public.media_likes (
  media_id UUID NOT NULL REFERENCES public.media_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.radio_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  stream_url TEXT,
  genre TEXT NOT NULL DEFAULT 'general',
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  listeners INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GOVERNANCE — PROPOSALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','passed','failed','closed')),
  voting_method TEXT NOT NULL DEFAULT 'single_choice',
  options TEXT[] NOT NULL DEFAULT '{"Yes","No"}',
  quorum INTEGER NOT NULL DEFAULT 10,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status, ends_at);

CREATE TABLE IF NOT EXISTS public.proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  choice INTEGER NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- ============================================
-- SOCIAL FEED
-- ============================================
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','link','poll')),
  likes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON public.feed_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_recent ON public.feed_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.feed_likes (
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SAFETY
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  guardian_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','arrived','cancelled','emergency')),
  destination TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.police_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT,
  officer_name TEXT,
  badge_number TEXT,
  department TEXT,
  reason TEXT,
  outcome TEXT,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_police_interactions_user ON public.police_interactions(user_id, created_at DESC);

-- ============================================
-- SUPPORT TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('bug','feature','account','billing','safety','other','general')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AID & RESOURCES
-- ============================================
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('food','housing','health','legal','employment','education','financial','other')),
  address TEXT,
  phone TEXT,
  website TEXT,
  hours TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

-- ============================================
-- EMERGENCY BROADCASTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('weather','safety','infrastructure','health','community')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  geo_zone TEXT,
  radius_miles NUMERIC(5,1),
  acknowledged_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.broadcast_acks (
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  acked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (broadcast_id, user_id)
);

-- ============================================
-- CONTENT MODERATION
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('post','comment','message','listing','media','profile','recording')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam','harassment','hate_speech','violence','misinformation','illegal','other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status, created_at);

-- ============================================
-- CONSEQUENCE / ACCOUNTABILITY
-- ============================================
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  reported_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','dismissed','appealed')),
  action_taken TEXT,
  standing_penalty INTEGER DEFAULT 0,
  mly_penalty NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('feature_lock','posting_ban','full_suspension','permanent_ban')),
  reason TEXT NOT NULL,
  violation_id UUID REFERENCES public.violations(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_restrictions_user ON public.user_restrictions(user_id, active);

CREATE TABLE IF NOT EXISTS public.community_juries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID NOT NULL REFERENCES public.violations(id),
  juror_ids UUID[] NOT NULL DEFAULT '{}',
  verdict TEXT CHECK (verdict IN ('confirm','dismiss')),
  reasoning TEXT,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID NOT NULL REFERENCES public.violations(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  statement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','accepted','rejected')),
  reviewed_by_jury UUID REFERENCES public.community_juries(id),
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMMUNITY RECORDINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorder_id UUID NOT NULL REFERENCES public.profiles(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT CHECK (category IN ('infrastructure','safety','police_encounter','community_win','emergency','other')),
  ai_category_suggestion TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','routed','rewarded','rejected')),
  routed_to TEXT,
  reward_mly NUMERIC(10,2) DEFAULT 0,
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public','community','private')),
  faces_blurred BOOLEAN DEFAULT FALSE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON public.community_recordings(status, created_at DESC);

-- ============================================
-- WIKI / KNOWLEDGE BASE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('how-to','resources','history','policies','faq','neighborhoods','general')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  last_edited_by UUID REFERENCES public.profiles(id),
  version INTEGER NOT NULL DEFAULT 1,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON public.wiki_pages(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_category ON public.wiki_pages(category);

CREATE TABLE IF NOT EXISTS public.wiki_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id),
  content_md TEXT NOT NULL,
  edit_summary TEXT,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wiki_revisions_page ON public.wiki_revisions(page_id, version DESC);

-- ============================================
-- CONSTITUTION (Interactive)
-- ============================================
CREATE TABLE IF NOT EXISTS public.constitution_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','amended','repealed'))
);

CREATE TABLE IF NOT EXISTS public.constitution_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.constitution_articles(id),
  proposed_by UUID NOT NULL REFERENCES public.profiles(id),
  proposal_text TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'voting' CHECK (status IN ('voting','ratified','rejected','withdrawn')),
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  required_votes INTEGER NOT NULL DEFAULT 10,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  ratified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.constitution_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.constitution_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  annotation TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('onboarding','engagement','civic','social','economic','education','leadership','seasonal')),
  points INTEGER NOT NULL DEFAULT 10,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'weekly' CHECK (type IN ('daily','weekly','monthly','seasonal')),
  criteria JSONB NOT NULL DEFAULT '{}',
  reward_mly NUMERIC(10,2) NOT NULL DEFAULT 5,
  reward_badge_id UUID REFERENCES public.badges(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- TOKENOMICS — TREASURY & METRICS
-- ============================================
CREATE TABLE IF NOT EXISTS public.mly_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_minted NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_burned NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_circulating NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  velocity_7d NUMERIC(8,4) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial treasury row
INSERT INTO public.mly_treasury (balance, total_minted, total_circulating) 
VALUES (0, 0, 0) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.mly_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  minted NUMERIC(12,2) NOT NULL DEFAULT 0,
  burned NUMERIC(12,2) NOT NULL DEFAULT 0,
  transferred NUMERIC(12,2) NOT NULL DEFAULT 0,
  earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mly_daily_stats_date ON public.mly_daily_stats(date DESC);

-- ============================================
-- ADDITIONAL STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('wiki', 'wiki', true) ON CONFLICT DO NOTHING;

-- Storage policies for new buckets
CREATE POLICY IF NOT EXISTS "Media files are public" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY IF NOT EXISTS "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Recordings private to owner" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY IF NOT EXISTS "Users can upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Wiki images are public" ON storage.objects FOR SELECT USING (bucket_id = 'wiki');
CREATE POLICY IF NOT EXISTS "Authenticated can upload wiki images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wiki' AND auth.role() = 'authenticated');

-- ============================================
-- RLS POLICIES FOR ALL NEW TABLES
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rideshare_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.police_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_acks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_juries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constitution_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constitution_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constitution_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mly_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mly_daily_stats ENABLE ROW LEVEL SECURITY;

-- === POLICIES: PUBLIC READ ===
CREATE POLICY IF NOT EXISTS "Public read" ON public.housing_listings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.housing_reviews FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.rideshare_rides FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.courses FOR SELECT USING (published = true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.course_discussions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.businesses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.business_reviews FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.guild_tasks FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.guild_conflicts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.media_content FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS "Public read" ON public.media_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.radio_stations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.proposals FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.proposal_votes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.resources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.broadcast_acks FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.wiki_pages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.wiki_revisions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.constitution_articles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.constitution_amendments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.constitution_annotations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.badges FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.challenges FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.challenge_progress FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.mly_treasury FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.mly_daily_stats FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read" ON public.community_recordings FOR SELECT USING (privacy_level = 'public');

-- === POLICIES: USER-SPECIFIC READ ===
CREATE POLICY IF NOT EXISTS "Own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own push subs" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY IF NOT EXISTS "Job poster sees apps" ON public.job_applications FOR SELECT USING (EXISTS(SELECT 1 FROM jobs WHERE id = job_applications.job_id AND poster_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Own resume" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Family members see family" ON public.families FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Family members see members" ON public.family_members FOR SELECT USING (EXISTS(SELECT 1 FROM family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Family members see events" ON public.family_events FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = family_events.family_id AND user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Own checkins" ON public.guild_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own walks" ON public.safety_walks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(guardian_ids));
CREATE POLICY IF NOT EXISTS "Own interactions" ON public.police_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own ticket messages" ON public.support_messages FOR SELECT USING (EXISTS(SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Own flags" ON public.content_flags FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY IF NOT EXISTS "Own violations" ON public.violations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own restrictions" ON public.user_restrictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Own recordings" ON public.community_recordings FOR SELECT USING (auth.uid() = recorder_id);
CREATE POLICY IF NOT EXISTS "Own appeals" ON public.appeals FOR SELECT USING (auth.uid() = user_id);

-- === POLICIES: AUTHENTICATED INSERT ===
CREATE POLICY IF NOT EXISTS "Create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Manage own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Manage own preferences update" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Register push" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create housing" ON public.housing_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own housing" ON public.housing_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create review" ON public.housing_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create ride" ON public.rideshare_rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own ride" ON public.rideshare_rides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create job" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY IF NOT EXISTS "Update own job" ON public.jobs FOR UPDATE USING (auth.uid() = poster_id);
CREATE POLICY IF NOT EXISTS "Apply to job" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY IF NOT EXISTS "Create resume" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own resume" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Enroll course" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update progress" ON public.course_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Post discussion" ON public.course_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create course" ON public.courses FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Create family" ON public.families FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Add family member" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Create family event" ON public.family_events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS "Register business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Update own business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY IF NOT EXISTS "Review business" ON public.business_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Join guild" ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Claim task" ON public.guild_tasks FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Create task" ON public.guild_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Report conflict" ON public.guild_conflicts FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY IF NOT EXISTS "Update conflict" ON public.guild_conflicts FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Guild checkin" ON public.guild_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Upload media" ON public.media_content FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Update own media" ON public.media_content FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Like media" ON public.media_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Unlike media" ON public.media_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create station" ON public.radio_stations FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Create proposal" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY IF NOT EXISTS "Vote on proposal" ON public.proposal_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create post" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Like post" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Unlike post" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Comment on post" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Start walk" ON public.safety_walks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update own walk" ON public.safety_walks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Log interaction" ON public.police_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Create ticket" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Send ticket message" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY IF NOT EXISTS "Submit resource" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Send broadcast" ON public.broadcasts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY IF NOT EXISTS "Acknowledge broadcast" ON public.broadcast_acks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Flag content" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY IF NOT EXISTS "Upload recording" ON public.community_recordings FOR INSERT WITH CHECK (auth.uid() = recorder_id);
CREATE POLICY IF NOT EXISTS "Create wiki page" ON public.wiki_pages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS "Update wiki page" ON public.wiki_pages FOR UPDATE USING (locked = false);
CREATE POLICY IF NOT EXISTS "Create wiki revision" ON public.wiki_revisions FOR INSERT WITH CHECK (auth.uid() = editor_id);
CREATE POLICY IF NOT EXISTS "Propose amendment" ON public.constitution_amendments FOR INSERT WITH CHECK (auth.uid() = proposed_by);
CREATE POLICY IF NOT EXISTS "Annotate constitution" ON public.constitution_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Award badge" ON public.user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Join challenge" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Update challenge progress" ON public.challenge_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "File appeal" ON public.appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mark notifications read
CREATE POLICY IF NOT EXISTS "Mark own read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Delete own push subscription
CREATE POLICY IF NOT EXISTS "Delete own push" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- REALTIME ADDITIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_walks;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Increment/decrement user balance safely
CREATE OR REPLACE FUNCTION public.increment_balance(user_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET mly_balance = mly_balance + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user standing points (used by standing system)
CREATE OR REPLACE FUNCTION public.get_standing_points(uid UUID)
RETURNS INTEGER AS $$
DECLARE
  pts INTEGER := 0;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO pts FROM health_checkins WHERE user_id = uid;
  pts := pts + COALESCE((SELECT COUNT(*) * 3 FROM city_issues WHERE reporter_id = uid), 0);
  pts := pts + COALESCE((SELECT COUNT(*) * 2 FROM proposal_votes WHERE user_id = uid), 0);
  pts := pts + COALESCE((SELECT COUNT(*) * 5 FROM media_content WHERE creator_id = uid), 0);
  pts := pts + COALESCE((SELECT COUNT(*) FROM mly_transactions WHERE from_id = uid), 0);
  pts := pts + COALESCE((SELECT COUNT(*) * 5 FROM guild_tasks WHERE completed_by = uid AND status = 'completed'), 0);
  pts := pts + COALESCE((SELECT COUNT(*) * 10 FROM course_progress WHERE user_id = uid AND completed = true), 0);
  RETURN pts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
