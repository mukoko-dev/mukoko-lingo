-- ============================================================================
-- VERIFICATION SCRIPT FOR MIGRATION 027
-- ============================================================================
-- Run this in Supabase SQL Editor to verify migration 027 was applied
-- ============================================================================

-- Check 1: Verify new indexes exist
SELECT
    'Index Check' as test_name,
    COUNT(*) as indexes_found,
    CASE
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_ai_messages_created_at',
    'idx_learning_standards_is_active',
    'idx_study_sessions_user_date',
    'idx_ai_conversations_user_created',
    'idx_moderation_alerts_pending'
);

-- Check 2: Verify phrase_stats_cache table exists
SELECT
    'Table Check' as test_name,
    COUNT(*) as tables_found,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'phrase_stats_cache';

-- Check 3: Verify utility functions exist
SELECT
    'Function Check' as test_name,
    COUNT(*) as functions_found,
    CASE
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('update_phrase_stats', 'refresh_all_phrase_stats');

-- Check 4: Verify RLS policy updated
SELECT
    'RLS Policy Check' as test_name,
    COUNT(*) as policies_found,
    CASE
        WHEN COUNT(*) >= 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'moderation_alerts'
AND policyname = 'Authenticated users can create moderation alerts';

-- Check 5: Verify constraints
SELECT
    'Constraint Check' as test_name,
    COUNT(*) as constraints_found,
    CASE
        WHEN COUNT(*) >= 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'moderation_alerts'
AND constraint_name = 'moderation_alerts_status_check';

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
    '=== MIGRATION 027 VERIFICATION COMPLETE ===' as summary;

SELECT
    CASE
        WHEN (
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname IN (
                'idx_ai_messages_created_at',
                'idx_learning_standards_is_active',
                'idx_study_sessions_user_date',
                'idx_ai_conversations_user_created',
                'idx_moderation_alerts_pending'
            )
        ) >= 5
        AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'phrase_stats_cache'
        )
        AND (
            SELECT COUNT(*) FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname IN ('update_phrase_stats', 'refresh_all_phrase_stats')
        ) >= 2
        THEN '✅ ALL CHECKS PASSED - Migration 027 applied successfully!'
        ELSE '⚠️ SOME CHECKS FAILED - Review results above'
    END as overall_status;
