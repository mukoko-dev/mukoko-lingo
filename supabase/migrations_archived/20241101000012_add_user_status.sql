-- Add status column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deactivated'));

-- Update RLS policy to prevent banned/deactivated users from accessing content
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create admin function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT status = 'active' FROM profiles WHERE id = user_id), false);
$$ LANGUAGE SQL SECURITY DEFINER;
