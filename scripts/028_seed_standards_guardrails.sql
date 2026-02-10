-- 028: Seed Learning Standards, Guardrails, and Skills data
-- Run this AFTER the consolidated schema migration (20241101000000)

-- ============================================
-- SEED: Core Skills
-- ============================================
INSERT INTO skills (name, description, is_active, sort_order) VALUES
  ('pronunciation', 'Sound production, tone, rhythm, and accent', true, 1),
  ('vocabulary', 'Word knowledge, context usage, and meaning', true, 2),
  ('grammar', 'Sentence structure, verb forms, and particles', true, 3),
  ('comprehension', 'Listening and reading understanding', true, 4),
  ('conversation', 'Real-time dialogue and cultural context', true, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED: Skill Levels (5 levels per skill)
-- ============================================
DO $$
DECLARE
  skill_rec RECORD;
BEGIN
  FOR skill_rec IN SELECT id FROM skills LOOP
    INSERT INTO skill_levels (skill_id, level, min_score, sort_order) VALUES
      (skill_rec.id, 'beginner', 0, 1),
      (skill_rec.id, 'elementary', 50, 2),
      (skill_rec.id, 'intermediate', 65, 3),
      (skill_rec.id, 'advanced', 80, 4),
      (skill_rec.id, 'fluent', 90, 5)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- SEED: Learning Standards
-- ============================================
INSERT INTO learning_standards (level, level_order, title, description, vocabulary_range, ai_prompt_template, is_active) VALUES
(
  'beginner', 1,
  'Beginner - Foundation',
  'Basic phrases, simple grammar, maximum AI support. Learners are just starting their journey.',
  '100-300 words',
  'Use VERY simple vocabulary (1-2 syllable words). Avoid idioms. Use short sentences (5-8 words max). ONLY present simple tense. Correct EVERY error gently. Provide MAXIMUM support.',
  true
),
(
  'novice', 2,
  'Elementary - Building Blocks',
  'Common expressions, guided practice, frequent checks. Learners can handle basic exchanges.',
  '300-800 words',
  'Use everyday common vocabulary. Simple sentence structures (8-12 words). Present simple, present continuous, simple past. Correct major errors. Provide HIGH support with frequent checks.',
  true
),
(
  'advanced', 3,
  'Intermediate - Conversational',
  'Varied vocabulary, all basic tenses, moderate scaffolding. Learners engage in real conversations.',
  '800-2000 words',
  'Use varied everyday vocabulary with some advanced words. Complex sentences okay (12-15 words). All basic tenses plus present perfect. Correct significant errors. Provide MODERATE support.',
  true
),
(
  'fluent', 4,
  'Advanced & Fluent - Mastery',
  'Sophisticated vocabulary, complex grammar, minimal AI intervention. Near-native proficiency.',
  '2000+ words',
  'Use sophisticated/native-level vocabulary including idioms, slang, technical terms. Full grammatical range. Only correct upon request. Treat as peer conversation.',
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Core Guardrails (6 categories)
-- ============================================
INSERT INTO guardrails (name, description, category, rule_type, is_active, severity, ai_instructions) VALUES
(
  'No Hate Speech',
  'Block any form of hate speech, slurs, or discriminatory language targeting race, ethnicity, religion, gender, or sexual orientation.',
  'hate_speech',
  'block',
  true,
  5,
  'If the user message contains hate speech, slurs, or discriminatory language, do NOT respond to the content. Instead, gently redirect to language learning and remind that Nyuchi Lingo is a safe, inclusive space for all learners.'
),
(
  'No Sexual Content',
  'Block sexually explicit or suggestive content. The platform serves learners of all ages.',
  'sexual_content',
  'block',
  true,
  5,
  'If the user message contains sexual or suggestive content, do NOT engage with it. Redirect to appropriate language learning topics.'
),
(
  'No Violence Promotion',
  'Block content that promotes, glorifies, or instructs violence or self-harm.',
  'violence',
  'block',
  true,
  5,
  'If the user discusses violence or self-harm, do NOT provide instructions. If self-harm is mentioned, express care and suggest they reach out to a trusted person or helpline.'
),
(
  'No Harassment',
  'Block bullying, intimidation, or targeted harassment of individuals or groups.',
  'harassment',
  'block',
  true,
  4,
  'If the user engages in harassment or bullying language, do NOT mirror it. Gently remind that respectful communication is key to language learning.'
),
(
  'Personal Information Protection',
  'Warn users when they share personal information like phone numbers, addresses, or financial data.',
  'personal_info',
  'warn',
  true,
  3,
  'If the user shares personal information (phone, email, address, financial data), gently advise them to keep such information private. Do NOT store or repeat their personal data.'
),
(
  'Stay On Topic',
  'Guide conversations back to language learning when they drift too far off topic.',
  'off_topic',
  'warn',
  true,
  2,
  'If the conversation drifts far from language learning, gently guide it back. Its okay to discuss culture and context related to the languages being learned.'
)
ON CONFLICT DO NOTHING;
