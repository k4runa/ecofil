#!/bin/bash
set -e

# 1. Frontend Build (Only local if npm is available, skipped in Docker)
if command -v npm &> /dev/null && [ -d "web" ]; then
    echo "🚀 Local environment detected. Building Next.js Frontend..."
    cd web
    npm install --no-audit --no-fund
    npm run build
    cd ..
    mkdir -p frontend
    rm -rf frontend/*
    cp -r web/out/* frontend/
    echo "✅ Frontend Build Complete!"
else
    echo "⚡ Skipping frontend build (Docker/Production or npm not found)."
fi

# 2. Update database tables to the latest version (Alembic)
echo "Running database migrations..."
alembic upgrade head

# 3. Start the application with Gunicorn (Memory-friendly settings)
echo "Starting CineWave API..."
exec gunicorn -w ${WEB_CONCURRENCY:-2} -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT:-8000} --access-logfile -
