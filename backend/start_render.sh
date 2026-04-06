#!/bin/bash
# Start both the FastAPI API and the LiveKit agent worker together

echo "=== Starting LiveKit Agent Worker ==="
python src/agent.py dev &
AGENT_PID=$!

echo "=== Starting FastAPI Backend ==="
uvicorn src.main:app --host 0.0.0.0 --port $PORT &
API_PID=$!

trap "kill $AGENT_PID $API_PID 2>/dev/null; exit" INT TERM EXIT
wait
