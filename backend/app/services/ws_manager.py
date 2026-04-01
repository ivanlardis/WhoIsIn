"""WebSocket connection manager for real-time pipeline progress."""

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WSManager:
    """Manages WebSocket connections grouped by event_id."""

    def __init__(self) -> None:
        self.connections: dict[int, list[WebSocket]] = {}

    async def connect(self, event_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.connections.setdefault(event_id, []).append(ws)
        logger.info("WS connected for event %d (total: %d)", event_id, len(self.connections[event_id]))

    async def disconnect(self, event_id: int, ws: WebSocket) -> None:
        conns = self.connections.get(event_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self.connections.pop(event_id, None)
        logger.info("WS disconnected for event %d", event_id)

    async def broadcast(self, event_id: int, message: dict[str, Any]) -> None:
        """Send a JSON message to all connections for a given event."""
        conns = self.connections.get(event_id, [])
        dead: list[WebSocket] = []
        payload = json.dumps(message)
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            conns.remove(ws)


# Global singleton
ws_manager = WSManager()
