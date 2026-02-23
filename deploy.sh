#!/bin/bash
# === TMC Portal Deploy Script ===
# Run these commands on the server after SSH-ing in as deploy

set -e

echo "===  Pulling latest code ==="
cd /var/www/tmcportal
git pull origin main

echo "=== Stopping current containers ==="
docker compose down

echo "=== Rebuilding Docker image (no cache) ==="
docker compose build --no-cache

echo "=== Starting containers ==="
docker compose up -d

echo "=== Container status ==="
docker compose ps

echo "=== Recent logs ==="
docker compose logs --tail=50

echo ""
echo "=== Deploy complete! ==="
