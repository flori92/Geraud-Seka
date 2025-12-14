#!/bin/bash
# Safe migration runner for Railway
# Prevents race conditions when multiple instances start

set -e  # Exit on error

echo "🔄 Starting database migrations..."

# Some environments (macOS, minimal containers) do not provide `timeout`.
# Fall back to running alembic directly and tolerate failures (safe runner).
if command -v timeout >/dev/null 2>&1; then
    echo "⏱️  Using timeout wrapper for alembic"
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
else
    echo "⚠️  'timeout' not found - running alembic directly (may block)"
    set +e
    alembic upgrade head
    RC=$?
    set -e
    if [ $RC -ne 0 ]; then
        echo "⚠️  Alembic exited with code $RC - continuing (safe runner)"
        # Do not fail the startup; migrations may be handled elsewhere
    fi
fi

echo "✅ Migrations step finished"
