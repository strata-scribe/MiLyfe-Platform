-- ============================================================================
-- Learn Tab — Education Paths, Modules, Progress, Completions
-- Migration 003
-- ============================================================================

-- ============================================================================
-- 1. LEARN_PATHS — The 10 staffed education paths
-- ============================================================================
CREATE TABLE public.learn_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  helper_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT '#6366f1',
  target_audience TEXT NOT NULL DEFAULT 'everyone',
  duration_weeks TEXT NOT NULL DEFAULT 'Self-paced',
  completion_badge TEXT NOT NULL,
  module_count INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. LEARN_MODULES — Individual modules within paths
-- ============================================================================
CREATE TABLE public.learn_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES public.learn_paths(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'lesson'
    CHECK (type IN ('lesson', 'exercise', 'practice', 'assessment', 'project', 'reflection')),
  content_markdown TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  requires_module_id UUID REFERENCES public.learn_modules(id),
  assessment_type TEXT DEFAULT 'completion'
    CHECK (assessment_type IN ('completion', 'portfolio', 'peer_observation', 'quiz', 'project')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  offline_available BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(path_id, slug)
);

CREATE INDEX idx_learn_modules_path ON public.learn_modules(path_id, sort_order);

-- ============================================================================
-- 3. LEARN_ENROLLMENTS — Members enrolled in paths
-- ============================================================================
CREATE TABLE public.learn_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.learn_paths(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  current_module_id UUID REFERENCES public.learn_modules(id),
  UNIQUE(user_id, path_id)
);

CREATE INDEX idx_enrollments_user ON public.learn_enrollments(user_id, status);
CREATE INDEX idx_enrollments_path ON public.learn_enrollments(path_id);

-- ============================================================================
-- 4. LEARN_PROGRESS — Per-module progress tracking
-- ============================================================================
CREATE TABLE public.learn_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'submitted', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  assessment_data JSONB DEFAULT '{}',
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_learn_progress_user ON public.learn_progress(user_id, status);
CREATE INDEX idx_learn_progress_module ON public.learn_progress(module_id);

-- ============================================================================
-- 5. LEARN_BADGES — Earned education badges (extends existing badges table)
-- ============================================================================
CREATE TABLE public.learn_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.learn_paths(id),
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏅',
  evidence_summary TEXT,
  issued_by TEXT NOT NULL DEFAULT 'system',
  portable BOOLEAN NOT NULL DEFAULT TRUE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, path_id)
);

CREATE INDEX idx_learn_badges_user ON public.learn_badges(user_id, earned_at DESC);

-- ============================================================================
-- 6. LEARN_CLASSES — Member-created classes (Teach mode)
-- ============================================================================
CREATE TABLE public.learn_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  path_id UUID REFERENCES public.learn_paths(id),
  format TEXT NOT NULL DEFAULT 'async'
    CHECK (format IN ('async', 'sync', 'hybrid')),
  level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  max_students INTEGER DEFAULT 20,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_learn_classes_teacher ON public.learn_classes(teacher_id);
CREATE INDEX idx_learn_classes_status ON public.learn_classes(status, published_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.learn_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_classes ENABLE ROW LEVEL SECURITY;

-- Paths and modules: public read
CREATE POLICY "learn_paths_select" ON public.learn_paths FOR SELECT USING (is_active = true);
CREATE POLICY "learn_modules_select" ON public.learn_modules FOR SELECT USING (is_active = true);

-- Enrollments: own only
CREATE POLICY "enrollments_select" ON public.learn_enrollments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert" ON public.learn_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enrollments_update" ON public.learn_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Progress: own only
CREATE POLICY "progress_select" ON public.learn_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON public.learn_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON public.learn_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges: public read (portable, shareable)
CREATE POLICY "learn_badges_select" ON public.learn_badges FOR SELECT USING (true);

-- Classes: public read published, teacher writes
CREATE POLICY "learn_classes_select" ON public.learn_classes
  FOR SELECT USING (status = 'published' OR auth.uid() = teacher_id);
CREATE POLICY "learn_classes_insert" ON public.learn_classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "learn_classes_update" ON public.learn_classes
  FOR UPDATE USING (auth.uid() = teacher_id);

-- ============================================================================
-- SEED DATA — The 10 Paths
-- ============================================================================

INSERT INTO public.learn_paths (slug, title, description, helper_name, icon, color, target_audience, duration_weeks, completion_badge, sort_order) VALUES
  ('rights-and-papers', 'Rights and Papers', 'Navigate legal systems, understand your rights, prepare documents, and access legal aid resources.', 'Rue', '⚖️', '#dc2626', 'Anyone needing legal navigation', '4-12 weeks', 'Rights Navigator', 1),
  ('parenting', 'Parenting', 'Build parenting skills, coordinate childcare, find resources, and connect with other parents.', 'Kin', '👨‍👩‍👧', '#ea580c', 'Parents, guardians, caregivers', 'Ongoing', 'Community Parent', 2),
  ('reentry', 'Reentry', 'Build your path from incarceration to community integration. Housing, work, documents, support.', 'Tide', '🌅', '#0891b2', 'Formerly incarcerated, probation', '12 weeks', 'New Chapter', 3),
  ('peace', 'Peace', 'Learn conflict resolution, de-escalation, mediation, and community protection through service.', 'Bridge', '🕊️', '#7c3aed', 'Gang/crew members, conflict-involved', '16 weeks', 'Peacemaker', 4),
  ('food-and-first-aid', 'Food and First Aid', 'Master cooking, food safety, nutrition, basic first aid, and emergency response skills.', 'Terra', '🍎', '#16a34a', 'Everyone (essential skills)', '6 weeks', 'Community First Responder', 5),
  ('repair', 'Repair', 'Fix things instead of replacing them. Electronics, plumbing, carpentry, bikes, and clothes.', 'Spark', '🔧', '#ca8a04', 'Anyone wanting to fix things', '8 weeks', 'Repair Specialist', 6),
  ('money-not-casino', 'Money (Not a Casino)', 'Understand money, budgeting, debt, savings, and community economics without the gambling mindset.', 'Nia', '💰', '#059669', 'Everyone (financial literacy)', '4 weeks', 'Money Navigator', 7),
  ('literacy', 'Read / Write / Numbers / Languages', 'Build reading, writing, math, and language skills at your own pace with patient support.', 'Sage', '📖', '#2563eb', 'Literacy learners, ESL', 'Self-paced', 'Literate', 8),
  ('the-trade', 'The Trade This Place Lacks', 'Learn a skilled trade that your community needs. Apprenticeship-based, real projects.', 'Forge', '🏗️', '#9333ea', 'Workers, career changers', '12-24 weeks', 'Tradesperson', 9),
  ('run-a-street', 'How to Run a Street', 'Learn community organizing, governance, facilitation, and stewardship.', 'Vox', '🏘️', '#e11d48', 'Community leaders, organizers', '8 weeks', 'Street Steward', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed modules for the first path (Rights and Papers) as example
INSERT INTO public.learn_modules (path_id, slug, title, description, type, duration_minutes, sort_order, assessment_type) VALUES
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'know-your-rights', 'Know Your Rights', 'Understand your fundamental rights in everyday situations: police encounters, housing, employment, healthcare.', 'lesson', 45, 1, 'completion'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'documents-checklist', 'Documents Checklist', 'What documents you need, how to get them, and how to keep them safe. Birth certificate, ID, Social Security, more.', 'exercise', 60, 2, 'completion'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'court-preparation', 'Court Preparation', 'What to expect, how to dress, what to say, how to work with public defenders, and your rights in court.', 'lesson', 30, 3, 'completion'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'legal-aid-resources', 'Finding Legal Aid', 'How to find free legal help, what legal aid covers, income qualification, and when you need a paid lawyer.', 'exercise', 45, 4, 'completion'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'housing-rights', 'Housing Rights', 'Tenant rights, eviction process, fair housing, Section 8, and how to fight illegal lockouts.', 'lesson', 60, 5, 'quiz'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'employment-rights', 'Employment Rights', 'Worker rights, wage theft, discrimination, OSHA, unemployment, and when to file complaints.', 'lesson', 45, 6, 'completion'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'benefits-navigation', 'Benefits Navigation', 'SNAP, Medicaid, SSI/SSDI, TANF, WIC, and other benefits. Eligibility, applications, appeals.', 'exercise', 60, 7, 'portfolio'),
  ((SELECT id FROM public.learn_paths WHERE slug = 'rights-and-papers'), 'community-project', 'Rights Navigator Project', 'Help one person in your community navigate a legal or documents challenge. Document the process.', 'project', 120, 8, 'project')
ON CONFLICT (path_id, slug) DO NOTHING;

-- Update module count
UPDATE public.learn_paths SET module_count = (
  SELECT COUNT(*) FROM public.learn_modules WHERE path_id = learn_paths.id
);
