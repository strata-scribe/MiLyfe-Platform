-- ============================================================================
-- MiAction + MiScope — Coordination Layer Foundation
-- Migration 002
-- ============================================================================

-- ============================================================================
-- 1. ACTION_LOG — Immutable record of all MiActions
-- ============================================================================
CREATE TABLE public.action_log (
  id UUID PRIMARY KEY,
  version TEXT NOT NULL DEFAULT '1.0',
  type TEXT NOT NULL,
  actor_did TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_is_helper BOOLEAN NOT NULL DEFAULT FALSE,
  instance_id TEXT NOT NULL,
  geo_scope TEXT,
  law_pack_version TEXT NOT NULL,
  country_code TEXT,
  subdivision TEXT,
  visibility TEXT NOT NULL DEFAULT 'self'
    CHECK (visibility IN ('self','named','household','circle','place','federation','public')),
  sensitivity TEXT NOT NULL DEFAULT 'community'
    CHECK (sensitivity IN ('public','community','private','intimate','safety_critical')),
  current_state TEXT NOT NULL DEFAULT 'draft'
    CHECK (current_state IN ('draft','pending_approval','walking','sent','arrived','executed','failed','expired','reversed','appealed')),
  purpose TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  explanation_lang TEXT NOT NULL DEFAULT 'en',
  payload JSONB NOT NULL DEFAULT '{}',
  approvals JSONB,
  consent JSONB,
  source JSONB,
  expiration JSONB,
  reversal JSONB,
  appeal JSONB,
  offline JSONB,
  state_history JSONB NOT NULL DEFAULT '[]',
  signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_log_type ON public.action_log(type, created_at DESC);
CREATE INDEX idx_action_log_actor ON public.action_log(actor_did, created_at DESC);
CREATE INDEX idx_action_log_state ON public.action_log(current_state);
CREATE INDEX idx_action_log_sensitivity ON public.action_log(sensitivity);
CREATE INDEX idx_action_log_instance ON public.action_log(instance_id, created_at DESC);

-- ============================================================================
-- 2. ACTION_RECEIPTS — Generated after action execution (MiReceipt)
-- ============================================================================
CREATE TABLE public.action_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.action_log(id),
  recipient_did TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  summary_es TEXT,
  what_happened TEXT NOT NULL,
  what_did_not_happen TEXT,
  who_can_see TEXT NOT NULL,
  policy_applied TEXT,
  reversible BOOLEAN NOT NULL DEFAULT FALSE,
  reversal_window TEXT,
  expires TEXT,
  appeal_route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipts_recipient ON public.action_receipts(recipient_did, created_at DESC);
CREATE INDEX idx_receipts_action ON public.action_receipts(action_id);

-- ============================================================================
-- 3. RELATIONSHIPS — MiScope relationship graph
-- ============================================================================
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'member_of','guardian_of','steward_of','keeper_of','teacher_of',
    'mediator_for','helper_operator','recovery_contact','temporary_access',
    'shop_staff','connected_to','blocked_by'
  )),
  scope TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, type)
);

CREATE INDEX idx_relationships_from ON public.relationships(from_user_id, type);
CREATE INDEX idx_relationships_to ON public.relationships(to_user_id, type);
CREATE INDEX idx_relationships_expires ON public.relationships(expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 4. PERMISSION_AUDIT — Log of all permission checks (for transparency)
-- ============================================================================
CREATE TABLE public.permission_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_owner_id UUID,
  allowed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  policy_ref TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permission_audit_actor ON public.permission_audit(actor_id, checked_at DESC);
-- Partition or TTL: keep 90 days, then aggregate

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit ENABLE ROW LEVEL SECURITY;

-- ACTION_LOG: actors can see their own actions, public actions visible to all
CREATE POLICY "action_log_select_own" ON public.action_log
  FOR SELECT USING (
    actor_did = auth.uid()::text
    OR visibility = 'public'
    OR (visibility = 'place' AND instance_id = current_setting('app.instance_id', true))
  );

CREATE POLICY "action_log_insert" ON public.action_log
  FOR INSERT WITH CHECK (actor_did = auth.uid()::text);

-- ACTION_RECEIPTS: recipients see their own receipts
CREATE POLICY "receipts_select" ON public.action_receipts
  FOR SELECT USING (recipient_did = auth.uid()::text);

-- RELATIONSHIPS: participants see their own relationships
CREATE POLICY "relationships_select" ON public.relationships
  FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "relationships_insert" ON public.relationships
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "relationships_delete" ON public.relationships
  FOR DELETE USING (from_user_id = auth.uid());

-- PERMISSION_AUDIT: own only (stewards can see all via service role)
CREATE POLICY "permission_audit_select" ON public.permission_audit
  FOR SELECT USING (actor_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to transition an action's state (server-side validation)
CREATE OR REPLACE FUNCTION public.transition_action_state(
  p_action_id UUID,
  p_new_state TEXT,
  p_triggered_by TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_state TEXT;
  v_valid_transitions JSONB;
  v_history JSONB;
BEGIN
  -- Get current state
  SELECT current_state, state_history INTO v_current_state, v_history
  FROM public.action_log
  WHERE id = p_action_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Action not found');
  END IF;

  -- Define valid transitions
  v_valid_transitions := '{
    "draft": ["pending_approval", "sent", "failed"],
    "pending_approval": ["sent", "walking", "failed", "expired"],
    "sent": ["arrived", "walking", "failed", "expired"],
    "walking": ["arrived", "failed", "expired"],
    "arrived": ["executed", "failed"],
    "executed": ["reversed", "appealed"],
    "failed": [],
    "expired": [],
    "reversed": ["appealed"],
    "appealed": ["executed", "reversed"]
  }'::jsonb;

  -- Check if transition is valid
  IF NOT (v_valid_transitions->v_current_state) ? p_new_state THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition: %s -> %s', v_current_state, p_new_state)
    );
  END IF;

  -- Append to history and update
  v_history := v_history || jsonb_build_object(
    'state', v_current_state,
    'at', NOW()::text,
    'by', COALESCE(p_triggered_by, auth.uid()::text)
  );

  UPDATE public.action_log
  SET current_state = p_new_state,
      state_history = v_history,
      updated_at = NOW()
  WHERE id = p_action_id;

  RETURN jsonb_build_object('success', true, 'new_state', p_new_state);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a relationship exists
CREATE OR REPLACE FUNCTION public.has_relationship(
  p_from_user UUID,
  p_to_user UUID,
  p_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.relationships
    WHERE from_user_id = p_from_user
      AND to_user_id = p_to_user
      AND type = p_type
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
