-- Fix profile update policies - remove duplicate and ensure proper permissions
-- Drop old conflicting policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create clear update policies
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile role"
  ON profiles FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Ensure all profile columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_ui_language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INT DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_study_date DATE;
