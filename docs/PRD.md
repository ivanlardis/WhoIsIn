---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['docs/task1_photo_sorter.md', 'docs/DECISION_LOG.md', 'docs/PROCESS.md']
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general_cv
  complexity: medium
  projectContext: greenfield
  users:
    - participant (ищет свои фото)
    - organizer (обрабатывает фотоотчёт)
  keyAccent: real-time processing and speed
vision:
  differentiators:
    - Real-time pipeline с WebSocket прогрессом
    - Поиск по селфи через векторный поиск
    - Полноценный продукт, а не скрипт
  coreInsight: Существующие решения — скрипты для разработчиков. WhoIsIn — продукт для людей.
---

# Product Requirements Document - WhoIsIn

**Author:** Ivanlardis
**Date:** 2026-04-01

## Executive Summary

WhoIsIn — интеллектуальный сервис для сортировки фотографий по лицам, ориентированный на мероприятия (конференции, митапы, корпоративные события). Организатор загружает фотоотчёт — сервис автоматически находит лица, группирует фото по людям и предоставляет участникам инструмент мгновенного поиска себя по селфи.

Целевые пользователи:
- **Организатор мероприятия** — загружает фото, управляет обработкой, получает структурированную библиотеку и аналитику
- **Участник мероприятия** — загружает селфи и за секунды находит все свои фото, скачивает ZIP

### What Makes This Special

1. **Real-time pipeline с визуальной обратной связью.** Пользователь видит процесс обработки в реальном времени через WebSocket: этап детекции, эмбеддингов, кластеризации, прогресс-бар и ETA. Не чёрный ящик, а прозрачный процесс.

2. **Поиск по селфи.** Участник загружает своё фото — система мгновенно находит все совпадения через векторный поиск (pgvector, cosine similarity). Момент «wow» — от селфи до галереи за секунды.

3. **Полноценный продукт, а не скрипт.** Веб-интерфейс с управлением мероприятиями, переименованием персон, ZIP-экспортом, consent-flow для биометрии и семантическим поиском по описанию фото.

## Project Classification

- **Тип:** Web Application (SPA + Backend API + ML Pipeline)
- **Домен:** Computer Vision / Event Management
- **Сложность:** Medium
- **Контекст:** Greenfield — новый продукт с нуля

## Success Criteria

### User Success
- Участник загружает селфи → находит все свои фото **за < 3 секунд**
- Организатор загружает 900 фото → обработка завершается **за < 10 минут** (CPU-only)
- Пользователь видит прогресс обработки в реальном времени — нет момента «завис, непонятно что происходит»
- Скачивание ZIP персоны — в 1 клик

### Business Success
- Сервис полностью функционален и задеплоен на VPS
- Интерфейс производит впечатление продукта, а не прототипа
- Процесс разработки документирован и воспроизводим

### Technical Success
- Точность детекции лиц: **> 90%** на типичных фото с мероприятий
- Ложные группировки (разные люди в одной группе): **< 5%**
- Бенчмарк 3 ML-моделей с precision/recall/F1
- Полный spec-driven pipeline: OpenAPI → автогенерация клиента → тесты
- Privacy: consent flow работает, данные удаляемы

### Measurable Outcomes
| Метрика | Цель |
|---|---|
| Время обработки 900 фото | < 10 мин (CPU-only) |
| Поиск по селфи | < 3 сек |
| Face detection rate | > 90% |
| False grouping rate | < 5% |
| Бюджет OpenRouter | < $5 |

## Product Scope

### MVP - Minimum Viable Product
- Загрузка фото (drag & drop, batch)
- Детекция лиц + эмбеддинги + кластеризация по персонам
- Real-time WebSocket pipeline прогресс
- Галерея персон с превью лиц
- Поиск по селфи (top-3 с confidence)
- Переименование персон
- ZIP-экспорт фото персоны
- Consent banner (биометрия)
- Docker deploy

### Growth Features (Post-MVP)
- Семантический поиск по тексту ("девушка в красном")
- Аналитика: гендер, возраст, пиковые моменты по EXIF
- Социальный граф (кто с кем фотографировался)
- Множественные мероприятия
- Aesthetic scoring (лучшие фото)

### Vision (Future)
- Telegram-бот для участников
- Мульти-мероприятия с отслеживанием персон между событиями
- Автоуведомления участникам
- API для интеграции с event-платформами

## User Journeys

### Journey 1: Марина — организатор конференции

**Ситуация:** Марина — организатор TechCommunity Fest. Фотограф прислал 682 фотографии. Участники в чате просят фото. Разбирать вручную — 2 дня работы.

**Путь:**
1. Марина открывает WhoIsIn, создаёт мероприятие "TechCommunity Fest 2026"
2. Drag & drop — загружает все 682 фото одним движением
3. Видит real-time прогресс: "Детекция лиц... 47/682... ~4 мин осталось"
4. Consent banner — подтверждает согласие на обработку
5. Обработка завершена: "Найдено 89 персон, 1240 лиц"
6. Открывает галерею персон — карточки с превью лиц
7. Переименовывает узнанных: "Person_12" → "Алексей Петров"
8. Отправляет ссылку на сервис участникам в чат

**Момент «wow»:** прогресс-бар показывает каждый этап, через 7 минут всё готово. Раньше это заняло бы 2 дня.

### Journey 2: Дима — участник, ищет свои фото

**Ситуация:** Дима получил ссылку от организатора. Хочет найти свои фото для соцсетей.

**Путь:**
1. Открывает ссылку → видит страницу мероприятия
2. Нажимает "Найти себя" → загружает селфи с телефона
3. За 2 секунды получает: "Найдено 3 совпадения (confidence: 94%, 91%, 87%)"
4. Просматривает свои фото, выбирает лучшие
5. Нажимает "Скачать ZIP" → получает архив

**Момент «wow»:** от селфи до ZIP за 30 секунд.

### Journey 3: Дима — edge case, не нашёл себя

**Ситуация:** Дима загрузил селфи, но он был в солнечных очках на конференции.

**Путь:**
1. Загружает селфи → "Найдено 0 совпадений"
2. Видит подсказку: "Попробуйте другое фото или просмотрите галерею"
3. Открывает галерею всех персон, скроллит
4. Находит себя среди карточек, кликает → видит свои фото
5. Скачивает ZIP

**Момент recovery:** понятная навигация, не тупик.

### Journey Requirements Summary

| Journey | Capabilities |
|---|---|
| Организатор | Создание мероприятия, batch upload, real-time pipeline, переименование, шаринг ссылки |
| Участник (happy) | Selfie search, просмотр, ZIP export |
| Участник (edge) | Галерея персон, browse, fallback navigation |

## Domain-Specific Requirements

### Privacy & Биометрия
- Обработка лиц — биометрические данные. Consent banner обязателен перед любой обработкой
- Эндпоинт удаления данных (`DELETE /events/{id}/data`) — право забыть
- Эмбеддинги лиц хранятся только в БД сервера, не передаются третьим сторонам
- Фото с OpenRouter описываются без передачи лиц (только полные фото для описания сцены)

### Technical Constraints
- CPU-only инференс — нет GPU на сервере
- Модели InsightFace ONNX оптимизированы для многопоточного CPU
- Максимальный размер загрузки: 900 фото × ~5MB = ~4.5GB → chunked upload
- PostgreSQL pgvector: cosine similarity на 512-dim векторах

### Risk Mitigations
| Риск | Митигация |
|---|---|
| Ложные группировки | HDBSCAN без eps-тюнинга + confidence threshold |
| Медленная обработка на CPU | buffalo_sc (3x быстрее), batch processing, progress feedback |
| Утечка биометрии | Данные только на сервере, consent flow, endpoint удаления |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Real-time ML pipeline с WebSocket feedback** — существующие face-sorting инструменты работают как batch-процесс (загрузил → ждёшь → результат). WhoIsIn показывает обработку в реальном времени: этап за этапом, прогресс, ETA. Прозрачный процесс вместо чёрного ящика.

2. **Selfie-first UX** — инверсия привычного паттерна. Обычно: "просмотри 900 фото, найди себя". WhoIsIn: "загрузи селфи — мы найдём тебя". Смена парадигмы поиска.

3. **ML model benchmark как фича продукта** — прозрачное сравнение моделей с метриками precision/recall/F1. Пользователь видит, какая модель как работает.

### Validation Approach

| Инновация | Как валидируем |
|---|---|
| Real-time pipeline | WebSocket stress-test на 900 фото, замер UX-метрик |
| Selfie search | Precision@3, время ответа < 3 сек |
| ML benchmark | Сравнение precision/recall/F1 на реальном датасете |

### Risk Mitigation

| Риск | Фолбэк |
|---|---|
| WebSocket нестабилен | Polling fallback + SSE как альтернатива |
| Selfie не находит (очки, профиль) | Галерея персон как fallback, подсказки пользователю |
| Benchmark показывает плохие результаты | Тюнинг порогов, документирование ограничений |

## Project Type: Web Application

### Architecture
- **SPA (Single Page Application)** — React 19 с client-side routing
- **Backend API** — FastAPI (Python) с REST + WebSocket
- **ML Pipeline** — серверный, запускается асинхронно

### Browser Support
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile browsers: Chrome/Safari на iOS/Android (responsive)

### Real-time
- WebSocket для pipeline прогресса (FastAPI native)
- Polling fallback если WebSocket недоступен

### Performance Targets
| Метрика | Цель |
|---|---|
| First Contentful Paint | < 1.5 сек |
| Time to Interactive | < 3 сек |
| API response (CRUD) | < 200 мс |
| Selfie search | < 3 сек |
| Photo upload (batch) | Chunked, progressive |

### SEO
- Не требуется — закрытый сервис для участников мероприятий

### Accessibility
- Базовый уровень: WCAG 2.1 AA для ключевых flows
- Keyboard navigation для основных действий

### Responsive Design
- Desktop-first (организатор работает на десктопе)
- Мобильная версия для участника (selfie search, просмотр, скачивание)

## Scoping: Feature Prioritization (MoSCoW)

### Must Have (MVP)
| Feature | Journey | Обоснование |
|---|---|---|
| Создание мероприятия | Организатор | Точка входа |
| Batch photo upload (drag & drop) | Организатор | Core flow |
| Face detection + embeddings | Организатор | Ядро ML |
| Clustering по персонам (HDBSCAN) | Организатор | Группировка |
| Real-time WebSocket pipeline | Организатор | Дифференциатор #1 |
| Галерея персон с превью | Оба | Просмотр результата |
| Selfie search (top-3 + confidence) | Участник | Дифференциатор #2 |
| Переименование персон | Организатор | Управление |
| ZIP-экспорт | Участник | Доставка ценности |
| Consent banner | Оба | Privacy requirement |
| Delete data endpoint | Организатор | Privacy requirement |

### Should Have
| Feature | Обоснование |
|---|---|
| Фото с несколькими лицами → копия в несколько персон | Полнота группировки |
| Превью лица (миниатюра crop) | UX качество |
| Статистика мероприятия | Полезно для организатора |

### Could Have (Post-MVP)
| Feature | Обоснование |
|---|---|
| Семантический поиск по тексту | Growth фича |
| ML model benchmark с отчётом | Дифференциатор #3 |
| Aesthetic scoring | Wow-фича |
| Социальный граф | Analytics |

### Won't Have (Now)
- Telegram-бот
- Мульти-мероприятия с кросс-идентификацией
- Автоуведомления участникам
- API для внешних интеграций

## Functional Requirements (Capability Contract)

### FR-1: Event Management
- FR-1.1: Создание мероприятия (название, дата, описание)
- FR-1.2: Просмотр списка мероприятий
- FR-1.3: Удаление мероприятия и всех данных

### FR-2: Photo Upload
- FR-2.1: Drag & drop загрузка множества файлов
- FR-2.2: Поддержка JPEG, PNG, WebP
- FR-2.3: Chunked upload для больших батчей (900+ фото)
- FR-2.4: Отображение превью при загрузке

### FR-3: ML Pipeline
- FR-3.1: Детекция лиц (InsightFace buffalo_sc)
- FR-3.2: Генерация эмбеддингов (ArcFace 512-dim)
- FR-3.3: Кластеризация (HDBSCAN)
- FR-3.4: Генерация превью лица (crop)
- FR-3.5: Real-time прогресс через WebSocket (stage, progress%, ETA)

### FR-4: Person Management
- FR-4.1: Галерея персон с миниатюрами лиц и количеством фото
- FR-4.2: Просмотр всех фото персоны
- FR-4.3: Переименование персоны
- FR-4.4: ZIP-экспорт всех фото персоны

### FR-5: Search
- FR-5.1: Selfie search — загрузка фото → top-3 совпадения с confidence score
- FR-5.2: (Post-MVP) Семантический текстовый поиск

### FR-6: Privacy
- FR-6.1: Consent banner перед обработкой
- FR-6.2: API удаления всех данных мероприятия
- FR-6.3: Эмбеддинги не передаются третьим сторонам

## Non-Functional Requirements

### NFR-1: Performance
- Обработка 900 фото: < 10 мин на 4 vCPU / 8 GB RAM
- Selfie search: < 3 сек
- API CRUD operations: < 200 мс
- FCP: < 1.5 сек, TTI: < 3 сек

### NFR-2: Reliability
- Graceful error handling: если ML падает на одном фото — пропускает, не останавливает pipeline
- WebSocket reconnect при обрыве соединения

### NFR-3: Security
- Файлы хранятся только на сервере
- Защита от path traversal при загрузке

### NFR-4: Deployability
- Docker Compose: backend + frontend + PostgreSQL
- Single-command deploy: `docker-compose up`
- VPS: 4 vCPU, 8 GB RAM, 40 GB NVMe

### NFR-5: Maintainability
- OpenAPI spec как source of truth
- Type hints (Python), strict TypeScript
- Автогенерация API client (orval)
