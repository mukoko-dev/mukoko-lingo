-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update RLS policies to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile or admins can view all"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant admin privileges to manage phrases
CREATE POLICY "Admins can insert phrases"
  ON phrases FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update phrases"
  ON phrases FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete phrases"
  ON phrases FOR DELETE
  USING (public.is_admin());

-- Allow admins to update user roles
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create a view for admin statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM phrases) as total_phrases,
  (SELECT COUNT(*) FROM phrase_progress) as total_progress_records,
  (SELECT COUNT(*) FROM bookmarks) as total_bookmarks,
  (SELECT COUNT(*) FROM phrase_views) as total_views;

-- Grant access to admin stats view
GRANT SELECT ON admin_stats TO authenticated;

-- Create function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  total_views BIGINT,
  total_bookmarks BIGINT,
  total_progress BIGINT,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.role,
    COALESCE(COUNT(DISTINCT pv.id), 0) as total_views,
    COALESCE(COUNT(DISTINCT b.id), 0) as total_bookmarks,
    COALESCE(COUNT(DISTINCT pp.id), 0) as total_progress,
    GREATEST(
      MAX(pv.viewed_at),
      MAX(b.created_at),
      MAX(pp.updated_at)
    ) as last_active
  FROM profiles p
  LEFT JOIN phrase_views pv ON pv.user_id = p.id
  LEFT JOIN bookmarks b ON b.user_id = p.id
  LEFT JOIN phrase_progress pp ON pp.user_id = p.id
  GROUP BY p.id, p.email, p.display_name, p.role
  ORDER BY last_active DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
