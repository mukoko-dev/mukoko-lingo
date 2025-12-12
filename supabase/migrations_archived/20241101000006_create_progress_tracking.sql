-- Create table to track user progress on phrases
CREATE TABLE IF NOT EXISTS phrase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('learning', 'practiced', 'mastered')),
  times_practiced INT DEFAULT 1,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

-- Enable RLS
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON phrase_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON phrase_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON phrase_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phrase_progress_user_id ON phrase_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_phrase_id ON phrase_progress(phrase_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_status ON phrase_progress(status);

-- Function to update study streak
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

-- Trigger to update streak when progress is recorded
DROP TRIGGER IF EXISTS on_phrase_progress_updated ON phrase_progress;
CREATE TRIGGER on_phrase_progress_updated
  AFTER INSERT OR UPDATE ON phrase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_study_streak();
