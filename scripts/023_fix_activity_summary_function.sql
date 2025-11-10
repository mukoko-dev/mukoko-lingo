-- Fix get_user_activity_summary function to use correct column names
-- Issue: phrase_progress table doesn't have updated_at, it has last_practiced_at

DROP FUNCTION IF EXISTS get_user_activity_summary() CASCADE;

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
  IF NOT public.check_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.display_name,
    p.role,
    COALESCE(COUNT(DISTINCT pv.id), 0) as total_views,
    COALESCE(COUNT(DISTINCT b.id), 0) as total_bookmarks,
    COALESCE(COUNT(DISTINCT pp.id), 0) as total_progress,
    -- Use correct column names: last_practiced_at instead of updated_at for phrase_progress
    GREATEST(
      MAX(pv.viewed_at),
      MAX(b.created_at),
      MAX(pp.last_practiced_at),
      MAX(p.updated_at)
    ) as last_active
  FROM profiles p
  LEFT JOIN phrase_views pv ON pv.user_id = p.user_id
  LEFT JOIN bookmarks b ON b.user_id = p.user_id
  LEFT JOIN phrase_progress pp ON pp.user_id = p.user_id
  GROUP BY p.user_id, p.email, p.display_name, p.role
  ORDER BY last_active DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
