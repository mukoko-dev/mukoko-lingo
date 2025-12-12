-- Migration: Add indexes for million-user scale performance
-- Created: 2025-11-10
-- Purpose: Optimize database queries for large-scale operations

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Index on email for fast user lookups during login/search
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- Index on role for admin filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

-- Index on created_at for user registration analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at DESC);

-- Index on last_active for activity filtering
CREATE INDEX IF NOT EXISTS idx_profiles_last_active
ON profiles(last_active DESC NULLS LAST);

-- Composite index for admin user management queries (role + last_active)
CREATE INDEX IF NOT EXISTS idx_profiles_role_last_active
ON profiles(role, last_active DESC);

-- ============================================================================
-- PHRASES TABLE INDEXES
-- ============================================================================

-- Index on category for phrase browsing
CREATE INDEX IF NOT EXISTS idx_phrases_category
ON phrases(category);

-- Index on created_at for recent phrases
CREATE INDEX IF NOT EXISTS idx_phrases_created_at
ON phrases(created_at DESC);

-- Full-text search index on English phrases
CREATE INDEX IF NOT EXISTS idx_phrases_english_search
ON phrases USING gin(to_tsvector('english', english));

-- Full-text search index on Shona phrases
CREATE INDEX IF NOT EXISTS idx_phrases_shona_search
ON phrases USING gin(to_tsvector('simple', shona));

-- ============================================================================
-- USER PROGRESS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user progress lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
ON user_progress(user_id);

-- Index on phrase_id for phrase statistics
CREATE INDEX IF NOT EXISTS idx_user_progress_phrase_id
ON user_progress(phrase_id);

-- Composite index for user progress queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_phrase
ON user_progress(user_id, phrase_id);

-- Index on updated_at for recent progress
CREATE INDEX IF NOT EXISTS idx_user_progress_updated_at
ON user_progress(updated_at DESC);

-- ============================================================================
-- BOOKMARKS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id
ON bookmarks(user_id);

-- Index on phrase_id for phrase popularity
CREATE INDEX IF NOT EXISTS idx_bookmarks_phrase_id
ON bookmarks(phrase_id);

-- Composite index for bookmark existence checks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_phrase
ON bookmarks(user_id, phrase_id);

-- Index on created_at for recent bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
ON bookmarks(created_at DESC);

-- ============================================================================
-- PHRASE VIEWS TABLE INDEXES
-- ============================================================================

-- Index on user_id for user activity
CREATE INDEX IF NOT EXISTS idx_phrase_views_user_id
ON phrase_views(user_id);

-- Index on phrase_id for phrase analytics
CREATE INDEX IF NOT EXISTS idx_phrase_views_phrase_id
ON phrase_views(phrase_id);

-- Index on viewed_at for recent activity
CREATE INDEX IF NOT EXISTS idx_phrase_views_viewed_at
ON phrase_views(viewed_at DESC);

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_phrase_views_user_viewed
ON phrase_views(user_id, viewed_at DESC);

-- ============================================================================
-- MODERATION ALERTS TABLE INDEXES
-- ============================================================================

-- Index on status for pending alerts filtering
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status
ON moderation_alerts(status);

-- Index on severity for priority sorting
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_severity
ON moderation_alerts(severity);

-- Index on created_at for chronological sorting
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_created_at
ON moderation_alerts(created_at DESC);

-- Composite index for moderation queue queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_status_created
ON moderation_alerts(status, created_at DESC);

-- Index on user_id for user-specific moderation
CREATE INDEX IF NOT EXISTS idx_moderation_alerts_user_id
ON moderation_alerts(user_id);

-- ============================================================================
-- LEARNING STANDARDS TABLE INDEXES
-- ============================================================================

-- Index on level for standard filtering
CREATE INDEX IF NOT EXISTS idx_learning_standards_level
ON learning_standards(level);

-- Index on level_order for proper ordering
CREATE INDEX IF NOT EXISTS idx_learning_standards_level_order
ON learning_standards(level_order);

-- Index on is_active for active standards
CREATE INDEX IF NOT EXISTS idx_learning_standards_is_active
ON learning_standards(is_active);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_profiles_email IS 'Fast lookup for login and user search';
COMMENT ON INDEX idx_profiles_role IS 'Filter users by role (admin/user)';
COMMENT ON INDEX idx_profiles_last_active IS 'Sort users by last activity for engagement tracking';

COMMENT ON INDEX idx_phrases_category IS 'Filter phrases by category for browsing';
COMMENT ON INDEX idx_phrases_english_search IS 'Full-text search on English phrases';

COMMENT ON INDEX idx_user_progress_user_phrase IS 'Unique lookup for user-specific phrase progress';
COMMENT ON INDEX idx_bookmarks_user_phrase IS 'Fast check if user bookmarked a phrase';

COMMENT ON INDEX idx_phrase_views_viewed_at IS 'Sort views chronologically for activity log';
COMMENT ON INDEX idx_moderation_alerts_status_created IS 'Efficient moderation queue queries';
