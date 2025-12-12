-- ============================================================================
-- Migration 030: Restore Learning Standards Data
-- ============================================================================
-- Description: Re-insert learning standards data if missing
-- Author: Claude Code
-- Date: 2025-11-11
-- ============================================================================

-- Delete existing data first to avoid conflicts
DELETE FROM learning_standards;

-- Insert default learning standards with all data
INSERT INTO learning_standards (level, level_order, title, description, criteria, vocabulary_range, conversation_types, grammar_concepts, ai_prompt_template, example_phrases, is_active) VALUES
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
  ARRAY['Hello, how are you?', 'My name is...', 'Thank you', 'How much?', 'Where is...?'],
  true
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
  ARRAY['I went to the market yesterday', 'What time is it?', 'This is my family', 'Can you help me?', 'I like...'],
  true
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
  ARRAY['In my opinion...', 'Have you considered...?', 'Let me explain...', 'That reminds me of...', 'Would you mind if...?'],
  true
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
  ARRAY['Between you and me...', 'That''s a double-edged sword', 'Let''s touch base next week', 'I''m all ears', 'It''s not rocket science'],
  true
);

-- Verify data was inserted
DO $$
DECLARE
  standard_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO standard_count FROM learning_standards;
  RAISE NOTICE 'Successfully inserted % learning standards', standard_count;
END $$;
