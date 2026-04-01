# Деплой WhoIsIn на VPS

## Требования к серверу
- Ubuntu 22.04 / Debian 12
- 4 vCPU, 8 GB RAM (рекомендуется для InsightFace)
- 40+ GB диска
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS опционально)

## 1. Первичная настройка VPS

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version && docker compose version
```

## 2. Клонирование и настройка

```bash
sudo mkdir -p /opt/whoisin
sudo chown $USER:$USER /opt/whoisin
git clone https://github.com/ivanlardis/WhoIsIn.git /opt/whoisin
cd /opt/whoisin

# Создать .env из примера
cp .env.example .env
nano .env
# → установить POSTGRES_PASSWORD и OPENROUTER_API_KEY
```

## 3. Первый запуск

```bash
cd /opt/whoisin

# Поднять стек (сборка займёт 10-15 мин из-за InsightFace)
docker compose -f docker-compose.prod.yml up -d --build

# Проверить статус
docker compose -f docker-compose.prod.yml ps

# Логи backend
docker compose -f docker-compose.prod.yml logs backend -f
```

## 4. Проверка

```bash
# Health check
curl http://localhost/api/v1/../health

# Открыть в браузере
http://<IP_СЕРВЕРА>
```

## 5. Обновление приложения

```bash
cd /opt/whoisin
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Полезные команды

```bash
# Логи всех сервисов
docker compose -f docker-compose.prod.yml logs -f

# Остановить
docker compose -f docker-compose.prod.yml down

# Сброс данных (ОСТОРОЖНО — удаляет БД и фото)
docker compose -f docker-compose.prod.yml down -v
```

## Примечания

- **Первая загрузка модели InsightFace** (`buffalo_sc`) происходит при первом запуске pipeline — займёт ~2-5 мин, модель кэшируется в контейнере.
- **Лимит загрузки файлов**: настроен `client_max_body_size 500M` в nginx.
- **Данные сохраняются** в docker volumes `whoisin_pgdata` и `whoisin_uploads` — не теряются при перезапуске.
- **Порт 5432** (PostgreSQL) не выставлен наружу в prod-конфиге.
