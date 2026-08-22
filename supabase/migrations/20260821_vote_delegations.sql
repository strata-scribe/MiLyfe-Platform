-- Vote Delegations table
CREATE TABLE IF NOT EXISTS vote_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  delegate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT, -- NULL means all categories
  weight INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT no_self_delegation CHECK (delegator_id != delegate_id)
);

-- RLS
ALTER TABLE vote_delegations ENABLE ROW LEVEL SECURITY;

-- Anyone can view active delegations
CREATE POLICY "Anyone can view delegations" ON vote_delegations
  FOR SELECT USING (true);

-- Users can create delegations as delegator
CREATE POLICY "Users can delegate own votes" ON vote_delegations
  FOR INSERT WITH CHECK (auth.uid() = delegator_id);

-- Users can update (revoke) own delegations
CREATE POLICY "Users can revoke own delegations" ON vote_delegations
  FOR UPDATE USING (auth.uid() = delegator_id);

-- Indexes
CREATE INDEX idx_delegations_delegator ON vote_delegations(delegator_id) WHERE active = true;
CREATE INDEX idx_delegations_delegate ON vote_delegations(delegate_id) WHERE active = true;
CREATE INDEX idx_delegations_category ON vote_delegations(category) WHERE active = true;

-- Function to apply delegation weight when voting
-- The governance page handleVote already uses weight=1,
-- this function calculates total weight for a voter including delegations
CREATE OR REPLACE FUNCTION get_vote_weight(voter_id UUID, proposal_category TEXT)
RETURNS INTEGER AS $$
DECLARE
  base_weight INTEGER := 1;
  delegated_weight INTEGER := 0;
BEGIN
  -- Count delegations that match this voter and category
  SELECT COALESCE(SUM(weight), 0) INTO delegated_weight
  FROM vote_delegations
  WHERE delegate_id = voter_id
    AND active = true
    AND (category IS NULL OR category = proposal_category);
  
  RETURN base_weight + delegated_weight;
END;
$$ LANGUAGE plpgsql;
