"""Pipeline API router — start, status, WebSocket progress."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, async_session_factory
from app.models import Event, PipelineRun
from app.schemas import PipelineStatusResponse
from app.services.clusterer import FaceClusterer
from app.services.detector import get_detector
from app.services.pipeline import PipelineOrchestrator
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/events/{event_id}/pipeline", tags=["Pipeline"])


@router.post("/start", response_model=PipelineStatusResponse, status_code=202)
async def start_pipeline(
    event_id: int,
    db: AsyncSession = Depends(get_db),
) -> PipelineStatusResponse:
    """operationId: startPipeline"""
    # Check event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check not already running
    result = await db.execute(
        select(PipelineRun)
        .where(
            PipelineRun.event_id == event_id,
            PipelineRun.status.in_(["idle", "detecting", "embedding", "clustering"]),
        )
        .limit(1)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Pipeline already running")

    # Launch pipeline as a background task (non-blocking)
    async def _run_pipeline() -> None:
        async with async_session_factory() as session:
            orchestrator = PipelineOrchestrator(
                db=session,
                detector=get_detector(),
                clusterer=FaceClusterer(),
                ws_manager=ws_manager,
            )
            await orchestrator.run(event_id)

    asyncio.create_task(_run_pipeline())

    return PipelineStatusResponse(
        eventId=event_id,
        status="detecting",
        progress=0.0,
        etaSeconds=None,
        currentPhotoIndex=0,
        totalPhotos=0,
    )


@router.get("/status", response_model=PipelineStatusResponse)
async def get_pipeline_status(
    event_id: int,
    db: AsyncSession = Depends(get_db),
) -> PipelineStatusResponse:
    """operationId: getPipelineStatus"""
    result = await db.execute(
        select(PipelineRun)
        .where(PipelineRun.event_id == event_id)
        .order_by(PipelineRun.created_at.desc())
        .limit(1)
    )
    run = result.scalar_one_or_none()

    if run is None:
        return PipelineStatusResponse(
            eventId=event_id,
            status="idle",
            progress=0.0,
        )

    return PipelineStatusResponse(
        eventId=event_id,
        status=run.status,
        progress=run.progress,
        etaSeconds=None,
        currentPhotoIndex=run.current_photo_index,
        totalPhotos=run.total_photos,
        error=run.error,
    )


@router.websocket("/ws")
async def pipeline_ws(
    event_id: int,
    websocket: WebSocket,
) -> None:
    """WebSocket endpoint for real-time pipeline progress."""
    await ws_manager.connect(event_id, websocket)
    try:
        while True:
            # Keep connection alive; client may send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(event_id, websocket)
