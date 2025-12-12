-- Migration: Add user status field and prepare for partitioning
-- Created: 2025-11-10
-- Purpose: Add status tracking and set up for horizontal scaling

-- ============================================================================
-- ADD USER STATUS FIELD
-- ============================================================================

-- Add status column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Create status constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'profiles' AND constraint_name = 'profiles_status_check'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_status_check
        CHECK (status IN ('active', 'inactive', 'banned', 'pending'));
    END IF;
END $$;

-- Set default status for existing users
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status
ON profiles(status);

-- ============================================================================
-- ADD SOFT DELETE SUPPORT
-- ============================================================================

-- Add deleted_at column for soft deletes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Index on deleted_at for filtering out deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- ADD MODERATION METADATA
-- ============================================================================

-- Add resolved_at and resolved_by to moderation_alerts if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'moderation_alerts' AND column_name = 'resolved_at'
    ) THEN
        ALTER TABLE moderation_alerts ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'moderation_alerts' AND column_name = 'resolved_by'
    ) THEN
        ALTER TABLE moderation_alerts ADD COLUMN resolved_by UUID REFERENCES profiles(user_id);
    END IF;
END $$;

-- ============================================================================
-- ANALYTICS SUPPORT - ADD AGGREGATED STATS TABLE
-- ============================================================================

-- Create daily user statistics table for fast analytics
CREATE TABLE IF NOT EXISTS daily_user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_bookmarks INTEGER DEFAULT 0,
    total_progress INTEGER DEFAULT 0,
    unique_phrases_viewed INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indexes for daily stats
CREATE INDEX IF NOT EXISTS idx_daily_user_stats_user_id
ON daily_user_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_user_stats_date
ON daily_user_stats(date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_user_stats_user_date
ON daily_user_stats(user_id, date DESC);

-- ============================================================================
-- PHRASE POPULARITY CACHE
-- ============================================================================

-- Create phrase statistics cache for performance
CREATE TABLE IF NOT EXISTS phrase_stats_cache (
    phrase_id INTEGER PRIMARY KEY REFERENCES phrases(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    progress_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for phrase stats
CREATE INDEX IF NOT EXISTS idx_phrase_stats_view_count
ON phrase_stats_cache(view_count DESC);

CREATE INDEX IF NOT EXISTS idx_phrase_stats_bookmark_count
ON phrase_stats_cache(bookmark_count DESC);

-- ============================================================================
-- USER ACTIVITY SUMMARY VIEW (MATERIALIZED)
-- ============================================================================

-- Create materialized view for user activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.role,
    p.status,
    p.created_at,
    p.last_active,
    COALESCE(COUNT(DISTINCT pv.id), 0) AS total_views,
    COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookmarks,
    COALESCE(COUNT(DISTINCT up.id), 0) AS total_progress
FROM profiles p
LEFT JOIN phrase_views pv ON p.user_id = pv.user_id
LEFT JOIN bookmarks b ON p.user_id = b.user_id
LEFT JOIN user_progress up ON p.user_id = up.user_id
WHERE p.deleted_at IS NULL
GROUP BY p.user_id, p.email, p.display_name, p.role, p.status, p.created_at, p.last_active;

-- Indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_summary_user_id
ON user_activity_summary(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_summary_last_active
ON user_activity_summary(last_active DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_user_activity_summary_role
ON user_activity_summary(role);

-- ============================================================================
-- REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh user activity summary
CREATE OR REPLACE FUNCTION refresh_user_activity_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to update phrase stats cache
CREATE OR REPLACE FUNCTION update_phrase_stats(p_phrase_id INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO phrase_stats_cache (phrase_id, view_count, bookmark_count, progress_count, last_updated)
    VALUES (
        p_phrase_id,
        (SELECT COUNT(*) FROM phrase_views WHERE phrase_id = p_phrase_id),
        (SELECT COUNT(*) FROM bookmarks WHERE phrase_id = p_phrase_id),
        (SELECT COUNT(*) FROM user_progress WHERE phrase_id = p_phrase_id),
        NOW()
    )
    ON CONFLICT (phrase_id) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        bookmark_count = EXCLUDED.bookmark_count,
        progress_count = EXCLUDED.progress_count,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED REFRESH (via pg_cron or external scheduler)
-- ============================================================================

-- Note: Actual scheduling should be done via pg_cron extension or external cron
-- Example pg_cron command (run this separately if pg_cron is enabled):
-- SELECT cron.schedule('refresh-user-stats', '0 */6 * * *', 'SELECT refresh_user_activity_summary()');

-- ============================================================================
-- PARTITIONING PREPARATION (for future scale)
-- ============================================================================

-- Create partitioned table for phrase_views (by month)
-- This is a template for when you need to partition historical data

-- Future: Convert phrase_views to partitioned table
-- CREATE TABLE phrase_views_partitioned (
--     LIKE phrase_views INCLUDING ALL
-- ) PARTITION BY RANGE (viewed_at);

-- Create partitions for each month
-- CREATE TABLE phrase_views_2025_11 PARTITION OF phrase_views_partitioned
--     FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE daily_user_stats IS 'Aggregated daily statistics per user for fast analytics';
COMMENT ON TABLE phrase_stats_cache IS 'Cached phrase popularity metrics for performance';
COMMENT ON MATERIALIZED VIEW user_activity_summary IS 'Pre-computed user activity for admin dashboard (refresh every 6 hours)';

COMMENT ON COLUMN profiles.status IS 'User account status: active, inactive, banned, pending';
COMMENT ON COLUMN profiles.deleted_at IS 'Soft delete timestamp (NULL = not deleted)';
