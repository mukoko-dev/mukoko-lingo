-- Add preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_ui_language TEXT DEFAULT 'en' CHECK (preferred_ui_language IN ('en', 'sn', 'nd', 'zh')),
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS daily_goal INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS study_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
