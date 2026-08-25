-- ============================================================================
-- Governance: Proposal Stages + Dedicated Comments + Delegation Foundation
-- Migration 008
-- ============================================================================

-- ============================================================================
-- 1. Add stage column to proposals (Idea → Talk → Try → Decide → What Happened)
-- ============================================================================
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'decide'
  CHECK (stage IN ('idea', 'talk', 'try', 'decide', 'what_happened'));

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS cosigners UUID[] DEFAULT '{}';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 2. Dedicated proposal comments table (replaces forum_replies hack)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  parent_comment_id UUID REFERENCES public.proposal_comments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal ON public.proposal_comments(proposal_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_author ON public.proposal_comments(author_id);

-- RLS
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposal_comments_select" ON public.proposal_comments FOR SELECT USING (true);
CREATE POLICY "proposal_comments_insert" ON public.proposal_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ============================================================================
-- 3. Delegation table (foundation for liquid delegation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'general',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id, topic),
  CHECK (delegator_id != delegate_id)
);

CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON public.delegations(delegator_id, topic);
CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON public.delegations(delegate_id, topic);

ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delegations_select" ON public.delegations FOR SELECT
  USING (auth.uid() = delegator_id OR auth.uid() = delegate_id);
CREATE POLICY "delegations_insert" ON public.delegations FOR INSERT
  WITH CHECK (auth.uid() = delegator_id);
CREATE POLICY "delegations_update" ON public.delegations FOR UPDATE
  USING (auth.uid() = delegator_id);

-- ============================================================================
-- 4. Function to advance proposal stage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.advance_proposal_stage(
  p_proposal_id UUID,
  p_new_stage TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_stage TEXT;
  v_valid_next JSONB;
BEGIN
  SELECT stage INTO v_current_stage FROM public.proposals WHERE id = p_proposal_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
  END IF;

  -- Valid transitions
  v_valid_next := '{
    "idea": ["talk"],
    "talk": ["try", "decide"],
    "try": ["decide"],
    "decide": ["what_happened"],
    "what_happened": []
  }'::jsonb;

  IF NOT (v_valid_next->v_current_stage) ? p_new_stage THEN
    RETURN jsonb_build_object('success', false, 'error', format('Cannot go from %s to %s', v_current_stage, p_new_stage));
  END IF;

  UPDATE public.proposals
  SET stage = p_new_stage, stage_changed_at = NOW(), updated_at = NOW()
  WHERE id = p_proposal_id;

  RETURN jsonb_build_object('success', true, 'new_stage', p_new_stage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
