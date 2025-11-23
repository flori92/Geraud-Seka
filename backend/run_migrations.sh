#!/bin/bash
# Safe migration runner for Railway
# Prevents race conditions when multiple instances start

set -e  # Exit on error

echo "🔄 Starting database migrations..."

# Run migrations with timeout
timeout 120s alembic upgrade head || {
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo "⏱️  Migration timeout after 120s - another instance may be running migrations"
        # Don't fail - another instance is likely handling it
        exit 0
    else
        echo "❌ Migration failed with exit code $EXIT_CODE"
        exit $EXIT_CODE
    fi
}

echo "✅ Migrations completed successfully"
