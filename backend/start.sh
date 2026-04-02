#!/bin/bash
# Start the user-owned PostgreSQL cluster (port 5433) + backend server
# Run from: /home/crayond/projects/human-ai-interaction/backend/

PGDATA="/home/crayond/projects/human-ai-interaction/pgdata"
PG_BIN="/usr/lib/postgresql/16/bin"

echo "=== Starting PostgreSQL cluster on port 5433 ==="
$PG_BIN/pg_ctl -D "$PGDATA" -o "-p 5433 -k /tmp" -l "$PGDATA/postgres.log" start 2>&1 || echo "(already running)"

sleep 1
cd "$(dirname "$0")"
source venv/bin/activate

echo "=== Starting LiveKit Voice Agent Worker ==="
python src/agent.py dev &
AGENT_PID=$!

echo "=== Starting FastAPI backend ==="
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

# Trap termination to kill both background processes neatly
trap "kill $AGENT_PID $API_PID 2>/dev/null; exit" INT TERM EXIT
wait
