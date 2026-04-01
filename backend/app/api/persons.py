"""Persons API router."""

import io
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import UPLOAD_DIR
from app.db import get_db
from app.models import Face, Person, Photo, PhotoPerson
from app.schemas import PersonResponse, PhotoResponse, UpdatePersonRequest

router = APIRouter(tags=["Persons"])


def _person_thumb_url(person: Person) -> str | None:
    if person.thumbnail_path:
        try:
            rel = Path(person.thumbnail_path).relative_to(UPLOAD_DIR)
            return f"/uploads/{rel}"
        except ValueError:
            return None
    return None


def _photo_url(photo: Photo) -> str:
    return f"/uploads/events/{photo.event_id}/photos/{photo.filename}"


@router.get("/events/{event_id}/persons", response_model=list[PersonResponse])
async def list_persons(
    event_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[PersonResponse]:
    """operationId: listPersons"""
    result = await db.execute(
        select(Person)
        .where(Person.event_id == event_id)
        .order_by(Person.photo_count.desc(), Person.id)
    )
    persons = result.scalars().all()
    return [
        PersonResponse(
            id=p.id,
            name=p.name,
            thumbnailUrl=_person_thumb_url(p),
            photoCount=p.photo_count,
            faceCount=p.face_count,
        )
        for p in persons
    ]


@router.put("/persons/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int,
    body: UpdatePersonRequest,
    db: AsyncSession = Depends(get_db),
) -> PersonResponse:
    """operationId: updatePerson"""
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    person.name = body.name
    await db.flush()
    await db.refresh(person)

    return PersonResponse(
        id=person.id,
        name=person.name,
        thumbnailUrl=_person_thumb_url(person),
        photoCount=person.photo_count,
        faceCount=person.face_count,
    )


@router.get("/persons/{person_id}/photos", response_model=list[PhotoResponse])
async def get_person_photos(
    person_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[PhotoResponse]:
    """operationId: getPersonPhotos"""
    result = await db.execute(select(Person).where(Person.id == person_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Person not found")

    result = await db.execute(
        select(Photo)
        .join(PhotoPerson, PhotoPerson.photo_id == Photo.id)
        .where(PhotoPerson.person_id == person_id)
        .order_by(Photo.id)
    )
    photos = result.scalars().all()

    return [
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


@router.get("/persons/{person_id}/download")
async def download_person_photos(
    person_id: int,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """operationId: downloadPersonPhotos

    Streams a ZIP archive of all photos for the given person.
    """
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    result = await db.execute(
        select(Photo)
        .join(PhotoPerson, PhotoPerson.photo_id == Photo.id)
        .where(PhotoPerson.person_id == person_id)
        .order_by(Photo.id)
    )
    photos = result.scalars().all()

    def _generate_zip():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for photo in photos:
                filepath = Path(photo.filepath)
                if filepath.exists():
                    zf.write(filepath, photo.filename)
        buf.seek(0)
        return buf

    import asyncio

    loop = asyncio.get_running_loop()
    zip_buf = await loop.run_in_executor(None, _generate_zip)

    safe_name = person.name.replace(" ", "_")
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}_photos.zip"'
        },
    )
