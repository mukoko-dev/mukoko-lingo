-- Combined Skills System Migration
-- Apply this via Supabase Dashboard SQL Editor
-- This combines 028, 029, and 030 into one transaction

BEGIN;

-- ============================================================================
-- MIGRATION 028: Skills Taxonomy
-- ============================================================================

-- Core skills that learners progress through
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name JSONB NOT NULL,
  description JSONB NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proficiency levels for each skill
CREATE TABLE IF NOT EXISTS skill_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'fluent')),
  display_name JSONB NOT NULL,
  description JSONB NOT NULL,
  min_score INTEGER NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(skill_id, level)
);

-- User's current proficiency in each skill
-- IMPORTANT: This table is READ BY AI TUTOR for adaptive teaching
CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  current_score INTEGER DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 100),
  total_practice_time INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  level_achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- Add foreign key constraint for user_id after table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE user_skills ADD CONSTRAINT fk_user_skills_user_id
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for skill level
ALTER TABLE user_skills
  ADD CONSTRAINT fk_user_skills_skill_level
  FOREIGN KEY (skill_id, current_level)
  REFERENCES skill_levels(skill_id, level)
  DEFERRABLE INITIALLY DEFERRED;

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active skills" ON skills;
DROP POLICY IF EXISTS "Admins can manage skills" ON skills;
DROP POLICY IF EXISTS "Anyone can view skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Admins can manage skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Users can view own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can update own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can insert own skills" ON user_skills;
DROP POLICY IF EXISTS "Admins can view all user skills" ON user_skills;

-- RLS Policies for skills
CREATE POLICY "Anyone can view active skills"
  ON skills FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage skills"
  ON skills FOR ALL
  USING (is_admin());

-- RLS Policies for skill_levels
CREATE POLICY "Anyone can view skill levels"
  ON skill_levels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage skill levels"
  ON skill_levels FOR ALL
  USING (is_admin());

-- RLS Policies for user_skills
CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user skills"
  ON user_skills FOR SELECT
  USING (is_admin());

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_user_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_skills_updated_at ON user_skills;
CREATE TRIGGER trigger_update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skills_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order);
CREATE INDEX IF NOT EXISTS idx_skill_levels_skill_id ON skill_levels(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_level ON user_skills(current_level);
CREATE INDEX IF NOT EXISTS idx_user_skills_score ON user_skills(current_score);

-- Insert core skills taxonomy
INSERT INTO skills (name, display_name, description, icon, sort_order) VALUES
('pronunciation',
 '{"en": "Pronunciation", "sn": "Kunyora Mazwi", "nd": "Ukuphimisela", "zh": "发音"}'::jsonb,
 '{"en": "Master correct sound production, tone, and rhythm in spoken language", "sn": "Dzidza kunyangaridza mazwi zvakanaka", "nd": "Funda ukukhuluma kahle", "zh": "掌握正确的发音、声调和节奏"}'::jsonb,
 'volume-2', 1),

('vocabulary',
 '{"en": "Vocabulary", "sn": "Mazwi", "nd": "Amagama", "zh": "词汇"}'::jsonb,
 '{"en": "Build word knowledge and understand contextual usage across different situations", "sn": "Wedzera ruzivo rwemazwi uye unzwisise mashandisirwo awo", "nd": "Yandisa ulwazi lwamagama waqonde ukusetshenziswa kwawo", "zh": "积累词汇知识，理解不同情境下的用法"}'::jsonb,
 'book-open', 2),

('grammar',
 '{"en": "Grammar", "sn": "Mutauro", "nd": "Uhlelo lwelimi", "zh": "语法"}'::jsonb,
 '{"en": "Understand sentence structure, language rules, and proper formation of expressions", "sn": "Nzwisisa maitiro emitsara nemitemo yemutauro", "nd": "Qonda ukwakheka kwemisho lemithetho yolimi", "zh": "理解句子结构、语言规则和正确的表达方式"}'::jsonb,
 'list-checks', 3),

('comprehension',
 '{"en": "Comprehension", "sn": "Kunzwisisa", "nd": "Ukuqonda", "zh": "理解"}'::jsonb,
 '{"en": "Develop listening and reading understanding to grasp meaning in conversations", "sn": "Kukura kunzwisisa kuteerera nekuverenga", "nd": "Thuthukisa ukuqonda okulalelwayo nokufundwayo", "zh": "培养听力和阅读理解能力"}'::jsonb,
 'ear', 4),

('conversation',
 '{"en": "Conversation", "sn": "Hurukuro", "nd": "Ingxoxo", "zh": "会话"}'::jsonb,
 '{"en": "Practice real-time dialogue, cultural context, and natural flow of communication", "sn": "Tsanangura kutaura zvakanaka munguva chaiyo uye unzwisise tsika", "nd": "Zilolonge ukukhuluma ngokwesikhathi nexhumaniso lesintu", "zh": "练习实时对话、文化语境和自然交流"}'::jsonb,
 'message-circle', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert proficiency levels for each skill
DO $$
DECLARE
  skill_record RECORD;
BEGIN
  FOR skill_record IN SELECT id FROM skills LOOP
    INSERT INTO skill_levels (skill_id, level, display_name, description, min_score, sort_order) VALUES
    (skill_record.id, 'beginner',
     '{"en": "Beginner", "sn": "Mutanguri", "nd": "Umqali", "zh": "初学者"}'::jsonb,
     '{"en": "Basic phrases and simple grammar with high AI support", "sn": "Mitsara yepakutanga uye mutauro usingaomeswe", "nd": "Imisho eyisisekelo lohlelo olula lolimi", "zh": "基础短语和简单语法，高度AI辅助"}'::jsonb,
     0, 1),

    (skill_record.id, 'elementary',
     '{"en": "Elementary", "sn": "Wepakutanga", "nd": "Wesisekelo", "zh": "基础"}'::jsonb,
     '{"en": "Common expressions and guided practice with moderate support", "sn": "Mitsara inozivikanwa uye kudzidziswa kunotsigirwa", "nd": "Imisho ejwayelekile lokuqeqeshwa okusekelwayo", "zh": "常用表达和指导练习，中度辅助"}'::jsonb,
     50, 2),

    (skill_record.id, 'intermediate',
     '{"en": "Intermediate", "sn": "Wepakati", "nd": "Ophakathi", "zh": "中级"}'::jsonb,
     '{"en": "Conversational fluency with reduced scaffolding and more independence", "sn": "Kutaura zvakanaka uine kuzvimirira kwakawanda", "nd": "Ukukhuluma okuhle ngokuzimela okukhulu", "zh": "对话流畅，减少辅助，更加独立"}'::jsonb,
     65, 3),

    (skill_record.id, 'advanced',
     '{"en": "Advanced", "sn": "Wepamusoro", "nd": "Ophezulu", "zh": "高级"}'::jsonb,
     '{"en": "Complex phrases, nuanced language, and sophisticated expression", "sn": "Mitsara yakaoma uye kutaura kune ungwaru", "nd": "Imisho elungileyo lokukhuluma okwakhe", "zh": "复杂短语、细致语言和高级表达"}'::jsonb,
     80, 4),

    (skill_record.id, 'fluent',
     '{"en": "Fluent", "sn": "Nyanzvi", "nd": "Ophucukile", "zh": "流利"}'::jsonb,
     '{"en": "Native-like proficiency with minimal AI intervention needed", "sn": "Kutaura semunyori wemutauro", "nd": "Ukukhuluma njengomuntu wasekhaya", "zh": "母语级别流利度"}'::jsonb,
     90, 5)
    ON CONFLICT (skill_id, level) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION 029: Assessment System
-- ============================================================================

-- Assessment templates
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
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for created_by after ensuring profiles exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE assessments ADD CONSTRAINT fk_assessments_created_by
      FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;

-- Add foreign key for target_level
ALTER TABLE assessments
  ADD CONSTRAINT fk_assessments_skill_level
  FOREIGN KEY (skill_id, target_level)
  REFERENCES skill_levels(skill_id, level)
  DEFERRABLE INITIALLY DEFERRED;

-- User assessment attempts
CREATE TABLE IF NOT EXISTS user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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

-- Add foreign key for user_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE user_assessments ADD CONSTRAINT fk_user_assessments_user_id
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view active assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can manage assessments" ON assessments;
DROP POLICY IF EXISTS "Users can view own assessment results" ON user_assessments;
DROP POLICY IF EXISTS "Users can insert own assessments" ON user_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON user_assessments;

-- RLS Policies
CREATE POLICY "Users can view active assessments"
  ON assessments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own assessment results"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON user_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments"
  ON user_assessments FOR SELECT
  USING (is_admin());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assessments_updated_at ON assessments;
CREATE TRIGGER trigger_update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessments_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_skill_id ON assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_assessment_id ON user_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_skill_id ON user_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed_at ON user_assessments(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assessments_passed ON user_assessments(passed);

-- Function to update user_skills after assessment
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
    VALUES (NEW.user_id, NEW.skill_id, 'beginner', NEW.score)
    ON CONFLICT (user_id, skill_id) DO NOTHING;
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

  -- Determine if level should change
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

DROP TRIGGER IF EXISTS trigger_update_user_skill_from_assessment ON user_assessments;
CREATE TRIGGER trigger_update_user_skill_from_assessment
  AFTER INSERT ON user_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skill_from_assessment();

-- Function to get user's overall proficiency
CREATE OR REPLACE FUNCTION get_user_overall_proficiency(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avg_score INTEGER;
  overall_level TEXT;
BEGIN
  SELECT AVG(current_score)::INTEGER INTO avg_score
  FROM user_skills
  WHERE user_id = p_user_id;

  IF avg_score IS NULL THEN
    RETURN 'beginner';
  END IF;

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

-- ============================================================================
-- MIGRATION 030: Phrases Skills Integration
-- ============================================================================

-- Add skills columns to phrases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phrases' AND column_name = 'skill_id') THEN
    ALTER TABLE phrases ADD COLUMN skill_id UUID REFERENCES skills(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phrases' AND column_name = 'required_level') THEN
    ALTER TABLE phrases ADD COLUMN required_level TEXT DEFAULT 'beginner';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phrases' AND column_name = 'learning_objectives') THEN
    ALTER TABLE phrases ADD COLUMN learning_objectives TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phrases' AND column_name = 'cultural_notes') THEN
    ALTER TABLE phrases ADD COLUMN cultural_notes JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phrases' AND column_name = 'difficulty_score') THEN
    ALTER TABLE phrases ADD COLUMN difficulty_score INTEGER DEFAULT 1 CHECK (difficulty_score BETWEEN 1 AND 5);
  END IF;
END $$;

-- Add foreign key constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phrases_skill_level') THEN
    ALTER TABLE phrases
      ADD CONSTRAINT fk_phrases_skill_level
      FOREIGN KEY (skill_id, required_level)
      REFERENCES skill_levels(skill_id, level)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phrases_skill_id ON phrases(skill_id);
CREATE INDEX IF NOT EXISTS idx_phrases_required_level ON phrases(required_level);
CREATE INDEX IF NOT EXISTS idx_phrases_skill_level ON phrases(skill_id, required_level);
CREATE INDEX IF NOT EXISTS idx_phrases_difficulty ON phrases(difficulty_score);

-- Update existing phrases with default skills
DO $$
DECLARE
  vocabulary_skill_id UUID;
  conversation_skill_id UUID;
BEGIN
  SELECT id INTO vocabulary_skill_id FROM skills WHERE name = 'vocabulary';
  SELECT id INTO conversation_skill_id FROM skills WHERE name = 'conversation';

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

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Skills system migration completed successfully!';
  RAISE NOTICE 'Created tables: skills, skill_levels, user_skills, assessments, user_assessments';
  RAISE NOTICE 'Seeded 5 skills with 5 proficiency levels each (25 total levels)';
  RAISE NOTICE 'Updated phrases table with skills integration';
  RAISE NOTICE 'AI tutor can now read user_skills table for adaptive teaching';
END $$;
