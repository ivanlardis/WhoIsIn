"""Benchmark API router — run and retrieve ML model comparisons."""

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session_factory, get_db
from app.models import BenchmarkResult, Event
from app.services.benchmark import BenchmarkService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/benchmark", tags=["Benchmark"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RunBenchmarkRequest(BaseModel):
    event_id: int
    sample_size: int = 20


class ModelMetricsResponse(BaseModel):
    model_name: str
    precision: float | None = None
    recall: float | None = None
    f1: float | None = None
    avg_time_per_photo: float | None = None
    total_photos: int | None = None


class BenchmarkReportResponse(BaseModel):
    event_id: int
    sample_size: int
    model_metrics: list[ModelMetricsResponse]


class BenchmarkResultResponse(BaseModel):
    id: int
    model_name: str
    precision_score: float | None = None
    recall_score: float | None = None
    f1_score: float | None = None
    avg_time_per_photo: float | None = None
    total_photos: int | None = None
    run_date: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/run", response_model=BenchmarkReportResponse, status_code=202)
async def run_benchmark(
    body: RunBenchmarkRequest,
    db: AsyncSession = Depends(get_db),
) -> BenchmarkReportResponse:
    """operationId: runBenchmark

    Launch a benchmark run comparing face-detection models on a sample of
    photos from the given event.  The task runs in the background; results
    are persisted to the ``benchmark_results`` table.
    """
    # Validate event exists
    result = await db.execute(select(Event).where(Event.id == body.event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Fire-and-forget background task
    response_future: asyncio.Future[BenchmarkReportResponse] = asyncio.get_running_loop().create_future()

    async def _run() -> None:
        try:
            async with async_session_factory() as session:
                service = BenchmarkService()
                report = await service.run_benchmark(
                    event_id=body.event_id,
                    sample_size=body.sample_size,
                    db=session,
                )
                await session.commit()

                resp = BenchmarkReportResponse(
                    event_id=report.event_id,
                    sample_size=report.sample_size,
                    model_metrics=[
                        ModelMetricsResponse(
                            model_name=m.model_name,
                            precision=m.precision,
                            recall=m.recall,
                            f1=m.f1,
                            avg_time_per_photo=m.avg_time_per_photo,
                            total_photos=m.total_photos,
                        )
                        for m in report.model_metrics
                    ],
                )
                response_future.set_result(resp)
        except Exception:
            logger.exception("Benchmark failed for event %d", body.event_id)
            response_future.set_result(
                BenchmarkReportResponse(
                    event_id=body.event_id,
                    sample_size=0,
                    model_metrics=[],
                )
            )

    asyncio.create_task(_run())

    # Return an immediate 202 with placeholder (results via GET later)
    return BenchmarkReportResponse(
        event_id=body.event_id,
        sample_size=body.sample_size,
        model_metrics=[],
    )


@router.get("/results", response_model=list[BenchmarkResultResponse])
async def get_benchmark_results(
    limit: int = Query(default=30, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[BenchmarkResultResponse]:
    """operationId: getBenchmarkResults

    Return the latest benchmark results from the database, ordered by
    ``run_date`` descending.
    """
    stmt = (
        select(BenchmarkResult)
        .order_by(BenchmarkResult.run_date.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        BenchmarkResultResponse(
            id=r.id,
            model_name=r.model_name,
            precision_score=r.precision_score,
            recall_score=r.recall_score,
            f1_score=r.f1_score,
            avg_time_per_photo=r.avg_time_per_photo,
            total_photos=r.total_photos,
            run_date=r.run_date.isoformat(),
        )
        for r in rows
    ]
