# ADR-005: Real-time Pipeline Architecture

**Статус:** Accepted
**Дата:** 2026-04-01

## Контекст
ML-pipeline обрабатывает 900+ фото за ~10 минут. Пользователь должен видеть прогресс в реальном времени.

## Решение
**FastAPI native WebSocket**.

## Обоснование
- Достаточно для single-server (не нужен horizontal scaling)
- Нет дополнительных зависимостей (Celery, Redis)
- Протокол сообщений: `{stage: "detecting"|"embedding"|"clustering", progress: 0-100, eta_seconds: int}`
- Двусторонняя связь: возможность отмены из UI

## Альтернативы
| Подход | Плюсы | Минусы | Статус |
|---|---|---|---|
| SSE (Server-Sent Events) | Проще | Однонаправленный, нет отмены | Отклонено |
| Polling | Совместимый | Неэффективно, задержки | Fallback |
| Celery + Redis | Масштабируемый | Overkill для MVP, 2 доп. сервиса | Отклонено |

## Fallback
Polling если WebSocket недоступен (корпоративные прокси).

## Последствия
- Pipeline работает в asyncio task, не блокирует API
- WebSocket endpoint: `/events/{event_id}/pipeline/ws`
