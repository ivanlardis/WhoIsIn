# WhoIsIn — Документация процесса разработки

> Этот файл описывает каждый шаг разработки проекта.
> Обновляется по мере продвижения по роадмапу.

---

## Методология

**BMAD-METHOD** — AI-driven agile framework с специализированными агентами.
**Spec-driven** — сначала спецификация, потом код. OpenAPI как source of truth.
**Claude Code** — основной инструмент разработки с кастомными скиллами и MCP.

### Инструменты процесса

| Инструмент | Роль в процессе |
|---|---|
| BMAD-METHOD | Структурированный workflow с агентами (PM, Architect, UX, Dev) |
| UI/UX Pro Max | Дизайн-система: стили, палитры, шрифты |
| frontend-design | Bold UI вместо generic AI-дефолтов |
| Excalidraw Generator | Архитектурные диаграммы из текста |
| Code Reviewer | Автоматическое ревью после каждой фазы |
| webapp-testing | Автотесты UI через Playwright |
| frontend-slides | HTML-презентация с анимациями из кода |
| orval | Генерация React Query хуков из OpenAPI |
| Playwright MCP | Скриншоты UI + тестирование |
| PostgreSQL MCP | Прямые запросы к БД |
| GitHub CLI | Issues, milestones, трекинг прогресса |

### Кастомные скиллы

| Скилл | Что делает |
|---|---|
| `/log-decision` | Добавляет запись в DECISION_LOG.md с таймстемпом |
| `/create-issue` | Создаёт GitHub Issue с milestone и labels |
| `/screenshot` | Скриншот UI → tmp/screenshots/ с таймстемпом |

---

## Шаги разработки

### Шаг 0: Подготовка среды
**Статус:** ✅ Завершён
**Время:** ~15 мин

**Что сделали:**
- Установили BMAD-METHOD (43 скилла: PM, Architect, UX, Dev, QA, Tech Writer и др.)
- Создали CLAUDE.md — проектная память (стек, команды, правила кодирования)
- Настроили GitHub: 7 milestones (Phase 0-6), 6 labels, 8 issues
- Создали 3 кастомных скилла: `/log-decision`, `/create-issue`, `/screenshot`
- MCP: Playwright (подключён), PostgreSQL (подключим при создании БД)

**Решения:**
| Решение | Выбор | Почему | Альтернативы |
|---|---|---|---|
| Методология | BMAD-METHOD | Структурированный AI-driven agile с трассируемой цепочкой | Ad-hoc промптинг, собственный workflow |
| Трекинг | GitHub Issues + Decision Log | Прозрачность для команды + история решений в git blame | Notion, Linear, только TODO.md |
| Spec-driven тулинг | orval (OpenAPI → React Query) | Type-safe API client, автогенерация | openapi-generator, ручной fetch |

**Артефакты:** CLAUDE.md, .claude/skills/\*, \_bmad/\*, GitHub Issues #1-#8

---

### Шаг 1: Продуктовая спецификация (PRD)
**Статус:** ✅ Завершён
**Агент:** BMAD PM Agent (bmad-create-prd, 12 шагов)

**Что сделали:**
- Прошли полный BMAD PRD workflow (12 шагов): init → discovery → vision → executive summary → success criteria → journeys → domain → innovation → project type → scoping → functional → non-functional
- Определили 2 типа пользователей: организатор + участник
- 3 дифференциатора: real-time pipeline, selfie search, ML benchmark
- MoSCoW-приоритизация: 11 Must Have, 3 Should Have, 4 Could Have
- 6 групп функциональных требований (FR-1..FR-6)
- 5 нефункциональных требований (NFR-1..NFR-5)
- Privacy requirements: consent, data deletion, local storage only

**Артефакты:** docs/PRD.md

---

### Шаг 2: Архитектурные решения (ADR)
**Статус:** ✅ Завершён
**Агент:** BMAD Architect Agent

**Что сделали:**
- 7 ADR записаны в docs/ADR/ (001-007)
- Каждый ADR: контекст, решение, обоснование, альтернативы с причинами отклонения
- Decision Log обновлён сводной таблицей всех решений

**Ключевые решения:**
| ADR | Решение | Почему |
|---|---|---|
| ML Model | InsightFace buffalo_sc | 3x CPU speed |
| Clustering | HDBSCAN | Без ручного eps |
| Database | PostgreSQL + pgvector | Unified relational + vector |
| Frontend | React + shadcn/ui | Production UI + orval codegen |
| Pipeline | FastAPI WebSocket | Minimal deps |
| Search | OpenRouter gemini-flash | $0.005/photo |
| Deploy | Docker + Рег.ру | Почасовая оплата |

**Артефакты:** docs/ADR/001-007.md, обновлён DECISION_LOG.md

---

### Шаг 3: API-контракт (OpenAPI)
**Статус:** ✅ Завершён
**Агент:** BMAD Architect Agent

**Что будем делать:**
- OpenAPI 3.1 spec со всеми эндпоинтами
- WebSocket протокол для real-time прогресса
- Примеры запросов/ответов

---

### Шаг 4: Схема БД
**Статус:** ✅ Завершён

**Что будем делать:**
- SQL-схема: events, photos, faces, persons, consent_records
- pgvector для эмбеддингов (512-dim)
- Индексы, миграции

---

### Шаг 5: UI/UX дизайн
**Статус:** ✅ Завершён
**Агент:** BMAD UX Agent + UI/UX Pro Max

**Что будем делать:**
- Выбор стиля, палитры, шрифтов через UI/UX Pro Max
- Wireframes основных экранов
- Тёмная/светлая тема

---

### Шаг 6: Backend
**Статус:** ✅ Завершён
**Агент:** 2 параллельных Claude Code агента

**Что сделали (1776 строк кода):**
- FastAPI app с CORS, lifespan, static files
- Async SQLAlchemy + pgvector модели (7 таблиц)
- Pydantic schemas с camelCase aliases по OpenAPI
- ML сервисы: FaceDetector (InsightFace), FaceClusterer (HDBSCAN), PipelineOrchestrator (WebSocket)
- 15 API endpoints: events, photos, pipeline, persons, search, privacy
- WebSocket manager для real-time прогресса

**Артефакты:** backend/ (20 Python файлов), Dockerfile, docker-compose.yml

---

### Шаг 7: Frontend
**Статус:** ✅ Завершён
**Агент:** Claude Code агент + UI/UX Pro Max skill

**Что сделали (5977 строк):**
- React 19 + Vite + Tailwind v4
- Design System через UI/UX Pro Max: Minimalism + Indigo + Space Grotesk/DM Sans
- 7 компонентов: UploadZone, PipelineProgress, PersonCard, PhotoGrid, PhotoLightbox, SelfieSearch, ConsentBanner
- 3 страницы: EventsPage, EventPage, PersonPage
- Typed API client + React Query hooks + WebSocket hook
- Dockerfile (multi-stage) + nginx.conf

**Артефакты:** frontend/ (18 файлов), docs/DESIGN_SYSTEM.md

---

### Шаг 8: Фичи
**Статус:** ✅ Интегрировано в backend/frontend
**Примечание:** Selfie search, consent, ZIP export, переименование — реализованы в Phase 2/3

---

### Шаг 9: ML Benchmark
**Статус:** 🔄 В процессе

---

### Шаг 10: Docker + Deploy
**Статус:** ⏳ Ожидает

---

### Шаг 11: Презентация
**Статус:** ⏳ Ожидает

---

## Общая статистика (заполняется в конце)

| Метрика | Значение |
|---|---|
| Общее время разработки | — |
| Количество коммитов | — |
| Количество GitHub Issues | — |
| Количество ADR | — |
| Записей в Decision Log | — |
| Автотестов UI | — |
| Скриншотов | — |
| Токенов Claude Code | — |
| $ потрачено на OpenRouter | — |
