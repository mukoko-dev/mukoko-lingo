-- Migration 028: Skills Taxonomy
-- AI-First Skills-Based Learning Architecture
-- Core skills that drive the entire learning system

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

-- Add foreign key constraint for skill level
ALTER TABLE user_skills
  ADD CONSTRAINT fk_user_skills_skill_level
  FOREIGN KEY (skill_id, current_level)
  REFERENCES skill_levels(skill_id, level);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills (public read)
CREATE POLICY "Anyone can view active skills"
  ON skills FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage skills"
  ON skills FOR ALL
  USING (is_admin());

-- RLS Policies for skill_levels (public read)
CREATE POLICY "Anyone can view skill levels"
  ON skill_levels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage skill levels"
  ON skill_levels FOR ALL
  USING (is_admin());

-- RLS Policies for user_skills (private)
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

-- Trigger to update updated_at on user_skills
CREATE OR REPLACE FUNCTION update_user_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
 'message-circle', 5);

-- Insert proficiency levels for each skill
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
     90, 5);
  END LOOP;
END $$;

COMMENT ON TABLE skills IS 'Core skills taxonomy that drives the entire learning system';
COMMENT ON TABLE skill_levels IS 'Proficiency levels for each skill with score thresholds';
COMMENT ON TABLE user_skills IS 'Tracks each user''s current proficiency in all skills - READ BY AI TUTOR';
