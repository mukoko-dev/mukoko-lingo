-- Ensure all admin checks use check_is_admin() consistently
-- This script updates all RLS policies and functions to use the secure check_is_admin() function

-- First ensure check_is_admin exists
CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profiles WHERE id = check_user_id LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Ensure is_admin wrapper exists (calls check_is_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update phrases table policies to use check_is_admin
DROP POLICY IF EXISTS "Admins can insert phrases" ON phrases;
DROP POLICY IF EXISTS "Admins can update phrases" ON phrases;
DROP POLICY IF EXISTS "Admins can delete phrases" ON phrases;

CREATE POLICY "Admins can insert phrases"
  ON phrases FOR INSERT
  WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update phrases"
  ON phrases FOR UPDATE
  USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can delete phrases"
  ON phrases FOR DELETE
  USING (public.check_is_admin(auth.uid()));

-- Update AI tables policies
DROP POLICY IF EXISTS "Admins can view all AI phrases" ON ai_generated_phrases;
DROP POLICY IF EXISTS "Admins can view all conversations" ON ai_conversations;

CREATE POLICY "Admins can view all AI phrases" 
  ON ai_generated_phrases FOR SELECT
  USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can view all conversations" 
  ON ai_conversations FOR SELECT
  USING (public.check_is_admin(auth.uid()));

-- Update moderation_alerts policies
DROP POLICY IF EXISTS "Admins can view all moderation alerts" ON moderation_alerts;
DROP POLICY IF EXISTS "Admins can update moderation alerts" ON moderation_alerts;

CREATE POLICY "Admins can view all moderation alerts"
  ON moderation_alerts FOR SELECT
  USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can update moderation alerts"
  ON moderation_alerts FOR UPDATE
  USING (public.check_is_admin(auth.uid()));

-- Drop handle_profile_role_change with CASCADE before recreating
DROP FUNCTION IF EXISTS public.handle_profile_role_change() CASCADE;

-- Update the handle_profile_role_change function to use check_is_admin
CREATE FUNCTION public.handle_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only admins can change roles
  IF NOT public.check_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS check_role_change ON profiles;
CREATE TRIGGER check_role_change
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION handle_profile_role_change();

-- Drop get_user_activity_summary with CASCADE before recreating
DROP FUNCTION IF EXISTS public.get_user_activity_summary() CASCADE;

-- Update get_user_activity_summary to use correct column names and check_is_admin
CREATE FUNCTION public.get_user_activity_summary()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_phrases_viewed BIGINT,
  avg_daily_goal NUMERIC,
  last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Only admins can access this
  IF NOT public.check_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id)::BIGINT as total_users,
    COUNT(DISTINCT CASE WHEN p.last_study_date >= CURRENT_DATE - INTERVAL '7 days' THEN p.id END)::BIGINT as active_users,
    COALESCE(SUM(pv.view_count), 0)::BIGINT as total_phrases_viewed,
    COALESCE(AVG(p.daily_goal), 0)::NUMERIC as avg_daily_goal,
    MAX(GREATEST(p.updated_at, COALESCE(pv.last_viewed_at, p.created_at))) as last_active
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as view_count, MAX(viewed_at) as last_viewed_at
    FROM phrase_views
    GROUP BY user_id
  ) pv ON p.id = pv.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_is_admin(UUID) IS 'Security definer function to check admin status without RLS recursion';
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user is admin (wrapper for check_is_admin)';
COMMENT ON FUNCTION public.get_user_activity_summary() IS 'Get activity summary for admin dashboard - admin only';
