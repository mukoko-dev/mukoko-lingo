-- Create moderation alerts table for flagged content
CREATE TABLE IF NOT EXISTS moderation_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'message', 'phrase', 'translation'
  content_id UUID, -- Reference to the specific content
  content_text TEXT NOT NULL,
  flagged_reason TEXT,
  categories JSONB NOT NULL DEFAULT '{}', -- Store which categories were flagged
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'approved', 'removed'
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE moderation_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view all alerts
CREATE POLICY "Admins can view all moderation alerts"
  ON moderation_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update alerts (review them)
CREATE POLICY "Admins can update moderation alerts"
  ON moderation_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert alerts (from moderation function)
CREATE POLICY "System can insert moderation alerts"
  ON moderation_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_moderation_alerts_status ON moderation_alerts(status);
CREATE INDEX idx_moderation_alerts_user_id ON moderation_alerts(user_id);
CREATE INDEX idx_moderation_alerts_created_at ON moderation_alerts(created_at DESC);
