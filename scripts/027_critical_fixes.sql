-- ============================================================================
-- NYUCHI LINGO - CRITICAL DATABASE FIXES
-- ============================================================================
-- Purpose: Fix critical schema issues identified in database review
-- Date: 2025-11-10
-- Run this AFTER all existing migrations have been applied
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX FOREIGN KEY REFERENCES
-- ============================================================================
-- The issue: Migration 020 added user_id column to profiles, but it should
-- have been used consistently. Instead, we have a mix of references to
-- profiles(id) and profiles(user_id). The correct column is profiles(id)
-- which references auth.users(id).

-- Drop broken foreign keys in AI tables
ALTER TABLE IF EXISTS ai_generated_phrases
  DROP CONSTRAINT IF EXISTS ai_generated_phrases_user_id_fkey,
  DROP CONSTRAINT IF EXISTS ai_generated_phrases_approved_by_fkey;

ALTER TABLE IF EXISTS ai_conversations
  DROP CONSTRAINT IF EXISTS ai_conversations_user_id_fkey;

ALTER TABLE IF EXISTS ai_recommendations
  DROP CONSTRAINT IF EXISTS ai_recommendations_user_id_fkey;

ALTER TABLE IF EXISTS daily_user_stats
  DROP CONSTRAINT IF EXISTS daily_user_stats_user_id_fkey;

-- Recreate with correct references to profiles(id) which references auth.users(id)
-- But first, we need to understand the data model:
-- profiles.id = UUID (references auth.users.id)
-- profiles.user_id = UUID (added later, duplicates id - should be removed)

-- For now, update AI tables to reference auth.users(id) directly
ALTER TABLE IF EXISTS ai_generated_phrases
  ADD CONSTRAINT ai_generated_phrases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS ai_generated_phrases
  ADD CONSTRAINT ai_generated_phrases_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS ai_conversations
  ADD CONSTRAINT ai_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS ai_recommendations
  ADD CONSTRAINT ai_recommendations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS daily_user_stats
  ADD CONSTRAINT daily_user_stats_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. FIX PHRASE_STATS_CACHE TYPE MISMATCH
-- ============================================================================
-- The issue: phrases.id is UUID but phrase_stats_cache.phrase_id is INT

-- Drop and recreate with correct type
DROP TABLE IF EXISTS phrase_stats_cache;

CREATE TABLE phrase_stats_cache (
    phrase_id UUID PRIMARY KEY REFERENCES phrases(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    progress_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_phrase_stats_cache_last_updated
ON phrase_stats_cache(last_updated);

-- ============================================================================
-- 3. FIX USER_ACTIVITY_SUMMARY MATERIALIZED VIEW
-- ============================================================================
-- The issue: References user_progress table but actual table is phrase_progress

DROP MATERIALIZED VIEW IF EXISTS user_activity_summary;

CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT
    p.id AS user_id,
    p.email,
    p.display_name,
    p.role,
    p.status,
    COALESCE(COUNT(DISTINCT pv.id), 0) AS total_views,
    COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookmarks,
    COALESCE(COUNT(DISTINCT pp.id), 0) AS total_progress,
    MAX(p.last_active) AS last_active,
    p.study_streak,
    p.created_at
FROM profiles p
LEFT JOIN phrase_views pv ON p.id = pv.user_id
LEFT JOIN bookmarks b ON p.id = b.user_id
LEFT JOIN phrase_progress pp ON p.id = pp.user_id
WHERE p.deleted_at IS NULL OR p.deleted_at IS NULL
GROUP BY p.id, p.email, p.display_name, p.role, p.status, p.study_streak, p.created_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_summary_user_id
ON user_activity_summary(user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_user_activity_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ADD MISSING INDEXES FOR SCALE
-- ============================================================================

-- AI messages - for conversation history queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at
ON ai_messages(created_at DESC);

-- Learning standards - frequently filtered by is_active
CREATE INDEX IF NOT EXISTS idx_learning_standards_is_active
ON learning_standards(is_active) WHERE is_active = true;

-- Profiles - composite index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_status_deleted
ON profiles(status, deleted_at) WHERE deleted_at IS NULL;

-- Study sessions - for analytics
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
ON study_sessions(user_id, session_date DESC);

-- AI conversations - for user history
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created
ON ai_conversations(user_id, created_at DESC);

-- Moderation alerts - for review queue
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_pending
ON moderation_alerts(status, created_at DESC) WHERE status = 'pending';

-- ============================================================================
-- 5. TIGHTEN RLS POLICIES
-- ============================================================================

-- Fix overly permissive moderation_alerts insert policy
DROP POLICY IF EXISTS "Users can create moderation alerts" ON moderation_alerts;

-- Only allow inserts from authenticated users (prevent spam)
CREATE POLICY "Authenticated users can create moderation alerts"
ON moderation_alerts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================================================
-- 6. ADD MISSING NOT NULL CONSTRAINTS
-- ============================================================================

-- Profiles - email should never be null
UPDATE profiles SET email = 'unknown@nyuchi.com' WHERE email IS NULL;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Moderation alerts - status should never be null
UPDATE moderation_alerts SET status = 'pending' WHERE status IS NULL;
ALTER TABLE moderation_alerts ALTER COLUMN status SET NOT NULL;

-- Add CHECK constraint for status values
ALTER TABLE moderation_alerts
DROP CONSTRAINT IF EXISTS moderation_alerts_status_check;

ALTER TABLE moderation_alerts
ADD CONSTRAINT moderation_alerts_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'resolved'));

-- ============================================================================
-- 7. ADD HELPFUL FUNCTIONS
-- ============================================================================

-- Function to update phrase stats cache
CREATE OR REPLACE FUNCTION update_phrase_stats(p_phrase_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO phrase_stats_cache (phrase_id, view_count, bookmark_count, progress_count, last_updated)
    SELECT
        p_phrase_id,
        COALESCE(COUNT(DISTINCT pv.id), 0),
        COALESCE(COUNT(DISTINCT b.id), 0),
        COALESCE(COUNT(DISTINCT pp.id), 0),
        NOW()
    FROM phrases p
    LEFT JOIN phrase_views pv ON p.id = pv.phrase_id
    LEFT JOIN bookmarks b ON p.id = b.phrase_id
    LEFT JOIN phrase_progress pp ON p.id = pp.phrase_id
    WHERE p.id = p_phrase_id
    GROUP BY p.id
    ON CONFLICT (phrase_id) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        bookmark_count = EXCLUDED.bookmark_count,
        progress_count = EXCLUDED.progress_count,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all phrase stats
CREATE OR REPLACE FUNCTION refresh_all_phrase_stats()
RETURNS VOID AS $$
BEGIN
    TRUNCATE phrase_stats_cache;

    INSERT INTO phrase_stats_cache (phrase_id, view_count, bookmark_count, progress_count, last_updated)
    SELECT
        p.id,
        COALESCE(COUNT(DISTINCT pv.id), 0),
        COALESCE(COUNT(DISTINCT b.id), 0),
        COALESCE(COUNT(DISTINCT pp.id), 0),
        NOW()
    FROM phrases p
    LEFT JOIN phrase_views pv ON p.id = pv.phrase_id
    LEFT JOIN bookmarks b ON p.id = b.phrase_id
    LEFT JOIN phrase_progress pp ON p.id = pp.phrase_id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CLEANUP DUPLICATE user_id COLUMN FROM PROFILES
-- ============================================================================
-- This column was added in migration 020 but creates confusion
-- The primary identifier should be profiles.id which references auth.users.id

-- First, ensure all data is in sync
UPDATE profiles SET user_id = id WHERE user_id IS NULL OR user_id != id;

-- Note: We're keeping user_id for now to avoid breaking existing queries
-- But all NEW code should use profiles.id instead
-- In a future migration, we can safely remove user_id after updating all queries

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check for orphaned records
DO $$
DECLARE
    orphaned_count INT;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM ai_generated_phrases
    WHERE user_id NOT IN (SELECT id FROM auth.users);

    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned records in ai_generated_phrases', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned records in ai_generated_phrases ✓';
    END IF;
END $$;

-- Verify materialized view works
DO $$
BEGIN
    PERFORM refresh_user_activity_summary();
    RAISE NOTICE 'Materialized view refreshed successfully ✓';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Materialized view refresh failed: %', SQLERRM;
END $$;

-- Verify phrase stats cache works
DO $$
DECLARE
    test_phrase_id UUID;
BEGIN
    SELECT id INTO test_phrase_id FROM phrases LIMIT 1;
    IF test_phrase_id IS NOT NULL THEN
        PERFORM update_phrase_stats(test_phrase_id);
        RAISE NOTICE 'Phrase stats cache working ✓';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Phrase stats cache failed: %', SQLERRM;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================
-- Run these commands after this migration completes:
--
-- 1. Refresh materialized view:
--    SELECT refresh_user_activity_summary();
--
-- 2. Populate phrase stats cache:
--    SELECT refresh_all_phrase_stats();
--
-- 3. Monitor for slow queries:
--    Check scripts/DATABASE_SCHEMA_REVIEW.md for monitoring queries
--
-- ============================================================================
