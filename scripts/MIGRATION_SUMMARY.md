# Mukoko Lingo Migration Summary
**Date:** November 10, 2025

## Overview
This document provides a summary of all database migrations and their current status.

---

## Migration Files (In Order)

### Core Schema (001-011)
```
001_create_phrases_table.sql          - Base phrases table
002_seed_phrases.sql                   - Initial phrase data
003_create_profiles_table.sql          - User profiles
004_add_profile_preferences.sql        - User preferences
005_create_bookmarks_table.sql         - Bookmark system
006_create_progress_tracking.sql       - Progress tracking
007_create_analytics_tables.sql        - Analytics tables
008_add_comprehensive_phrases.sql      - More phrases
009_add_user_roles.sql                 - Admin/user roles
010_create_ai_tables.sql               - AI features
011_create_moderation_alerts.sql       - Content moderation
```

### Fixes & Improvements (012-021)
```
012_add_user_status.sql                - User status field
013_fix_profile_updates.sql            - Profile update fixes
014_make_bryan_admin.sql               - Set admin user
015_add_tourism_phrases.sql            - Tourism category
016_fix_profile_column_and_rls.sql     - Profile schema fix
017_fix_auth_and_profiles.sql          - Auth integration
018_fix_tracking_permissions.sql       - RLS policy fixes
019_ensure_profile_status.sql          - Status defaults
020_fix_all_user_id_references.sql     - ID reference cleanup
021_fix_rls_infinite_recursion.sql     - RLS performance fix
```

### Features & Standards (022-024)
```
022_create_learning_standards_fixed.sql - AI proficiency levels
023_fix_activity_summary_function.sql   - Admin dashboard view
024_standardize_admin_checks.sql        - Consistent admin checks
```

### Performance & Scale (025-027)
```
025_add_indexes_for_scale.sql          - Performance indexes
026_add_user_status_and_partitioning.sql - Scale preparation
027_critical_fixes.sql                 - ⚠️ MUST RUN - Critical fixes
```

---

## Critical Issues Fixed

### 1. Migration Numbering
- **Problem:** Duplicate migration numbers (001, 002)
- **Solution:** Renumbered 024-026 migrations to avoid conflicts
- **Status:** ✅ RESOLVED

### 2. Foreign Key References
- **Problem:** AI tables referenced `profiles(user_id)` which created confusion
- **Solution:** Migration 027 fixes all FK references to use auth.users(id)
- **Status:** ⚠️ REQUIRES MIGRATION 027

### 3. Type Mismatches
- **Problem:** `phrase_stats_cache.phrase_id` was INT but phrases.id is UUID
- **Solution:** Migration 027 recreates table with correct type
- **Status:** ⚠️ REQUIRES MIGRATION 027

### 4. Materialized View Error
- **Problem:** Referenced non-existent table `user_progress`
- **Solution:** Migration 027 fixes to use correct table `phrase_progress`
- **Status:** ⚠️ REQUIRES MIGRATION 027

### 5. Missing Indexes
- **Problem:** Several performance-critical indexes missing
- **Solution:** Migration 027 adds all missing indexes
- **Status:** ⚠️ REQUIRES MIGRATION 027

### 6. RLS Policy Issues
- **Problem:** Overly permissive moderation_alerts insert policy
- **Solution:** Migration 027 tightens security
- **Status:** ⚠️ REQUIRES MIGRATION 027

---

## Database Schema Overview

### 16 Tables
1. **profiles** - User accounts (linked to auth.users)
2. **phrases** - Core phrase database (Shona, Ndebele, English, Chinese)
3. **phrase_progress** - User learning progress
4. **bookmarks** - Saved phrases
5. **phrase_views** - Analytics tracking
6. **study_sessions** - Daily study stats
7. **ai_generated_phrases** - Custom user phrases
8. **ai_conversations** - AI chat sessions
9. **ai_messages** - Chat messages
10. **ai_recommendations** - AI phrase suggestions
11. **moderation_alerts** - Content moderation
12. **learning_standards** - AI proficiency levels
13. **daily_user_stats** - Aggregated user metrics
14. **phrase_stats_cache** - Cached phrase statistics

### 1 Materialized View
- **user_activity_summary** - Pre-computed admin dashboard data

### Key Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Full-text search on phrases
- ✅ Composite indexes for performance
- ✅ Materialized views for admin dashboard
- ✅ Caching tables for analytics
- ✅ Triggers for automatic updates
- ✅ Foreign key constraints
- ✅ Check constraints on enums

---

## How to Apply Migrations

### First Time Setup
```bash
# 1. Set your database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# 2. Run the migration script
./scripts/apply-migrations.sh
```

### Manual Application
```bash
# Apply a specific migration
psql $DATABASE_URL -f scripts/027_critical_fixes.sql
```

### After Migration 027
```sql
-- 1. Refresh materialized view
SELECT refresh_user_activity_summary();

-- 2. Populate phrase stats cache
SELECT refresh_all_phrase_stats();

-- 3. Verify no orphaned records
SELECT COUNT(*) FROM ai_generated_phrases
WHERE user_id NOT IN (SELECT id FROM auth.users);
-- Should return 0
```

---

## Security Review

### RLS Policies Status
| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| profiles | User own, Admin all | Auto (trigger) | User own | ❌ None | ⚠️ Add DELETE policy |
| phrases | Public | Admin only | Admin only | Admin only | ✅ Secure |
| phrase_progress | User own, Admin all | User own | User own | ❌ None | ⚠️ Add DELETE policy |
| bookmarks | User own, Admin all | User own | User own | User own | ✅ Secure |
| phrase_views | User own, Admin all | User own | ❌ None | ❌ None | ✅ OK (append-only) |
| study_sessions | User own, Admin all | User own | User own | ❌ None | ⚠️ Add DELETE policy |
| ai_* tables | User own, Admin all | User own | User own | ❌ None | ⚠️ Add DELETE policies |
| moderation_alerts | User own, Admin all | Auth users | Admin only | Admin only | ✅ Fixed in 027 |
| learning_standards | Public | Admin only | Admin only | Admin only | ✅ Secure |

### Recommendations
1. Add explicit DELETE policies for user-owned data
2. Consider audit logging for admin actions
3. Review admin policy performance at scale

---

## Performance Optimization

### Current Optimizations
- ✅ Full-text search indexes (GIN)
- ✅ Composite indexes for common queries
- ✅ Materialized view for admin dashboard
- ✅ Phrase stats caching
- ✅ Unique indexes for deduplication

### Future Optimizations (At Scale)
1. **Table Partitioning**
   - phrase_views (by date, 1B+ rows expected)
   - study_sessions (by date)
   - ai_messages (by created_at)

2. **Read Replicas**
   - Analytics queries
   - Public phrase browsing

3. **Connection Pooling**
   - PgBouncer for connection management
   - Reduce connection overhead

4. **Scheduled Jobs**
   - Materialized view refresh (hourly)
   - Phrase stats cache update (daily)
   - Archive old analytics data (monthly)

---

## Monitoring

### Key Metrics to Track
```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
-- Low idx_scan = unused index (consider dropping)

-- Cache hit ratio (should be > 90%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 AS cache_hit_ratio
FROM pg_statio_user_tables;
```

---

## Next Steps

### Immediate (Before Production)
- [ ] Apply migration 027_critical_fixes.sql
- [ ] Refresh materialized view
- [ ] Populate phrase stats cache
- [ ] Verify no orphaned records
- [ ] Test all RLS policies

### Short Term (1-2 Weeks)
- [ ] Add DELETE policies for user data
- [ ] Set up automated materialized view refresh
- [ ] Configure connection pooling
- [ ] Add database monitoring alerts

### Medium Term (1-3 Months)
- [ ] Implement table partitioning for high-volume tables
- [ ] Set up read replicas
- [ ] Add audit logging for admin actions
- [ ] Performance testing with synthetic data (1M users)

### Long Term (3-6 Months)
- [ ] Review and optimize all queries
- [ ] Implement data archival strategy
- [ ] Add database backup automation
- [ ] Disaster recovery plan

---

## Support & Documentation

### Files
- `DATABASE_SCHEMA_REVIEW.md` - Comprehensive schema analysis
- `027_critical_fixes.sql` - Critical fixes to apply
- `migrations-README.md` - Original migration guide
- `apply-migrations.sh` - Migration application script

### Troubleshooting
```sql
-- Check migration status
SELECT * FROM schema_migrations; -- If you're using a migration tracker

-- Rollback last migration (if needed)
BEGIN;
-- Run rollback commands here
ROLLBACK; -- or COMMIT when ready

-- Verify database integrity
-- (Add ANALYZE and VACUUM commands as needed)
VACUUM ANALYZE;
```

---

**Last Updated:** 2025-11-10
**Next Review:** After migration 027 is applied
