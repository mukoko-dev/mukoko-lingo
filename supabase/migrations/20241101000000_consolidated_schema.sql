-- ============================================================================
-- NYUCHI LINGO - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This migration combines all database objects into a single, properly ordered
-- migration file to avoid conflicts and ensure correct dependencies.
-- Created: 2025-12-12
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CORE HELPER FUNCTIONS (No dependencies)
-- ============================================================================

-- Create admin check function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profiles WHERE id = check_user_id LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Wrapper function for current user
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- Phrases table (multilingual content)
CREATE TABLE IF NOT EXISTS public.phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  english TEXT NOT NULL,
  english_pronunciation TEXT NOT NULL,
  english_context TEXT NOT NULL,
  shona TEXT NOT NULL,
  shona_pronunciation TEXT NOT NULL,
  shona_context TEXT NOT NULL,
  ndebele TEXT NOT NULL,
  ndebele_pronunciation TEXT NOT NULL,
  ndebele_context TEXT NOT NULL,
  chinese TEXT NOT NULL,
  chinese_pronunciation TEXT NOT NULL,
  chinese_context TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  skill_id UUID,
  required_proficiency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),
  preferred_ui_language TEXT DEFAULT 'en',
  learning_goal TEXT,
  daily_goal INT DEFAULT 10,
  study_streak INT DEFAULT 0,
  last_study_date DATE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

-- Phrase progress tracking
CREATE TABLE IF NOT EXISTS phrase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('learning', 'practiced', 'mastered')),
  times_practiced INT DEFAULT 1,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

-- Phrase views (analytics)
CREATE TABLE IF NOT EXISTS phrase_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  phrases_studied INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- ============================================================================
-- SECTION 3: AI TABLES
-- ============================================================================

-- AI-generated phrases
CREATE TABLE IF NOT EXISTS ai_generated_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  english TEXT NOT NULL,
  shona TEXT NOT NULL,
  ndebele TEXT NOT NULL,
  chinese TEXT NOT NULL,
  english_pronunciation TEXT,
  shona_pronunciation TEXT,
  ndebele_pronunciation TEXT,
  chinese_pronunciation TEXT,
  context TEXT,
  category TEXT DEFAULT 'custom',
  source TEXT DEFAULT 'ai_generated',
  moderation_flagged BOOLEAN DEFAULT false,
  moderation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id)
);

-- AI chat conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  moderation_flagged BOOLEAN DEFAULT false,
  moderation_categories JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  phrase_id UUID REFERENCES phrases(id) ON DELETE CASCADE,
  reason TEXT,
  score DECIMAL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false
);

-- Moderation alerts
CREATE TABLE IF NOT EXISTS moderation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID,
  content_text TEXT NOT NULL,
  flagged_reason TEXT,
  categories JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: SKILLS-BASED LEARNING TABLES
-- ============================================================================

-- Core skills
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

-- Skill levels (proficiency thresholds)
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

-- User skills (proficiency tracking)
CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Assessments (templates)
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

-- Learning standards (AI teaching configuration)
CREATE TABLE IF NOT EXISTS learning_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'novice', 'advanced', 'fluent')),
  level_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,
  vocabulary_range TEXT,
  conversation_types TEXT[],
  grammar_concepts TEXT[],
  ai_prompt_template TEXT,
  example_phrases TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(level)
);

-- Guardrails (AI content moderation rules)
CREATE TABLE IF NOT EXISTS guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('block', 'warn', 'allow')),
  patterns TEXT[],
  keywords TEXT[],
  ai_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- SECTION 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardrails ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: RLS POLICIES
-- ============================================================================

-- Phrases (public read, admin write)
CREATE POLICY "phrases_select_all" ON phrases FOR SELECT USING (true);
CREATE POLICY "Admins can insert phrases" ON phrases FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update phrases" ON phrases FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete phrases" ON phrases FOR DELETE USING (public.is_admin());

-- Profiles (users see own, admins see all)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (auth.uid() = id OR public.check_is_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role = (SELECT role FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));

-- Bookmarks (private)
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Phrase progress (private)
CREATE POLICY "Users can view own progress" ON phrase_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON phrase_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON phrase_progress FOR UPDATE USING (auth.uid() = user_id);

-- Phrase views (private)
CREATE POLICY "Users can view own phrase views" ON phrase_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phrase views" ON phrase_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions (private)
CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- AI tables (private with admin access)
CREATE POLICY "Users can view own AI phrases" ON ai_generated_phrases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create AI phrases" ON ai_generated_phrases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all AI phrases" ON ai_generated_phrases FOR ALL USING (public.is_admin());

CREATE POLICY "Users can manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all conversations" ON ai_conversations FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own messages" ON ai_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));
CREATE POLICY "Users can create messages" ON ai_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

CREATE POLICY "Users can manage own recommendations" ON ai_recommendations FOR ALL USING (auth.uid() = user_id);

-- Moderation alerts (admin only)
CREATE POLICY "Admins can view moderation alerts" ON moderation_alerts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update moderation alerts" ON moderation_alerts FOR UPDATE USING (public.is_admin());
CREATE POLICY "System can insert moderation alerts" ON moderation_alerts FOR INSERT WITH CHECK (true);

-- Skills (public read, admin write)
CREATE POLICY "Anyone can view active skills" ON skills FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage skills" ON skills FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view skill levels" ON skill_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage skill levels" ON skill_levels FOR ALL USING (public.is_admin());

-- User skills (private with admin read)
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all user skills" ON user_skills FOR SELECT USING (public.is_admin());

-- Assessments (public read active, admin write)
CREATE POLICY "Users can view active assessments" ON assessments FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage assessments" ON assessments FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own assessment results" ON user_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON user_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all assessments" ON user_assessments FOR SELECT USING (public.is_admin());

-- Learning standards (public read active, admin write)
CREATE POLICY "Anyone can view active learning standards" ON learning_standards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all learning standards" ON learning_standards FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert learning standards" ON learning_standards FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update learning standards" ON learning_standards FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete learning standards" ON learning_standards FOR DELETE USING (public.is_admin());

-- Guardrails (public read active, admin write)
CREATE POLICY "Anyone can view active guardrails" ON guardrails FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage guardrails" ON guardrails FOR ALL USING (public.is_admin());

-- ============================================================================
-- SECTION 7: INDEXES
-- ============================================================================

-- Phrases
CREATE INDEX IF NOT EXISTS idx_phrases_category ON phrases(category);
CREATE INDEX IF NOT EXISTS idx_phrases_created_at ON phrases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phrases_skill_id ON phrases(skill_id);
CREATE INDEX IF NOT EXISTS idx_phrases_english_search ON phrases USING gin(to_tsvector('english', english));
CREATE INDEX IF NOT EXISTS idx_phrases_shona_search ON phrases USING gin(to_tsvector('simple', shona));

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_role_last_active ON profiles(role, last_active DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_phrase_id ON bookmarks(phrase_id);

-- Phrase progress
CREATE INDEX IF NOT EXISTS idx_phrase_progress_user_id ON phrase_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_phrase_id ON phrase_progress(phrase_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_status ON phrase_progress(status);

-- Phrase views
CREATE INDEX IF NOT EXISTS idx_phrase_views_user_id ON phrase_views(user_id);
CREATE INDEX IF NOT EXISTS idx_phrase_views_phrase_id ON phrase_views(phrase_id);
CREATE INDEX IF NOT EXISTS idx_phrase_views_viewed_at ON phrase_views(viewed_at);

-- Study sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);

-- AI tables
CREATE INDEX IF NOT EXISTS idx_ai_generated_phrases_user_id ON ai_generated_phrases(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);

-- Moderation alerts
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status ON moderation_alerts(status);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_user_id ON moderation_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_created_at ON moderation_alerts(created_at DESC);

-- Skills
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order);
CREATE INDEX IF NOT EXISTS idx_skill_levels_skill_id ON skill_levels(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_level ON user_skills(current_level);
CREATE INDEX IF NOT EXISTS idx_user_skills_score ON user_skills(current_score);

-- Assessments
CREATE INDEX IF NOT EXISTS idx_assessments_skill_id ON assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_assessment_id ON user_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_skill_id ON user_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_completed_at ON user_assessments(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assessments_passed ON user_assessments(passed);

-- Learning standards
CREATE INDEX IF NOT EXISTS idx_learning_standards_level ON learning_standards(level);
CREATE INDEX IF NOT EXISTS idx_learning_standards_active ON learning_standards(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_standards_order ON learning_standards(level_order);

-- ============================================================================
-- SECTION 8: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Handle new user signup (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update study streak
CREATE OR REPLACE FUNCTION update_study_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    study_streak = CASE
      WHEN last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN study_streak + 1
      WHEN last_study_date = CURRENT_DATE THEN study_streak
      ELSE 1
    END,
    last_study_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_phrase_progress_updated ON phrase_progress;
CREATE TRIGGER on_phrase_progress_updated
  AFTER INSERT OR UPDATE ON phrase_progress
  FOR EACH ROW EXECUTE FUNCTION update_study_streak();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_learning_standards_updated_at ON learning_standards;
CREATE TRIGGER update_learning_standards_updated_at
  BEFORE UPDATE ON learning_standards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get popular phrases
CREATE OR REPLACE FUNCTION get_popular_phrases(days_back INT DEFAULT 7)
RETURNS TABLE (phrase_id UUID, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT pv.phrase_id, COUNT(*) as view_count
  FROM phrase_views pv
  WHERE pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY pv.phrase_id
  ORDER BY view_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user learning stats
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

-- Get user activity summary (admin only)
CREATE OR REPLACE FUNCTION get_user_activity_summary()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_phrases_viewed BIGINT,
  avg_daily_goal NUMERIC,
  last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT public.check_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id)::BIGINT as total_users,
    COUNT(DISTINCT CASE WHEN p.last_study_date >= CURRENT_DATE - INTERVAL '7 days' THEN p.id END)::BIGINT as active_users,
    COALESCE(SUM(pv.view_count), 0)::BIGINT as total_phrases_viewed,
    COALESCE(AVG(p.daily_goal), 0)::NUMERIC as avg_daily_goal,
    MAX(GREATEST(p.updated_at, COALESCE(pv.last_viewed_at, p.created_at))) as last_active
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as view_count, MAX(viewed_at) as last_viewed_at
    FROM phrase_views
    GROUP BY user_id
  ) pv ON p.id = pv.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user skill from assessment
CREATE OR REPLACE FUNCTION update_user_skill_from_assessment()
RETURNS TRIGGER AS $$
DECLARE
  current_user_skill RECORD;
  new_level TEXT;
BEGIN
  SELECT * INTO current_user_skill
  FROM user_skills
  WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;

  IF current_user_skill IS NULL THEN
    INSERT INTO user_skills (user_id, skill_id, current_level, current_score)
    VALUES (NEW.user_id, NEW.skill_id, 'beginner', NEW.score);
    RETURN NEW;
  END IF;

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

  IF new_level != current_user_skill.current_level THEN
    UPDATE user_skills
    SET current_level = new_level, level_achieved_at = NOW()
    WHERE user_id = NEW.user_id AND skill_id = NEW.skill_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_skill_from_assessment ON user_assessments;
CREATE TRIGGER trigger_update_user_skill_from_assessment
  AFTER INSERT ON user_assessments
  FOR EACH ROW EXECUTE FUNCTION update_user_skill_from_assessment();

-- Get user overall proficiency
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

  IF avg_score >= 90 THEN overall_level := 'fluent';
  ELSIF avg_score >= 80 THEN overall_level := 'advanced';
  ELSIF avg_score >= 65 THEN overall_level := 'intermediate';
  ELSIF avg_score >= 50 THEN overall_level := 'elementary';
  ELSE overall_level := 'beginner';
  END IF;

  RETURN overall_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get learning standard by level
CREATE OR REPLACE FUNCTION get_learning_standard(target_level TEXT)
RETURNS TABLE (
  id UUID, level TEXT, title TEXT, description TEXT, criteria JSONB,
  vocabulary_range TEXT, conversation_types TEXT[], grammar_concepts TEXT[],
  ai_prompt_template TEXT, example_phrases TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id, ls.level, ls.title, ls.description, ls.criteria,
    ls.vocabulary_range, ls.conversation_types, ls.grammar_concepts,
    ls.ai_prompt_template, ls.example_phrases
  FROM learning_standards ls
  WHERE ls.level = target_level AND ls.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 9: ADMIN VIEW
-- ============================================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM phrases) as total_phrases,
  (SELECT COUNT(*) FROM phrase_progress) as total_progress_records,
  (SELECT COUNT(*) FROM bookmarks) as total_bookmarks,
  (SELECT COUNT(*) FROM phrase_views) as total_views;

GRANT SELECT ON admin_stats TO authenticated;

-- ============================================================================
-- SECTION 10: SEED DATA - SKILLS TAXONOMY
-- ============================================================================

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

-- Insert skill levels for each skill
DO $$
DECLARE
  skill_record RECORD;
BEGIN
  FOR skill_record IN SELECT id FROM skills LOOP
    INSERT INTO skill_levels (skill_id, level, display_name, description, min_score, sort_order) VALUES
    (skill_record.id, 'beginner',
     '{"en": "Beginner", "sn": "Mutanguri", "nd": "Umqali", "zh": "初学者"}'::jsonb,
     '{"en": "Basic phrases and simple grammar with high AI support", "sn": "Mitsara yepakutanga uye mutauro usingaomeswe", "nd": "Imisho eyisisekelo lohlelo olulula lolimi", "zh": "基础短语和简单语法，高度AI辅助"}'::jsonb,
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
-- SECTION 11: SEED DATA - LEARNING STANDARDS
-- ============================================================================

INSERT INTO learning_standards (level, level_order, title, description, criteria, vocabulary_range, conversation_types, grammar_concepts, ai_prompt_template, example_phrases) VALUES
('beginner', 1, 'Beginner - Basic Communication',
 'Start with essential greetings, introductions, and basic everyday phrases. Focus on simple, practical communication.',
 '{"vocabulary_size": 100, "sentence_complexity": "Simple present tense only", "conversation_length": "1-2 exchanges", "pronunciation_focus": "Basic sounds and tones", "comprehension_level": "Understand basic questions and statements"}'::jsonb,
 '50-150 words',
 ARRAY['Greetings', 'Introductions', 'Basic requests', 'Numbers', 'Shopping basics'],
 ARRAY['Present tense', 'Personal pronouns', 'Basic questions', 'Yes/No responses'],
 'You are teaching a complete beginner. Use very simple vocabulary, speak slowly, and focus on practical everyday phrases. Provide phonetic guidance and cultural context. Encourage repetition and practice.',
 ARRAY['Hello, how are you?', 'My name is...', 'Thank you', 'How much?', 'Where is...?']),

('novice', 2, 'Novice - Building Confidence',
 'Expand vocabulary and start forming simple sentences. Begin basic conversations about daily life.',
 '{"vocabulary_size": 300, "sentence_complexity": "Simple past and future tenses", "conversation_length": "3-5 exchanges", "pronunciation_focus": "Consistent pronunciation, basic intonation", "comprehension_level": "Understand common phrases and respond appropriately"}'::jsonb,
 '150-400 words',
 ARRAY['Family', 'Food ordering', 'Directions', 'Time and dates', 'Daily routines'],
 ARRAY['Past tense', 'Future tense', 'Possessives', 'Basic adjectives', 'Question words'],
 'You are teaching a novice learner. They know basic phrases and are ready to form simple sentences. Help them connect ideas, use appropriate tenses, and engage in short conversations. Provide gentle corrections and cultural insights.',
 ARRAY['I went to the market yesterday', 'What time is it?', 'This is my family', 'Can you help me?', 'I like...']),

('advanced', 3, 'Advanced - Conversational Fluency',
 'Engage in extended conversations, express opinions, and understand nuanced language.',
 '{"vocabulary_size": 1000, "sentence_complexity": "Complex sentences with conjunctions", "conversation_length": "10+ exchanges", "pronunciation_focus": "Natural rhythm and intonation", "comprehension_level": "Understand context, idioms, and implied meanings"}'::jsonb,
 '400-1200 words',
 ARRAY['Work discussions', 'Expressing opinions', 'Storytelling', 'Problem solving', 'Social etiquette'],
 ARRAY['Conditionals', 'Subjunctive mood', 'Complex questions', 'Idioms', 'Formal vs informal'],
 'You are teaching an advanced learner. They can hold basic conversations and are ready for more complex topics. Challenge them with nuanced vocabulary, cultural expressions, and longer dialogues. Discuss abstract concepts and provide feedback on naturalness.',
 ARRAY['In my opinion...', 'Have you considered...?', 'Let me explain...', 'That reminds me of...', 'Would you mind if...?']),

('fluent', 4, 'Fluent - Mastery & Refinement',
 'Achieve near-native proficiency with sophisticated vocabulary, cultural understanding, and natural expression.',
 '{"vocabulary_size": 2000, "sentence_complexity": "Native-like complexity with idioms", "conversation_length": "Extended natural conversations", "pronunciation_focus": "Native-like pronunciation and regional accents", "comprehension_level": "Understand slang, humor, and cultural references"}'::jsonb,
 '1200+ words',
 ARRAY['Professional communication', 'Cultural discussions', 'Debates', 'Humor and wordplay', 'Literature and media'],
 ARRAY['Advanced idioms', 'Regional variations', 'Cultural references', 'Professional jargon', 'Rhetorical devices'],
 'You are teaching a fluent learner who is refining their mastery. Engage in sophisticated discussions, introduce regional variations and idioms, and help them sound more natural. Focus on subtle nuances, cultural context, and professional communication.',
 ARRAY['Between you and me...', 'That''s a double-edged sword', 'Let''s touch base next week', 'I''m all ears', 'It''s not rocket science'])
ON CONFLICT (level) DO NOTHING;

-- ============================================================================
-- SECTION 12: SEED DATA - GUARDRAILS
-- ============================================================================

INSERT INTO guardrails (name, description, category, rule_type, keywords, ai_instructions, severity) VALUES
('profanity_filter', 'Block profane language and slurs', 'content', 'block',
 ARRAY['slur', 'profanity', 'vulgar'],
 'Do not generate or respond to content containing profanity, slurs, or vulgar language.',
 5),
('educational_focus', 'Keep conversations educational and on-topic', 'behavior', 'warn',
 ARRAY['off-topic', 'inappropriate', 'non-educational'],
 'Gently redirect conversations that stray from language learning. Remind users of the educational purpose.',
 2),
('personal_safety', 'Protect users from sharing personal information', 'safety', 'block',
 ARRAY['address', 'phone', 'password', 'social security'],
 'Never ask for or store personal identifying information. Warn users not to share such information.',
 5),
('cultural_sensitivity', 'Ensure cultural content is respectful and accurate', 'content', 'warn',
 ARRAY['stereotype', 'offensive', 'disrespectful'],
 'Present cultural information respectfully and accurately. Avoid stereotypes and generalizations.',
 3),
('age_appropriate', 'Ensure content is appropriate for all ages', 'content', 'block',
 ARRAY['adult', 'explicit', 'violent'],
 'Generate only age-appropriate content suitable for learners of all ages.',
 5),
('harassment_prevention', 'Prevent harassment and bullying behavior', 'behavior', 'block',
 ARRAY['bully', 'harass', 'threaten', 'intimidate'],
 'Do not engage with or generate content that could be considered harassment or bullying.',
 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 13: COMMENTS
-- ============================================================================

COMMENT ON TABLE phrases IS 'Multilingual phrase content for learning';
COMMENT ON TABLE profiles IS 'User profiles with preferences and progress tracking';
COMMENT ON TABLE skills IS 'Core skills taxonomy that drives the entire learning system';
COMMENT ON TABLE skill_levels IS 'Proficiency levels for each skill with score thresholds';
COMMENT ON TABLE user_skills IS 'Tracks each user''s current proficiency in all skills - READ BY AI TUTOR';
COMMENT ON TABLE assessments IS 'Assessment templates for evaluating skill proficiency';
COMMENT ON TABLE user_assessments IS 'User assessment attempts and results - updates user_skills automatically';
COMMENT ON TABLE learning_standards IS 'Defines proficiency levels and standards that govern AI learning capabilities';
COMMENT ON TABLE guardrails IS 'AI content moderation rules and safety guidelines';
COMMENT ON FUNCTION public.check_is_admin(UUID) IS 'Security definer function to check admin status without RLS recursion';
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user is admin (wrapper for check_is_admin)';
COMMENT ON FUNCTION get_user_overall_proficiency(UUID) IS 'Returns user''s overall proficiency level based on average skill scores';

COMMIT;
