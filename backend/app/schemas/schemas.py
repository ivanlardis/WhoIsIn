"""Pydantic schemas matching docs/openapi.yaml component schemas."""

import datetime as _dt
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Events ----------


class CreateEventRequest(BaseModel):
    name: str
    date: Optional[_dt.date] = None
    description: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    name: str
    date: Optional[_dt.date] = None
    description: Optional[str] = None
    photo_count: int = Field(0, alias="photoCount")
    person_count: int = Field(0, alias="personCount")
    status: str = "created"
    created_at: _dt.datetime = Field(alias="createdAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class EventStats(BaseModel):
    total_photos: int = Field(alias="totalPhotos")
    total_faces: int = Field(alias="totalFaces")
    total_persons: int = Field(alias="totalPersons")
    photos_without_faces: int = Field(alias="photosWithoutFaces")

    model_config = {"populate_by_name": True}


class EventDetail(EventResponse):
    stats: Optional[EventStats] = None


# ---------- Photos ----------


class PhotoResponse(BaseModel):
    id: int
    filename: str
    url: str
    thumbnail_url: Optional[str] = Field(None, alias="thumbnailUrl")
    width: Optional[int] = None
    height: Optional[int] = None
    face_count: int = Field(0, alias="faceCount")

    model_config = {"from_attributes": True, "populate_by_name": True}


class BBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class FaceResponse(BaseModel):
    id: int
    bbox: BBox
    confidence: float
    thumbnail_url: Optional[str] = Field(None, alias="thumbnailUrl")
    person_id: Optional[int] = Field(None, alias="personId")

    model_config = {"from_attributes": True, "populate_by_name": True}


class PhotoDetail(PhotoResponse):
    faces: list[FaceResponse] = []
    description: Optional[str] = None


class PhotoList(BaseModel):
    items: list[PhotoResponse]
    total: int
    page: int
    limit: int


class UploadResult(BaseModel):
    uploaded: int
    failed: int
    photo_ids: list[int] = Field(alias="photoIds")

    model_config = {"populate_by_name": True}


# ---------- Persons ----------


class PersonResponse(BaseModel):
    id: int
    name: str
    thumbnail_url: str | None = Field(None, alias="thumbnailUrl")
    photo_count: int = Field(0, alias="photoCount")
    face_count: int = Field(0, alias="faceCount")

    model_config = {"from_attributes": True, "populate_by_name": True}


class UpdatePersonRequest(BaseModel):
    name: str


# ---------- Pipeline ----------


class PipelineStatusResponse(BaseModel):
    event_id: int = Field(alias="eventId")
    status: str = "idle"
    progress: float = 0.0
    eta_seconds: Optional[int] = Field(None, alias="etaSeconds")
    current_photo_index: Optional[int] = Field(None, alias="currentPhotoIndex")
    total_photos: Optional[int] = Field(None, alias="totalPhotos")
    error: Optional[str] = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------- Search ----------


class SelfieMatch(BaseModel):
    person: PersonResponse
    confidence: float


class SelfieSearchResult(BaseModel):
    matches: list[SelfieMatch]


class SemanticSearchRequest(BaseModel):
    query: str


class SemanticSearchResult(BaseModel):
    results: list[dict] = []


# ---------- Privacy ----------


class ConsentRequest(BaseModel):
    event_id: int = Field(alias="eventId")
    accepted: bool

    model_config = {"populate_by_name": True}
