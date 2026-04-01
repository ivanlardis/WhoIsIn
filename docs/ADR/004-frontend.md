# ADR-004: Frontend Framework

**Статус:** Accepted
**Дата:** 2026-04-01

## Контекст
Необходим красивый, production-quality веб-интерфейс с real-time обновлениями (WebSocket) и responsive design.

## Решение
**React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui**.

## Обоснование
- shadcn/ui — production-quality компоненты, не библиотека (копируются в проект)
- Tailwind — быстрая кастомизация дизайна
- orval генерирует type-safe React Query хуки из OpenAPI spec
- React 19 — зрелая экосистема, хорошо генерируется AI-инструментами
- Vite — мгновенный hot reload для разработки

## Альтернативы
| Фреймворк | Плюсы | Минусы | Статус |
|---|---|---|---|
| Streamlit | Быстрый старт | Ограниченный UI, не production-quality | Отклонено |
| Next.js | SSR, full-stack | SSR не нужен, overhead | Отклонено |
| Svelte + Skeleton | Лёгкий, быстрый | AI-генерация хуже чем для React | Отклонено |

## Последствия
- Node.js 20+ для сборки
- Автогенерация API client через orval при изменении OpenAPI spec
