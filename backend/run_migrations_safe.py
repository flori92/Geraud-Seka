#!/usr/bin/env python3
"""
Safe migration runner using PostgreSQL advisory locks.
Prevents race conditions when multiple instances try to run migrations.
"""
import sys
import os
import time
from sqlalchemy import create_engine, text

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import get_settings
from alembic.config import Config
from alembic import command

def run_migrations_with_lock():
    """Run migrations with PostgreSQL advisory lock to prevent races."""
    settings = get_settings()
    engine = create_engine(settings.database_url)

    # Use a unique lock ID for migrations (hash of 'seka-migrations')
    LOCK_ID = 123456789

    print("🔄 Attempting to acquire migration lock...")

    with engine.connect() as conn:
        # Try to acquire advisory lock (non-blocking)
        result = conn.execute(text(f"SELECT pg_try_advisory_lock({LOCK_ID})"))
        lock_acquired = result.scalar()

        if not lock_acquired:
            print("⏳ Another instance is running migrations, waiting...")
            # Wait for lock (blocking, with timeout handled by Railway)
            conn.execute(text(f"SELECT pg_advisory_lock({LOCK_ID})"))
            print("✅ Lock acquired, checking if migrations still needed...")
        else:
            print("✅ Lock acquired, running migrations...")

        try:
            # Run migrations
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
            print("✅ Migrations completed successfully")
        finally:
            # Release lock
            conn.execute(text(f"SELECT pg_advisory_unlock({LOCK_ID})"))
            print("🔓 Lock released")

    engine.dispose()

if __name__ == "__main__":
    try:
        run_migrations_with_lock()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
