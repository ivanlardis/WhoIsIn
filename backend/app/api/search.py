"""Search API router — selfie search and semantic search stub."""

import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import UPLOAD_DIR
from app.db import get_db
from app.models import Person
from app.schemas import (
    PersonResponse,
    SelfieMatch,
    SelfieSearchResult,
    SemanticSearchRequest,
    SemanticSearchResult,
)
from app.services.detector import get_detector

router = APIRouter(prefix="/events/{event_id}/search", tags=["Search"])


def _person_thumb_url(person: Person) -> str | None:
    if person.thumbnail_path:
        try:
            rel = Path(person.thumbnail_path).relative_to(UPLOAD_DIR)
            return f"/uploads/{rel}"
        except ValueError:
            return None
    return None


@router.post("/selfie", response_model=SelfieSearchResult)
async def search_by_selfie(
    event_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
) -> SelfieSearchResult:
    """operationId: searchBySelfie

    Upload a selfie image, detect a face, and find the top-3 most similar
    persons in the event using pgvector cosine similarity.
    """
    # Save temporary file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        detector = get_detector()
        faces = await detector.detect_faces(tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if not faces:
        return SelfieSearchResult(matches=[])

    # Use the highest-confidence face
    best_face = max(faces, key=lambda f: f.confidence)
    embedding = best_face.embedding.tolist()

    # pgvector cosine similarity: 1 - cosine_distance
    # <=> operator is cosine distance in pgvector
    query = text("""
        SELECT id, name, thumbnail_path, photo_count, face_count,
               1 - (representative_embedding <=> :emb::vector) AS similarity
        FROM persons
        WHERE event_id = :event_id
          AND representative_embedding IS NOT NULL
        ORDER BY representative_embedding <=> :emb::vector
        LIMIT 3
    """)

    result = await db.execute(
        query, {"emb": str(embedding), "event_id": event_id}
    )
    rows = result.fetchall()

    matches: list[SelfieMatch] = []
    for row in rows:
        person_resp = PersonResponse(
            id=row.id,
            name=row.name,
            thumbnailUrl=(
                f"/uploads/{Path(row.thumbnail_path).relative_to(UPLOAD_DIR)}"
                if row.thumbnail_path
                else None
            ),
            photoCount=row.photo_count or 0,
            faceCount=row.face_count or 0,
        )
        matches.append(SelfieMatch(person=person_resp, confidence=round(row.similarity, 4)))

    return SelfieSearchResult(matches=matches)


@router.post("/semantic", response_model=SemanticSearchResult)
async def search_semantic(
    event_id: int,
    body: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
) -> SemanticSearchResult:
    """operationId: searchSemantic

    Stub for post-MVP semantic text search.
    """
    return SemanticSearchResult(results=[])
