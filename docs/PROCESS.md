# WhoIsIn — Документация процесса разработки

> Этот файл описывает каждый шаг разработки для презентации.
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
**Статус:** 🔄 В процессе
**Время:** —

**Что делали:**
- Установили BMAD-METHOD
- Создали CLAUDE.md — проектная память для Claude Code
- Настроили GitHub: milestones (7 фаз), labels (6 категорий), issues
- Установили скиллы: UI/UX Pro Max, frontend-design, skill-creator, Excalidraw, Code Reviewer, webapp-testing, frontend-slides
- Создали кастомные скиллы: /log-decision, /create-issue, /screenshot
- Настроили MCP серверы: Playwright, PostgreSQL

**Решения:**
| Решение | Выбор | Почему | Альтернативы |
|---|---|---|---|
| Методология | BMAD-METHOD | Структурированный AI-driven agile. Ни один конкурент не показал процесс | Ad-hoc промптинг, собственный workflow |
| Трекинг | GitHub Issues + Decision Log | Видимый прогресс для судей + история решений в git blame | Notion, Linear, только TODO.md |
| Spec-driven тулинг | orval (OpenAPI → React Query) | Type-safe API client, автогенерация | openapi-generator, ручной fetch |

**Скриншоты:** —

---

### Шаг 1: Продуктовая спецификация (PRD)
**Статус:** ⏳ Ожидает
**Агент:** BMAD PM Agent

**Что будем делать:**
- Обсуждение с PM Agent: проблема, видение, пользователи
- User stories с приоритетами MoSCoW
- Нефункциональные требования
- Privacy requirements
- Метрики успеха

**Решения:** (заполняется после выполнения)

---

### Шаг 2: Архитектурные решения (ADR)
**Статус:** ⏳ Ожидает
**Агент:** BMAD Architect Agent

**Что будем делать:**
- 7 ADR: ML-модель, кластеризация, БД, фронтенд, пайплайн, семантический поиск, деплой
- Каждое решение обсуждается, записывается в ADR и Decision Log
- Диаграмма архитектуры через Excalidraw

**Решения:** (заполняется после выполнения)

---

### Шаг 3: API-контракт (OpenAPI)
**Статус:** ⏳ Ожидает
**Агент:** BMAD Architect Agent

**Что будем делать:**
- OpenAPI 3.1 spec со всеми эндпоинтами
- WebSocket протокол для real-time прогресса
- Примеры запросов/ответов

---

### Шаг 4: Схема БД
**Статус:** ⏳ Ожидает

**Что будем делать:**
- SQL-схема: events, photos, faces, persons, consent_records
- pgvector для эмбеддингов (512-dim)
- Индексы, миграции

---

### Шаг 5: UI/UX дизайн
**Статус:** ⏳ Ожидает
**Агент:** BMAD UX Agent + UI/UX Pro Max

**Что будем делать:**
- Выбор стиля, палитры, шрифтов через UI/UX Pro Max
- Wireframes основных экранов
- Тёмная/светлая тема

---

### Шаг 6: Backend
**Статус:** ⏳ Ожидает
**Агент:** BMAD Developer Agent

---

### Шаг 7: Frontend
**Статус:** ⏳ Ожидает
**Агент:** BMAD Developer Agent

---

### Шаг 8: Фичи
**Статус:** ⏳ Ожидает

---

### Шаг 9: ML Benchmark
**Статус:** ⏳ Ожидает

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
| Скриншотов для презентации | — |
| Токенов Claude Code | — |
| $ потрачено на OpenRouter | — |
