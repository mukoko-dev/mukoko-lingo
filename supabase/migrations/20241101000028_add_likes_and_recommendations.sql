-- Migration 028: Add Likes and Recommendation Tracking
-- This migration adds phrase likes functionality and recommendation tracking

-- ============================================================================
-- PHRASE LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS phrase_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, phrase_id)
);

-- Indexes for performance
CREATE INDEX idx_phrase_likes_user_id ON phrase_likes(user_id);
CREATE INDEX idx_phrase_likes_phrase_id ON phrase_likes(phrase_id);
CREATE INDEX idx_phrase_likes_created_at ON phrase_likes(created_at DESC);

-- ============================================================================
-- PHRASE ENGAGEMENT TRACKING
-- ============================================================================

-- Track overall engagement metrics per phrase
CREATE TABLE IF NOT EXISTS phrase_engagement (
  phrase_id TEXT PRIMARY KEY,
  like_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  practice_count INTEGER NOT NULL DEFAULT 0,
  mastery_count INTEGER NOT NULL DEFAULT 0,
  last_engaged_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for sorting by popularity
CREATE INDEX idx_phrase_engagement_like_count ON phrase_engagement(like_count DESC);
CREATE INDEX idx_phrase_engagement_engagement_score ON phrase_engagement((like_count + bookmark_count * 2 + practice_count + mastery_count * 3) DESC);

-- ============================================================================
-- RECOMMENDATION TRACKING
-- ============================================================================

-- Track what phrases are recommended to users and their interaction
CREATE TABLE IF NOT EXISTS phrase_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id TEXT NOT NULL,
  recommendation_reason TEXT NOT NULL, -- 'similar_to_mastered', 'popular', 'category_progress', 'ai_suggested'
  recommendation_score DECIMAL(5,2) NOT NULL, -- 0-100 score
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,

  -- Index for analytics
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user_id ON phrase_recommendations(user_id, shown_at DESC);
CREATE INDEX idx_recommendations_phrase_id ON phrase_recommendations(phrase_id);
CREATE INDEX idx_recommendations_clicked ON phrase_recommendations(clicked, shown_at DESC);

-- ============================================================================
-- TRIGGERS FOR ENGAGEMENT TRACKING
-- ============================================================================

-- Function to update phrase engagement when a like is added/removed
CREATE OR REPLACE FUNCTION update_phrase_engagement_on_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    INSERT INTO phrase_engagement (phrase_id, like_count, last_engaged_at)
    VALUES (NEW.phrase_id, 1, NEW.created_at)
    ON CONFLICT (phrase_id) DO UPDATE
    SET
      like_count = phrase_engagement.like_count + 1,
      last_engaged_at = NEW.created_at,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE phrase_engagement
    SET
      like_count = GREATEST(like_count - 1, 0),
      updated_at = NOW()
    WHERE phrase_id = OLD.phrase_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_on_like
AFTER INSERT OR DELETE ON phrase_likes
FOR EACH ROW
EXECUTE FUNCTION update_phrase_engagement_on_like();

-- Function to update engagement when bookmarks change
CREATE OR REPLACE FUNCTION update_phrase_engagement_on_bookmark()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO phrase_engagement (phrase_id, bookmark_count, last_engaged_at)
    VALUES (NEW.phrase_id, 1, NEW.created_at)
    ON CONFLICT (phrase_id) DO UPDATE
    SET
      bookmark_count = phrase_engagement.bookmark_count + 1,
      last_engaged_at = NEW.created_at,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE phrase_engagement
    SET
      bookmark_count = GREATEST(bookmark_count - 1, 0),
      updated_at = NOW()
    WHERE phrase_id = OLD.phrase_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_on_bookmark
AFTER INSERT OR DELETE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION update_phrase_engagement_on_bookmark();

-- Function to update engagement when progress changes
CREATE OR REPLACE FUNCTION update_phrase_engagement_on_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO phrase_engagement (
      phrase_id,
      practice_count,
      mastery_count,
      last_engaged_at
    )
    VALUES (
      NEW.phrase_id,
      NEW.times_practiced,
      CASE WHEN NEW.status = 'mastered' THEN 1 ELSE 0 END,
      NEW.updated_at
    )
    ON CONFLICT (phrase_id) DO UPDATE
    SET
      practice_count = phrase_engagement.practice_count + (NEW.times_practiced - COALESCE(OLD.times_practiced, 0)),
      mastery_count = phrase_engagement.mastery_count +
        (CASE WHEN NEW.status = 'mastered' THEN 1 ELSE 0 END) -
        (CASE WHEN OLD.status = 'mastered' THEN 1 ELSE 0 END),
      last_engaged_at = NEW.updated_at,
      updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_on_progress
AFTER INSERT OR UPDATE ON phrase_progress
FOR EACH ROW
EXECUTE FUNCTION update_phrase_engagement_on_progress();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE phrase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_recommendations ENABLE ROW LEVEL SECURITY;

-- Phrase Likes Policies
CREATE POLICY "Users can view all likes"
  ON phrase_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON phrase_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Phrase Engagement Policies (read-only for users)
CREATE POLICY "Users can view phrase engagement"
  ON phrase_engagement FOR SELECT
  TO authenticated
  USING (true);

-- Only system can update engagement (via triggers)
CREATE POLICY "System can update engagement"
  ON phrase_engagement FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recommendation Policies
CREATE POLICY "Users can view their own recommendations"
  ON phrase_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON phrase_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations"
  ON phrase_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get most liked phrases globally
CREATE OR REPLACE FUNCTION get_most_liked_phrases(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  phrase_id TEXT,
  like_count INTEGER,
  bookmark_count INTEGER,
  engagement_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.phrase_id,
    pe.like_count,
    pe.bookmark_count,
    (pe.like_count + pe.bookmark_count * 2 + pe.practice_count + pe.mastery_count * 3) as engagement_score
  FROM phrase_engagement pe
  ORDER BY pe.like_count DESC, engagement_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending phrases (recently engaged)
CREATE OR REPLACE FUNCTION get_trending_phrases(
  days_back INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  phrase_id TEXT,
  recent_likes INTEGER,
  recent_bookmarks INTEGER,
  trending_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.phrase_id,
    COUNT(DISTINCT pl.id)::INTEGER as recent_likes,
    COUNT(DISTINCT b.id)::INTEGER as recent_bookmarks,
    (COUNT(DISTINCT pl.id) * 1.5 + COUNT(DISTINCT b.id) * 2.0) as trending_score
  FROM phrase_engagement pe
  LEFT JOIN phrase_likes pl ON pl.phrase_id = pe.phrase_id
    AND pl.created_at > NOW() - INTERVAL '1 day' * days_back
  LEFT JOIN bookmarks b ON b.phrase_id = pe.phrase_id
    AND b.created_at > NOW() - INTERVAL '1 day' * days_back
  WHERE pe.last_engaged_at > NOW() - INTERVAL '1 day' * days_back
  GROUP BY pe.phrase_id
  HAVING COUNT(DISTINCT pl.id) > 0 OR COUNT(DISTINCT b.id) > 0
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKFILL EXISTING DATA
-- ============================================================================

-- Backfill engagement data from existing bookmarks and progress
INSERT INTO phrase_engagement (phrase_id, bookmark_count, practice_count, mastery_count, last_engaged_at, updated_at)
SELECT
  COALESCE(b.phrase_id, pp.phrase_id) as phrase_id,
  COUNT(DISTINCT b.id) as bookmark_count,
  COALESCE(SUM(pp.times_practiced), 0)::INTEGER as practice_count,
  COUNT(DISTINCT pp.id) FILTER (WHERE pp.status = 'mastered') as mastery_count,
  GREATEST(MAX(b.created_at), MAX(pp.created_at)) as last_engaged_at,
  NOW() as updated_at
FROM bookmarks b
FULL OUTER JOIN phrase_progress pp ON b.phrase_id = pp.phrase_id
WHERE b.phrase_id IS NOT NULL OR pp.phrase_id IS NOT NULL
GROUP BY COALESCE(b.phrase_id, pp.phrase_id)
ON CONFLICT (phrase_id) DO UPDATE
SET
  bookmark_count = EXCLUDED.bookmark_count,
  practice_count = EXCLUDED.practice_count,
  mastery_count = EXCLUDED.mastery_count,
  last_engaged_at = EXCLUDED.last_engaged_at,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE phrase_likes IS 'User likes for phrases - tracks community popularity';
COMMENT ON TABLE phrase_engagement IS 'Aggregate engagement metrics per phrase for recommendations';
COMMENT ON TABLE phrase_recommendations IS 'Tracks personalized recommendations shown to users';
COMMENT ON FUNCTION get_most_liked_phrases IS 'Returns top N most liked phrases globally';
COMMENT ON FUNCTION get_trending_phrases IS 'Returns phrases with recent engagement activity';
