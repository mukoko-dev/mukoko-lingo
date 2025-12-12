-- Fix RLS policies and add missing permissions

-- Add RLS to admin_stats table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_stats') THEN
    ALTER TABLE admin_stats ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Admins can view stats" ON admin_stats;
    
    -- Only admins can view stats
    CREATE POLICY "Admins can view stats"
    ON admin_stats
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;

-- Fix AI recommendations RLS to allow proper inserts
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON ai_recommendations;
DROP POLICY IF EXISTS "Users can update own recommendations" ON ai_recommendations;

-- Create new separate policies
CREATE POLICY "Users can view own recommendations"
ON ai_recommendations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recommendations"
ON ai_recommendations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
ON ai_recommendations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix study sessions to update profile streak
CREATE OR REPLACE FUNCTION update_study_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_study_date and streak in profiles
  UPDATE profiles
  SET 
    last_study_date = NEW.session_date,
    study_streak = CASE
      WHEN last_study_date = NEW.session_date - INTERVAL '1 day' THEN study_streak + 1
      WHEN last_study_date = NEW.session_date THEN study_streak
      ELSE 1
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update streak automatically
DROP TRIGGER IF EXISTS update_streak_on_session ON study_sessions;
CREATE TRIGGER update_streak_on_session
  AFTER INSERT OR UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_study_streak();

-- Ensure moderation alerts can be inserted by system
DROP POLICY IF EXISTS "System can insert moderation alerts" ON moderation_alerts;

CREATE POLICY "System can insert moderation alerts"
ON moderation_alerts
FOR INSERT
TO authenticated
WITH CHECK (true);
