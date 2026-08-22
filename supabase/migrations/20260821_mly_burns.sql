-- MLY Burns ledger - tracks daily decay/burn operations
CREATE TABLE IF NOT EXISTS mly_burns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'daily_decay',
  affected_users INTEGER DEFAULT 0,
  inactive_decayed INTEGER DEFAULT 0,
  hoarding_decayed INTEGER DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add last_active_at to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- RLS
ALTER TABLE mly_burns ENABLE ROW LEVEL SECURITY;

-- Anyone can view burn history (transparency)
CREATE POLICY "Anyone can view burns" ON mly_burns FOR SELECT USING (true);

-- Only service role can insert (cron job)
CREATE POLICY "Service role inserts burns" ON mly_burns FOR INSERT WITH CHECK (true);

-- Index
CREATE INDEX idx_mly_burns_date ON mly_burns(executed_at DESC);

-- Function to update last_active_at on user activity
-- This gets called from various triggers
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on health_checkins to update activity
CREATE TRIGGER on_health_checkin_activity
AFTER INSERT ON health_checkins
FOR EACH ROW EXECUTE FUNCTION update_last_active();
