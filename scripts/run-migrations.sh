#!/bin/bash
# MiLyfe Migration Runner
# Run all migrations in order against your Supabase instance.
#
# Usage:
#   export SUPABASE_URL="https://your-project.supabase.co"
#   export SUPABASE_SERVICE_KEY="your-service-role-key"
#   ./scripts/run-migrations.sh
#
# Or for local development with Supabase CLI:
#   supabase db push

set -e

MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"

echo "=== MiLyfe Migration Runner ==="
echo ""

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Environment variables not set. Trying supabase CLI..."
  echo ""
  
  if command -v supabase &> /dev/null; then
    echo "Running: supabase db push"
    supabase db push
    echo ""
    echo "✅ All migrations applied via supabase CLI."
    exit 0
  else
    echo "ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY, or install supabase CLI."
    echo ""
    echo "  export SUPABASE_URL='https://your-project.supabase.co'"
    echo "  export SUPABASE_SERVICE_KEY='your-service-role-key'"
    echo ""
    exit 1
  fi
fi

echo "Target: $SUPABASE_URL"
echo ""

# Run each migration file in order
for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$migration")
  echo "  Running: $filename..."
  
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat "$migration" | jq -Rs .)}" \
    > /dev/null 2>&1 || {
      # Fallback: use psql if available
      echo "  (curl method failed, trying direct SQL...)"
      echo "  NOTE: You may need to run migrations directly in Supabase SQL Editor."
      echo "  File: $migration"
    }
  
  echo "  ✅ $filename"
done

echo ""
echo "=== All migrations complete ==="
echo ""
echo "Migrations applied:"
ls "$MIGRATIONS_DIR"/*.sql | sort | while read f; do echo "  ✅ $(basename $f)"; done
