-- Migration 001: Security Fixes (Consolidated)
-- Fixes all Supabase Linter ERRORS and WARNINGS
-- This migration is idempotent - safe to run multiple times
--
-- Fixes:
-- - ERROR: security_definer_view on admin_stats (replaced with secure function)
-- - ERROR: rls_disabled_in_public on phrase_stats_cache
-- - WARNINGS: 20+ functions with mutable search_path

-- ============================================
-- CRITICAL FIXES (ERRORS)
-- ============================================

-- 1. Fix SECURITY DEFINER view - replace with a secure function
-- Views with SECURITY DEFINER bypass RLS, which is a security risk
DROP VIEW IF EXISTS public.admin_stats;
DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
  total_users BIGINT,
  admin_count BIGINT,
  total_phrases BIGINT,
  total_conversations BIGINT,
  pending_alerts BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return stats if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.profiles),
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE role = 'admin'),
    (SELECT COUNT(*)::BIGINT FROM public.phrases),
    (SELECT COUNT(*)::BIGINT FROM public.ai_conversations),
    (SELECT COUNT(*)::BIGINT FROM public.moderation_alerts WHERE status = 'pending');
END;
$$;

-- Grant execute to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- 2. Enable RLS on phrase_stats_cache table
ALTER TABLE public.phrase_stats_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phrase_stats_cache (read-only for all authenticated)
DROP POLICY IF EXISTS "Anyone can read phrase stats" ON public.phrase_stats_cache;
CREATE POLICY "Anyone can read phrase stats"
  ON public.phrase_stats_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (for background jobs)
DROP POLICY IF EXISTS "Service role can modify phrase stats" ON public.phrase_stats_cache;
CREATE POLICY "Service role can modify phrase stats"
  ON public.phrase_stats_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- WARNINGS FIXES (Function search_path)
-- All functions updated with SET search_path = public
-- DROP statements ensure clean replacement even if return types differ
-- ============================================

-- 3. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. get_learning_standard
DROP FUNCTION IF EXISTS public.get_learning_standard(TEXT);
CREATE OR REPLACE FUNCTION public.get_learning_standard(p_proficiency_level TEXT)
RETURNS TABLE(
  id UUID,
  proficiency_level TEXT,
  vocabulary_complexity TEXT,
  grammar_complexity TEXT,
  explanation_depth TEXT,
  ai_instructions TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id,
    ls.proficiency_level,
    ls.vocabulary_complexity,
    ls.grammar_complexity,
    ls.explanation_depth,
    ls.ai_instructions
  FROM public.learning_standards ls
  WHERE ls.proficiency_level = p_proficiency_level
  LIMIT 1;
END;
$$;

-- 5. get_popular_phrases
DROP FUNCTION IF EXISTS public.get_popular_phrases(INT);
CREATE OR REPLACE FUNCTION public.get_popular_phrases(limit_count INT DEFAULT 10)
RETURNS TABLE(
  phrase_id UUID,
  total_views BIGINT,
  total_bookmarks BIGINT,
  total_likes BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psc.phrase_id,
    psc.total_views,
    psc.total_bookmarks,
    psc.total_likes
  FROM public.phrase_stats_cache psc
  ORDER BY (psc.total_views + psc.total_bookmarks * 2 + psc.total_likes * 3) DESC
  LIMIT limit_count;
END;
$$;

-- 6. get_user_learning_stats
DROP FUNCTION IF EXISTS public.get_user_learning_stats(UUID);
CREATE OR REPLACE FUNCTION public.get_user_learning_stats(p_user_id UUID)
RETURNS TABLE(
  phrases_learned BIGINT,
  phrases_mastered BIGINT,
  total_bookmarks BIGINT,
  study_streak INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.phrase_progress WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM public.phrase_progress WHERE user_id = p_user_id AND status = 'mastered'),
    (SELECT COUNT(*) FROM public.bookmarks WHERE user_id = p_user_id),
    COALESCE((SELECT p.study_streak FROM public.profiles p WHERE p.id = p_user_id), 0);
END;
$$;

-- 7. update_study_streak
CREATE OR REPLACE FUNCTION public.update_study_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_session_date DATE;
  current_streak INT;
BEGIN
  SELECT
    COALESCE(MAX(ss.date)::DATE, CURRENT_DATE - INTERVAL '2 days'),
    COALESCE(p.study_streak, 0)
  INTO last_session_date, current_streak
  FROM public.profiles p
  LEFT JOIN public.study_sessions ss ON ss.user_id = p.id
  WHERE p.id = NEW.user_id
  GROUP BY p.study_streak;

  IF last_session_date = CURRENT_DATE - INTERVAL '1 day' THEN
    current_streak := current_streak + 1;
  ELSIF last_session_date < CURRENT_DATE - INTERVAL '1 day' THEN
    current_streak := 1;
  END IF;

  UPDATE public.profiles
  SET study_streak = current_streak, updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- 8. is_user_active
DROP FUNCTION IF EXISTS public.is_user_active(UUID);
CREATE OR REPLACE FUNCTION public.is_user_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_status TEXT;
BEGIN
  SELECT status INTO user_status
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN user_status = 'active' OR user_status IS NULL;
END;
$$;

-- 9. check_is_admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 10. is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 11. update_phrase_stats
CREATE OR REPLACE FUNCTION public.update_phrase_stats(p_phrase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.phrase_stats_cache (phrase_id, total_views, total_bookmarks, total_likes, updated_at)
  VALUES (
    p_phrase_id,
    (SELECT COUNT(*) FROM public.phrase_views WHERE phrase_id = p_phrase_id),
    (SELECT COUNT(*) FROM public.bookmarks WHERE phrase_id = p_phrase_id),
    (SELECT COUNT(*) FROM public.phrase_likes WHERE phrase_id = p_phrase_id),
    NOW()
  )
  ON CONFLICT (phrase_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_bookmarks = EXCLUDED.total_bookmarks,
    total_likes = EXCLUDED.total_likes,
    updated_at = NOW();
END;
$$;

-- 12. refresh_all_phrase_stats
CREATE OR REPLACE FUNCTION public.refresh_all_phrase_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.phrase_stats_cache (phrase_id, total_views, total_bookmarks, total_likes, updated_at)
  SELECT
    p.id,
    COALESCE((SELECT COUNT(*) FROM public.phrase_views pv WHERE pv.phrase_id = p.id), 0),
    COALESCE((SELECT COUNT(*) FROM public.bookmarks b WHERE b.phrase_id = p.id), 0),
    COALESCE((SELECT COUNT(*) FROM public.phrase_likes pl WHERE pl.phrase_id = p.id), 0),
    NOW()
  FROM public.phrases p
  ON CONFLICT (phrase_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_bookmarks = EXCLUDED.total_bookmarks,
    total_likes = EXCLUDED.total_likes,
    updated_at = NOW();
END;
$$;

-- 13. update_learning_standards_updated_at
CREATE OR REPLACE FUNCTION public.update_learning_standards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 14. handle_profile_role_change
CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.activity_logs (user_id, action, details, created_at)
    VALUES (
      NEW.id,
      'role_change',
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 15. get_user_activity_summary
DROP FUNCTION IF EXISTS public.get_user_activity_summary(UUID);
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id UUID)
RETURNS TABLE(
  total_sessions BIGINT,
  total_phrases_practiced BIGINT,
  total_minutes BIGINT,
  last_active TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    SUM(COALESCE(phrases_practiced, 0))::BIGINT,
    SUM(COALESCE(duration_minutes, 0))::BIGINT,
    MAX(created_at)
  FROM public.study_sessions
  WHERE user_id = p_user_id;
END;
$$;

-- 16-18. Engagement update functions
CREATE OR REPLACE FUNCTION public.update_phrase_engagement_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_phrase_stats(NEW.phrase_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_phrase_stats(OLD.phrase_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_phrase_engagement_on_bookmark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_phrase_stats(NEW.phrase_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_phrase_stats(OLD.phrase_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_phrase_engagement_on_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_phrase_stats(NEW.phrase_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 19. get_most_liked_phrases
DROP FUNCTION IF EXISTS public.get_most_liked_phrases(INT);
CREATE OR REPLACE FUNCTION public.get_most_liked_phrases(limit_count INT DEFAULT 10)
RETURNS TABLE(
  phrase_id UUID,
  like_count BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psc.phrase_id,
    psc.total_likes
  FROM public.phrase_stats_cache psc
  WHERE psc.total_likes > 0
  ORDER BY psc.total_likes DESC
  LIMIT limit_count;
END;
$$;

-- 20. get_trending_phrases
DROP FUNCTION IF EXISTS public.get_trending_phrases(INT);
CREATE OR REPLACE FUNCTION public.get_trending_phrases(limit_count INT DEFAULT 10)
RETURNS TABLE(
  phrase_id UUID,
  engagement_score BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psc.phrase_id,
    (psc.total_views + psc.total_bookmarks * 2 + psc.total_likes * 3)::BIGINT AS engagement_score
  FROM public.phrase_stats_cache psc
  WHERE psc.updated_at > NOW() - INTERVAL '7 days'
  ORDER BY engagement_score DESC
  LIMIT limit_count;
END;
$$;

-- 21. update_guardrails_updated_at
CREATE OR REPLACE FUNCTION public.update_guardrails_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 22. log_guardrails_changes
CREATE OR REPLACE FUNCTION public.log_guardrails_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, details, created_at)
  VALUES (
    auth.uid(),
    'guardrails_change',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    ),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================
-- NOTE: Leaked Password Protection
-- ============================================
-- To enable leaked password protection:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication > Providers > Email
-- 3. Enable "Leaked Password Protection" toggle
-- This cannot be done via SQL migration
