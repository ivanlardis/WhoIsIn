"""Events API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Event, Face, Person, Photo
from app.schemas import CreateEventRequest, EventDetail, EventResponse, EventStats

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    body: CreateEventRequest,
    db: AsyncSession = Depends(get_db),
) -> EventResponse:
    """operationId: createEvent"""
    event = Event(name=body.name, date=body.date, description=body.description)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return EventResponse(
        id=event.id,
        name=event.name,
        date=event.date,
        description=event.description,
        photoCount=0,
        personCount=0,
        status=event.status,
        createdAt=event.created_at,
    )


@router.get("", response_model=list[EventResponse])
async def list_events(
    db: AsyncSession = Depends(get_db),
) -> list[EventResponse]:
    """operationId: listEvents"""
    result = await db.execute(select(Event).order_by(Event.created_at.desc()))
    events = result.scalars().all()

    responses: list[EventResponse] = []
    for ev in events:
        photo_count = (
            await db.execute(
                select(func.count()).select_from(Photo).where(Photo.event_id == ev.id)
            )
        ).scalar_one()
        person_count = (
            await db.execute(
                select(func.count()).select_from(Person).where(Person.event_id == ev.id)
            )
        ).scalar_one()
        responses.append(
            EventResponse(
                id=ev.id,
                name=ev.name,
                date=ev.date,
                description=ev.description,
                photoCount=photo_count,
                personCount=person_count,
                status=ev.status,
                createdAt=ev.created_at,
            )
        )
    return responses


@router.get("/{event_id}", response_model=EventDetail)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
) -> EventDetail:
    """operationId: getEvent"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    photo_count = (
        await db.execute(
            select(func.count()).select_from(Photo).where(Photo.event_id == event_id)
        )
    ).scalar_one()
    person_count = (
        await db.execute(
            select(func.count()).select_from(Person).where(Person.event_id == event_id)
        )
    ).scalar_one()
    face_count = (
        await db.execute(
            select(func.count())
            .select_from(Face)
            .join(Photo, Face.photo_id == Photo.id)
            .where(Photo.event_id == event_id)
        )
    ).scalar_one()
    photos_no_faces = (
        await db.execute(
            select(func.count())
            .select_from(Photo)
            .where(Photo.event_id == event_id, Photo.face_count == 0)
        )
    ).scalar_one()

    return EventDetail(
        id=event.id,
        name=event.name,
        date=event.date,
        description=event.description,
        photoCount=photo_count,
        personCount=person_count,
        status=event.status,
        createdAt=event.created_at,
        stats=EventStats(
            totalPhotos=photo_count,
            totalFaces=face_count,
            totalPersons=person_count,
            photosWithoutFaces=photos_no_faces,
        ),
    )


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """operationId: deleteEvent"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.execute(delete(Event).where(Event.id == event_id))

    # Clean up files
    import shutil
    from app.config import UPLOAD_DIR

    event_dir = UPLOAD_DIR / f"events/{event_id}"
    if event_dir.exists():
        shutil.rmtree(event_dir, ignore_errors=True)
