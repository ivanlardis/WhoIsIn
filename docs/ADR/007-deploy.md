# ADR-007: Deployment Strategy

**Статус:** Accepted
**Дата:** 2026-04-01

## Контекст
Сервис должен быть доступен по публичной ссылке. CPU-only (нет GPU). Нужен простой деплой.

## Решение
**Docker Compose** (backend + frontend + PostgreSQL + nginx) на **VPS** (Рег.ру, почасовая оплата).

## Обоснование
- Docker Compose: single-command deploy (`docker-compose up -d`)
- Воспроизводимость: одинаковое окружение на dev и prod
- nginx: reverse proxy + раздача статики frontend
- Рег.ру: почасовая оплата — экономично для POC

## Спецификации VPS
| Параметр | Значение |
|---|---|
| vCPU | 4 |
| RAM | 8 GB |
| Диск | 40 GB NVMe SSD |
| ОС | Ubuntu 22.04 |
| Провайдер | Рег.ру (почасовая оплата) |

## Альтернативы
| Подход | Плюсы | Минусы | Статус |
|---|---|---|---|
| Kubernetes | Масштабируемый | Overkill для single-server | Отклонено |
| Bare metal | Быстрее | Не воспроизводимо | Отклонено |
| Serverless | Автомасштабирование | Не подходит для ML-инференса | Отклонено |
| Timeweb/Selectel | Хорошие VPS | Нет почасовой оплаты | Отклонено |

## Последствия
- Dockerfile для backend и frontend
- docker-compose.yml с volumes для фото и PostgreSQL данных
- Nginx конфиг для проксирования и WebSocket
