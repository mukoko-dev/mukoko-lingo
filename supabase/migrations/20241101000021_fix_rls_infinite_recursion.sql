-- Fix infinite recursion in profiles RLS policies
-- The issue: policies were querying profiles table while evaluating policies on profiles itself
-- Solution: Use a separate function that uses SECURITY DEFINER to bypass RLS

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create a SECURITY DEFINER function to check admin status without RLS
CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profiles WHERE user_id = check_user_id LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate policies without recursion using direct checks
CREATE POLICY "Users can view their own profile or admins can view all"
  ON profiles FOR SELECT
  USING (
    auth.uid() = user_id OR 
    public.check_is_admin(auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND 
    -- Prevent users from changing their own role
    (role = (SELECT role FROM profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));

-- Update the is_admin function to use the new helper
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verify policies are working
COMMENT ON FUNCTION public.check_is_admin(UUID) IS 'Security definer function to check admin status without RLS recursion';
