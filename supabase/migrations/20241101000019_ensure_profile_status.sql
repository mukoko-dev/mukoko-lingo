-- Ensure the status column exists with a default value
ALTER TABLE profiles 
ALTER COLUMN status SET DEFAULT 'active';

-- Update any NULL status values to 'active'
UPDATE profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Verify RLS policies are correctly set
-- Drop and recreate the update policy to ensure it works
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure users can select their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

CREATE POLICY "profiles_select_own" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Ensure users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_insert_own" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
