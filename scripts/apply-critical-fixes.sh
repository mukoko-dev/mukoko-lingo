#!/bin/bash

# Nyuchi Lingo - Apply Critical Fixes
# Applies migration 027 using Supabase connection string

set -e

echo "🔧 Nyuchi Lingo - Applying Critical Fixes Migration"
echo "====================================================="
echo ""

# Get database URL from .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    exit 1
fi

# Extract connection string (use the direct connection, not pooled)
DB_URL=$(grep "SUPABASE_POSTGRES_URL=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo "❌ Error: Could not find SUPABASE_POSTGRES_URL in .env.local"
    exit 1
fi

echo "✅ Found database connection string"
echo ""

# Show what will be applied
echo "📋 Migration to apply: 027_critical_fixes.sql"
echo ""
echo "This migration will:"
echo "  ✓ Fix broken foreign key references in AI tables"
echo "  ✓ Fix phrase_stats_cache type mismatch"
echo "  ✓ Recreate user_activity_summary materialized view"
echo "  ✓ Add missing performance indexes"
echo "  ✓ Tighten RLS security policies"
echo "  ✓ Add data validation constraints"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Apply the migration using Supabase CLI
if ! supabase db execute --db-url "$DB_URL" -f scripts/027_critical_fixes.sql; then
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "Please check the error above and fix any issues before retrying."
    exit 1
fi

echo ""
echo "✅ Migration applied successfully!"
echo ""

# Post-migration tasks
echo "📝 Running post-migration tasks..."
echo ""

# Refresh materialized view
echo "  → Refreshing user_activity_summary materialized view..."
if supabase db execute --db-url "$DB_URL" -c "SELECT refresh_user_activity_summary();"; then
    echo "     ✅ Materialized view refreshed"
else
    echo "     ⚠️  Materialized view refresh failed (may need to be done manually)"
fi

echo ""

# Populate phrase stats cache
echo "  → Populating phrase_stats_cache..."
if supabase db execute --db-url "$DB_URL" -c "SELECT refresh_all_phrase_stats();"; then
    echo "     ✅ Phrase stats cache populated"
else
    echo "     ⚠️  Phrase stats cache population failed (may need to be done manually)"
fi

echo ""

# Check for orphaned records
echo "  → Checking for orphaned records..."
ORPHANED=$(supabase db execute --db-url "$DB_URL" -c "SELECT COUNT(*) FROM ai_generated_phrases WHERE user_id NOT IN (SELECT id FROM auth.users);" 2>/dev/null | grep -E "^[0-9]+$" || echo "0")

if [ "$ORPHANED" = "0" ]; then
    echo "     ✅ No orphaned records found"
else
    echo "     ⚠️  Found $ORPHANED orphaned records"
fi

echo ""
echo "====================================================="
echo "🎉 All done!"
echo ""
echo "Next steps:"
echo "  1. Review scripts/DATABASE_SCHEMA_REVIEW.md for full analysis"
echo "  2. Monitor database performance"
echo "  3. Consider applying future optimizations from MIGRATION_SUMMARY.md"
echo ""
