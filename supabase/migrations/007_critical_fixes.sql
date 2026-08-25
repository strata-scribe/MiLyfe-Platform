-- ============================================================================
-- Critical Fixes — Atomic Transfer, Timer Escalation, Proposal Auto-Close
-- Migration 007
-- ============================================================================

-- ============================================================================
-- 1. ATOMIC TRANSFER — Single function that debits AND credits in one transaction
-- Prevents money from disappearing if process crashes mid-transfer.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.atomic_transfer(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount NUMERIC(12,2),
  p_from_pot TEXT DEFAULT 'spending',
  p_description TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_from_balance NUMERIC(12,2);
  v_to_balance NUMERIC(12,2);
BEGIN
  -- Validate
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;
  IF p_from_user_id = p_to_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Check wallet freeze
  IF public.is_wallet_frozen(p_from_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet is frozen for safety');
  END IF;

  -- Lock sender row to prevent race conditions
  IF p_from_pot = 'spending' THEN
    SELECT spending_balance INTO v_from_balance FROM public.wallets WHERE user_id = p_from_user_id FOR UPDATE;
  ELSIF p_from_pot = 'savings' THEN
    SELECT savings_balance INTO v_from_balance FROM public.wallets WHERE user_id = p_from_user_id FOR UPDATE;
  ELSIF p_from_pot = 'community' THEN
    SELECT community_balance INTO v_from_balance FROM public.wallets WHERE user_id = p_from_user_id FOR UPDATE;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pot');
  END IF;

  IF v_from_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', format('Insufficient balance: have %s, need %s', v_from_balance, p_amount));
  END IF;

  -- Lock recipient row
  SELECT spending_balance INTO v_to_balance FROM public.wallets WHERE user_id = p_to_user_id FOR UPDATE;
  IF v_to_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;

  -- DEBIT sender (all in one transaction — if anything fails, ALL rolls back)
  IF p_from_pot = 'spending' THEN
    UPDATE public.wallets SET spending_balance = spending_balance - p_amount, total_spent = total_spent + p_amount WHERE user_id = p_from_user_id;
  ELSIF p_from_pot = 'savings' THEN
    UPDATE public.wallets SET savings_balance = savings_balance - p_amount, total_spent = total_spent + p_amount WHERE user_id = p_from_user_id;
  ELSIF p_from_pot = 'community' THEN
    UPDATE public.wallets SET community_balance = community_balance - p_amount, total_spent = total_spent + p_amount WHERE user_id = p_from_user_id;
  END IF;

  -- CREDIT recipient (always to spending)
  UPDATE public.wallets SET spending_balance = spending_balance + p_amount, total_earned = total_earned + p_amount WHERE user_id = p_to_user_id;

  -- Record transaction
  INSERT INTO public.transactions (from_user_id, to_user_id, amount, type, pot, description)
  VALUES (p_from_user_id, p_to_user_id, p_amount, 'transfer', p_from_pot, p_description);

  -- Send notification to recipient
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_to_user_id, 'ubi', format('Received %s $MLY', p_amount), COALESCE(NULLIF(p_description, ''), 'Someone thanked you!'), '/wallet');

  RETURN jsonb_build_object('success', true, 'new_balance', v_from_balance - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. PROPOSAL AUTO-CLOSE — Function to close expired proposals
-- Called by cron route. Marks proposals as passed/rejected based on quorum + votes.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.close_expired_proposals() RETURNS JSONB AS $$
DECLARE
  v_proposal RECORD;
  v_closed INTEGER := 0;
  v_total_votes INTEGER;
  v_passed BOOLEAN;
BEGIN
  FOR v_proposal IN
    SELECT id, votes_for, votes_against, quorum_required
    FROM public.proposals
    WHERE status = 'active' AND closes_at IS NOT NULL AND closes_at < NOW()
  LOOP
    v_total_votes := v_proposal.votes_for + v_proposal.votes_against;
    v_passed := (v_total_votes >= v_proposal.quorum_required) AND (v_proposal.votes_for > v_proposal.votes_against);

    UPDATE public.proposals
    SET status = CASE WHEN v_passed THEN 'passed' ELSE 'rejected' END,
        updated_at = NOW()
    WHERE id = v_proposal.id;

    v_closed := v_closed + 1;
  END LOOP;

  RETURN jsonb_build_object('closed', v_closed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. TIMER ESCALATION — Function to check expired walk-home timers
-- Returns timers that have expired but not been resolved, for notification dispatch.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_expired_timers() RETURNS TABLE (
  timer_id UUID,
  user_id UUID,
  destination TEXT,
  expected_arrival TIMESTAMPTZ,
  alert_contacts TEXT[],
  escalation_level INTEGER,
  minutes_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS timer_id,
    t.user_id,
    t.destination,
    t.expected_arrival,
    t.alert_contacts,
    t.escalation_level,
    EXTRACT(EPOCH FROM (NOW() - t.expected_arrival))::INTEGER / 60 AS minutes_overdue
  FROM public.walk_home_timers t
  WHERE t.status = 'active'
    AND t.expected_arrival < NOW();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Escalate a timer (increment level, used after sending notifications)
CREATE OR REPLACE FUNCTION public.escalate_timer(p_timer_id UUID, p_new_level INTEGER) RETURNS VOID AS $$
BEGIN
  UPDATE public.walk_home_timers
  SET escalation_level = p_new_level
  WHERE id = p_timer_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
