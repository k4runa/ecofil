#!/bin/bash
set -e

# build_frontend.sh — Builds the Next.js frontend and moves it to the static folder.
# This script is called by the Render build command.

echo "🚀 Starting Frontend Build Process..."

if [ -d "web" ]; then
    cd web
    echo "📦 Installing web dependencies..."
    # npm install is already done by the Render build command, but let's be safe
    # npm install --no-audit --no-fund
    
    echo "🏗️ Running Next.js build (Exporting static files)..."
    npm run build
    
    cd ..
    echo "📂 Copying build output to /frontend static directory..."
    mkdir -p frontend
    rm -rf frontend/*
    cp -r web/out/* frontend/
    echo "✅ Frontend build successfully deployed to /frontend"
else
    echo "❌ Error: 'web' directory not found. Skipping build."
    exit 1
fi
