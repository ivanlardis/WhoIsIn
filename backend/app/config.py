"""Application configuration."""

import os
from pathlib import Path

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://whoisin:whoisin@localhost:5432/whoisin",
)

UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))

# InsightFace model name (buffalo_sc is lightweight, CPU-friendly)
INSIGHTFACE_MODEL: str = os.getenv("INSIGHTFACE_MODEL", "buffalo_sc")

# HDBSCAN defaults
HDBSCAN_MIN_CLUSTER_SIZE: int = int(os.getenv("HDBSCAN_MIN_CLUSTER_SIZE", "2"))

# Face detection confidence threshold
FACE_CONFIDENCE_THRESHOLD: float = float(
    os.getenv("FACE_CONFIDENCE_THRESHOLD", "0.5")
)
