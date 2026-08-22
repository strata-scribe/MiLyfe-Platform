-- ============================================================================
-- MiLyfe Platform — COMPLETE MIGRATION (Safe to re-run)
-- Drops non-core tables, then recreates everything cleanly.
-- Core tables (profiles, transactions, issues, checkins, messages) are preserved.
-- ============================================================================

-- === DROP NON-CORE TABLES (preserves user data) ===
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.housing_listings CASCADE;
DROP TABLE IF EXISTS public.housing_reviews CASCADE;
DROP TABLE IF EXISTS public.rideshare_rides CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.course_discussions CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.family_events CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.business_reviews CASCADE;
DROP TABLE IF EXISTS public.guild_members CASCADE;
DROP TABLE IF EXISTS public.guild_tasks CASCADE;
DROP TABLE IF EXISTS public.guild_conflicts CASCADE;
DROP TABLE IF EXISTS public.guild_checkins CASCADE;
DROP TABLE IF EXISTS public.media_content CASCADE;
DROP TABLE IF EXISTS public.media_likes CASCADE;
DROP TABLE IF EXISTS public.radio_stations CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.proposal_votes CASCADE;
DROP TABLE IF EXISTS public.feed_posts CASCADE;
DROP TABLE IF EXISTS public.feed_likes CASCADE;
DROP TABLE IF EXISTS public.feed_comments CASCADE;
DROP TABLE IF EXISTS public.safety_walks CASCADE;
DROP TABLE IF EXISTS public.police_interactions CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.broadcasts CASCADE;
DROP TABLE IF EXISTS public.broadcast_acks CASCADE;
DROP TABLE IF EXISTS public.content_flags CASCADE;
DROP TABLE IF EXISTS public.violations CASCADE;
DROP TABLE IF EXISTS public.user_restrictions CASCADE;
DROP TABLE IF EXISTS public.community_juries CASCADE;
DROP TABLE IF EXISTS public.appeals CASCADE;
DROP TABLE IF EXISTS public.community_recordings CASCADE;
DROP TABLE IF EXISTS public.wiki_pages CASCADE;
DROP TABLE IF EXISTS public.wiki_revisions CASCADE;
DROP TABLE IF EXISTS public.constitution_articles CASCADE;
DROP TABLE IF EXISTS public.constitution_amendments CASCADE;
DROP TABLE IF EXISTS public.constitution_annotations CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.challenge_progress CASCADE;
DROP TABLE IF EXISTS public.mly_treasury CASCADE;
DROP TABLE IF EXISTS public.mly_daily_stats CASCADE;
DROP TABLE IF EXISTS public.forum_spaces CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;
DROP TABLE IF EXISTS public.forum_comments CASCADE;
DROP TABLE IF EXISTS public.forum_memberships CASCADE;
DROP TABLE IF EXISTS public.forum_votes CASCADE;
DROP TABLE IF EXISTS public.social_profiles CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.reels CASCADE;
DROP TABLE IF EXISTS public.social_reactions CASCADE;
DROP TABLE IF EXISTS public.news_sources CASCADE;
DROP TABLE IF EXISTS public.news_articles CASCADE;
DROP TABLE IF EXISTS public.news_comments CASCADE;
DROP TABLE IF EXISTS public.call_sessions CASCADE;
DROP TABLE IF EXISTS public.research_projects CASCADE;
DROP TABLE IF EXISTS public.research_members CASCADE;
DROP TABLE IF EXISTS public.study_groups CASCADE;
DROP TABLE IF EXISTS public.academic_papers CASCADE;
DROP TABLE IF EXISTS public.research_grants CASCADE;
DROP TABLE IF EXISTS public.marketplace_listings CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.escrow_holds CASCADE;
DROP TABLE IF EXISTS public.civic_projects CASCADE;
DROP TABLE IF EXISTS public.civic_milestones CASCADE;
DROP TABLE IF EXISTS public.civic_repair_claims CASCADE;
DROP TABLE IF EXISTS public.repair_certifications CASCADE;
DROP TABLE IF EXISTS public.map_reports CASCADE;
DROP TABLE IF EXISTS public.map_routes CASCADE;
DROP TABLE IF EXISTS public.transit_stops CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.maintenance_records CASCADE;
DROP TABLE IF EXISTS public.car_shares CASCADE;
DROP TABLE IF EXISTS public.parking_spots CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.ai_function_calls CASCADE;
DROP TABLE IF EXISTS public.developer_apps CASCADE;
DROP TABLE IF EXISTS public.app_reviews CASCADE;
DROP TABLE IF EXISTS public.bounties CASCADE;
DROP TABLE IF EXISTS public.developer_contributions CASCADE;
DROP TABLE IF EXISTS public.digital_twins CASCADE;
DROP TABLE IF EXISTS public.twin_actions CASCADE;
DROP TABLE IF EXISTS public.twin_insights CASCADE;
DROP TABLE IF EXISTS public.consent_records CASCADE;
DROP TABLE IF EXISTS public.data_export_requests CASCADE;
DROP TABLE IF EXISTS public.deletion_requests CASCADE;
DROP TABLE IF EXISTS public.ap_actors CASCADE;
DROP TABLE IF EXISTS public.ap_followers CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;

-- === RECREATE ALL TABLES ===
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
DROP POLICY IF EXISTS "Media files are public" ON storage.objects;
CREATE POLICY "Media files are public" ON storage.objects FOR SELECT USING (bucket_id = 'media');
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
CREATE POLICY "Users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Recordings private to owner" ON storage.objects;
CREATE POLICY "Recordings private to owner" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can upload recordings" ON storage.objects;
CREATE POLICY "Users can upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Wiki images are public" ON storage.objects;
CREATE POLICY "Wiki images are public" ON storage.objects FOR SELECT USING (bucket_id = 'wiki');
DROP POLICY IF EXISTS "Authenticated can upload wiki images" ON storage.objects;
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
DROP POLICY IF EXISTS "Public read" ON public.housing_listings;
CREATE POLICY "Public read" ON public.housing_listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.housing_reviews;
CREATE POLICY "Public read" ON public.housing_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.rideshare_rides;
CREATE POLICY "Public read" ON public.rideshare_rides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.jobs;
CREATE POLICY "Public read" ON public.jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.courses;
CREATE POLICY "Public read" ON public.courses FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Public read" ON public.course_modules;
CREATE POLICY "Public read" ON public.course_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.course_discussions;
CREATE POLICY "Public read" ON public.course_discussions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.businesses;
CREATE POLICY "Public read" ON public.businesses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.business_reviews;
CREATE POLICY "Public read" ON public.business_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.guild_members;
CREATE POLICY "Public read" ON public.guild_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.guild_tasks;
CREATE POLICY "Public read" ON public.guild_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.guild_conflicts;
CREATE POLICY "Public read" ON public.guild_conflicts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.media_content;
CREATE POLICY "Public read" ON public.media_content FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Public read" ON public.media_likes;
CREATE POLICY "Public read" ON public.media_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.radio_stations;
CREATE POLICY "Public read" ON public.radio_stations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.proposals;
CREATE POLICY "Public read" ON public.proposals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.proposal_votes;
CREATE POLICY "Public read" ON public.proposal_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.feed_posts;
CREATE POLICY "Public read" ON public.feed_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.feed_likes;
CREATE POLICY "Public read" ON public.feed_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.feed_comments;
CREATE POLICY "Public read" ON public.feed_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.resources;
CREATE POLICY "Public read" ON public.resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.broadcasts;
CREATE POLICY "Public read" ON public.broadcasts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.broadcast_acks;
CREATE POLICY "Public read" ON public.broadcast_acks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.wiki_pages;
CREATE POLICY "Public read" ON public.wiki_pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.wiki_revisions;
CREATE POLICY "Public read" ON public.wiki_revisions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.constitution_articles;
CREATE POLICY "Public read" ON public.constitution_articles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.constitution_amendments;
CREATE POLICY "Public read" ON public.constitution_amendments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.constitution_annotations;
CREATE POLICY "Public read" ON public.constitution_annotations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.badges;
CREATE POLICY "Public read" ON public.badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.user_badges;
CREATE POLICY "Public read" ON public.user_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.challenges;
CREATE POLICY "Public read" ON public.challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.challenge_progress;
CREATE POLICY "Public read" ON public.challenge_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.mly_treasury;
CREATE POLICY "Public read" ON public.mly_treasury FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.mly_daily_stats;
CREATE POLICY "Public read" ON public.mly_daily_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.community_recordings;
CREATE POLICY "Public read" ON public.community_recordings FOR SELECT USING (privacy_level = 'public');

-- === POLICIES: USER-SPECIFIC READ ===
DROP POLICY IF EXISTS "Own notifications" ON public.notifications;
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own preferences" ON public.notification_preferences;
CREATE POLICY "Own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own push subs" ON public.push_subscriptions;
CREATE POLICY "Own push subs" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own applications" ON public.job_applications;
CREATE POLICY "Own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
DROP POLICY IF EXISTS "Job poster sees apps" ON public.job_applications;
CREATE POLICY "Job poster sees apps" ON public.job_applications FOR SELECT USING (EXISTS(SELECT 1 FROM jobs WHERE id = job_applications.job_id AND poster_id = auth.uid()));
DROP POLICY IF EXISTS "Own resume" ON public.resumes;
CREATE POLICY "Own resume" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own progress" ON public.course_progress;
CREATE POLICY "Own progress" ON public.course_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Family members see family" ON public.families;
CREATE POLICY "Family members see family" ON public.families FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Family members see members" ON public.family_members;
CREATE POLICY "Family members see members" ON public.family_members FOR SELECT USING (EXISTS(SELECT 1 FROM family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Family members see events" ON public.family_events;
CREATE POLICY "Family members see events" ON public.family_events FOR SELECT USING (EXISTS(SELECT 1 FROM family_members WHERE family_id = family_events.family_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Own checkins" ON public.guild_checkins;
CREATE POLICY "Own checkins" ON public.guild_checkins FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own walks" ON public.safety_walks;
CREATE POLICY "Own walks" ON public.safety_walks FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(guardian_ids));
DROP POLICY IF EXISTS "Own interactions" ON public.police_interactions;
CREATE POLICY "Own interactions" ON public.police_interactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own tickets" ON public.support_tickets;
CREATE POLICY "Own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own ticket messages" ON public.support_messages;
CREATE POLICY "Own ticket messages" ON public.support_messages FOR SELECT USING (EXISTS(SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Own flags" ON public.content_flags;
CREATE POLICY "Own flags" ON public.content_flags FOR SELECT USING (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Own violations" ON public.violations;
CREATE POLICY "Own violations" ON public.violations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own restrictions" ON public.user_restrictions;
CREATE POLICY "Own restrictions" ON public.user_restrictions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own recordings" ON public.community_recordings;
CREATE POLICY "Own recordings" ON public.community_recordings FOR SELECT USING (auth.uid() = recorder_id);
DROP POLICY IF EXISTS "Own appeals" ON public.appeals;
CREATE POLICY "Own appeals" ON public.appeals FOR SELECT USING (auth.uid() = user_id);

-- === POLICIES: AUTHENTICATED INSERT ===
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Manage own preferences" ON public.notification_preferences;
CREATE POLICY "Manage own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage own preferences update" ON public.notification_preferences;
CREATE POLICY "Manage own preferences update" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Register push" ON public.push_subscriptions;
CREATE POLICY "Register push" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create housing" ON public.housing_listings;
CREATE POLICY "Create housing" ON public.housing_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own housing" ON public.housing_listings;
CREATE POLICY "Update own housing" ON public.housing_listings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create review" ON public.housing_reviews;
CREATE POLICY "Create review" ON public.housing_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create ride" ON public.rideshare_rides;
CREATE POLICY "Create ride" ON public.rideshare_rides FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own ride" ON public.rideshare_rides;
CREATE POLICY "Update own ride" ON public.rideshare_rides FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create job" ON public.jobs;
CREATE POLICY "Create job" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = poster_id);
DROP POLICY IF EXISTS "Update own job" ON public.jobs;
CREATE POLICY "Update own job" ON public.jobs FOR UPDATE USING (auth.uid() = poster_id);
DROP POLICY IF EXISTS "Apply to job" ON public.job_applications;
CREATE POLICY "Apply to job" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
DROP POLICY IF EXISTS "Create resume" ON public.resumes;
CREATE POLICY "Create resume" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own resume" ON public.resumes;
CREATE POLICY "Update own resume" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Enroll course" ON public.course_progress;
CREATE POLICY "Enroll course" ON public.course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update progress" ON public.course_progress;
CREATE POLICY "Update progress" ON public.course_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Post discussion" ON public.course_discussions;
CREATE POLICY "Post discussion" ON public.course_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create course" ON public.courses;
CREATE POLICY "Create course" ON public.courses FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Create family" ON public.families;
CREATE POLICY "Create family" ON public.families FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Add family member" ON public.family_members;
CREATE POLICY "Add family member" ON public.family_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Create family event" ON public.family_events;
CREATE POLICY "Create family event" ON public.family_events FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Register business" ON public.businesses;
CREATE POLICY "Register business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Update own business" ON public.businesses;
CREATE POLICY "Update own business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Review business" ON public.business_reviews;
CREATE POLICY "Review business" ON public.business_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Join guild" ON public.guild_members;
CREATE POLICY "Join guild" ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Claim task" ON public.guild_tasks;
CREATE POLICY "Claim task" ON public.guild_tasks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Create task" ON public.guild_tasks;
CREATE POLICY "Create task" ON public.guild_tasks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Report conflict" ON public.guild_conflicts;
CREATE POLICY "Report conflict" ON public.guild_conflicts FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Update conflict" ON public.guild_conflicts;
CREATE POLICY "Update conflict" ON public.guild_conflicts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Guild checkin" ON public.guild_checkins;
CREATE POLICY "Guild checkin" ON public.guild_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Upload media" ON public.media_content;
CREATE POLICY "Upload media" ON public.media_content FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Update own media" ON public.media_content;
CREATE POLICY "Update own media" ON public.media_content FOR UPDATE USING (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Like media" ON public.media_likes;
CREATE POLICY "Like media" ON public.media_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Unlike media" ON public.media_likes;
CREATE POLICY "Unlike media" ON public.media_likes FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create station" ON public.radio_stations;
CREATE POLICY "Create station" ON public.radio_stations FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Create proposal" ON public.proposals;
CREATE POLICY "Create proposal" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Vote on proposal" ON public.proposal_votes;
CREATE POLICY "Vote on proposal" ON public.proposal_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create post" ON public.feed_posts;
CREATE POLICY "Create post" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Like post" ON public.feed_likes;
CREATE POLICY "Like post" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Unlike post" ON public.feed_likes;
CREATE POLICY "Unlike post" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Comment on post" ON public.feed_comments;
CREATE POLICY "Comment on post" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Start walk" ON public.safety_walks;
CREATE POLICY "Start walk" ON public.safety_walks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update own walk" ON public.safety_walks;
CREATE POLICY "Update own walk" ON public.safety_walks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Log interaction" ON public.police_interactions;
CREATE POLICY "Log interaction" ON public.police_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create ticket" ON public.support_tickets;
CREATE POLICY "Create ticket" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Send ticket message" ON public.support_messages;
CREATE POLICY "Send ticket message" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Submit resource" ON public.resources;
CREATE POLICY "Submit resource" ON public.resources FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Send broadcast" ON public.broadcasts;
CREATE POLICY "Send broadcast" ON public.broadcasts FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Acknowledge broadcast" ON public.broadcast_acks;
CREATE POLICY "Acknowledge broadcast" ON public.broadcast_acks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Flag content" ON public.content_flags;
CREATE POLICY "Flag content" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Upload recording" ON public.community_recordings;
CREATE POLICY "Upload recording" ON public.community_recordings FOR INSERT WITH CHECK (auth.uid() = recorder_id);
DROP POLICY IF EXISTS "Create wiki page" ON public.wiki_pages;
CREATE POLICY "Create wiki page" ON public.wiki_pages FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Update wiki page" ON public.wiki_pages;
CREATE POLICY "Update wiki page" ON public.wiki_pages FOR UPDATE USING (locked = false);
DROP POLICY IF EXISTS "Create wiki revision" ON public.wiki_revisions;
CREATE POLICY "Create wiki revision" ON public.wiki_revisions FOR INSERT WITH CHECK (auth.uid() = editor_id);
DROP POLICY IF EXISTS "Propose amendment" ON public.constitution_amendments;
CREATE POLICY "Propose amendment" ON public.constitution_amendments FOR INSERT WITH CHECK (auth.uid() = proposed_by);
DROP POLICY IF EXISTS "Annotate constitution" ON public.constitution_annotations;
CREATE POLICY "Annotate constitution" ON public.constitution_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Award badge" ON public.user_badges;
CREATE POLICY "Award badge" ON public.user_badges FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Join challenge" ON public.challenge_progress;
CREATE POLICY "Join challenge" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update challenge progress" ON public.challenge_progress;
CREATE POLICY "Update challenge progress" ON public.challenge_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "File appeal" ON public.appeals;
CREATE POLICY "File appeal" ON public.appeals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mark notifications read
DROP POLICY IF EXISTS "Mark own read" ON public.notifications;
CREATE POLICY "Mark own read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Delete own push subscription
DROP POLICY IF EXISTS "Delete own push" ON public.push_subscriptions;
CREATE POLICY "Delete own push" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- REALTIME ADDITIONS
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_walks;

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
CREATE INDEX IF NOT EXISTS idx_map_reports_active ON public.map_reports(expires_at);

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
DROP POLICY IF EXISTS "Public read" ON public.forum_spaces;
CREATE POLICY "Public read" ON public.forum_spaces FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.forum_posts;
CREATE POLICY "Public read" ON public.forum_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.forum_comments;
CREATE POLICY "Public read" ON public.forum_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.forum_memberships;
CREATE POLICY "Public read" ON public.forum_memberships FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.forum_votes;
CREATE POLICY "Public read" ON public.forum_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.social_profiles;
CREATE POLICY "Public read" ON public.social_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.follows;
CREATE POLICY "Public read" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.stories;
CREATE POLICY "Public read" ON public.stories FOR SELECT USING (expires_at > NOW());
DROP POLICY IF EXISTS "Public read" ON public.reels;
CREATE POLICY "Public read" ON public.reels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.social_reactions;
CREATE POLICY "Public read" ON public.social_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.news_sources;
CREATE POLICY "Public read" ON public.news_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.news_articles;
CREATE POLICY "Public read" ON public.news_articles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.news_comments;
CREATE POLICY "Public read" ON public.news_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.research_projects;
CREATE POLICY "Public read" ON public.research_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.research_members;
CREATE POLICY "Public read" ON public.research_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.study_groups;
CREATE POLICY "Public read" ON public.study_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.academic_papers;
CREATE POLICY "Public read" ON public.academic_papers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.research_grants;
CREATE POLICY "Public read" ON public.research_grants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.marketplace_listings;
CREATE POLICY "Public read" ON public.marketplace_listings FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Public read" ON public.civic_projects;
CREATE POLICY "Public read" ON public.civic_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.civic_milestones;
CREATE POLICY "Public read" ON public.civic_milestones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.civic_repair_claims;
CREATE POLICY "Public read" ON public.civic_repair_claims FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.repair_certifications;
CREATE POLICY "Public read" ON public.repair_certifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.map_reports;
CREATE POLICY "Public read" ON public.map_reports FOR SELECT USING (expires_at > NOW());
DROP POLICY IF EXISTS "Public read" ON public.transit_stops;
CREATE POLICY "Public read" ON public.transit_stops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.car_shares;
CREATE POLICY "Public read" ON public.car_shares FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read" ON public.parking_spots;
CREATE POLICY "Public read" ON public.parking_spots FOR SELECT USING (true);

-- USER-SPECIFIC READ
DROP POLICY IF EXISTS "Own calls" ON public.call_sessions;
CREATE POLICY "Own calls" ON public.call_sessions FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);
DROP POLICY IF EXISTS "Own service requests" ON public.service_requests;
CREATE POLICY "Own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
DROP POLICY IF EXISTS "Own escrow" ON public.escrow_holds;
CREATE POLICY "Own escrow" ON public.escrow_holds FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "Own routes" ON public.map_routes;
CREATE POLICY "Own routes" ON public.map_routes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own vehicles" ON public.vehicles;
CREATE POLICY "Own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Own maintenance" ON public.maintenance_records;
CREATE POLICY "Own maintenance" ON public.maintenance_records FOR SELECT USING (EXISTS(SELECT 1 FROM vehicles WHERE id = maintenance_records.vehicle_id AND owner_id = auth.uid()));

-- AUTHENTICATED INSERT policies
DROP POLICY IF EXISTS "Create space" ON public.forum_spaces;
CREATE POLICY "Create space" ON public.forum_spaces FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Create post" ON public.forum_posts;
CREATE POLICY "Create post" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Create comment" ON public.forum_comments;
CREATE POLICY "Create comment" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Join space" ON public.forum_memberships;
CREATE POLICY "Join space" ON public.forum_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Vote" ON public.forum_votes;
CREATE POLICY "Vote" ON public.forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create profile" ON public.social_profiles;
CREATE POLICY "Create profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update profile" ON public.social_profiles;
CREATE POLICY "Update profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Follow" ON public.follows;
CREATE POLICY "Follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Unfollow" ON public.follows;
CREATE POLICY "Unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Post story" ON public.stories;
CREATE POLICY "Post story" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Post reel" ON public.reels;
CREATE POLICY "Post reel" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "React" ON public.social_reactions;
CREATE POLICY "React" ON public.social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Unreact" ON public.social_reactions;
CREATE POLICY "Unreact" ON public.social_reactions FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Submit article" ON public.news_articles;
CREATE POLICY "Submit article" ON public.news_articles FOR INSERT WITH CHECK (auth.uid() = submitted_by);
DROP POLICY IF EXISTS "Comment news" ON public.news_comments;
CREATE POLICY "Comment news" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Start call" ON public.call_sessions;
CREATE POLICY "Start call" ON public.call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
DROP POLICY IF EXISTS "Update call" ON public.call_sessions;
CREATE POLICY "Update call" ON public.call_sessions FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);
DROP POLICY IF EXISTS "Create project" ON public.research_projects;
CREATE POLICY "Create project" ON public.research_projects FOR INSERT WITH CHECK (auth.uid() = lead_id);
DROP POLICY IF EXISTS "Join research" ON public.research_members;
CREATE POLICY "Join research" ON public.research_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create study group" ON public.study_groups;
CREATE POLICY "Create study group" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Submit paper" ON public.academic_papers;
CREATE POLICY "Submit paper" ON public.academic_papers FOR INSERT WITH CHECK (auth.uid() = submitted_by);
DROP POLICY IF EXISTS "Fund research" ON public.research_grants;
CREATE POLICY "Fund research" ON public.research_grants FOR INSERT WITH CHECK (auth.uid() = funder_id);
DROP POLICY IF EXISTS "Create listing" ON public.marketplace_listings;
CREATE POLICY "Create listing" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Update listing" ON public.marketplace_listings;
CREATE POLICY "Update listing" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Request service" ON public.service_requests;
CREATE POLICY "Request service" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Update service" ON public.service_requests;
CREATE POLICY "Update service" ON public.service_requests FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = matched_provider_id);
DROP POLICY IF EXISTS "Create escrow" ON public.escrow_holds;
CREATE POLICY "Create escrow" ON public.escrow_holds FOR INSERT WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "Create civic project" ON public.civic_projects;
CREATE POLICY "Create civic project" ON public.civic_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Create milestone" ON public.civic_milestones;
CREATE POLICY "Create milestone" ON public.civic_milestones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Claim repair" ON public.civic_repair_claims;
CREATE POLICY "Claim repair" ON public.civic_repair_claims FOR INSERT WITH CHECK (auth.uid() = claimer_id);
DROP POLICY IF EXISTS "Update repair" ON public.civic_repair_claims;
CREATE POLICY "Update repair" ON public.civic_repair_claims FOR UPDATE USING (auth.uid() = claimer_id);
DROP POLICY IF EXISTS "Report map" ON public.map_reports;
CREATE POLICY "Report map" ON public.map_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Save route" ON public.map_routes;
CREATE POLICY "Save route" ON public.map_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Add vehicle" ON public.vehicles;
CREATE POLICY "Add vehicle" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Update vehicle" ON public.vehicles;
CREATE POLICY "Update vehicle" ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Log maintenance" ON public.maintenance_records;
CREATE POLICY "Log maintenance" ON public.maintenance_records FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Share car" ON public.car_shares;
CREATE POLICY "Share car" ON public.car_shares FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Update share" ON public.car_shares;
CREATE POLICY "Update share" ON public.car_shares FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Report parking" ON public.parking_spots;
CREATE POLICY "Report parking" ON public.parking_spots FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- REALTIME
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.map_reports;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('social', 'social', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('forum', 'forum', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles', 'vehicles', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Social media public" ON storage.objects;
CREATE POLICY "Social media public" ON storage.objects FOR SELECT USING (bucket_id = 'social');
DROP POLICY IF EXISTS "Upload social" ON storage.objects;
CREATE POLICY "Upload social" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Forum media public" ON storage.objects;
CREATE POLICY "Forum media public" ON storage.objects FOR SELECT USING (bucket_id = 'forum');
DROP POLICY IF EXISTS "Upload forum" ON storage.objects;
CREATE POLICY "Upload forum" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Vehicle media public" ON storage.objects;
CREATE POLICY "Vehicle media public" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');
DROP POLICY IF EXISTS "Upload vehicle" ON storage.objects;
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

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
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

DROP TRIGGER IF EXISTS on_membership_change ON public.forum_memberships;
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
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_twin_insights_user ON public.twin_insights(user_id, generated_at DESC);

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_user_category ON public.consent_records(user_id, category);

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
DROP POLICY IF EXISTS "Own AI conversations" ON public.ai_conversations;
CREATE POLICY "Own AI conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create AI conversation" ON public.ai_conversations;
CREATE POLICY "Create AI conversation" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update AI conversation" ON public.ai_conversations;
CREATE POLICY "Update AI conversation" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own function calls" ON public.ai_function_calls;
CREATE POLICY "Own function calls" ON public.ai_function_calls FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own twin" ON public.digital_twins;
CREATE POLICY "Own twin" ON public.digital_twins FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create twin" ON public.digital_twins;
CREATE POLICY "Create twin" ON public.digital_twins FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update twin" ON public.digital_twins;
CREATE POLICY "Update twin" ON public.digital_twins FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own twin actions" ON public.twin_actions;
CREATE POLICY "Own twin actions" ON public.twin_actions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own insights" ON public.twin_insights;
CREATE POLICY "Own insights" ON public.twin_insights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own consent" ON public.consent_records;
CREATE POLICY "Own consent" ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Manage consent" ON public.consent_records;
CREATE POLICY "Manage consent" ON public.consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Update consent" ON public.consent_records;
CREATE POLICY "Update consent" ON public.consent_records FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own export requests" ON public.data_export_requests;
CREATE POLICY "Own export requests" ON public.data_export_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Request export" ON public.data_export_requests;
CREATE POLICY "Request export" ON public.data_export_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own deletion" ON public.deletion_requests;
CREATE POLICY "Own deletion" ON public.deletion_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Request deletion" ON public.deletion_requests;
CREATE POLICY "Request deletion" ON public.deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Cancel deletion" ON public.deletion_requests;
CREATE POLICY "Cancel deletion" ON public.deletion_requests FOR UPDATE USING (auth.uid() = user_id);

-- Public read
DROP POLICY IF EXISTS "Public apps" ON public.developer_apps;
CREATE POLICY "Public apps" ON public.developer_apps FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Public reviews" ON public.app_reviews;
CREATE POLICY "Public reviews" ON public.app_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public bounties" ON public.bounties;
CREATE POLICY "Public bounties" ON public.bounties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public contributions" ON public.developer_contributions;
CREATE POLICY "Public contributions" ON public.developer_contributions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public feature flags" ON public.feature_flags;
CREATE POLICY "Public feature flags" ON public.feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public AP actors" ON public.ap_actors;
CREATE POLICY "Public AP actors" ON public.ap_actors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public AP followers" ON public.ap_followers;
CREATE POLICY "Public AP followers" ON public.ap_followers FOR SELECT USING (true);

-- Authenticated write
DROP POLICY IF EXISTS "Create app" ON public.developer_apps;
CREATE POLICY "Create app" ON public.developer_apps FOR INSERT WITH CHECK (auth.uid() = developer_id);
DROP POLICY IF EXISTS "Update own app" ON public.developer_apps;
CREATE POLICY "Update own app" ON public.developer_apps FOR UPDATE USING (auth.uid() = developer_id);
DROP POLICY IF EXISTS "Review app" ON public.app_reviews;
CREATE POLICY "Review app" ON public.app_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Post bounty" ON public.bounties;
CREATE POLICY "Post bounty" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = posted_by);
DROP POLICY IF EXISTS "Claim bounty" ON public.bounties;
CREATE POLICY "Claim bounty" ON public.bounties FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Log contribution" ON public.developer_contributions;
CREATE POLICY "Log contribution" ON public.developer_contributions FOR INSERT WITH CHECK (auth.uid() = developer_id);
DROP POLICY IF EXISTS "Create AI func call" ON public.ai_function_calls;
CREATE POLICY "Create AI func call" ON public.ai_function_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Create twin action" ON public.twin_actions;
CREATE POLICY "Create twin action" ON public.twin_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
