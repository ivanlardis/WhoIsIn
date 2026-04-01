#!/usr/bin/env bash
# WhoIsIn — скрипт деплоя на VPS
# Использование: ./deploy.sh
# Требования: Docker 24+, Docker Compose v2, git

set -euo pipefail

REPO_URL="https://github.com/ivanlardis/WhoIsIn.git"
APP_DIR="/opt/whoisin"
COMPOSE_FILE="docker-compose.prod.yml"

echo "==> WhoIsIn deploy script"

# 1. Клонируем или обновляем репозиторий
if [ -d "$APP_DIR/.git" ]; then
    echo "==> Updating repo..."
    git -C "$APP_DIR" pull --ff-only
else
    echo "==> Cloning repo..."
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# 2. Проверяем .env
if [ ! -f .env ]; then
    echo "ERROR: .env not found. Copy .env.example and fill values:"
    echo "  cp .env.example .env && nano .env"
    exit 1
fi

# 3. Собираем и поднимаем
echo "==> Building images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "==> Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Waiting for services..."
sleep 10
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "==> Done! App is running at http://$(curl -s ifconfig.me 2>/dev/null || echo '<YOUR_IP>')"
