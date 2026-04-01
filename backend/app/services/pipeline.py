"""Pipeline orchestrator: detection -> clustering -> DB persistence."""

from __future__ import annotations

import logging
import time
from pathlib import Path

import numpy as np
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import UPLOAD_DIR
from app.models import Event, Face, Person, Photo, PhotoPerson, PipelineRun
from app.services.clusterer import FaceClusterer
from app.services.detector import DetectedFace, FaceDetector
from app.services.ws_manager import WSManager

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Runs the full ML pipeline for an event."""

    def __init__(
        self,
        db: AsyncSession,
        detector: FaceDetector,
        clusterer: FaceClusterer,
        ws_manager: WSManager,
    ) -> None:
        self._db = db
        self._detector = detector
        self._clusterer = clusterer
        self._ws = ws_manager

    # ------------------------------------------------------------------ run

    async def run(self, event_id: int) -> None:
        """Execute the full pipeline for *event_id*."""
        pipeline_run = await self._create_run(event_id)
        try:
            # Update event status
            await self._db.execute(
                update(Event).where(Event.id == event_id).values(status="processing")
            )
            await self._db.commit()

            # Fetch photos
            result = await self._db.execute(
                select(Photo).where(Photo.event_id == event_id).order_by(Photo.id)
            )
            photos: list[Photo] = list(result.scalars().all())
            if not photos:
                await self._finish_run(pipeline_run, "complete")
                return

            pipeline_run.total_photos = len(photos)
            await self._db.commit()

            # Stage 1: detecting (+ embeddings done in same step)
            all_faces: list[tuple[int, DetectedFace]] = []  # (photo_id, face)
            await self._set_stage(pipeline_run, event_id, "detecting")

            start_t = time.monotonic()
            for idx, photo in enumerate(photos):
                try:
                    detected = await self._detector.detect_faces(photo.filepath)
                except Exception:
                    logger.exception("Detection failed for photo %d", photo.id)
                    detected = []

                for df in detected:
                    all_faces.append((photo.id, df))

                # Update photo face_count
                photo.face_count = len(detected)

                # Progress
                elapsed = time.monotonic() - start_t
                progress = ((idx + 1) / len(photos)) * 100
                eta = int(elapsed / (idx + 1) * (len(photos) - idx - 1)) if idx > 0 else 0

                pipeline_run.progress = progress
                pipeline_run.current_photo_index = idx + 1
                await self._db.commit()

                await self._ws.broadcast(event_id, {
                    "stage": "detecting",
                    "progress": round(progress, 1),
                    "etaSeconds": eta,
                    "currentPhotoIndex": idx + 1,
                    "totalPhotos": len(photos),
                })

            # Save face thumbnails
            faces_dir = UPLOAD_DIR / f"events/{event_id}/faces"
            faces_dir.mkdir(parents=True, exist_ok=True)

            face_records: list[Face] = []
            embeddings_list: list[np.ndarray] = []

            for i, (photo_id, df) in enumerate(all_faces):
                thumb_name = f"face_{i:06d}.jpg"
                thumb_path = faces_dir / thumb_name
                df.face_image.save(str(thumb_path), "JPEG", quality=85)

                face_rec = Face(
                    photo_id=photo_id,
                    bbox_x=df.bbox[0],
                    bbox_y=df.bbox[1],
                    bbox_width=df.bbox[2],
                    bbox_height=df.bbox[3],
                    confidence=df.confidence,
                    embedding=df.embedding.tolist(),
                    thumbnail_path=str(thumb_path),
                )
                self._db.add(face_rec)
                face_records.append(face_rec)
                embeddings_list.append(df.embedding)

            await self._db.flush()  # get face IDs

            # Stage 2: clustering
            await self._set_stage(pipeline_run, event_id, "clustering")

            if embeddings_list:
                embeddings_matrix = np.stack(embeddings_list)
                labels = self._clusterer.cluster(embeddings_matrix)
            else:
                labels = []

            await self._ws.broadcast(event_id, {
                "stage": "clustering",
                "progress": 50.0,
                "etaSeconds": 0,
                "currentPhotoIndex": len(photos),
                "totalPhotos": len(photos),
            })

            # Create persons and assign faces
            cluster_ids = set(labels) - {-1}
            person_map: dict[int, Person] = {}

            for cluster_id in sorted(cluster_ids):
                person = Person(
                    event_id=event_id,
                    name=f"Person_{cluster_id + 1}",
                )
                self._db.add(person)
                person_map[cluster_id] = person

            await self._db.flush()  # get person IDs

            # Assign faces to persons, create photo_persons, compute stats
            photo_person_pairs: set[tuple[int, int]] = set()

            for face_rec, label in zip(face_records, labels):
                if label == -1:
                    continue
                person = person_map[label]
                face_rec.person_id = person.id
                photo_person_pairs.add((face_rec.photo_id, person.id))

            # Insert photo_persons
            for photo_id, person_id in photo_person_pairs:
                self._db.add(PhotoPerson(photo_id=photo_id, person_id=person_id))

            # Compute person stats and set representative thumbnail/embedding
            for cluster_id, person in person_map.items():
                cluster_faces = [
                    (face_records[i], embeddings_list[i])
                    for i, lbl in enumerate(labels)
                    if lbl == cluster_id
                ]
                person.face_count = len(cluster_faces)

                # Unique photos for this person
                person_photo_ids = {f.photo_id for f, _ in cluster_faces}
                person.photo_count = len(person_photo_ids)

                # Representative: highest confidence face
                best_face = max(cluster_faces, key=lambda x: x[0].confidence)
                person.thumbnail_path = best_face[0].thumbnail_path

                # Mean embedding for selfie search
                mean_emb = np.mean([e for _, e in cluster_faces], axis=0)
                mean_emb = mean_emb / np.linalg.norm(mean_emb)  # re-normalise
                person.representative_embedding = mean_emb.tolist()

            await self._db.commit()

            # Stage 3: complete
            await self._finish_run(pipeline_run, "complete")
            await self._db.execute(
                update(Event).where(Event.id == event_id).values(status="completed")
            )
            await self._db.commit()

            await self._ws.broadcast(event_id, {
                "stage": "complete",
                "progress": 100.0,
                "etaSeconds": 0,
                "currentPhotoIndex": len(photos),
                "totalPhotos": len(photos),
            })
            logger.info(
                "Pipeline complete for event %d: %d faces, %d persons",
                event_id, len(face_records), len(person_map),
            )

        except Exception as exc:
            logger.exception("Pipeline failed for event %d", event_id)
            pipeline_run.status = "failed"
            pipeline_run.error = str(exc)
            await self._db.commit()

            await self._db.execute(
                update(Event).where(Event.id == event_id).values(status="created")
            )
            await self._db.commit()

            await self._ws.broadcast(event_id, {
                "stage": "failed",
                "progress": pipeline_run.progress,
                "error": str(exc),
            })

    # ------------------------------------------------------------------ helpers

    async def _create_run(self, event_id: int) -> PipelineRun:
        from datetime import datetime, timezone

        run = PipelineRun(
            event_id=event_id,
            status="idle",
            started_at=datetime.now(timezone.utc),
        )
        self._db.add(run)
        await self._db.commit()
        await self._db.refresh(run)
        return run

    async def _set_stage(
        self, run: PipelineRun, event_id: int, stage: str
    ) -> None:
        run.status = stage
        await self._db.commit()

    async def _finish_run(self, run: PipelineRun, status: str) -> None:
        from datetime import datetime, timezone

        run.status = status
        run.progress = 100.0
        run.completed_at = datetime.now(timezone.utc)
        await self._db.commit()
