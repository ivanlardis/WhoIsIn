"""ML benchmark service — compares face detection models on precision/recall/F1."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BenchmarkResult, Photo
from app.services.detector import DetectedFace, FaceDetector

logger = logging.getLogger(__name__)

# Models to benchmark. The first entry is treated as ground truth.
BENCHMARK_MODELS: list[str] = [
    "buffalo_l",   # ground truth — highest accuracy
    "buffalo_sc",  # lightweight CPU-friendly
    "antelopev2",  # alternative model (ArcFace + scrfd detector)
]

IOU_THRESHOLD: float = 0.5


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ModelMetrics:
    """Per-model aggregated metrics."""

    model_name: str
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    avg_time_per_photo: float = 0.0
    total_photos: int = 0


@dataclass
class PhotoDetectionResult:
    """Raw detection output for a single photo + model."""

    photo_id: int
    model_name: str
    faces: list[DetectedFace] = field(default_factory=list)
    elapsed_seconds: float = 0.0


@dataclass
class BenchmarkReport:
    """Full benchmark report across all models."""

    event_id: int
    sample_size: int
    model_metrics: list[ModelMetrics] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _bbox_to_xyxy(bbox: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    """Convert (x, y, w, h) normalised bbox to (x1, y1, x2, y2)."""
    x, y, w, h = bbox
    return (x, y, x + w, y + h)


def compute_iou(
    bbox_a: tuple[float, float, float, float],
    bbox_b: tuple[float, float, float, float],
) -> float:
    """Compute Intersection over Union for two (x, y, w, h) bounding boxes.

    Both bounding boxes are expected in normalised [0..1] coordinates.
    """
    a = _bbox_to_xyxy(bbox_a)
    b = _bbox_to_xyxy(bbox_b)

    inter_x1 = max(a[0], b[0])
    inter_y1 = max(a[1], b[1])
    inter_x2 = min(a[2], b[2])
    inter_y2 = min(a[3], b[3])

    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])

    union_area = area_a + area_b - inter_area
    if union_area <= 0:
        return 0.0

    return inter_area / union_area


def _match_detections(
    ground_truth: list[DetectedFace],
    predictions: list[DetectedFace],
    iou_threshold: float = IOU_THRESHOLD,
) -> tuple[int, int, int]:
    """Match predictions against ground truth using greedy IoU matching.

    Returns (true_positives, false_positives, false_negatives).
    """
    if not ground_truth:
        return 0, len(predictions), 0
    if not predictions:
        return 0, 0, len(ground_truth)

    gt_matched: set[int] = set()
    tp = 0

    # Sort predictions by confidence (highest first) for greedy matching
    sorted_preds = sorted(predictions, key=lambda f: f.confidence, reverse=True)

    for pred in sorted_preds:
        best_iou = 0.0
        best_gt_idx = -1

        for gt_idx, gt_face in enumerate(ground_truth):
            if gt_idx in gt_matched:
                continue
            iou = compute_iou(pred.bbox, gt_face.bbox)
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = gt_idx

        if best_iou >= iou_threshold and best_gt_idx >= 0:
            tp += 1
            gt_matched.add(best_gt_idx)

    fp = len(predictions) - tp
    fn = len(ground_truth) - len(gt_matched)
    return tp, fp, fn


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class BenchmarkService:
    """Compares multiple face detection models on a sample of photos."""

    def __init__(self, models: list[str] | None = None) -> None:
        self._model_names = models or BENCHMARK_MODELS

    async def _get_sample_photos(
        self,
        event_id: int,
        sample_size: int,
        db: AsyncSession,
    ) -> list[Photo]:
        """Fetch a random sample of photos for the given event."""
        stmt = (
            select(Photo)
            .where(Photo.event_id == event_id)
            .order_by(func.random())
            .limit(sample_size)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def _detect_with_model(
        self,
        model_name: str,
        photo: Photo,
    ) -> PhotoDetectionResult:
        """Run detection on a single photo with a specific model."""
        detector = FaceDetector(model_name=model_name)

        start = time.perf_counter()
        faces = await detector.detect_faces(photo.filepath)
        elapsed = time.perf_counter() - start

        return PhotoDetectionResult(
            photo_id=photo.id,
            model_name=model_name,
            faces=faces,
            elapsed_seconds=elapsed,
        )

    async def run_benchmark(
        self,
        event_id: int,
        sample_size: int,
        db: AsyncSession,
    ) -> BenchmarkReport:
        """Run a full benchmark comparing all configured models.

        1. Get *sample_size* random photos from the event.
        2. For each model, detect faces on every photo and record timings.
        3. Use the first model (buffalo_l) as ground truth.
        4. Calculate precision / recall / F1 per model.
        5. Persist results to ``benchmark_results`` and return a report.
        """
        photos = await self._get_sample_photos(event_id, sample_size, db)
        if not photos:
            logger.warning("No photos found for event %d", event_id)
            return BenchmarkReport(event_id=event_id, sample_size=0)

        actual_sample = len(photos)
        logger.info(
            "Benchmark: %d photos sampled for event %d, models=%s",
            actual_sample,
            event_id,
            self._model_names,
        )

        # model_name -> list of PhotoDetectionResult
        all_results: dict[str, list[PhotoDetectionResult]] = {
            m: [] for m in self._model_names
        }

        for model_name in self._model_names:
            logger.info("Running model '%s' on %d photos …", model_name, actual_sample)
            for photo in photos:
                result = await self._detect_with_model(model_name, photo)
                all_results[model_name].append(result)

        # Ground truth is the first model
        gt_model = self._model_names[0]
        gt_results = all_results[gt_model]

        report = BenchmarkReport(event_id=event_id, sample_size=actual_sample)

        for model_name in self._model_names:
            model_results = all_results[model_name]
            total_tp = 0
            total_fp = 0
            total_fn = 0
            total_time = 0.0

            for gt_res, pred_res in zip(gt_results, model_results, strict=True):
                tp, fp, fn = _match_detections(gt_res.faces, pred_res.faces)
                total_tp += tp
                total_fp += fp
                total_fn += fn
                total_time += pred_res.elapsed_seconds

            precision = (
                total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
            )
            recall = (
                total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
            )
            f1 = (
                2 * precision * recall / (precision + recall)
                if (precision + recall) > 0
                else 0.0
            )
            avg_time = total_time / actual_sample if actual_sample > 0 else 0.0

            metrics = ModelMetrics(
                model_name=model_name,
                precision=round(precision, 4),
                recall=round(recall, 4),
                f1=round(f1, 4),
                avg_time_per_photo=round(avg_time, 4),
                total_photos=actual_sample,
            )
            report.model_metrics.append(metrics)

            # Persist to DB
            db.add(
                BenchmarkResult(
                    model_name=model_name,
                    precision_score=metrics.precision,
                    recall_score=metrics.recall,
                    f1_score=metrics.f1,
                    avg_time_per_photo=metrics.avg_time_per_photo,
                    total_photos=metrics.total_photos,
                )
            )

        await db.flush()
        logger.info("Benchmark complete for event %d", event_id)
        return report
