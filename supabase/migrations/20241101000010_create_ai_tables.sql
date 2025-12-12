-- AI-generated phrases and conversations
CREATE TABLE IF NOT EXISTS ai_generated_phrases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  english text NOT NULL,
  shona text NOT NULL,
  ndebele text NOT NULL,
  chinese text NOT NULL,
  english_pronunciation text,
  shona_pronunciation text,
  ndebele_pronunciation text,
  chinese_pronunciation text,
  context text,
  category text DEFAULT 'custom',
  source text DEFAULT 'ai_generated',
  moderation_flagged boolean DEFAULT false,
  moderation_reason text,
  created_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES profiles(user_id)
);

-- AI chat conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL, -- 'practice', 'scenario', 'translation_help'
  language text NOT NULL, -- which language user is practicing
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- AI chat messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user' or 'assistant'
  content text NOT NULL,
  moderation_flagged boolean DEFAULT false,
  moderation_categories jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Phrase recommendations tracking
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  phrase_id uuid REFERENCES phrases(id) ON DELETE CASCADE,
  reason text,
  score decimal,
  shown_at timestamp with time zone DEFAULT now(),
  clicked boolean DEFAULT false
);

-- RLS Policies
ALTER TABLE ai_generated_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI content
CREATE POLICY "Users can view own AI phrases" ON ai_generated_phrases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI phrases" ON ai_generated_phrases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages" ON ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_messages.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own recommendations" ON ai_recommendations
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all AI content
CREATE POLICY "Admins can view all AI phrases" ON ai_generated_phrases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can view all conversations" ON ai_conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- Indexes for performance
CREATE INDEX ai_generated_phrases_user_id_idx ON ai_generated_phrases(user_id);
CREATE INDEX ai_conversations_user_id_idx ON ai_conversations(user_id);
CREATE INDEX ai_messages_conversation_id_idx ON ai_messages(conversation_id);
CREATE INDEX ai_recommendations_user_id_idx ON ai_recommendations(user_id);
