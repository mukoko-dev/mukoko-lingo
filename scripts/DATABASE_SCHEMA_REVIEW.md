# Mukoko Lingo Database Schema Review
**Date:** November 10, 2025
**Purpose:** Comprehensive schema analysis for million-user scalability

---

## Executive Summary

### Critical Issues Found
1. **Duplicate Migration Numbers** - Files 001 and 002 exist twice with different content
2. **Column Reference Mismatch** - `profiles.id` vs `profiles.user_id` inconsistency
3. **Foreign Key Errors** - AI tables reference `profiles(user_id)` but column is `profiles(id)`
4. **Missing Indexes** - Several tables missing performance indexes

### Status: ⚠️ REQUIRES IMMEDIATE FIXES

---

## Migration Files Inventory

### Duplicate Numbers (CRITICAL)
```
001_create_phrases_table.sql (original - 19:01)
001_add_indexes_for_scale.sql (NEW - 21:56) ⚠️ CONFLICT

002_seed_phrases.sql (original - 19:01)
002_add_user_status_and_partitioning.sql (NEW - 21:56) ⚠️ CONFLICT
```

### Recommended Renumbering
```
001_create_phrases_table.sql → 001 (KEEP)
002_seed_phrases.sql → 002 (KEEP)
003_create_profiles_table.sql → 003 (KEEP)
004_add_profile_preferences.sql → 004 (KEEP)
005_create_bookmarks_table.sql → 005 (KEEP)
006_create_progress_tracking.sql → 006 (KEEP)
007_create_analytics_tables.sql → 007 (KEEP)
008_add_comprehensive_phrases.sql → 008 (KEEP)
009_add_user_roles.sql → 009 (KEEP)
010_create_ai_tables.sql → 010 (KEEP)
011_create_moderation_alerts.sql → 011 (KEEP)
012_add_user_status.sql → 012 (KEEP)
013_fix_profile_updates.sql → 013 (KEEP)
014_make_bryan_admin.sql → 014 (KEEP)
015_add_tourism_phrases.sql → 015 (KEEP)
016_fix_profile_column_and_rls.sql → 016 (KEEP)
017_fix_auth_and_profiles.sql → 017 (KEEP)
018_fix_tracking_permissions.sql → 018 (KEEP)
019_ensure_profile_status.sql → 019 (KEEP)
020_fix_all_user_id_references.sql → 020 (KEEP)
021_fix_rls_infinite_recursion.sql → 021 (KEEP)
024_create_learning_standards_fixed.sql → 022 (RENUMBER)
025_fix_activity_summary_function.sql → 023 (RENUMBER)
026_standardize_admin_checks.sql → 024 (RENUMBER)
001_add_indexes_for_scale.sql → 025 (RENUMBER)
002_add_user_status_and_partitioning.sql → 026 (RENUMBER)
```

---

## Database Schema

### Table: `profiles`
**Purpose:** User profile data and authentication linkage
**Primary Key:** `id` (UUID, references auth.users)

#### Columns (from various migrations)
```sql
id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
user_id           UUID (added later, creates confusion) ⚠️
email             TEXT NOT NULL
display_name      TEXT
role              TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
status            TEXT DEFAULT 'active'
deleted_at        TIMESTAMPTZ
study_streak      INT DEFAULT 0
last_study_date   DATE
last_active       TIMESTAMPTZ
daily_goal        INT DEFAULT 10
learning_goal     TEXT
preferred_language TEXT DEFAULT 'en'
ui_theme          TEXT DEFAULT 'system'
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

#### Issues
- **CRITICAL:** Migration 020 adds `user_id` column but most code uses `id`
- This creates inconsistency in foreign key references
- Migration 010 (AI tables) references `profiles(user_id)` which doesn't exist initially

#### RLS Policies
```sql
✓ Users can view their own profile (SECURE)
✓ Users can update their own profile (SECURE)
✓ Admins can view all profiles (SECURE)
```

#### Indexes
```sql
✓ idx_profiles_email
✓ idx_profiles_role
✓ idx_profiles_last_active
✓ idx_profiles_role_last_active (composite)
✓ idx_profiles_created_at
```

---

### Table: `phrases`
**Purpose:** Core phrase database (Shona, Ndebele, English, Chinese)
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
english             TEXT NOT NULL
shona               TEXT NOT NULL
ndebele             TEXT NOT NULL
chinese             TEXT NOT NULL
pronunciation       JSONB (english, shona, ndebele, chinese)
context             JSONB (en, sn, nd, zh)
category            TEXT NOT NULL
difficulty_level    TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
tags                TEXT[]
usage_frequency     INT DEFAULT 0
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

#### Indexes
```sql
✓ idx_phrases_category
✓ idx_phrases_difficulty
✓ idx_phrases_english_search (GIN full-text)
✓ idx_phrases_shona_search (GIN full-text)
✓ idx_phrases_tags (GIN array)
```

#### RLS Policies
```sql
✓ Public read access (APPROPRIATE - phrases are public)
✓ Admin-only write access (SECURE)
```

---

### Table: `phrase_progress`
**Purpose:** Track user progress on phrases
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
phrase_id           UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE
status              TEXT CHECK (status IN ('learning', 'practiced', 'mastered'))
times_practiced     INT DEFAULT 1
last_practiced_at   TIMESTAMPTZ DEFAULT NOW()
created_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, phrase_id)
```

#### Issues
- Migration 001 (new) tries to create `idx_user_progress_user_id` but table is `phrase_progress`

#### Indexes
```sql
✓ idx_phrase_progress_user_id
✓ idx_phrase_progress_phrase_id
✓ idx_phrase_progress_status
✓ idx_phrase_progress_user_status (composite)
✓ idx_phrase_progress_last_practiced
```

#### RLS Policies
```sql
✓ Users can view their own progress (SECURE)
✓ Users can insert their own progress (SECURE)
✓ Users can update their own progress (SECURE)
✓ Admins can view all progress (SECURE)
```

---

### Table: `bookmarks`
**Purpose:** User-saved phrases
**Primary Key:** `id` (UUID)

#### Columns
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
phrase_id   UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE
created_at  TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, phrase_id)
```

#### Indexes
```sql
✓ idx_bookmarks_user_id
✓ idx_bookmarks_phrase_id
✓ idx_bookmarks_user_phrase (composite unique)
```

#### RLS Policies
```sql
✓ Users can manage their own bookmarks (SECURE)
✓ Admins can view all bookmarks (SECURE)
```

---

### Table: `phrase_views`
**Purpose:** Track phrase view analytics
**Primary Key:** `id` (UUID)

#### Columns
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE
phrase_id   UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE
viewed_at   TIMESTAMPTZ DEFAULT NOW()
```

#### Indexes
```sql
✓ idx_phrase_views_user_id
✓ idx_phrase_views_phrase_id
✓ idx_phrase_views_viewed_at
```

---

### Table: `study_sessions`
**Purpose:** Daily study tracking
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
session_date          DATE NOT NULL
phrases_studied       INT DEFAULT 0
time_spent_minutes    INT DEFAULT 0
created_at            TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, session_date)
```

#### Indexes
```sql
✓ idx_study_sessions_user_id
✓ idx_study_sessions_date
```

---

### Table: `ai_generated_phrases`
**Purpose:** User-generated custom phrases via AI
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID REFERENCES profiles(user_id) ⚠️ BROKEN FK
english                 TEXT NOT NULL
shona                   TEXT NOT NULL
ndebele                 TEXT NOT NULL
chinese                 TEXT NOT NULL
english_pronunciation   TEXT
shona_pronunciation     TEXT
ndebele_pronunciation   TEXT
chinese_pronunciation   TEXT
context                 TEXT
category                TEXT DEFAULT 'custom'
source                  TEXT DEFAULT 'ai_generated'
moderation_flagged      BOOLEAN DEFAULT false
moderation_reason       TEXT
created_at              TIMESTAMPTZ DEFAULT NOW()
approved_at             TIMESTAMPTZ
approved_by             UUID REFERENCES profiles(user_id) ⚠️ BROKEN FK
```

#### Issues
- **CRITICAL:** References `profiles(user_id)` but should be `profiles(id)` or use the actual user_id column after migration 020

#### Indexes
```sql
✓ ai_generated_phrases_user_id_idx
```

---

### Table: `ai_conversations`
**Purpose:** AI chat session tracking
**Primary Key:** `id` (UUID)

#### Columns
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES profiles(user_id) ⚠️ BROKEN FK
type        TEXT NOT NULL
language    TEXT NOT NULL
title       TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```

#### Issues
- **CRITICAL:** Same foreign key issue as ai_generated_phrases

---

### Table: `ai_messages`
**Purpose:** Messages within AI conversations
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id         UUID REFERENCES ai_conversations(id) ON DELETE CASCADE
role                    TEXT NOT NULL
content                 TEXT NOT NULL
moderation_flagged      BOOLEAN DEFAULT false
moderation_categories   JSONB
created_at              TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `moderation_alerts`
**Purpose:** Content moderation tracking
**Primary Key:** `id` (UUID)

#### Columns
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
content_type    TEXT NOT NULL
content_id      UUID NOT NULL
user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL
reason          TEXT NOT NULL
categories      JSONB
status          TEXT DEFAULT 'pending'
reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
reviewed_at     TIMESTAMPTZ
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()
```

#### Issues
- Migration 001 (new) tries to create index on `severity` and `updated_at` columns that don't exist

#### Indexes
```sql
✓ idx_moderation_alerts_status
✓ idx_moderation_alerts_content_type
✓ idx_moderation_alerts_status_created (composite)
✗ idx_moderation_alerts_severity ⚠️ Column doesn't exist
✗ idx_moderation_alerts_updated ⚠️ Column doesn't exist
```

#### RLS Policies
```sql
⚠️ Users can insert alerts (TOO PERMISSIVE - should be restricted)
✓ Users can view their own alerts (SECURE)
✓ Admins can manage all alerts (SECURE)
```

---

### Table: `learning_standards`
**Purpose:** AI proficiency level definitions
**Primary Key:** `id` (UUID)

#### Columns
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
level               TEXT UNIQUE NOT NULL
level_order         INT UNIQUE NOT NULL
title               TEXT NOT NULL
description         TEXT NOT NULL
criteria            JSONB NOT NULL
vocabulary_range    TEXT NOT NULL
conversation_types  TEXT[] NOT NULL
grammar_concepts    TEXT[] NOT NULL
ai_prompt_template  TEXT NOT NULL
example_phrases     TEXT[] NOT NULL
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `daily_user_stats`
**Purpose:** Aggregated daily analytics (performance optimization)
**Primary Key:** `id` (BIGSERIAL)

#### Columns
```sql
id                  BIGSERIAL PRIMARY KEY
user_id             UUID NOT NULL REFERENCES profiles(user_id) ⚠️ BROKEN FK
date                DATE NOT NULL
total_views         INT DEFAULT 0
total_bookmarks     INT DEFAULT 0
total_progress      INT DEFAULT 0
study_time_minutes  INT DEFAULT 0
phrases_practiced   INT DEFAULT 0
ai_interactions     INT DEFAULT 0
created_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, date)
```

---

### Table: `phrase_stats_cache`
**Purpose:** Cached phrase popularity metrics
**Primary Key:** `phrase_id`

#### Columns
```sql
phrase_id       INT PRIMARY KEY REFERENCES phrases(id) ⚠️ Type mismatch (INT vs UUID)
view_count      INT DEFAULT 0
bookmark_count  INT DEFAULT 0
progress_count  INT DEFAULT 0
last_updated    TIMESTAMPTZ DEFAULT NOW()
```

#### Issues
- **CRITICAL:** References phrases(id) as INT but phrases.id is UUID

---

### Materialized View: `user_activity_summary`
**Purpose:** Pre-computed user statistics for admin dashboard

```sql
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.role,
    p.status,
    COUNT(DISTINCT pv.id) AS total_views,
    COUNT(DISTINCT b.id) AS total_bookmarks,
    COUNT(DISTINCT up.id) AS total_progress
FROM profiles p
LEFT JOIN phrase_views pv ON p.user_id = pv.user_id
LEFT JOIN bookmarks b ON p.user_id = b.user_id
LEFT JOIN user_progress up ON p.user_id = up.user_id ⚠️ Wrong table name
WHERE p.deleted_at IS NULL
GROUP BY p.user_id, p.email, p.display_name, p.role, p.status;
```

#### Issues
- References `user_progress` table but actual table is `phrase_progress`

---

## Security Analysis

### RLS Policy Review

#### ✅ Secure Policies
- User profile access (users see only own data)
- Phrase progress tracking (users manage only own progress)
- Bookmarks (users manage only own bookmarks)
- AI content (users see only own AI interactions)
- Admin policies use proper role checks

#### ⚠️ Security Concerns
1. **Moderation Alerts** - Any user can insert alerts (should be system-only or restricted)
2. **Missing DELETE policies** - Several tables allow insert/update but no explicit DELETE policy
3. **Admin checks** - Some policies use EXISTS subquery which may have performance impact at scale

---

## Scalability Analysis

### Performance Optimizations ✅
- Full-text search indexes on phrases
- Composite indexes for common query patterns
- Materialized view for admin dashboard
- Caching table for phrase stats

### Concerns for Million-User Scale

#### High Priority
1. **Partitioning needed for:**
   - `phrase_views` (will grow to billions of rows)
   - `study_sessions` (partition by date)
   - `ai_messages` (partition by created_at)

2. **Missing indexes:**
   - `ai_messages.created_at` (for conversation history)
   - `learning_standards.is_active` (frequent filter)
   - `profiles.status` + `profiles.deleted_at` composite

3. **Query optimization needed:**
   - Materialized view refresh strategy (currently manual)
   - Phrase stats cache update trigger (currently manual)

---

## Data Integrity Issues

### Foreign Key Problems
| Table | Column | Issue | Severity |
|-------|--------|-------|----------|
| ai_generated_phrases | user_id | References profiles(user_id) but should be profiles(id) | CRITICAL |
| ai_conversations | user_id | Same as above | CRITICAL |
| ai_recommendations | user_id | Same as above | CRITICAL |
| daily_user_stats | user_id | Same as above | CRITICAL |
| phrase_stats_cache | phrase_id | INT vs UUID type mismatch | CRITICAL |

### Missing Constraints
- No CHECK constraint on `profiles.email` format
- No CHECK constraint on `moderation_alerts.status` values
- Missing NOT NULL on several important columns

---

## Recommended Actions

### Immediate (Run Before Production)
1. Rename duplicate migration files
2. Fix all foreign key references
3. Fix phrase_stats_cache type mismatch
4. Add missing NOT NULL constraints
5. Tighten moderation_alerts RLS policy

### High Priority (Within 1 Month)
1. Implement partitioning for high-volume tables
2. Add missing indexes
3. Set up materialized view refresh schedule
4. Add phrase stats cache auto-update triggers

### Medium Priority (Within 3 Months)
1. Review and optimize all RLS policies for performance
2. Add database monitoring for slow queries
3. Implement connection pooling strategy
4. Set up read replicas for analytics queries

---

## Migration Execution Order

```bash
# Apply in this exact order:
# Base schema (001-011)
# Fixes (012-021)
# Features (022-024) - after renumbering
# Performance (025-026) - after renumbering
```

---

## Monitoring Queries

### Check for orphaned records
```sql
-- AI tables referencing non-existent users
SELECT COUNT(*) FROM ai_generated_phrases
WHERE user_id NOT IN (SELECT id FROM profiles);
```

### Check table sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check slow queries
```sql
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

**Report Generated:** 2025-11-10
**Next Review:** Before production deployment
