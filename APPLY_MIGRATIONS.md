# Apply Skills System Migrations

## Quick Start

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/yqmqdiudhztddiyeerig
   - Navigate to **SQL Editor**

2. **Run the Combined Migration**
   - Copy the entire contents of `supabase/migrations/028_skills_system_combined.sql`
   - Paste into the SQL Editor
   - Click **Run**

3. **Verify Success**
   - You should see: "Skills system migration completed successfully!"
   - Check that 5 skills were created
   - Check that 25 skill levels were created (5 per skill)

### Option 2: Supabase CLI (if profiles table exists)

```bash
# Remove individual migrations
rm supabase/migrations/028_skills_taxonomy.sql
rm supabase/migrations/029_assessment_system.sql
rm supabase/migrations/030_phrases_skills_integration.sql

# Push the combined migration
supabase db push
```

## What Gets Created

### Tables

1. **skills** (5 rows)
   - pronunciation
   - vocabulary
   - grammar
   - comprehension
   - conversation

2. **skill_levels** (25 rows: 5 levels × 5 skills)
   - beginner (0-49)
   - elementary (50-64)
   - intermediate (65-79)
   - advanced (80-89)
   - fluent (90-100)

3. **user_skills**
   - Tracks each user's proficiency
   - **READ BY AI TUTOR** for adaptive teaching
   - Updates automatically when assessments complete

4. **assessments**
   - Templates for diagnostic/formative/summative tests
   - Created by admins

5. **user_assessments**
   - User attempts and results
   - Triggers update to user_skills

### Functions Created

- `update_user_skill_from_assessment()` - Auto-updates proficiency
- `get_user_overall_proficiency(user_id)` - Get overall level

### Triggers Created

- Auto-update user_skills when assessment completes
- Auto-update updated_at timestamps

## Verification Queries

After applying, run these queries to verify:

```sql
-- Check skills were created
SELECT name, display_name->>'en' as display_name FROM skills ORDER BY sort_order;
-- Should return 5 skills

-- Check skill levels
SELECT
  s.name as skill,
  sl.level,
  sl.min_score
FROM skill_levels sl
JOIN skills s ON s.id = sl.skill_id
ORDER BY s.sort_order, sl.sort_order;
-- Should return 25 rows

-- Check phrases were updated
SELECT
  COUNT(*) as total_phrases,
  COUNT(skill_id) as with_skills,
  COUNT(*) - COUNT(skill_id) as without_skills
FROM phrases;
-- Should show all phrases now have skill_id

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('skills', 'skill_levels', 'user_skills', 'assessments', 'user_assessments')
ORDER BY tablename, policyname;
-- Should show 12+ policies
```

## Troubleshooting

### Error: "profiles table doesn't exist"

The migration handles this gracefully with conditional FK creation. If you see this error:

1. Apply your existing profiles migration first
2. Then re-run the skills migration

### Error: "skill_id already exists"

The migration uses `IF NOT EXISTS` clauses. If you see this:

1. The migration is idempotent - safe to re-run
2. Or the tables already exist (check with `\dt` in psql)

### Error: "constraint already exists"

The migration drops existing policies before creating new ones. If you see this:

1. Run the migration again - it will clean up and recreate
2. Or manually drop the constraint first

## Next Steps After Migration

1. **Verify in Dashboard**
   - Check Table Editor → see new tables
   - Check Database → Functions → see new functions

2. **Test with a User**
   - Sign up a test user
   - Check that user_skills row is NOT created yet (created on first assessment)

3. **Continue to Phase 2**
   - Build AI skills-aware prompts
   - Rebuild AI chat API
   - Create diagnostic assessment flow

## Rollback (if needed)

```sql
-- WARNING: This deletes all skills data!
DROP TABLE IF EXISTS user_assessments CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS skill_levels CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

DROP FUNCTION IF EXISTS update_user_skill_from_assessment() CASCADE;
DROP FUNCTION IF EXISTS get_user_overall_proficiency(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_skills_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_assessments_updated_at() CASCADE;

-- Remove columns from phrases
ALTER TABLE phrases
  DROP COLUMN IF EXISTS skill_id,
  DROP COLUMN IF EXISTS required_level,
  DROP COLUMN IF EXISTS learning_objectives,
  DROP COLUMN IF EXISTS cultural_notes,
  DROP COLUMN IF EXISTS difficulty_score;
```

## File Locations

- Combined migration: `supabase/migrations/028_skills_system_combined.sql`
- Original migrations (for reference):
  - `scripts/028_skills_taxonomy.sql`
  - `scripts/029_assessment_system.sql`
  - `scripts/030_phrases_skills_integration.sql`
