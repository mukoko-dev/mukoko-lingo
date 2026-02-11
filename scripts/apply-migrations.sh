#!/bin/bash

# Mukoko Lingo - Database Migration Script
# Applies SQL migrations to Supabase database

set -e  # Exit on error

echo "🚀 Mukoko Lingo Database Migration Tool"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set your database connection string:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Or use Supabase connection string from your dashboard"
    exit 1
fi

echo "✅ Database connection string found"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql (PostgreSQL client) is not installed"
    echo ""
    echo "Install psql:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL client (psql) found"
echo ""

# Migration directory
MIGRATION_DIR="supabase/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo "❌ Error: Migration directory not found: $MIGRATION_DIR"
    exit 1
fi

echo "📁 Found migration directory: $MIGRATION_DIR"
echo ""

# List available migrations
echo "📋 Available migrations:"
ls -1 $MIGRATION_DIR/*.sql 2>/dev/null || echo "  No migration files found"
echo ""

# Ask for confirmation
read -p "Do you want to apply these migrations? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔧 Applying migrations..."
echo "=========================="
echo ""

# Apply each migration
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration_file in $MIGRATION_DIR/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "📝 Applying: $filename"

        if psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
            echo "   ✅ Success"
            ((SUCCESS_COUNT++))
        else
            echo "   ❌ Failed"
            echo "   Running with error details..."
            psql "$DATABASE_URL" -f "$migration_file"
            ((FAIL_COUNT++))
        fi
        echo ""
    fi
done

echo "=========================="
echo "📊 Migration Summary"
echo "=========================="
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed:     $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All migrations applied successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Refresh materialized view:"
    echo "   psql \$DATABASE_URL -c \"SELECT refresh_user_activity_summary();\""
    echo ""
    echo "2. Populate phrase stats cache (optional):"
    echo "   See supabase/migrations/README.md for SQL"
    echo ""
    echo "3. Monitor performance:"
    echo "   Check index usage and query performance"
else
    echo "⚠️  Some migrations failed. Please check the errors above."
    echo "   Review the migration files and fix any issues."
    exit 1
fi
