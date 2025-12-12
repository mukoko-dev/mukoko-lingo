-- Create table to track phrase views
CREATE TABLE IF NOT EXISTS phrase_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE phrase_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own phrase views"
  ON phrase_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phrase views"
  ON phrase_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_phrase_views_user_id ON phrase_views(user_id);
CREATE INDEX IF NOT EXISTS idx_phrase_views_phrase_id ON phrase_views(phrase_id);
CREATE INDEX IF NOT EXISTS idx_phrase_views_viewed_at ON phrase_views(viewed_at);

-- Create table for daily study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  phrases_studied INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);

-- Function to get popular phrases (for analytics)
CREATE OR REPLACE FUNCTION get_popular_phrases(days_back INT DEFAULT 7)
RETURNS TABLE (
  phrase_id UUID,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.phrase_id,
    COUNT(*) as view_count
  FROM phrase_views pv
  WHERE pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY pv.phrase_id
  ORDER BY view_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user learning stats
CREATE OR REPLACE FUNCTION get_user_learning_stats(target_user_id UUID)
RETURNS TABLE (
  total_phrases_viewed BIGINT,
  unique_phrases_viewed BIGINT,
  total_study_days BIGINT,
  avg_phrases_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_phrases_viewed,
    COUNT(DISTINCT phrase_id) as unique_phrases_viewed,
    COUNT(DISTINCT DATE(viewed_at)) as total_study_days,
    ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(viewed_at)), 0), 2) as avg_phrases_per_day
  FROM phrase_views
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
