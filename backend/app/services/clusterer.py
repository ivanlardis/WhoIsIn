"""Face clustering service using HDBSCAN."""

from __future__ import annotations

import logging

import hdbscan
import numpy as np

from app.config import HDBSCAN_MIN_CLUSTER_SIZE

logger = logging.getLogger(__name__)


class FaceClusterer:
    """Clusters face embeddings using HDBSCAN with cosine distance."""

    def __init__(self, min_cluster_size: int = HDBSCAN_MIN_CLUSTER_SIZE) -> None:
        self._min_cluster_size = min_cluster_size

    def cluster(self, embeddings: np.ndarray) -> list[int]:
        """Return cluster labels for each embedding (-1 = noise).

        Args:
            embeddings: (N, 512) array of L2-normalised face embeddings.

        Returns:
            List of integer cluster labels, length N.
        """
        if len(embeddings) < self._min_cluster_size:
            logger.warning(
                "Too few faces (%d) for min_cluster_size=%d, all labelled as noise",
                len(embeddings),
                self._min_cluster_size,
            )
            return [-1] * len(embeddings)

        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=self._min_cluster_size,
            metric="euclidean",
            cluster_selection_method="eom",
        )
        # For cosine distance on L2-normalised vectors, euclidean is equivalent
        # (cosine_dist = 1 - cos_sim, and for unit vectors: ||a-b||^2 = 2*(1-cos_sim))
        labels: list[int] = clusterer.fit_predict(embeddings).tolist()

        n_clusters = len(set(labels) - {-1})
        n_noise = labels.count(-1)
        logger.info(
            "Clustered %d faces into %d persons (%d noise)",
            len(embeddings),
            n_clusters,
            n_noise,
        )
        return labels
