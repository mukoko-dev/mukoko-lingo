-- ============================================================================
-- MIGRATION HISTORY REPAIR SCRIPT
-- ============================================================================
-- Run this script ONCE on your Supabase database to reset migration history
-- after consolidating all migrations into a single file.
--
-- This script:
-- 1. Clears all old migration records
-- 2. Inserts the new consolidated migration as "applied"
-- ============================================================================

-- Clear old migration history
DELETE FROM supabase_migrations.schema_migrations;

-- Mark consolidated migration as applied
INSERT INTO supabase_migrations.schema_migrations (version, name, statements_applied)
VALUES ('20241101000000', 'consolidated_schema', -1);

-- Verify
SELECT * FROM supabase_migrations.schema_migrations;
