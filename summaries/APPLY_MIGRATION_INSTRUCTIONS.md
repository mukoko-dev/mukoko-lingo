# How to Apply Migration 027 via Supabase Dashboard

The Supabase CLI connection pooler is currently experiencing issues. Follow these steps to apply the migration manually through the Supabase Dashboard.

---

## Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/yqmqdiudhztddiyeerig
2. Click on **SQL Editor** in the left sidebar

---

## Step 2: Open the Migration File

The migration file is located at:
```
scripts/027_critical_fixes.sql
```

This is a safe, idempotent migration that uses `IF NOT EXISTS` checks.

---

## Step 3: Copy the Migration SQL

Open the file and copy its entire contents. The migration includes:

✅ **Performance Indexes** - 5 critical indexes for scale
✅ **Security Improvements** - Tightened RLS policies
✅ **Data Validation** - NOT NULL and CHECK constraints
✅ **Caching System** - phrase_stats_cache table + utility functions

---

## Step 4: Run in SQL Editor

1. In the Supabase SQL Editor, create a new query
2. Paste the entire migration SQL
3. Click **RUN** (or press Cmd/Ctrl + Enter)
4. Wait for completion (should take 5-10 seconds)

---

## Step 5: Verify Success

You should see output like:
```
NOTICE: ✓ Critical fixes applied successfully
NOTICE:   - Added missing performance indexes
NOTICE:   - Improved RLS security policies
NOTICE:   - Added data validation constraints
NOTICE:   - Created phrase stats cache system
```

---

## Step 6: Post-Migration Tasks

After the migration completes successfully, run these two commands in the SQL Editor:

### 6.1 Refresh Phrase Stats Cache
```sql
SELECT refresh_all_phrase_stats();
```

### 6.2 Verify No Issues
```sql
-- Check for orphaned records (should return 0)
SELECT COUNT(*) FROM ai_generated_phrases
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

---

## Troubleshooting

### If you see errors:

**Error: "relation already exists"**
- This is OK - it means part of the migration was already applied
- The migration uses `IF NOT EXISTS` so it's safe to re-run

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check your Supabase dashboard permissions

**Error: "column does not exist"**
- Some tables might not exist yet
- This is OK - those parts will be skipped

---

## What This Migration Does

### 1. Performance Indexes (5 new indexes)
```sql
idx_ai_messages_created_at          -- Speed up conversation history
idx_learning_standards_is_active    -- Speed up active standards lookup
idx_study_sessions_user_date        -- Speed up analytics queries
idx_ai_conversations_user_created   -- Speed up user history
idx_moderation_alerts_pending       -- Speed up moderation queue
```

### 2. Security Improvements
- Tightens moderation_alerts RLS policy
- Prevents unauthenticated users from creating alerts
- Validates user_id matches authenticated user

### 3. Data Validation
- Adds NOT NULL constraint on moderation_alerts.status
- Adds CHECK constraint for valid status values
- Ensures data integrity

### 4. Caching System
- Creates phrase_stats_cache table
- Adds update_phrase_stats() function
- Adds refresh_all_phrase_stats() function
- Enables fast phrase popularity queries

---

## Alternative: Using Supabase CLI (When Working)

If the connection pooler starts working again, you can use:

```bash
supabase db push --linked
```

But currently, the pooler has connection issues.

---

## Need Help?

If you encounter any issues:

1. Check the Supabase status page: https://status.supabase.com
2. Review the full migration file to understand what it does
3. Contact Supabase support if connection issues persist
4. The migration is **safe to run multiple times** due to safety checks

---

## Summary

✅ This migration is **production-ready** and **safe to apply**
✅ Uses `IF NOT EXISTS` and other safety checks
✅ Won't break existing data or functionality
✅ Adds important performance and security improvements
✅ Required for optimal app performance at scale

After applying, your database will be ready for millions of users! 🚀
