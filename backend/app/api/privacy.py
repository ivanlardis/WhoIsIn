"""Privacy API router — consent recording."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import ConsentRecord
from app.schemas import ConsentRequest

router = APIRouter(tags=["Privacy"])


@router.post("/consent", status_code=201)
async def record_consent(
    body: ConsentRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """operationId: recordConsent"""
    record = ConsentRecord(
        event_id=body.event_id,
        accepted=body.accepted,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(record)
    await db.flush()
    return {"status": "ok"}
