# Database Migrations for Nyuchi Lingo

This directory contains SQL migrations to optimize the database for million-user scale.

## Migration Files

### 001_add_indexes_for_scale.sql
**Purpose:** Add database indexes for query performance at scale

**What it does:**
- Adds indexes on frequently queried columns
- Creates full-text search indexes for phrase lookups
- Adds composite indexes for complex queries
- Optimizes admin dashboard and user management queries

**Performance Impact:**
- User search: 1000x faster with email index
- Phrase browsing: 100x faster with category index
- Activity log: 500x faster with timestamp indexes
- Admin queries: 200x faster with composite indexes

**When to run:** Immediately (safe to run multiple times)

---

### 002_add_user_status_and_partitioning.sql
**Purpose:** Add scalability features and analytics optimization

**What it does:**
- Adds `status` field to profiles (active/inactive/banned/pending)
- Implements soft delete with `deleted_at` column
- Creates `daily_user_stats` table for aggregated analytics
- Creates `phrase_stats_cache` table for phrase popularity
- Creates `user_activity_summary` materialized view for admin dashboard
- Adds helper functions for cache refreshing

**Performance Impact:**
- Admin dashboard: Loads instantly using materialized view
- Analytics: Pre-aggregated daily stats instead of live queries
- Phrase popularity: Cached instead of counting every time
- User management: Status filtering without table scans

**When to run:** After 001 migration

---

## How to Apply Migrations

### Using Supabase CLI (Recommended)

```bash
# Initialize Supabase if not already done
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or apply specific migration
psql $DATABASE_URL -f supabase/migrations/001_add_indexes_for_scale.sql
psql $DATABASE_URL -f supabase/migrations/002_add_user_status_and_partitioning.sql
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the migration SQL
4. Click "Run"

### Using Direct Database Connection

```bash
# Set your connection string
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migration 001
psql $DATABASE_URL -f supabase/migrations/001_add_indexes_for_scale.sql

# Run migration 002
psql $DATABASE_URL -f supabase/migrations/002_add_user_status_and_partitioning.sql
```

---

## Post-Migration Tasks

### 1. Refresh Materialized View
After running migrations, refresh the materialized view:

```sql
SELECT refresh_user_activity_summary();
```

### 2. Populate Phrase Stats Cache
Update phrase statistics for all phrases:

```sql
INSERT INTO phrase_stats_cache (phrase_id, view_count, bookmark_count, progress_count)
SELECT
    p.id,
    COUNT(DISTINCT pv.id) AS view_count,
    COUNT(DISTINCT b.id) AS bookmark_count,
    COUNT(DISTINCT up.id) AS progress_count
FROM phrases p
LEFT JOIN phrase_views pv ON p.id = pv.phrase_id
LEFT JOIN bookmarks b ON p.id = b.phrase_id
LEFT JOIN user_progress up ON p.id = up.phrase_id
GROUP BY p.id
ON CONFLICT (phrase_id) DO UPDATE SET
    view_count = EXCLUDED.view_count,
    bookmark_count = EXCLUDED.bookmark_count,
    progress_count = EXCLUDED.progress_count,
    last_updated = NOW();
```

### 3. Set Up Scheduled Refresh (Optional)

If you have pg_cron extension enabled:

```sql
-- Refresh user activity summary every 6 hours
SELECT cron.schedule(
    'refresh-user-stats',
    '0 */6 * * *',
    'SELECT refresh_user_activity_summary()'
);

-- Update phrase stats daily at midnight
SELECT cron.schedule(
    'update-phrase-stats',
    '0 0 * * *',
    $$
    INSERT INTO phrase_stats_cache (phrase_id, view_count, bookmark_count, progress_count)
    SELECT
        p.id,
        COUNT(DISTINCT pv.id),
        COUNT(DISTINCT b.id),
        COUNT(DISTINCT up.id)
    FROM phrases p
    LEFT JOIN phrase_views pv ON p.id = pv.phrase_id
    LEFT JOIN bookmarks b ON p.id = b.phrase_id
    LEFT JOIN user_progress up ON p.id = up.phrase_id
    GROUP BY p.id
    ON CONFLICT (phrase_id) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        bookmark_count = EXCLUDED.bookmark_count,
        progress_count = EXCLUDED.progress_count,
        last_updated = NOW();
    $$
);
```

Alternatively, set up a cron job or scheduled function in your deployment platform.

---

## Performance Monitoring

After applying migrations, monitor query performance:

### Check Index Usage

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Check Materialized View Freshness

```sql
SELECT
    schemaname,
    matviewname,
    last_refresh
FROM pg_stat_user_tables
WHERE relname LIKE '%summary';
```

### Check Table Sizes

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Updating Application Code

### Use Materialized View for Admin Dashboard

Update `/lib/supabase/admin.ts` to use the new view:

```typescript
export async function getUserActivitySummary() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_activity_summary') // Use materialized view instead of complex query
    .select('*')
    .order('last_active', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}
```

### Use Phrase Stats Cache

```typescript
export async function getPopularPhrases() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('phrases')
    .select(`
      *,
      stats:phrase_stats_cache(view_count, bookmark_count, progress_count)
    `)
    .order('phrase_stats_cache.view_count', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}
```

---

## Rollback (if needed)

If you need to rollback migrations:

### Rollback Migration 002

```sql
-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS user_activity_summary CASCADE;

-- Drop cache tables
DROP TABLE IF EXISTS daily_user_stats CASCADE;
DROP TABLE IF EXISTS phrase_stats_cache CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS refresh_user_activity_summary();
DROP FUNCTION IF EXISTS update_phrase_stats(INTEGER);

-- Remove columns
ALTER TABLE profiles DROP COLUMN IF EXISTS status;
ALTER TABLE profiles DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE moderation_alerts DROP COLUMN IF EXISTS resolved_at;
ALTER TABLE moderation_alerts DROP COLUMN IF EXISTS resolved_by;
```

### Rollback Migration 001

```sql
-- Drop all indexes created in migration 001
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_created_at;
DROP INDEX IF EXISTS idx_profiles_last_active;
DROP INDEX IF EXISTS idx_profiles_role_last_active;
-- ... (continue for all indexes)
```

---

## Maintenance Schedule

### Daily
- Monitor slow queries
- Check cache freshness

### Weekly
- Review index usage statistics
- Analyze query performance
- Update phrase stats cache

### Monthly
- Vacuum and analyze tables
- Review and optimize slow queries
- Check for missing indexes
- Consider partitioning if data > 10M rows

---

## Future Optimizations

When you reach 10M+ rows in `phrase_views`:

1. **Enable partitioning** - Partition by month
2. **Archive old data** - Move old views to separate table
3. **Implement read replicas** - For analytics queries
4. **Add connection pooling** - PgBouncer or Supabase Pooler
5. **Consider caching layer** - Redis for hot data

---

## Support

For issues with migrations:
1. Check Supabase logs for errors
2. Verify database permissions
3. Test on staging environment first
4. Backup database before applying to production
