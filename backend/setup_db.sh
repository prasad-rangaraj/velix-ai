#!/bin/bash
# Run this script ONCE to create the PostgreSQL database, role, and run migrations.
# Usage: bash setup_db.sh

set -e
echo "=== AI Communication Coach — DB Setup ==="

# 1. Create postgres role for current Linux user (if it doesn't exist)
echo "→ Creating postgres role for $USER..."
sudo -u postgres psql -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$USER') THEN
    CREATE ROLE $USER WITH LOGIN SUPERUSER;
  END IF;
END \$\$;" 2>/dev/null || true

# 2. Create the database
echo "→ Creating database 'human-ai-interaction'..."
sudo -u postgres psql -c "CREATE DATABASE \"human-ai-interaction\";" 2>/dev/null || echo "  (already exists, skipping)"

# 3. Set password for postgres role to match .env
echo "→ Setting password for postgres role..."
sudo -u postgres psql -c "ALTER ROLE postgres WITH PASSWORD 'postgres';" 2>/dev/null || true

# 4. Allow password auth — update pg_hba.conf if needed
HBA=$(sudo -u postgres psql -tAc "SHOW hba_file;")
echo "  pg_hba.conf: $HBA"

# 5. Run Alembic migrations
echo "→ Activating virtualenv and running migrations..."
cd "$(dirname "$0")"
source venv/bin/activate
alembic upgrade head

echo "=== Done! Database is ready. ==="
