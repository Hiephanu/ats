#!/bin/bash

set -e  # ❌ fail là dừng ngay

echo "🚀 Starting ATS system (PROD)..."

# Load env
if [ -f .env ]; then
  echo "📦 Loading environment variables..."
  export $(grep -v '^#' .env | xargs)
fi

echo "🐳 Building Docker images..."

# Build services
docker build -t ats-ocr:latest ./apps/ocr
docker build -t ats-match:latest ./apps/match

echo "📦 Starting services with docker-compose..."

docker-compose -f docker-compose.prod.yaml up -d

echo "✅ All services are up!"

echo "📊 Running containers:"
docker ps