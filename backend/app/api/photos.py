"""Photos API router."""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import UPLOAD_DIR
from app.db import get_db
from app.models import Event, Face, Photo
from app.schemas import (
    BBox,
    FaceResponse,
    PhotoDetail,
    PhotoList,
    PhotoResponse,
    UploadResult,
)

router = APIRouter(prefix="/events/{event_id}/photos", tags=["Photos"])


def _photo_url(photo: Photo) -> str:
    """Build a relative URL for the photo file."""
    return f"/uploads/events/{photo.event_id}/photos/{photo.filename}"


def _thumb_url(face: Face) -> str | None:
    if face.thumbnail_path:
        return f"/uploads/{Path(face.thumbnail_path).relative_to(UPLOAD_DIR)}"
    return None


@router.post("", response_model=UploadResult, status_code=201)
async def upload_photos(
    event_id: int,
    files: list[UploadFile],
    db: AsyncSession = Depends(get_db),
) -> UploadResult:
    """operationId: uploadPhotos"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Event not found")

    photos_dir = UPLOAD_DIR / f"events/{event_id}/photos"
    photos_dir.mkdir(parents=True, exist_ok=True)

    uploaded_ids: list[int] = []
    failed = 0

    for file in files:
        try:
            filename = Path(file.filename or "unknown.jpg").name
            # Sanitise
            filename = filename.replace("..", "").replace("/", "").replace("\\", "")
            filepath = photos_dir / filename

            # Avoid overwrites
            counter = 1
            stem = filepath.stem
            suffix = filepath.suffix
            while filepath.exists():
                filepath = photos_dir / f"{stem}_{counter}{suffix}"
                filename = filepath.name
                counter += 1

            content = await file.read()
            filepath.write_bytes(content)

            # Get image dimensions
            width, height = None, None
            try:
                with Image.open(filepath) as img:
                    width, height = img.size
            except Exception:
                pass

            photo = Photo(
                event_id=event_id,
                filename=filename,
                filepath=str(filepath),
                width=width,
                height=height,
                file_size=len(content),
            )
            db.add(photo)
            await db.flush()
            uploaded_ids.append(photo.id)
        except Exception:
            failed += 1

    return UploadResult(uploaded=len(uploaded_ids), failed=failed, photoIds=uploaded_ids)


@router.get("", response_model=PhotoList)
async def list_photos(
    event_id: int,
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> PhotoList:
    """operationId: listPhotos"""
    total = (
        await db.execute(
            select(func.count()).select_from(Photo).where(Photo.event_id == event_id)
        )
    ).scalar_one()

    offset = (page - 1) * limit
    result = await db.execute(
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.id)
        .offset(offset)
        .limit(limit)
    )
    photos = result.scalars().all()

    items = [
        PhotoResponse(
            id=p.id,
            filename=p.filename,
            url=_photo_url(p),
            thumbnailUrl=_photo_url(p),
            width=p.width,
            height=p.height,
            faceCount=p.face_count or 0,
        )
        for p in photos
    ]
    return PhotoList(items=items, total=total, page=page, limit=limit)


@router.get("/{photo_id}", response_model=PhotoDetail)
async def get_photo(
    event_id: int,
    photo_id: int,
    db: AsyncSession = Depends(get_db),
) -> PhotoDetail:
    """operationId: getPhoto"""
    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.event_id == event_id)
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")

    faces_result = await db.execute(
        select(Face).where(Face.photo_id == photo_id).order_by(Face.id)
    )
    faces = faces_result.scalars().all()

    face_responses = [
        FaceResponse(
            id=f.id,
            bbox=BBox(x=f.bbox_x, y=f.bbox_y, width=f.bbox_width, height=f.bbox_height),
            confidence=f.confidence,
            thumbnailUrl=_thumb_url(f),
            personId=f.person_id,
        )
        for f in faces
    ]

    return PhotoDetail(
        id=photo.id,
        filename=photo.filename,
        url=_photo_url(photo),
        thumbnailUrl=_photo_url(photo),
        width=photo.width,
        height=photo.height,
        faceCount=photo.face_count or 0,
        faces=face_responses,
        description=photo.description,
    )
