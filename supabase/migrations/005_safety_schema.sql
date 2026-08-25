-- ============================================================================
-- Safety System — Leave-Now, Walk-Home Timer, Safety Contacts, Freezes
-- Migration 005
-- "Worst-case-first. Safety is not earned."
-- ============================================================================

-- ============================================================================
-- 1. SAFETY_CONTACTS — Pre-configured emergency contacts
-- ============================================================================
CREATE TABLE public.safety_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES public.profiles(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  relationship TEXT DEFAULT 'trusted_person',
  notify_on_leave_now BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_timer_expire BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contact_user_id)
);

CREATE INDEX idx_safety_contacts_user ON public.safety_contacts(user_id, sort_order);

-- ============================================================================
-- 2. SAFETY_ACTIONS — Leave-now triggers, emergency activations
-- ============================================================================
CREATE TABLE public.safety_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('leave_now', 'freeze', 'unfreeze', 'hide_location', 'reveal_location')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  -- What was activated
  freeze_jars BOOLEAN NOT NULL DEFAULT FALSE,
  hide_location BOOLEAN NOT NULL DEFAULT FALSE,
  remove_devices BOOLEAN NOT NULL DEFAULT FALSE,
  contacts_notified TEXT[] DEFAULT '{}',
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_safety_actions_user ON public.safety_actions(user_id, status, created_at DESC);
CREATE INDEX idx_safety_actions_active ON public.safety_actions(status) WHERE status = 'active';

-- ============================================================================
-- 3. WALK_HOME_TIMERS — Active walk-home safety timers
-- ============================================================================
CREATE TABLE public.walk_home_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'arrived', 'expired', 'cancelled')),
  destination TEXT,
  expected_arrival TIMESTAMPTZ NOT NULL,
  -- Escalation tracking
  alert_contacts TEXT[] NOT NULL DEFAULT '{}',
  last_checkin_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  escalation_level INTEGER NOT NULL DEFAULT 0,
  -- 0=active, 1=nudge sent, 2=contacts alerted, 3=location shared, 4=keeper notified
  -- Resolution
  arrived_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timers_user ON public.walk_home_timers(user_id, status);
CREATE INDEX idx_timers_active ON public.walk_home_timers(status, expected_arrival)
  WHERE status = 'active';

-- ============================================================================
-- 4. SAFETY_JOURNAL — Private encrypted notes (only owner reads)
-- ============================================================================
CREATE TABLE public.safety_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  -- Client-side encrypted. Server cannot read.
  content_type TEXT NOT NULL DEFAULT 'note' CHECK (content_type IN ('note', 'evidence', 'plan', 'log')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_safety_journal_user ON public.safety_journal(user_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.safety_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_home_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_journal ENABLE ROW LEVEL SECURITY;

-- SAFETY_CONTACTS: own only
CREATE POLICY "safety_contacts_select" ON public.safety_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "safety_contacts_insert" ON public.safety_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "safety_contacts_update" ON public.safety_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "safety_contacts_delete" ON public.safety_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- SAFETY_ACTIONS: own only (keepers see via service role)
CREATE POLICY "safety_actions_select" ON public.safety_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "safety_actions_insert" ON public.safety_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "safety_actions_update" ON public.safety_actions
  FOR UPDATE USING (auth.uid() = user_id);

-- WALK_HOME_TIMERS: own only
CREATE POLICY "timers_select" ON public.walk_home_timers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "timers_insert" ON public.walk_home_timers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "timers_update" ON public.walk_home_timers
  FOR UPDATE USING (auth.uid() = user_id);

-- SAFETY_JOURNAL: own only (absolutely private)
CREATE POLICY "journal_select" ON public.safety_journal
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert" ON public.safety_journal
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_delete" ON public.safety_journal
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Leave-Now: freeze wallet, hide location, notify contacts
CREATE OR REPLACE FUNCTION public.activate_leave_now(
  p_user_id UUID,
  p_notify_contacts TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Create safety action
  INSERT INTO public.safety_actions (user_id, type, freeze_jars, hide_location, remove_devices, contacts_notified)
  VALUES (p_user_id, 'leave_now', TRUE, TRUE, TRUE, p_notify_contacts)
  RETURNING id INTO v_action_id;

  -- Freeze wallet (spending only — can't debit)
  -- Note: actual enforcement is at application layer checking safety_actions
  -- The wallet itself isn't modified — the transfer function checks for active freezes

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a user has an active wallet freeze
CREATE OR REPLACE FUNCTION public.is_wallet_frozen(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.safety_actions
    WHERE user_id = p_user_id
      AND type IN ('leave_now', 'freeze')
      AND status = 'active'
      AND freeze_jars = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- SYSTEM USER — Used by cron jobs and automated actions
-- ============================================================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@milyfe.local',
  '$2a$10$placeholder_never_authenticates',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, username, display_name, role, onboarding_complete)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system',
  'MiLyfe System',
  'admin',
  TRUE
) ON CONFLICT (id) DO NOTHING;
