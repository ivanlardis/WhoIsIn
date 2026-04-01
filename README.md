# WhoIsIn

Интеллектуальный сервис для сортировки фотографий по лицам. Загрузите фото с мероприятия — сервис автоматически найдёт лица, сгруппирует по людям и позволит каждому участнику найти себя по селфи.

> **Demo:** [http://185.46.11.151](http://185.46.11.151) — рабочий инстанс на VPS

## Возможности

- **Real-time pipeline** — обработка фото с визуальным прогрессом через WebSocket
- **Поиск по селфи** — загрузите фото лица → мгновенно найдите все свои фотографии
- **Галерея персон** — автоматическая группировка по людям с превью лиц
- **ZIP-экспорт** — скачивание всех фото конкретного человека одним архивом
- **Privacy-first** — consent flow для биометрии, эндпоинт удаления данных
- **ML Benchmark** — сравнение 3 моделей с precision/recall/F1 метриками

## Стек

| Компонент | Технология |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| ML | InsightFace (ArcFace 512-dim), HDBSCAN |
| Database | PostgreSQL 16 + pgvector |
| Deploy | Docker Compose |

## Быстрый старт

### Разработка (локально)
```bash
git clone https://github.com/ivanlardis/WhoIsIn.git
cd WhoIsIn
docker compose up -d
open http://localhost:3000
```

### Production (VPS)
```bash
git clone https://github.com/ivanlardis/WhoIsIn.git /opt/whoisin
cd /opt/whoisin
cp .env.example .env   # заполнить POSTGRES_PASSWORD и OPENROUTER_API_KEY
docker compose -f docker-compose.prod.yml up -d --build
```

Подробнее: [docs/VPS_DEPLOY.md](docs/VPS_DEPLOY.md)

## Design System

- **Стиль:** Minimalism (Swiss Style)
- **Палитра:** Indigo #6366F1 + Emerald CTA #10B981
- **Шрифты:** Space Grotesk (заголовки) + DM Sans (текст) + JetBrains Mono (метрики)

Подробнее: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

## Архитектура

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│ Frontend │────▶│ FastAPI      │────▶│ PostgreSQL │
│ React    │◀────│ + WebSocket  │     │ + pgvector │
└──────────┘     └──────┬───────┘     └────────────┘
                        │
                 ┌──────▼───────┐
                 │ ML Pipeline  │
                 │ InsightFace  │
                 │ HDBSCAN      │
                 └──────────────┘
```

## Процесс разработки

Проект разработан по методологии **BMAD-METHOD** (AI-driven agile) с полным spec-driven циклом:

1. **PRD** → Product Requirements Document ([docs/PRD.md](docs/PRD.md))
2. **ADR** → 7 Architecture Decision Records ([docs/ADR/](docs/ADR/))
3. **OpenAPI** → API спецификация ([docs/openapi.yaml](docs/openapi.yaml))
4. **DB Schema** → PostgreSQL + pgvector ([docs/schema.sql](docs/schema.sql))
5. **Design System** → UI/UX Pro Max ([docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md))
6. **Implementation** → Backend + Frontend
7. **Benchmark** → ML model comparison

Подробнее: [docs/PROCESS.md](docs/PROCESS.md) | [docs/DECISION_LOG.md](docs/DECISION_LOG.md)

## API

15 эндпоинтов, описанных в [OpenAPI spec](docs/openapi.yaml):

| Группа | Эндпоинты |
|---|---|
| Events | CRUD мероприятий |
| Photos | Batch upload, список, детали |
| Pipeline | Запуск, статус, WebSocket real-time |
| Persons | Галерея, переименование, ZIP |
| Search | Селфи (top-3), семантический |
| Privacy | Consent, удаление данных |
| Benchmark | Запуск, результаты |

## Документация

- [PRD.md](docs/PRD.md) — требования к продукту
- [ADR/](docs/ADR/) — архитектурные решения
- [openapi.yaml](docs/openapi.yaml) — API контракт
- [schema.sql](docs/schema.sql) — схема базы данных
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — дизайн-система
- [PROCESS.md](docs/PROCESS.md) — процесс разработки
- [DECISION_LOG.md](docs/DECISION_LOG.md) — журнал решений

## Лицензия

MIT
