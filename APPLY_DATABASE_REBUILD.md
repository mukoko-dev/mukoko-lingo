# Apply Complete Database Rebuild

## ⚠️ WARNING: This will rebuild the ENTIRE database

This script creates all tables from scratch. Only use this if:
- You're starting fresh, OR
- You've backed up your data and want to rebuild

## Option 1: Supabase Dashboard (Recommended)

1. **Backup existing data** (if you have any)
   ```sql
   -- Save your phrases
   SELECT * FROM phrases;

   -- Save your users
   SELECT * FROM profiles;
   ```

2. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/yqmqdiudhztddiyeerig
   - Navigate to **SQL Editor**

3. **Run the rebuild script**
   - Open `supabase/migrations/000_complete_database_rebuild.sql`
   - Copy the ENTIRE contents
   - Paste into SQL Editor
   - Click **Run**

4. **Watch for success message**
   ```
   ╔══════════════════════════════════════════════════════════════╗
   ║  NYUCHI LINGO - DATABASE REBUILD COMPLETE                   ║
   ╚══════════════════════════════════════════════════════════════╝
   ```

## What Gets Created

### 14 Tables
1. **profiles** - User management with roles
2. **skills** - 5 core skills (pronunciation, vocabulary, grammar, comprehension, conversation)
3. **skill_levels** - 25 proficiency levels (5 per skill)
4. **user_skills** - ⚡ READ BY AI TUTOR for adaptive teaching
5. **assessments** - Test templates
6. **user_assessments** - Test results (auto-updates user_skills)
7. **phrases** - Skills-based phrases
8. **phrase_progress** - Learning tracking
9. **bookmarks** - User favorites
10. **study_sessions** - Daily analytics
11. **ai_conversations** - Chat history
12. **ai_messages** - Messages with moderation
13. **moderation_alerts** - Flagged content
14. **learning_standards** - AI tutor configuration

### 4 Key Functions
- `is_admin()` - Check if user is admin
- `handle_new_user()` - Auto-create profile on signup
- `update_user_skill_from_assessment()` - Auto-update proficiency
- `get_user_overall_proficiency()` - Calculate overall level

### 40+ RLS Policies
- Complete Row Level Security
- Users see only their data
- Admins have elevated access

### 30+ Performance Indexes
- Fast queries
- Optimized foreign keys

### Seeded Data
- 5 skills with multilingual names/descriptions
- 25 skill levels (beginner → fluent for each skill)
- 5 learning standards (AI configuration)

## Verification

After running, check:

```sql
-- Should return 5 skills
SELECT name, display_name->>'en' as name
FROM skills
ORDER BY sort_order;

-- Should return 25 levels
SELECT COUNT(*) FROM skill_levels;

-- Should return 5 standards
SELECT level, vocabulary_complexity, ai_scaffolding_level
FROM learning_standards
ORDER BY vocabulary_complexity;

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Import Existing Phrases (if you have them)

If you backed up phrases, re-import them:

```sql
-- After running rebuild, import your phrase backup
INSERT INTO phrases (english, shona, ndebele, chinese, category)
SELECT english, shona, ndebele, chinese, category
FROM your_backup_table;

-- Then assign skills to phrases
UPDATE phrases
SET skill_id = (SELECT id FROM skills WHERE name = 'conversation'),
    required_level = 'beginner',
    difficulty_score = 1
WHERE category = 'greetings';
```

## Rollback (Complete Reset)

If you need to start over:

```sql
-- WARNING: Deletes EVERYTHING
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run the rebuild script.

## Next Steps

After successful migration:

1. ✅ Database rebuilt with AI-first architecture
2. ⏭️ Build skills-aware AI prompt system (`lib/ai/skills-aware-prompts.ts`)
3. ⏭️ Rebuild AI chat API to read user_skills
4. ⏭️ Create diagnostic assessment flow
5. ⏭️ Test complete learning journey

---

## Troubleshooting

### "auth.users doesn't exist"

The script assumes Supabase Auth is set up. If not:
- Supabase Auth is automatically available
- Make sure you're connected to the right project

### "permission denied"

Make sure you're using:
- SQL Editor in Supabase Dashboard, OR
- Service role key (not anon key)

### Script takes too long

The script should complete in 5-10 seconds. If it hangs:
- Check your connection
- Try breaking it into smaller parts
- Run in Supabase Dashboard instead of CLI

---

**Ready?** Open Supabase Dashboard and run the script! 🚀
