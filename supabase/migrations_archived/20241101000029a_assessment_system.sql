-- Migration 029: Assessment System
-- Diagnostic, formative, and summative assessments for skills evaluation

-- Assessment templates (created by admins)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('diagnostic', 'formative', 'summative')),
  target_level TEXT NOT NULL,
  title JSONB NOT NULL,
  description JSONB,
  questions JSONB NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit INTEGER CHECK (time_limit IS NULL OR time_limit > 0),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for target_level
ALTER TABLE assessments
  ADD CONSTRAINT fk_assessments_skill_level
  FOREIGN KEY (skill_id, target_level)
  REFERENCES skill_levels(skill_id, level);

-- User assessment attempts
CREATE TABLE IF NOT EXISTS user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id),
  answers JSONB NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  time_taken INTEGER CHECK (time_taken IS NULL OR time_taken > 0),
  feedback JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Users can view active assessments"
  ON assessments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  USING (is_admin());

-- RLS Policies for user_assessments
CREATE POLICY "Users can view own assessment results"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON user_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments"
  ON user_assessments FOR SELECT
  USING (is_admin());

-- Trigger to update updated_at on assessments
CREATE OR REPLACE FUNCTION update_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessments_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_skill_id ON assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_assessment_id ON user_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_skill_id ON user_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed_at ON user_assessments(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assessments_passed ON user_assessments(passed);

-- Function to update user_skills after assessment completion
CREATE OR REPLACE FUNCTION update_user_skill_from_assessment()
RETURNS TRIGGER AS $$
DECLARE
  current_user_skill RECORD;
  new_level TEXT;
BEGIN
  -- Get current user skill
  SELECT * INTO current_user_skill
  FROM user_skills
  WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;

  -- If user doesn't have this skill tracked yet, create it
  IF current_user_skill IS NULL THEN
    INSERT INTO user_skills (user_id, skill_id, current_level, current_score)
    VALUES (NEW.user_id, NEW.skill_id, 'beginner', NEW.score);
    RETURN NEW;
  END IF;

  -- Update score (average of recent assessments)
  UPDATE user_skills
  SET current_score = (
    SELECT AVG(score)::INTEGER
    FROM user_assessments
    WHERE user_id = NEW.user_id
      AND skill_id = NEW.skill_id
      AND completed_at > NOW() - INTERVAL '30 days'
  ),
  last_practiced_at = NEW.completed_at,
  updated_at = NOW()
  WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;

  -- Determine if level should change based on new score
  SELECT level INTO new_level
  FROM skill_levels
  WHERE skill_id = NEW.skill_id
    AND min_score <= (
      SELECT current_score
      FROM user_skills
      WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id
    )
  ORDER BY min_score DESC
  LIMIT 1;

  -- Update level if it changed
  IF new_level != current_user_skill.current_level THEN
    UPDATE user_skills
    SET current_level = new_level,
        level_achieved_at = NOW()
    WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_skill_from_assessment
  AFTER INSERT ON user_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skill_from_assessment();

-- Function to get user's overall proficiency level
CREATE OR REPLACE FUNCTION get_user_overall_proficiency(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avg_score INTEGER;
  overall_level TEXT;
BEGIN
  -- Calculate average score across all skills
  SELECT AVG(current_score)::INTEGER INTO avg_score
  FROM user_skills
  WHERE user_id = p_user_id;

  -- If no skills tracked, return beginner
  IF avg_score IS NULL THEN
    RETURN 'beginner';
  END IF;

  -- Determine overall level from average score
  IF avg_score >= 90 THEN
    overall_level := 'fluent';
  ELSIF avg_score >= 80 THEN
    overall_level := 'advanced';
  ELSIF avg_score >= 65 THEN
    overall_level := 'intermediate';
  ELSIF avg_score >= 50 THEN
    overall_level := 'elementary';
  ELSE
    overall_level := 'beginner';
  END IF;

  RETURN overall_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE assessments IS 'Assessment templates for evaluating skill proficiency';
COMMENT ON TABLE user_assessments IS 'User assessment attempts and results - updates user_skills automatically';
COMMENT ON FUNCTION update_user_skill_from_assessment() IS 'Automatically updates user_skills when assessment is completed';
COMMENT ON FUNCTION get_user_overall_proficiency(UUID) IS 'Returns user''s overall proficiency level based on average skill scores';
