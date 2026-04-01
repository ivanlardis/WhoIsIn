"""Face detection service using InsightFace."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

from app.config import FACE_CONFIDENCE_THRESHOLD, INSIGHTFACE_MODEL

logger = logging.getLogger(__name__)


@dataclass
class DetectedFace:
    """Single detected face result."""

    bbox: tuple[float, float, float, float]  # (x, y, w, h) normalised 0..1
    confidence: float
    embedding: np.ndarray  # 512-dim ArcFace
    face_image: Image.Image  # cropped thumbnail


class FaceDetector:
    """Wraps InsightFace FaceAnalysis for detection + embedding extraction."""

    def __init__(self, model_name: str = INSIGHTFACE_MODEL) -> None:
        self._model_name = model_name
        self._app = None  # lazy init

    def _ensure_model(self) -> None:
        if self._app is not None:
            return
        import insightface  # heavy import — defer

        self._app = insightface.app.FaceAnalysis(
            name=self._model_name,
            providers=["CPUExecutionProvider"],
        )
        self._app.prepare(ctx_id=0, det_size=(640, 640))
        logger.info("InsightFace model '%s' loaded", self._model_name)

    def _detect_sync(self, image_path: str) -> list[DetectedFace]:
        """Run face detection (CPU-bound, call in executor)."""
        self._ensure_model()
        assert self._app is not None

        img = Image.open(image_path).convert("RGB")
        img_np = np.array(img)
        img_w, img_h = img.size

        faces_raw = self._app.get(img_np)
        results: list[DetectedFace] = []

        for face in faces_raw:
            det_score = float(face.det_score)
            if det_score < FACE_CONFIDENCE_THRESHOLD:
                continue

            # bbox: insightface returns [x1, y1, x2, y2]
            x1, y1, x2, y2 = face.bbox.astype(int)
            # Clamp to image bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(img_w, x2)
            y2 = min(img_h, y2)

            # Normalise to 0..1
            bbox = (
                x1 / img_w,
                y1 / img_h,
                (x2 - x1) / img_w,
                (y2 - y1) / img_h,
            )

            # Crop face thumbnail
            face_image = img.crop((x1, y1, x2, y2))

            embedding = face.normed_embedding  # 512-dim, already L2-normalised

            results.append(
                DetectedFace(
                    bbox=bbox,
                    confidence=det_score,
                    embedding=embedding,
                    face_image=face_image,
                )
            )

        return results

    async def detect_faces(self, image_path: str) -> list[DetectedFace]:
        """Detect faces asynchronously (runs in thread executor)."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._detect_sync, image_path)


@lru_cache(maxsize=1)
def get_detector() -> FaceDetector:
    """Return a shared FaceDetector singleton."""
    return FaceDetector()
