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
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

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
CREATE INDEX idx_housing_status ON public.housing_listings(status, created_at DESC);

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
CREATE INDEX idx_rideshare_status ON public.rideshare_rides(status, departure_at);

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
CREATE INDEX idx_jobs_status ON public.jobs(status, created_at DESC);

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
CREATE INDEX idx_courses_category ON public.courses(category, published);

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
CREATE INDEX idx_modules_course ON public.course_modules(course_id, position);

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
CREATE INDEX idx_businesses_category ON public.businesses(category);

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
CREATE INDEX idx_guild_tasks_status ON public.guild_tasks(status);

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
CREATE INDEX idx_guild_checkins_user ON public.guild_checkins(user_id, created_at DESC);

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
CREATE INDEX idx_media_content_type ON public.media_content(type, status, created_at DESC);
CREATE INDEX idx_media_content_creator ON public.media_content(creator_id);

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
CREATE INDEX idx_proposals_status ON public.proposals(status, ends_at);

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
CREATE INDEX idx_feed_posts_user ON public.feed_posts(user_id, created_at DESC);
CREATE INDEX idx_feed_posts_recent ON public.feed_posts(created_at DESC);

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
CREATE INDEX idx_police_interactions_user ON public.police_interactions(user_id, created_at DESC);

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
CREATE INDEX idx_resources_category ON public.resources(category);

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
CREATE INDEX idx_content_flags_status ON public.content_flags(status, created_at);

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
CREATE INDEX idx_restrictions_user ON public.user_restrictions(user_id, active);

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
CREATE INDEX idx_recordings_status ON public.community_recordings(status, created_at DESC);

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
CREATE INDEX idx_wiki_pages_slug ON public.wiki_pages(slug);
CREATE INDEX idx_wiki_pages_category ON public.wiki_pages(category);

CREATE TABLE IF NOT EXISTS public.wiki_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id),
  content_md TEXT NOT NULL,
  edit_summary TEXT,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wiki_revisions_page ON public.wiki_revisions(page_id, version DESC);

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
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

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
CREATE INDEX idx_mly_daily_stats_date ON public.mly_daily_stats(date DESC);

-- ============================================
-- ADDITIONAL STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('wiki', 'wiki', true) ON CONFLICT DO NOTHING;

-- Storage policies for new buckets
CREATE POLICY "Media files are public" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Recordings private to owner" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Wiki images are public" ON storage.objects FOR SELECT USING (bucket_id = 'wiki');
CREATE POLICY "Authenticated can upload wiki images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wiki' AND auth.role() = 'authenticated');

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
CREATE POLICY "Public read" ON public.housing_listings FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.housing_reviews FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.rideshare_rides FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.courses FOR SELECT USING (published = true);
CREATE POLICY "Public read" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.course_discussions FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.business_reviews FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.guild_tasks FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.guild_conflicts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.media_content FOR SELECT USING (status = 'published');
CREATE POLICY "Public read" ON public.media_likes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.radio_stations FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.proposal_votes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.broadcast_acks FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.wiki_pages FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.wiki_revisions FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.constitution_articles FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.constitution_amendments FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.constitution_annotations FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.challenge_progress FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.mly_treasury FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.mly_daily_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.community_recordings FOR SELECT USING (privacy_level = 'public');

-- === POLICIES: USER-SPECIFIC READ ===
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own push subs" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job poster sees apps" ON public.job_applications FOR SELECT USING (EXISTS(SELECT 1 FROM jobs WHERE id = job_applications.job_id AND poster_id = auth.uid()));
CREATE POLICY "Own resume" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Family members see family" ON public.families FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid()));
CREATE POLICY "Family members see members" ON public.family_members FOR SELECT USING (EXISTS(SELECT 1 FROM family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()));
CREATE POLICY "Family members see events" ON public.family_events FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = family_events.family_id AND user_id = auth.uid()));
CREATE POLICY "Own checkins" ON public.guild_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own walks" ON public.safety_walks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(guardian_ids));
CREATE POLICY "Own interactions" ON public.police_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own ticket messages" ON public.support_messages FOR SELECT USING (EXISTS(SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid()));
CREATE POLICY "Own flags" ON public.content_flags FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Own violations" ON public.violations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own restrictions" ON public.user_restrictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own recordings" ON public.community_recordings FOR SELECT USING (auth.uid() = recorder_id);
CREATE POLICY "Own appeals" ON public.appeals FOR SELECT USING (auth.uid() = user_id);

-- === POLICIES: AUTHENTICATED INSERT ===
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Manage own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manage own preferences update" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Register push" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create housing" ON public.housing_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own housing" ON public.housing_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Create review" ON public.housing_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create ride" ON public.rideshare_rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own ride" ON public.rideshare_rides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Create job" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Update own job" ON public.jobs FOR UPDATE USING (auth.uid() = poster_id);
CREATE POLICY "Apply to job" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Create resume" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own resume" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enroll course" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update progress" ON public.course_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Post discussion" ON public.course_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create course" ON public.courses FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Create family" ON public.families FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Add family member" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Create family event" ON public.family_events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Register business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Update own business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Review business" ON public.business_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Join guild" ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Claim task" ON public.guild_tasks FOR UPDATE USING (true);
CREATE POLICY "Create task" ON public.guild_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Report conflict" ON public.guild_conflicts FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Update conflict" ON public.guild_conflicts FOR UPDATE USING (true);
CREATE POLICY "Guild checkin" ON public.guild_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Upload media" ON public.media_content FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Update own media" ON public.media_content FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Like media" ON public.media_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike media" ON public.media_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Create station" ON public.radio_stations FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Create proposal" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Vote on proposal" ON public.proposal_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create post" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Like post" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike post" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Comment on post" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Start walk" ON public.safety_walks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own walk" ON public.safety_walks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Log interaction" ON public.police_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create ticket" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Send ticket message" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Submit resource" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Send broadcast" ON public.broadcasts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Acknowledge broadcast" ON public.broadcast_acks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Flag content" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Upload recording" ON public.community_recordings FOR INSERT WITH CHECK (auth.uid() = recorder_id);
CREATE POLICY "Create wiki page" ON public.wiki_pages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update wiki page" ON public.wiki_pages FOR UPDATE USING (locked = false);
CREATE POLICY "Create wiki revision" ON public.wiki_revisions FOR INSERT WITH CHECK (auth.uid() = editor_id);
CREATE POLICY "Propose amendment" ON public.constitution_amendments FOR INSERT WITH CHECK (auth.uid() = proposed_by);
CREATE POLICY "Annotate constitution" ON public.constitution_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Award badge" ON public.user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Join challenge" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update challenge progress" ON public.challenge_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "File appeal" ON public.appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mark notifications read
CREATE POLICY "Mark own read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Delete own push subscription
CREATE POLICY "Delete own push" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

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
CREATE INDEX idx_forum_spaces_slug ON public.forum_spaces(slug);

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
CREATE INDEX idx_forum_posts_space ON public.forum_posts(space_id, created_at DESC);
CREATE INDEX idx_forum_posts_hot ON public.forum_posts(space_id, upvotes DESC);

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
CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id, created_at);

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
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

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
CREATE INDEX idx_stories_user ON public.stories(user_id, created_at DESC);

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
CREATE INDEX idx_reels_recent ON public.reels(created_at DESC);

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
CREATE INDEX idx_news_articles_category ON public.news_articles(category, created_at DESC);

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
CREATE INDEX idx_calls_participants ON public.call_sessions(caller_id, callee_id, created_at DESC);

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
CREATE INDEX idx_marketplace_type ON public.marketplace_listings(type, status, created_at DESC);
CREATE INDEX idx_marketplace_category ON public.marketplace_listings(category, status);

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
CREATE INDEX idx_service_requests_status ON public.service_requests(status, created_at DESC);

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
CREATE INDEX idx_map_reports_geo ON public.map_reports(lat, lng);
CREATE INDEX idx_map_reports_active ON public.map_reports(expires_at) WHERE expires_at > NOW();

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
CREATE INDEX idx_vehicles_owner ON public.vehicles(owner_id);

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
CREATE INDEX idx_parking_geo ON public.parking_spots(lat, lng);

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
CREATE POLICY "Public read" ON public.forum_spaces FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.forum_memberships FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.social_profiles FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Public read" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.social_reactions FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.news_sources FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.research_projects FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.research_members FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.academic_papers FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.research_grants FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.marketplace_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Public read" ON public.civic_projects FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.civic_milestones FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.civic_repair_claims FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.repair_certifications FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.map_reports FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Public read" ON public.transit_stops FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.car_shares FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.parking_spots FOR SELECT USING (true);

-- USER-SPECIFIC READ
CREATE POLICY "Own calls" ON public.call_sessions FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY "Own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
CREATE POLICY "Own escrow" ON public.escrow_holds FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Own routes" ON public.map_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Own maintenance" ON public.maintenance_records FOR SELECT USING (EXISTS(SELECT 1 FROM vehicles WHERE id = maintenance_records.vehicle_id AND owner_id = auth.uid()));

-- AUTHENTICATED INSERT policies
CREATE POLICY "Create space" ON public.forum_spaces FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Create post" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Create comment" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Join space" ON public.forum_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vote" ON public.forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
CREATE POLICY "Post story" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post reel" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "React" ON public.social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unreact" ON public.social_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Submit article" ON public.news_articles FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Comment news" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Start call" ON public.call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Update call" ON public.call_sessions FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY "Create project" ON public.research_projects FOR INSERT WITH CHECK (auth.uid() = lead_id);
CREATE POLICY "Join research" ON public.research_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Create study group" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Submit paper" ON public.academic_papers FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Fund research" ON public.research_grants FOR INSERT WITH CHECK (auth.uid() = funder_id);
CREATE POLICY "Create listing" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Update listing" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Request service" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Update service" ON public.service_requests FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
CREATE POLICY "Create escrow" ON public.escrow_holds FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Create civic project" ON public.civic_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Create milestone" ON public.civic_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Claim repair" ON public.civic_repair_claims FOR INSERT WITH CHECK (auth.uid() = claimer_id);
CREATE POLICY "Update repair" ON public.civic_repair_claims FOR UPDATE USING (auth.uid() = claimer_id);
CREATE POLICY "Report map" ON public.map_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Save route" ON public.map_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Add vehicle" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Update vehicle" ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Log maintenance" ON public.maintenance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Share car" ON public.car_shares FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Update share" ON public.car_shares FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Report parking" ON public.parking_spots FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_reports;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('social', 'social', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('forum', 'forum', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Social media public" ON storage.objects FOR SELECT USING (bucket_id = 'social');
CREATE POLICY "Upload social" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');
CREATE POLICY "Forum media public" ON storage.objects FOR SELECT USING (bucket_id = 'forum');
CREATE POLICY "Upload forum" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum' AND auth.role() = 'authenticated');
CREATE POLICY "Vehicle media public" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');
CREATE POLICY "Upload vehicle" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicles' AND auth.role() = 'authenticated');

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

CREATE TRIGGER on_follow_change
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

CREATE TRIGGER on_membership_change
AFTER INSERT OR DELETE ON public.forum_memberships
FOR EACH ROW EXECUTE FUNCTION update_space_member_count();
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
-- ============================================================================
-- MiLearn — 25 Real Courses with Module Content
-- Run after 002_full_platform_tables.sql
-- ============================================================================

-- ─── LEGAL & RIGHTS (5 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c001', 'Know Your Rights: Complete Guide', 'A comprehensive guide to your constitutional rights, how to exercise them, and what to do when they''re violated.', 'legal', 'beginner', 15, 10),
('c002', 'Tenant Rights in Florida', 'Everything renters need to know about Florida landlord-tenant law, eviction protections, and how to fight back.', 'legal', 'beginner', 12, 8),
('c003', 'Police Encounters: What to Do', 'Step-by-step guide for traffic stops, pedestrian stops, home visits, and arrest scenarios. Know what to say and when to stay silent.', 'legal', 'beginner', 10, 6),
('c004', 'Small Claims Court: Step by Step', 'How to file, prepare, and win in small claims court without a lawyer. Covers disputes up to $8,000 in Florida.', 'legal', 'intermediate', 12, 7),
('c005', 'Immigration Rights Basics', 'Your rights regardless of immigration status. ICE encounters, workplace rights, family separation resources.', 'legal', 'beginner', 12, 8);

-- Modules for Course 1: Know Your Rights
INSERT INTO course_modules (course_id, position, title, content_md, quiz) VALUES
('c001', 1, 'The Bill of Rights Overview', '# The Bill of Rights\n\nThe first 10 amendments to the Constitution protect your fundamental freedoms.\n\n## Key Takeaway\nThese rights **cannot** be taken away by any government — federal, state, or local. They apply to everyone on US soil, regardless of citizenship status.\n\n## The Big 5 You Need Daily:\n1. **1st Amendment** — Speech, religion, assembly, press\n2. **4th Amendment** — No unreasonable searches\n3. **5th Amendment** — Right to remain silent\n4. **6th Amendment** — Right to a lawyer\n5. **14th Amendment** — Equal protection\n\n## Why This Matters\nPolice, employers, and governments routinely violate these rights because people don''t know they have them. Knowledge is your first defense.', '[{"question":"Can the government restrict your right to protest?","options":["Yes, always","No, never","Only with a permit for public safety","Only during emergencies"],"correct":2},{"question":"Do constitutional rights apply to non-citizens?","options":["No","Yes, most of them","Only the 2nd Amendment","Only to legal residents"],"correct":1}]'),
('c001', 2, 'The 4th Amendment: Searches', '# Your Right Against Unreasonable Search\n\n## The Rule\nPolice CANNOT search you, your home, your car, or your phone without:\n- A warrant signed by a judge, OR\n- Your voluntary consent, OR\n- A recognized exception (plain view, exigent circumstances)\n\n## The Magic Words\n> "I do not consent to a search."\n\nSay it clearly. Say it calmly. Say it on camera if possible.\n\n## What Happens If They Search Anyway?\nDo NOT physically resist. State your objection verbally, then comply physically. The evidence may be thrown out in court later (exclusionary rule).\n\n## Phone Searches\nSince Riley v. California (2014), police need a warrant to search your phone — even during an arrest. Lock your phone with a passcode (not biometrics, which can be compelled).', '[{"question":"What should you say if police ask to search your car?","options":["Sure, I have nothing to hide","I do not consent to a search","You need my lawyer''s permission","I''ll think about it"],"correct":1},{"question":"Can police search your phone during arrest without a warrant?","options":["Yes","No","Only if it''s unlocked","Only for 5 minutes"],"correct":1}]'),
('c001', 3, 'The 5th Amendment: Silence', '# Your Right to Remain Silent\n\n## The Rule\nYou cannot be forced to testify against yourself. This applies:\n- During police questioning\n- During interrogation\n- In court\n- At any government hearing\n\n## How to Invoke It\n> "I am invoking my Fifth Amendment right to remain silent. I want a lawyer."\n\nThen **STOP TALKING**. Completely. Do not:\n- Explain yourself\n- Apologize\n- Make small talk\n- Answer "just one more question"\n\n## Why People Talk\nPolice are trained interrogators. They use:\n- Fake sympathy: "I understand, just explain your side"\n- Lies: "Your friend already told us everything" (legal to lie)\n- Minimization: "It''s not a big deal, just clear it up"\n\nAll designed to make you incriminate yourself.\n\n## The Only Correct Response\nLawyer. Silence. Nothing else.', '[{"question":"After invoking your right to silence, what should you do?","options":["Explain your side briefly","Answer easy questions only","Stop talking completely","Ask what evidence they have"],"correct":2},{"question":"Can police legally lie to you during interrogation?","options":["No, that''s illegal","Yes, it''s allowed","Only federal agents","Only with a warrant"],"correct":1}]'),
('c001', 4, 'The 6th Amendment: Right to Counsel', '# Your Right to a Lawyer\n\n## The Rule\nIf you are arrested or charged with a crime, you have the right to:\n- A lawyer (even if you can''t afford one)\n- Have that lawyer present during questioning\n- A speedy public trial\n- Confront witnesses against you\n\n## How to Get a Public Defender\n1. At your first court appearance (arraignment), tell the judge you cannot afford a lawyer\n2. Fill out the financial affidavit\n3. A public defender will be assigned\n\n## Important: Invoke EARLY\nDon''t wait until court. The moment police contact becomes adversarial:\n> "I want a lawyer."\n\nOnce you say this, they MUST stop questioning you.\n\n## Jacksonville Resources\n- Public Defender: 904-255-4700\n- Jacksonville Area Legal Aid: 904-356-8371\n- Three Rivers Legal Services: 386-752-1011', '[{"question":"When should you ask for a lawyer?","options":["At trial","At arraignment","The moment police questioning becomes adversarial","Only if charged with a felony"],"correct":2}]'),
('c001', 5, 'The 14th Amendment: Equal Protection', '# Equal Protection Under Law\n\n## The Rule\nNo state shall deny any person equal protection of the laws. This means:\n- Police must treat you the same regardless of race\n- City services must be equally distributed across neighborhoods\n- Laws cannot discriminate based on protected characteristics\n\n## Why This Matters for Jacksonville\nIf your neighborhood gets:\n- Slower police response times\n- Worse road maintenance\n- Fewer parks and resources\n- Heavier policing for minor offenses\n\n...compared to wealthier/whiter neighborhoods, that may violate the 14th Amendment.\n\n## How MiLyfe Helps\nMiCity tracks issue resolution times by neighborhood. This data can be used to prove unequal treatment — the first step to legal challenge.\n\n## Filing a Complaint\n- DOJ Civil Rights Division: 1-800-253-3931\n- ACLU of Florida: aclufl.org\n- NAACP Jacksonville Branch: 904-354-1217', '[{"question":"What does the 14th Amendment guarantee?","options":["Right to bear arms","Freedom of speech","Equal protection under law","Right to vote"],"correct":2}]');

-- ─── FINANCIAL (5 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c006', '$MLY Economics: How Community Currency Works', 'Understand the MiLyfe economy — how $MLY is earned, spent, decayed, and why it''s designed to circulate.', 'financial', 'beginner', 8, 5),
('c007', 'Building Credit from Zero', 'A step-by-step guide to establishing credit history, improving your score, and avoiding predatory products.', 'financial', 'beginner', 12, 8),
('c008', 'Starting a Business with $0', 'How to validate, launch, and grow a business with no capital. Leverage community, skills, and platforms.', 'financial', 'intermediate', 15, 10),
('c009', 'Crypto & Digital Assets for Beginners', 'Understand blockchain, Bitcoin, stablecoins, and digital ownership without the hype. Practical knowledge for the real world.', 'financial', 'beginner', 10, 7),
('c010', 'Tax Basics for Gig Workers', 'Self-employment tax, quarterly payments, deductions, and how to not get surprised at tax time.', 'financial', 'intermediate', 10, 6);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c006', 1, 'What is $MLY?', '# Understanding $MLY\n\n$MLY is MiLyfe''s community currency. It is:\n- **Not crypto** — no blockchain, no speculation\n- **Pegged 1:1 to USD** — 1 MLY = $1\n- **Earned, not bought** — you get it by participating\n- **Designed to circulate** — hoarding is taxed\n\n## How You Earn\n- Daily UBI: $10/day for active members\n- Health check-ins: $5/day\n- Reporting issues: $3-10\n- Voting on proposals: $3\n- Publishing content: $5\n- Completing courses: $8-15\n- Guild patrols: $10-30/day\n\n## How You Spend\n- Buy from MiShop\n- Pay local businesses\n- Send to friends/family\n- Tip creators\n- Fund proposals'),
('c006', 2, 'The Decay System', '# Why Your Balance Decreases\n\n## Inactive Decay\nIf you don''t participate for 14+ days, your balance decays at 2% per day.\n\n**Why?** To prevent abandonment. $MLY that sits in dead accounts hurts the community.\n\n## Hoarding Tax\nBalances over $1,000 MLY decay at 1% per day on the excess.\n\n**Why?** To encourage circulation. $MLY is meant to flow through the community, not be hoarded.\n\n## How to Avoid Decay\n- Check in daily (any action counts)\n- Spend at local businesses\n- Send to friends\n- Participate in governance\n\n## Where Decayed MLY Goes\nIt''s burned — permanently removed from supply. This keeps the overall value stable.'),
('c006', 3, 'Spending Smart', '# Where to Spend $MLY\n\n## Local Businesses\nCheck the Business Hub for shops accepting $MLY. Every dollar spent locally is a dollar that stays in our community.\n\n## MiShop\nBuy goods and services from neighbors. From baked goods to tutoring to lawn care.\n\n## Tips & Transfers\nTip content creators. Send $MLY to family. Split costs with roommates.\n\n## Why Spending > Hoarding\nEvery $MLY spent:\n1. Supports a neighbor''s income\n2. Keeps the local economy healthy\n3. Avoids your hoarding tax\n4. Earns you standing points\n\nThe system rewards circulation, not accumulation.');

-- ─── DIGITAL (4 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c011', 'Digital Literacy: Protect Yourself Online', 'Passwords, phishing, privacy settings, and data protection. Essential knowledge for the modern world.', 'digital', 'beginner', 10, 8),
('c012', 'Building Your First Website', 'From zero to published website. No coding experience needed. HTML, hosting, and domains explained simply.', 'digital', 'beginner', 12, 10),
('c013', 'Data Privacy: What They Know About You', 'How companies track you, what data they sell, and practical steps to protect your digital footprint.', 'digital', 'intermediate', 10, 6),
('c014', 'AI Literacy: Understanding Machine Learning', 'What AI actually is, how it works, its limitations, and how it''s being used in your daily life.', 'digital', 'intermediate', 12, 7);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c011', 1, 'Password Security', '# Passwords: Your First Defense\n\n## The Problem\nMost people use:\n- The same password everywhere\n- Short, guessable passwords\n- Personal info (birthdays, pet names)\n\n## The Fix\n1. **Use a password manager** (Bitwarden is free)\n2. **Make passwords 16+ characters**\n3. **Never reuse across sites**\n4. **Enable 2FA everywhere**\n\n## How to Make a Strong Password\nUse a passphrase: 4+ random words strung together\n- Bad: `fluffy123`\n- Good: `correct-horse-battery-staple`\n- Better: `MiLyfe$Platform$Jacksonville$2026`\n\n## If You Get Hacked\n1. Change the compromised password immediately\n2. Change it everywhere else you used it\n3. Enable 2FA\n4. Check haveibeenpwned.com'),
('c011', 2, 'Phishing & Scams', '# Recognizing Phishing\n\n## What is Phishing?\nFake emails, texts, or websites designed to steal your login credentials or personal info.\n\n## Red Flags\n- Urgent language: "Your account will be closed!"\n- Unknown sender with familiar branding\n- Links that don''t match the company''s real domain\n- Requests for passwords or SSN via email\n- Grammar errors in "official" communications\n\n## What to Do\n1. **Don''t click links** in suspicious emails\n2. **Go directly** to the website by typing it yourself\n3. **Check the sender** email address carefully\n4. **When in doubt**, call the company using their official number\n\n## Common Jacksonville Scams\n- Fake JEA shutoff notices\n- "Jury duty" phone calls demanding payment\n- Fake city parking tickets with QR codes\n- Social media "free MLY" schemes');

-- ─── CIVIC (4 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c015', 'How Local Government Actually Works', 'City council, mayor, budget process, and how decisions affecting your neighborhood get made.', 'civic', 'beginner', 12, 8),
('c016', 'Community Organizing 101', 'How to identify issues, build coalitions, run meetings, pressure officials, and create lasting change.', 'civic', 'intermediate', 15, 10),
('c017', 'Running for Local Office', 'Filing requirements, campaign basics, fundraising, and what the job actually entails. You don''t need to be rich.', 'civic', 'advanced', 15, 7),
('c018', 'Grant Writing for Community Projects', 'Find funding sources, write compelling proposals, manage budgets, and report outcomes.', 'civic', 'advanced', 15, 8);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c015', 1, 'Jacksonville City Government Structure', '# How Jax is Governed\n\n## Consolidated Government\nJacksonville is unique — the city and county merged in 1968. One government covers everything.\n\n## Key Players\n- **Mayor** — Executive (elected, 4-year term)\n- **City Council** — 19 members (14 district + 5 at-large)\n- **Constitutional Officers** — Sheriff, Property Appraiser, Clerk, Tax Collector, Supervisor of Elections\n\n## How Decisions Get Made\n1. Issue identified\n2. Council member introduces legislation\n3. Committee review\n4. Full council vote (10 votes to pass)\n5. Mayor signs or vetoes (13 votes to override)\n\n## Your Entry Points\n- City Council meetings: 1st & 3rd Tuesday, 5pm\n- Public comment: 3 minutes to speak on any topic\n- Committee meetings: Where real work happens\n- Your district council member: The person who represents YOUR area'),
('c015', 2, 'The City Budget', '# Following the Money\n\n## Jacksonville Budget (~$1.6 Billion/year)\n- Public Safety (Sheriff + Fire): ~45%\n- Infrastructure (Roads, Water, Parks): ~20%\n- General Government: ~15%\n- Debt Service: ~10%\n- Everything else: ~10%\n\n## Why This Matters\nWhen your street has potholes but the sheriff gets a new helicopter, that''s a budget priority decision. You can influence these.\n\n## Budget Calendar\n- March: Mayor''s budget office starts planning\n- July: Mayor submits proposed budget\n- August-September: Council hearings (PUBLIC)\n- October 1: New fiscal year begins\n\n## How to Participate\n1. Attend budget hearings in August\n2. Submit written comments to your council member\n3. Use MiCity data to show neighborhood investment gaps\n4. Organize neighbors to show up together (numbers matter)');

-- ─── HEALTH (3 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c019', 'Mental Health First Aid', 'Recognize signs of crisis, support someone in distress, and know when/how to get professional help.', 'health', 'beginner', 12, 8),
('c020', 'Nutrition on a Budget', 'Eat well without spending a fortune. Meal planning, food assistance programs, and community resources.', 'health', 'beginner', 8, 6),
('c021', 'CPR & First Aid Basics', 'Learn the basics of emergency response. Hands-only CPR, choking, bleeding, and when to call 911.', 'health', 'beginner', 10, 5);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c019', 1, 'Recognizing a Mental Health Crisis', '# When Someone Needs Help\n\n## Warning Signs\n- Talking about wanting to die or being a burden\n- Withdrawing from activities and people\n- Extreme mood swings\n- Giving away possessions\n- Increased substance use\n- Sleeping too much or too little\n- Expressing hopelessness\n\n## What to Do\n1. **Ask directly**: "Are you thinking about hurting yourself?" (This does NOT plant the idea)\n2. **Listen without judgment**\n3. **Don''t leave them alone** if in immediate danger\n4. **Call 988** (Suicide & Crisis Lifeline) together\n5. **Call 911** if there''s immediate danger\n\n## Jacksonville Resources\n- 988 Suicide & Crisis Lifeline (call or text)\n- Crisis Center: 904-632-0600\n- Mobile Crisis Team: 904-695-9145\n- NAMI Jacksonville: 904-724-7782\n\n## Remember\nYou don''t need to be a therapist. Just being present and connecting them to help can save a life.');

-- ─── CAREER (3 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c022', 'Interview Skills That Actually Work', 'STAR method, common questions, salary negotiation, and how to follow up. Practical tips from hiring managers.', 'career', 'beginner', 10, 6),
('c023', 'Remote Work: Getting Started', 'Find remote jobs, set up your workspace, manage your time, and avoid common pitfalls.', 'career', 'beginner', 10, 7),
('c024', 'Freelancing & Self-Employment', 'Find clients, set rates, manage contracts, handle taxes, and build a sustainable independent career.', 'career', 'intermediate', 12, 9);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c022', 1, 'The STAR Method', '# STAR: How to Answer Any Interview Question\n\n## What is STAR?\nA structured way to answer behavioral interview questions:\n\n- **S**ituation — Set the scene (where, when, what was happening)\n- **T**ask — What was your responsibility?\n- **A**ction — What specifically did YOU do?\n- **R**esult — What happened? (Use numbers if possible)\n\n## Example\n**Q: "Tell me about a time you solved a difficult problem"**\n\n**S:** "At my previous job, our main delivery vendor suddenly went out of business, leaving us with 200 pending orders."\n\n**T:** "As operations lead, I needed to find an alternative within 48 hours or we''d lose those customers."\n\n**A:** "I called 12 local delivery services, negotiated a temporary contract with the best option, personally re-routed the most urgent orders, and set up a tracking system so customers could see status."\n\n**R:** "We fulfilled 195 of 200 orders on time, retained 97% of those customers, and the temp vendor became our permanent partner at 15% lower cost."\n\n## Practice Questions\n1. Tell me about a time you failed\n2. Describe a conflict with a coworker\n3. When did you go above and beyond?\n4. How do you handle tight deadlines?');

-- ─── LIFE SKILLS (2 courses) ──────────────────────────────────────────

INSERT INTO courses (id, title, description, category, difficulty, mly_reward, module_count) VALUES
('c025', 'Conflict Resolution & De-escalation', 'Calm tense situations, mediate disputes, and find solutions without violence. Essential for Guild members.', 'life_skills', 'intermediate', 12, 7),
('c026', 'Home Repair Basics', 'Fix common household problems yourself. Plumbing, electrical, drywall, and when to call a professional.', 'life_skills', 'beginner', 10, 10);

INSERT INTO course_modules (course_id, position, title, content_md) VALUES
('c025', 1, 'The De-escalation Mindset', '# Before Techniques: Your State of Mind\n\n## The Goal\nDe-escalation is NOT about winning. It''s about reducing emotional temperature so rational conversation becomes possible.\n\n## Your Checklist Before Engaging\n1. **Am I calm?** If not, you''ll escalate it further\n2. **Am I safe?** If physical danger exists, create distance first\n3. **What does this person need?** Usually to be heard\n4. **What''s my exit?** Always know how to disengage\n\n## Core Principles\n- **Lower your voice** — people match your energy\n- **Slow down** — speed = anxiety = escalation\n- **Open posture** — uncrossed arms, visible hands\n- **Acknowledge** — "I hear you" is powerful even when you disagree\n- **Name the emotion** — "You seem frustrated" validates without agreeing\n\n## What NOT to Do\n- Don''t say "calm down" (never works)\n- Don''t point or use aggressive body language\n- Don''t interrupt or talk over them\n- Don''t make threats or ultimatums\n- Don''t take insults personally\n\n## The 5-Second Rule\nWhen you feel triggered, count to 5 before responding. Most regrettable things are said in the first 3 seconds.');
