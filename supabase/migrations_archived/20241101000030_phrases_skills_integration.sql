-- Migration 030: Integrate Phrases with Skills System
-- Link phrases to skills and proficiency levels

-- Add skills columns to phrases
ALTER TABLE phrases
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id),
  ADD COLUMN IF NOT EXISTS required_level TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS cultural_notes JSONB,
  ADD COLUMN IF NOT EXISTS difficulty_score INTEGER DEFAULT 1 CHECK (difficulty_score BETWEEN 1 AND 5);

-- Add foreign key constraint for skill level
ALTER TABLE phrases
  ADD CONSTRAINT fk_phrases_skill_level
  FOREIGN KEY (skill_id, required_level)
  REFERENCES skill_levels(skill_id, level)
  DEFERRABLE INITIALLY DEFERRED;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_phrases_skill_id ON phrases(skill_id);
CREATE INDEX IF NOT EXISTS idx_phrases_required_level ON phrases(required_level);
CREATE INDEX IF NOT EXISTS idx_phrases_skill_level ON phrases(skill_id, required_level);
CREATE INDEX IF NOT EXISTS idx_phrases_difficulty ON phrases(difficulty_score);

-- Function to recommend phrases based on user's skill levels
CREATE OR REPLACE FUNCTION get_recommended_phrases(
  p_user_id UUID,
  p_language TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  phrase_id UUID,
  skill_name TEXT,
  required_level TEXT,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_skill_levels AS (
    SELECT
      us.skill_id,
      s.name as skill_name,
      us.current_level,
      us.current_score
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = p_user_id
  ),
  level_scores AS (
    -- Assign numeric values to levels for comparison
    SELECT 'beginner' as level, 1 as score
    UNION ALL SELECT 'elementary', 2
    UNION ALL SELECT 'intermediate', 3
    UNION ALL SELECT 'advanced', 4
    UNION ALL SELECT 'fluent', 5
  ),
  user_level_scores AS (
    SELECT
      usl.skill_id,
      usl.skill_name,
      usl.current_level,
      ls.score as level_score
    FROM user_skill_levels usl
    JOIN level_scores ls ON ls.level = usl.current_level
  )
  SELECT
    p.id as phrase_id,
    s.name as skill_name,
    p.required_level,
    -- Relevance score: prefer phrases at or slightly above current level
    CASE
      WHEN pls.score = uls.level_score THEN 1.0  -- Exact match
      WHEN pls.score = uls.level_score + 1 THEN 0.8  -- One level up (stretch)
      WHEN pls.score = uls.level_score - 1 THEN 0.6  -- One level down (review)
      ELSE 0.3  -- Other levels (less relevant)
    END as relevance_score
  FROM phrases p
  JOIN skills s ON s.id = p.skill_id
  JOIN level_scores pls ON pls.level = p.required_level
  LEFT JOIN user_level_scores uls ON uls.skill_id = p.skill_id
  WHERE (
    p.english LIKE '%' || p_language || '%'
    OR p.shona LIKE '%' || p_language || '%'
    OR p.ndebele LIKE '%' || p_language || '%'
    OR p.chinese LIKE '%' || p_language || '%'
  )
  AND p.skill_id IS NOT NULL
  ORDER BY relevance_score DESC, RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get phrases for specific skill and level
CREATE OR REPLACE FUNCTION get_phrases_for_skill_level(
  p_skill_id UUID,
  p_level TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF phrases AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM phrases p
  WHERE p.skill_id = p_skill_id
    AND p.required_level = p_level
  ORDER BY p.difficulty_score, RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to phrase based on skill level
CREATE OR REPLACE FUNCTION user_can_access_phrase(
  p_user_id UUID,
  p_phrase_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  phrase_skill_id UUID;
  phrase_required_level TEXT;
  user_level TEXT;
  user_level_score INTEGER;
  required_level_score INTEGER;
BEGIN
  -- Get phrase skill and level
  SELECT skill_id, required_level
  INTO phrase_skill_id, phrase_required_level
  FROM phrases
  WHERE id = p_phrase_id;

  -- If phrase has no skill requirement, it's accessible
  IF phrase_skill_id IS NULL THEN
    RETURN true;
  END IF;

  -- Get user's level for this skill
  SELECT current_level INTO user_level
  FROM user_skills
  WHERE user_id = p_user_id AND skill_id = phrase_skill_id;

  -- If user hasn't started this skill, they can access beginner phrases
  IF user_level IS NULL THEN
    RETURN phrase_required_level = 'beginner';
  END IF;

  -- Get numeric scores for comparison
  SELECT score INTO user_level_score
  FROM (
    SELECT 'beginner' as level, 1 as score
    UNION ALL SELECT 'elementary', 2
    UNION ALL SELECT 'intermediate', 3
    UNION ALL SELECT 'advanced', 4
    UNION ALL SELECT 'fluent', 5
  ) levels
  WHERE level = user_level;

  SELECT score INTO required_level_score
  FROM (
    SELECT 'beginner' as level, 1 as score
    UNION ALL SELECT 'elementary', 2
    UNION ALL SELECT 'intermediate', 3
    UNION ALL SELECT 'advanced', 4
    UNION ALL SELECT 'fluent', 5
  ) levels
  WHERE level = phrase_required_level;

  -- User can access phrases at or below their level
  RETURN user_level_score >= required_level_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing phrases with default skills (run after skills are seeded)
-- This will need to be customized based on existing phrase categories
DO $$
DECLARE
  vocabulary_skill_id UUID;
  conversation_skill_id UUID;
BEGIN
  -- Get skill IDs
  SELECT id INTO vocabulary_skill_id FROM skills WHERE name = 'vocabulary';
  SELECT id INTO conversation_skill_id FROM skills WHERE name = 'conversation';

  -- Update phrases with default skills based on category
  -- Greetings -> conversation skill, beginner
  UPDATE phrases
  SET skill_id = conversation_skill_id,
      required_level = 'beginner',
      difficulty_score = 1
  WHERE category IN ('greetings', 'introductions')
    AND skill_id IS NULL;

  -- Basic expressions -> vocabulary skill, beginner
  UPDATE phrases
  SET skill_id = vocabulary_skill_id,
      required_level = 'beginner',
      difficulty_score = 1
  WHERE category IN ('numbers', 'colors', 'food', 'family')
    AND skill_id IS NULL;

  -- Everyday conversation -> conversation skill, elementary
  UPDATE phrases
  SET skill_id = conversation_skill_id,
      required_level = 'elementary',
      difficulty_score = 2
  WHERE category IN ('shopping', 'directions', 'time')
    AND skill_id IS NULL;

  -- Advanced topics -> conversation skill, intermediate+
  UPDATE phrases
  SET skill_id = conversation_skill_id,
      required_level = 'intermediate',
      difficulty_score = 3
  WHERE category IN ('business', 'travel', 'culture')
    AND skill_id IS NULL;

  -- Set default vocabulary skill for remaining phrases
  UPDATE phrases
  SET skill_id = vocabulary_skill_id,
      required_level = 'beginner',
      difficulty_score = 1
  WHERE skill_id IS NULL;
END $$;

COMMENT ON COLUMN phrases.skill_id IS 'Skill this phrase helps develop - REQUIRED for skills-based filtering';
COMMENT ON COLUMN phrases.required_level IS 'Minimum proficiency level needed to access this phrase';
COMMENT ON COLUMN phrases.learning_objectives IS 'What learner should achieve by mastering this phrase';
COMMENT ON COLUMN phrases.cultural_notes IS 'Cultural context and usage notes in multiple languages';
COMMENT ON COLUMN phrases.difficulty_score IS 'Difficulty rating 1-5 within the required level';

COMMENT ON FUNCTION get_recommended_phrases(UUID, TEXT, INTEGER) IS 'AI-powered phrase recommendations based on user skill proficiency';
COMMENT ON FUNCTION get_phrases_for_skill_level(UUID, TEXT, INTEGER) IS 'Get phrases for specific skill and proficiency level';
COMMENT ON FUNCTION user_can_access_phrase(UUID, UUID) IS 'Check if user has unlocked access to phrase based on skill level';
