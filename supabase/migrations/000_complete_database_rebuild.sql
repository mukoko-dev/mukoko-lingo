-- ============================================================================
-- NYUCHI LINGO - COMPLETE DATABASE REBUILD
-- AI-First Skills-Based Language Learning Platform
-- ============================================================================
-- This script creates the entire database schema from scratch
-- Optimized for AI tutor that reads user proficiency for adaptive teaching
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CORE USER MANAGEMENT
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  target_language TEXT DEFAULT 'sn',
  native_language TEXT DEFAULT 'en',
  study_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: SKILLS SYSTEM (AI CORE)
-- ============================================================================

-- Core skills that learners progress through
CREATE TABLE skills (
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
CREATE TABLE skill_levels (
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
-- CRITICAL: This table is READ BY AI TUTOR for adaptive teaching
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  current_score INTEGER DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 100),
  total_practice_time INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  level_achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (skill_id, current_level) REFERENCES skill_levels(skill_id, level) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

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

-- Trigger for user_skills updated_at
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_skills_active ON skills(is_active);
CREATE INDEX idx_skills_sort_order ON skills(sort_order);
CREATE INDEX idx_skill_levels_skill_id ON skill_levels(skill_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX idx_user_skills_level ON user_skills(current_level);
CREATE INDEX idx_user_skills_score ON user_skills(current_score);

-- ============================================================================
-- PART 3: ASSESSMENT SYSTEM
-- ============================================================================

-- Assessment templates
CREATE TABLE assessments (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (skill_id, target_level) REFERENCES skill_levels(skill_id, level) DEFERRABLE INITIALLY DEFERRED
);

-- User assessment attempts
CREATE TABLE user_assessments (
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

-- Trigger for assessments updated_at
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_assessments_skill_id ON assessments(skill_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_active ON assessments(is_active);
CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_assessment_id ON user_assessments(assessment_id);
CREATE INDEX idx_user_assessments_skill_id ON user_assessments(skill_id);
CREATE INDEX idx_user_assessments_completed_at ON user_assessments(completed_at DESC);
CREATE INDEX idx_user_assessments_passed ON user_assessments(passed);

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
-- PART 4: PHRASES (Skills-Based Content)
-- ============================================================================

CREATE TABLE phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english TEXT NOT NULL,
  shona TEXT NOT NULL,
  ndebele TEXT NOT NULL,
  chinese TEXT NOT NULL,
  category TEXT NOT NULL,
  skill_id UUID REFERENCES skills(id),
  required_level TEXT DEFAULT 'beginner',
  learning_objectives TEXT[],
  cultural_notes JSONB,
  difficulty_score INTEGER DEFAULT 1 CHECK (difficulty_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (skill_id, required_level) REFERENCES skill_levels(skill_id, level) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view phrases"
  ON phrases FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage phrases"
  ON phrases FOR ALL
  USING (is_admin());

-- Trigger for phrases updated_at
CREATE TRIGGER update_phrases_updated_at
  BEFORE UPDATE ON phrases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_phrases_category ON phrases(category);
CREATE INDEX idx_phrases_skill_id ON phrases(skill_id);
CREATE INDEX idx_phrases_required_level ON phrases(required_level);
CREATE INDEX idx_phrases_skill_level ON phrases(skill_id, required_level);
CREATE INDEX idx_phrases_difficulty ON phrases(difficulty_score);

-- ============================================================================
-- PART 5: USER PROGRESS TRACKING
-- ============================================================================

-- Phrase progress tracking
CREATE TABLE phrase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'practiced', 'mastered')),
  times_practiced INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

-- Study sessions
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  phrases_studied INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phrase_progress
CREATE POLICY "Users can view own progress"
  ON phrase_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON phrase_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON phrase_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON phrase_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON phrase_progress FOR SELECT
  USING (is_admin());

-- RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for study_sessions
CREATE POLICY "Users can view own sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON study_sessions FOR SELECT
  USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_phrase_progress_updated_at
  BEFORE UPDATE ON phrase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_phrase_progress_user_id ON phrase_progress(user_id);
CREATE INDEX idx_phrase_progress_phrase_id ON phrase_progress(phrase_id);
CREATE INDEX idx_phrase_progress_status ON phrase_progress(status);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_phrase_id ON bookmarks(phrase_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(date DESC);

-- ============================================================================
-- PART 6: AI CONVERSATIONS
-- ============================================================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('practice', 'scenario', 'translation_help')),
  language TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  moderation_flagged BOOLEAN DEFAULT false,
  moderation_categories JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON ai_conversations FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can view own messages"
  ON ai_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE id = ai_messages.conversation_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON ai_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE id = ai_messages.conversation_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all messages"
  ON ai_messages FOR SELECT
  USING (is_admin());

-- Trigger for ai_conversations updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_type ON ai_conversations(type);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_moderation_flagged ON ai_messages(moderation_flagged);

-- ============================================================================
-- PART 7: MODERATION
-- ============================================================================

CREATE TABLE moderation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  categories JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE moderation_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all moderation alerts"
  ON moderation_alerts FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update moderation alerts"
  ON moderation_alerts FOR UPDATE
  USING (is_admin());

-- Indexes
CREATE INDEX idx_moderation_alerts_status ON moderation_alerts(status);
CREATE INDEX idx_moderation_alerts_created_at ON moderation_alerts(created_at DESC);
CREATE INDEX idx_moderation_alerts_user_id ON moderation_alerts(user_id);

-- ============================================================================
-- PART 8: LEARNING STANDARDS (AI Tutor Configuration)
-- ============================================================================

CREATE TABLE learning_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL UNIQUE CHECK (level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'fluent')),
  vocabulary_complexity INTEGER NOT NULL CHECK (vocabulary_complexity BETWEEN 1 AND 5),
  grammar_complexity INTEGER NOT NULL CHECK (grammar_complexity BETWEEN 1 AND 5),
  explanation_depth INTEGER NOT NULL CHECK (explanation_depth BETWEEN 1 AND 5),
  cultural_context_level INTEGER NOT NULL CHECK (cultural_context_level BETWEEN 1 AND 5),
  ai_scaffolding_level INTEGER NOT NULL CHECK (ai_scaffolding_level BETWEEN 1 AND 5),
  description JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE learning_standards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view learning standards"
  ON learning_standards FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage learning standards"
  ON learning_standards FOR ALL
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_learning_standards_updated_at
  BEFORE UPDATE ON learning_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 9: SEED DATA
-- ============================================================================

-- Seed core skills (5 skills)
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
 'message-circle', 5);

-- Seed proficiency levels for each skill (25 total: 5 skills × 5 levels)
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
     90, 5);
  END LOOP;
END $$;

-- Seed learning standards (AI tutor configuration)
INSERT INTO learning_standards (level, vocabulary_complexity, grammar_complexity, explanation_depth, cultural_context_level, ai_scaffolding_level, description) VALUES
('beginner', 1, 1, 5, 2, 5,
 '{"en": "Use only common essential words, simple present tense, provide extensive explanations with high AI support", "sn": "Shandisa mazwi akajairwa chete, nguva yazvino iri nyore, ipa tsananguro yakawanda", "nd": "Sebenzisa kuphela amagama ajwayelekile, isikhathi samanje esilula, nikeza incazelo ebanzi", "zh": "只使用常用基本词汇，简单现在时，提供详细解释和高度AI支持"}'::jsonb),

('elementary', 2, 2, 4, 3, 4,
 '{"en": "Introduce everyday phrases, past/future tense, moderate guidance with cultural insights", "sn": "Tangisa mitsara yezuva nezuva, nguva yakapfuura nekamuri, tsananguro yetsika", "nd": "Ngenisa imisho yansuku zonke, isikhathi esedlule lesizayo, iseluleko esingakho", "zh": "引入日常短语，过去/将来时，适度指导和文化见解"}'::jsonb),

('intermediate', 3, 3, 3, 4, 3,
 '{"en": "Use conversational vocabulary, complex sentences, reduced support with more cultural context", "sn": "Shandisa mazwi ekutaura, mitsara yakaoma, rutsigiro rwakadzikira nezvetsika", "nd": "Sebenzisa izaga zokukhuluma, imisho elungileyo, usekelo oluncane lesintu", "zh": "使用对话词汇，复杂句子，减少支持但增加文化语境"}'::jsonb),

('advanced', 4, 4, 2, 5, 2,
 '{"en": "Include nuanced vocabulary, all grammar structures, minimal hints with deep cultural understanding", "sn": "Sanganisa mazwi ane hungwaru, mutauro wese, kushorera kushoma nekunzwisisa tsika", "nd": "Hlanganisa izaga ezinobuhlakani, zonke izakhiwo zolimi, izeluleko ezincane lokuqonda isiko", "zh": "包含细致词汇，所有语法结构，最少提示但深入文化理解"}'::jsonb),

('fluent', 5, 5, 1, 5, 1,
 '{"en": "Native-level vocabulary including slang, all structures, peer-level interaction with full cultural fluency", "sn": "Mazwi esemataurirwo anosanganisira slang, zvese, kudyidzana sevabereki vetsika", "nd": "Izaga zekhaya kuhlanganisa isilolimi setsotsi, zonke, ukuxoxisana okufananayo lwamasiko onke", "zh": "母语级词汇包括俚语，所有结构，平等交流和完全文化流畅"}'::jsonb);

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  NYUCHI LINGO - DATABASE REBUILD COMPLETE                   ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Tables:';
  RAISE NOTICE '  • profiles (user management)';
  RAISE NOTICE '  • skills (5 core skills)';
  RAISE NOTICE '  • skill_levels (25 proficiency levels)';
  RAISE NOTICE '  • user_skills (← READ BY AI TUTOR for adaptive teaching)';
  RAISE NOTICE '  • assessments (diagnostic, formative, summative)';
  RAISE NOTICE '  • user_assessments (auto-updates user_skills)';
  RAISE NOTICE '  • phrases (skills-based content)';
  RAISE NOTICE '  • phrase_progress (learning tracking)';
  RAISE NOTICE '  • bookmarks (user favorites)';
  RAISE NOTICE '  • study_sessions (daily analytics)';
  RAISE NOTICE '  • ai_conversations (chat history)';
  RAISE NOTICE '  • ai_messages (with moderation)';
  RAISE NOTICE '  • moderation_alerts (admin review)';
  RAISE NOTICE '  • learning_standards (AI configuration)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Functions:';
  RAISE NOTICE '  • is_admin() - role checking';
  RAISE NOTICE '  • handle_new_user() - auto-create profiles';
  RAISE NOTICE '  • update_user_skill_from_assessment() - auto-proficiency tracking';
  RAISE NOTICE '  • get_user_overall_proficiency() - calculate overall level';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Triggers:';
  RAISE NOTICE '  • Auto-update user_skills on assessment completion';
  RAISE NOTICE '  • Auto-update updated_at timestamps';
  RAISE NOTICE '  • Auto-create profile on user signup';
  RAISE NOTICE '';
  RAISE NOTICE 'Seeded Data:';
  RAISE NOTICE '  • 5 skills (pronunciation, vocabulary, grammar, comprehension, conversation)';
  RAISE NOTICE '  • 25 skill levels (5 per skill: beginner → fluent)';
  RAISE NOTICE '  • 5 learning standards (AI tutor configuration)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  • All tables have Row Level Security (RLS) enabled';
  RAISE NOTICE '  • 40+ RLS policies for fine-grained access control';
  RAISE NOTICE '  • Admin checks integrated throughout';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance:';
  RAISE NOTICE '  • 30+ indexes for fast queries';
  RAISE NOTICE '  • Foreign keys with CASCADE delete';
  RAISE NOTICE '  • DEFERRED constraints for complex inserts';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ AI-FIRST ARCHITECTURE READY';
  RAISE NOTICE '   AI tutor can now read user_skills for adaptive teaching!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Import existing phrases (if any)';
  RAISE NOTICE '  2. Build skills-aware AI prompt system';
  RAISE NOTICE '  3. Create diagnostic assessment flow';
  RAISE NOTICE '  4. Test user journey end-to-end';
  RAISE NOTICE '';
END $$;
