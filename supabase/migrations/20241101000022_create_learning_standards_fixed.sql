-- Ensure check_is_admin function exists first
-- Create a SECURITY DEFINER function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profiles WHERE user_id = check_user_id LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Now create learning standards table
DROP TABLE IF EXISTS learning_standards CASCADE;

CREATE TABLE learning_standards (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(level)
);

-- Create indexes
CREATE INDEX idx_learning_standards_level ON learning_standards(level);
CREATE INDEX idx_learning_standards_active ON learning_standards(is_active);
CREATE INDEX idx_learning_standards_order ON learning_standards(level_order);

-- Enable RLS
ALTER TABLE learning_standards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view active standards
CREATE POLICY "Anyone can view active learning standards"
  ON learning_standards FOR SELECT
  USING (is_active = true);

-- Only admins can view inactive standards
CREATE POLICY "Admins can view all learning standards"
  ON learning_standards FOR SELECT
  USING (public.check_is_admin(auth.uid()));

-- Only admins can insert
CREATE POLICY "Admins can insert learning standards"
  ON learning_standards FOR INSERT
  WITH CHECK (public.check_is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update learning standards"
  ON learning_standards FOR UPDATE
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete learning standards"
  ON learning_standards FOR DELETE
  USING (public.check_is_admin(auth.uid()));

-- Insert default learning standards
INSERT INTO learning_standards (level, level_order, title, description, criteria, vocabulary_range, conversation_types, grammar_concepts, ai_prompt_template, example_phrases) VALUES
(
  'beginner',
  1,
  'Beginner - Basic Communication',
  'Start with essential greetings, introductions, and basic everyday phrases. Focus on simple, practical communication.',
  '{
    "vocabulary_size": 100,
    "sentence_complexity": "Simple present tense only",
    "conversation_length": "1-2 exchanges",
    "pronunciation_focus": "Basic sounds and tones",
    "comprehension_level": "Understand basic questions and statements"
  }'::jsonb,
  '50-150 words',
  ARRAY['Greetings', 'Introductions', 'Basic requests', 'Numbers', 'Shopping basics'],
  ARRAY['Present tense', 'Personal pronouns', 'Basic questions', 'Yes/No responses'],
  'You are teaching a complete beginner. Use very simple vocabulary, speak slowly, and focus on practical everyday phrases. Provide phonetic guidance and cultural context. Encourage repetition and practice.',
  ARRAY['Hello, how are you?', 'My name is...', 'Thank you', 'How much?', 'Where is...?']
),
(
  'novice',
  2,
  'Novice - Building Confidence',
  'Expand vocabulary and start forming simple sentences. Begin basic conversations about daily life.',
  '{
    "vocabulary_size": 300,
    "sentence_complexity": "Simple past and future tenses",
    "conversation_length": "3-5 exchanges",
    "pronunciation_focus": "Consistent pronunciation, basic intonation",
    "comprehension_level": "Understand common phrases and respond appropriately"
  }'::jsonb,
  '150-400 words',
  ARRAY['Family', 'Food ordering', 'Directions', 'Time and dates', 'Daily routines'],
  ARRAY['Past tense', 'Future tense', 'Possessives', 'Basic adjectives', 'Question words'],
  'You are teaching a novice learner. They know basic phrases and are ready to form simple sentences. Help them connect ideas, use appropriate tenses, and engage in short conversations. Provide gentle corrections and cultural insights.',
  ARRAY['I went to the market yesterday', 'What time is it?', 'This is my family', 'Can you help me?', 'I like...']
),
(
  'advanced',
  3,
  'Advanced - Conversational Fluency',
  'Engage in extended conversations, express opinions, and understand nuanced language.',
  '{
    "vocabulary_size": 1000,
    "sentence_complexity": "Complex sentences with conjunctions",
    "conversation_length": "10+ exchanges",
    "pronunciation_focus": "Natural rhythm and intonation",
    "comprehension_level": "Understand context, idioms, and implied meanings"
  }'::jsonb,
  '400-1200 words',
  ARRAY['Work discussions', 'Expressing opinions', 'Storytelling', 'Problem solving', 'Social etiquette'],
  ARRAY['Conditionals', 'Subjunctive mood', 'Complex questions', 'Idioms', 'Formal vs informal'],
  'You are teaching an advanced learner. They can hold basic conversations and are ready for more complex topics. Challenge them with nuanced vocabulary, cultural expressions, and longer dialogues. Discuss abstract concepts and provide feedback on naturalness.',
  ARRAY['In my opinion...', 'Have you considered...?', 'Let me explain...', 'That reminds me of...', 'Would you mind if...?']
),
(
  'fluent',
  4,
  'Fluent - Mastery & Refinement',
  'Achieve near-native proficiency with sophisticated vocabulary, cultural understanding, and natural expression.',
  '{
    "vocabulary_size": 2000,
    "sentence_complexity": "Native-like complexity with idioms",
    "conversation_length": "Extended natural conversations",
    "pronunciation_focus": "Native-like pronunciation and regional accents",
    "comprehension_level": "Understand slang, humor, and cultural references"
  }'::jsonb,
  '1200+ words',
  ARRAY['Professional communication', 'Cultural discussions', 'Debates', 'Humor and wordplay', 'Literature and media'],
  ARRAY['Advanced idioms', 'Regional variations', 'Cultural references', 'Professional jargon', 'Rhetorical devices'],
  'You are teaching a fluent learner who is refining their mastery. Engage in sophisticated discussions, introduce regional variations and idioms, and help them sound more natural. Focus on subtle nuances, cultural context, and professional communication.',
  ARRAY['Between you and me...', 'That''s a double-edged sword', 'Let''s touch base next week', 'I''m all ears', 'It''s not rocket science']
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_learning_standards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_standards_updated_at
  BEFORE UPDATE ON learning_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_standards_updated_at();

-- Create helper function to get standard by level
CREATE OR REPLACE FUNCTION get_learning_standard(target_level TEXT)
RETURNS TABLE (
  id UUID,
  level TEXT,
  title TEXT,
  description TEXT,
  criteria JSONB,
  vocabulary_range TEXT,
  conversation_types TEXT[],
  grammar_concepts TEXT[],
  ai_prompt_template TEXT,
  example_phrases TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.level,
    ls.title,
    ls.description,
    ls.criteria,
    ls.vocabulary_range,
    ls.conversation_types,
    ls.grammar_concepts,
    ls.ai_prompt_template,
    ls.example_phrases
  FROM learning_standards ls
  WHERE ls.level = target_level AND ls.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON TABLE learning_standards IS 'Defines proficiency levels and standards that govern AI learning capabilities and adapt teaching approaches based on user proficiency';
COMMENT ON FUNCTION get_learning_standard(TEXT) IS 'Retrieves active learning standard for a specific proficiency level';
