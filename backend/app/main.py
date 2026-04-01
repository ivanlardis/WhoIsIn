"""FastAPI application entrypoint."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import benchmark, events, persons, photos, pipeline, privacy, search
from app.config import UPLOAD_DIR

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="WhoIsIn API",
    description="Intelligent face-sorting photo organizer for events",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Register API routers under /api/v1
api_prefix = "/api/v1"
app.include_router(events.router, prefix=api_prefix)
app.include_router(photos.router, prefix=api_prefix)
app.include_router(pipeline.router, prefix=api_prefix)
app.include_router(persons.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)
app.include_router(privacy.router, prefix=api_prefix)
app.include_router(benchmark.router, prefix=api_prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
