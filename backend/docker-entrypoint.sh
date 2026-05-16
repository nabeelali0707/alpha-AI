#!/usr/bin/env bash
set -e

POSTGRES_HOST=${POSTGRES_HOST:-db}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
export PGPASSWORD=${POSTGRES_PASSWORD:-example}

echo "Waiting for Postgres at ${POSTGRES_HOST}..."
until psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -c '\l' >/dev/null 2>&1; do
  sleep 1
done

if [ -f /app/supabase/tables.sql ]; then
  echo "Applying database schema (/app/supabase/tables.sql)"
  psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /app/supabase/tables.sql || true
fi

echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8001
