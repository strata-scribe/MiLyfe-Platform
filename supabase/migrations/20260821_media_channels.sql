-- Media Channels table
CREATE TABLE IF NOT EXISTS media_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  banner_url TEXT,
  subscriber_count INTEGER DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Subscriptions table
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES media_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- RLS
ALTER TABLE media_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;

-- Media channels: anyone can read, owner can write
CREATE POLICY "Anyone can view channels" ON media_channels FOR SELECT USING (true);
CREATE POLICY "Users can create own channel" ON media_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own channel" ON media_channels FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: anyone can read, authenticated users manage their own
CREATE POLICY "Anyone can view subscriptions" ON channel_subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can subscribe" ON channel_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsubscribe" ON channel_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-increment/decrement subscriber count
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE media_channels SET subscriber_count = subscriber_count + 1 WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE media_channels SET subscriber_count = subscriber_count - 1 WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_change
AFTER INSERT OR DELETE ON channel_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

-- Indexes
CREATE INDEX idx_media_channels_user ON media_channels(user_id);
CREATE INDEX idx_channel_subs_channel ON channel_subscriptions(channel_id);
CREATE INDEX idx_channel_subs_user ON channel_subscriptions(user_id);
