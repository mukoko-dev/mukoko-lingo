-- ============================================================================
-- NYUCHI LINGO - SECURITY AND CONSISTENCY FIXES
-- ============================================================================
-- Purpose: Fix all high-priority security and database consistency issues
-- Date: 2025-12-12
-- Priority: CRITICAL/HIGH issues from security audit
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX PROFILES TABLE COLUMN NAMING (CRITICAL)
-- ============================================================================
-- Issue: Inconsistent use of 'id' vs 'user_id' across migrations and code
-- Solution: Standardize on 'id' as primary key (matches auth.users.id)

-- First, check current state and add 'id' column if only 'user_id' exists
DO $$
BEGIN
  -- If user_id exists but id doesn't, rename user_id back to id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'id'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN user_id TO id;
    RAISE NOTICE 'Renamed user_id back to id in profiles table';

  -- If both exist, ensure they're in sync and keep id as primary
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'id'
  ) THEN
    -- Sync the values
    UPDATE profiles SET id = user_id WHERE id IS NULL OR id != user_id;
    UPDATE profiles SET user_id = id WHERE user_id IS NULL OR user_id != id;
    RAISE NOTICE 'Synced id and user_id columns in profiles table';
  END IF;
END $$;

-- ============================================================================
-- 2. UPDATE check_is_admin FUNCTION TO USE CORRECT COLUMN
-- ============================================================================
-- This function is used in RLS policies - must handle both column scenarios

CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try to find by id first (preferred), then by user_id for backwards compat
  SELECT role INTO user_role
  FROM profiles
  WHERE id = check_user_id OR user_id = check_user_id
  LIMIT 1;

  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update is_admin() to use the updated check_is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. FIX PROFILES RLS POLICIES (HIGH)
-- ============================================================================
-- Drop existing policies and recreate with consistent column handling

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create clean policies using auth.uid() directly
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    auth.uid() = user_id OR
    public.is_admin()
  );

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() = user_id
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. ADD USER_SKILLS INITIALIZATION TO handle_new_user TRIGGER (HIGH)
-- ============================================================================
-- Issue: New users don't get user_skills entries, breaking AI tutor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    id,
    user_id, -- Keep for backwards compatibility
    email,
    display_name,
    preferred_ui_language,
    learning_goal,
    daily_goal,
    study_streak,
    role,
    status
  )
  VALUES (
    NEW.id,
    NEW.id, -- user_id = id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_ui_language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'learning_goal', 'Learn basic phrases'),
    COALESCE((NEW.raw_user_meta_data->>'daily_goal')::INTEGER, 10),
    0,
    'user',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Initialize user_skills for all active skills (CRITICAL for AI tutor)
  INSERT INTO user_skills (user_id, skill_id, current_level, current_score)
  SELECT NEW.id, s.id, 'beginner', 0
  FROM skills s
  WHERE s.is_active = true
  ON CONFLICT (user_id, skill_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. BACKFILL USER_SKILLS FOR EXISTING USERS (HIGH)
-- ============================================================================
-- Ensure existing users have user_skills entries

INSERT INTO user_skills (user_id, skill_id, current_level, current_score)
SELECT p.id, s.id, 'beginner', 0
FROM profiles p
CROSS JOIN skills s
WHERE s.is_active = true
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- ============================================================================
-- 6. ADD RATE LIMITING INFRASTRUCTURE (HIGH)
-- ============================================================================

-- Create rate limiting table for password resets
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_time
ON password_reset_attempts(email, attempted_at DESC);

-- Auto-cleanup old records (older than 24 hours)
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_cleanup
ON password_reset_attempts(attempted_at);

-- Create rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
ON login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
ON login_attempts(ip_address, attempted_at DESC) WHERE ip_address IS NOT NULL;

-- Function to check password reset rate limit (max 3 per hour)
CREATE OR REPLACE FUNCTION check_password_reset_rate_limit(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM password_reset_attempts
  WHERE LOWER(email) = LOWER(p_email)
    AND attempted_at > NOW() - INTERVAL '1 hour';

  RETURN attempt_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record password reset attempt
CREATE OR REPLACE FUNCTION record_password_reset_attempt(p_email TEXT, p_ip TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO password_reset_attempts (email, ip_address)
  VALUES (LOWER(p_email), p_ip);

  -- Cleanup old records (older than 24 hours)
  DELETE FROM password_reset_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check login rate limit (max 5 failed attempts per 15 minutes)
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  failed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO failed_count
  FROM login_attempts
  WHERE LOWER(email) = LOWER(p_email)
    AND success = false
    AND attempted_at > NOW() - INTERVAL '15 minutes';

  RETURN failed_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(p_email TEXT, p_success BOOLEAN, p_ip TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO login_attempts (email, success, ip_address)
  VALUES (LOWER(p_email), p_success, p_ip);

  -- Cleanup old records (older than 24 hours)
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for rate limiting tables (admin only access)
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view password reset attempts"
  ON password_reset_attempts FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view login attempts"
  ON login_attempts FOR SELECT
  USING (is_admin());

-- ============================================================================
-- 7. ADD ADMIN AUDIT LOGGING (MEDIUM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'phrase', 'standard', etc.
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin
ON admin_audit_log(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
ON admin_audit_log(target_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
ON admin_audit_log(action, created_at DESC);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can log admin actions';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, ip_address)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details, p_ip_address)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================================
-- 8. ADD FUNCTION TO GET USER OVERALL PROFICIENCY (UTILITY)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_overall_proficiency(p_user_id UUID)
RETURNS TABLE (
  overall_score NUMERIC,
  overall_level TEXT,
  skills_count INTEGER,
  weakest_skill TEXT,
  strongest_skill TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH skill_stats AS (
    SELECT
      us.current_score,
      us.current_level,
      s.name as skill_name
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE us.user_id = p_user_id AND s.is_active = true
  )
  SELECT
    ROUND(AVG(current_score)::NUMERIC, 1) as overall_score,
    CASE
      WHEN AVG(current_score) >= 90 THEN 'fluent'
      WHEN AVG(current_score) >= 80 THEN 'advanced'
      WHEN AVG(current_score) >= 65 THEN 'intermediate'
      WHEN AVG(current_score) >= 50 THEN 'elementary'
      ELSE 'beginner'
    END as overall_level,
    COUNT(*)::INTEGER as skills_count,
    (SELECT skill_name FROM skill_stats ORDER BY current_score ASC LIMIT 1) as weakest_skill,
    (SELECT skill_name FROM skill_stats ORDER BY current_score DESC LIMIT 1) as strongest_skill
  FROM skill_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  profile_count INTEGER;
  user_skills_count INTEGER;
  skills_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO skills_count FROM skills WHERE is_active = true;
  SELECT COUNT(DISTINCT user_id) INTO user_skills_count FROM user_skills;

  RAISE NOTICE 'Profiles: %, Active Skills: %, Users with skills: %',
    profile_count, skills_count, user_skills_count;

  IF profile_count > user_skills_count THEN
    RAISE WARNING 'Some profiles may not have user_skills initialized!';
  ELSE
    RAISE NOTICE 'All profiles have user_skills initialized';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 1. All new users will automatically get user_skills initialized
-- 2. Existing users have been backfilled with beginner level skills
-- 3. Rate limiting is now available via check_password_reset_rate_limit()
-- 4. Admin actions should call log_admin_action() for audit trail
-- 5. RLS policies now handle both id and user_id columns safely
-- ============================================================================
