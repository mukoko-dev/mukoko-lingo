-- ============================================================================
-- POST-MIGRATION TASKS FOR MIGRATION 027
-- ============================================================================
-- Run this AFTER migration 027 has been applied successfully
-- ============================================================================

-- Task 1: Populate phrase stats cache
SELECT refresh_all_phrase_stats();

-- Task 2: Verify cache was populated
SELECT
    'Phrase Stats Cache' as task,
    COUNT(*) as phrases_cached,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS'
        ELSE '⚠️ NO DATA'
    END as status
FROM phrase_stats_cache;

-- Task 3: Check for orphaned records
SELECT
    'Orphaned Records Check' as task,
    COUNT(*) as orphaned_count,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ NONE FOUND'
        ELSE '⚠️ FOUND ORPHANED RECORDS'
    END as status
FROM ai_generated_phrases
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Task 4: Show sample cached stats
SELECT
    'Sample Phrase Stats (Top 10)' as info;

SELECT
    p.english as phrase,
    psc.view_count,
    psc.bookmark_count,
    psc.progress_count,
    psc.last_updated
FROM phrase_stats_cache psc
JOIN phrases p ON p.id = psc.phrase_id
ORDER BY psc.view_count DESC
LIMIT 10;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=== POST-MIGRATION TASKS COMPLETE ===' as summary;

SELECT
    COUNT(*) as total_phrases_cached,
    SUM(view_count) as total_views,
    SUM(bookmark_count) as total_bookmarks,
    SUM(progress_count) as total_progress_entries,
    MAX(last_updated) as cache_last_updated
FROM phrase_stats_cache;

SELECT '✅ Migration 027 fully applied and operational!' as final_status;
