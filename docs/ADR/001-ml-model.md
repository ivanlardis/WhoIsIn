# ADR-001: Face Detection and Embedding Model

**Статус:** Accepted
**Дата:** 2026-04-01

## Контекст
Необходимо детектировать и создавать эмбеддинги лиц на 900+ фотографиях. Сервер CPU-only (нет GPU).

## Решение
**InsightFace buffalo_sc** как основная модель. **buffalo_l** и **MediaPipe** для бенчмарка.

## Обоснование
- buffalo_sc — 3x быстрее buffalo_l на CPU при достаточной точности
- ArcFace embeddings 512-dim — стандарт индустрии, совместим с pgvector
- ONNX runtime оптимизирован для многопоточного CPU-инференса

## Альтернативы
| Модель | Плюсы | Минусы | Статус |
|---|---|---|---|
| buffalo_l | Выше точность | 3x медленнее на CPU | Benchmark |
| MediaPipe | Лёгкая, быстрая | Слабые embeddings для кластеризации | Benchmark |
| DeepFace | Много моделей | Тяжёлые зависимости, сложная настройка | Отклонено |

## Валидация
Benchmark всех 3 моделей с precision/recall/F1 на реальном датасете (Phase 4).

## Последствия
- Зависимость от onnxruntime и insightface PyPI пакетов
- Модели весят ~100-300 MB, включаются в Docker-образ
