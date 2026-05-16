"""
WebSocket Connection Manager
Manages active WebSocket connections and provides broadcast capabilities
for real-time price streaming in AlphaAI.
"""

import logging
from typing import List

from fastapi import WebSocket

logger = logging.getLogger("alphaai.ws")


class ConnectionManager:
    """
    Manages WebSocket connections for real-time data streaming.

    Responsibilities:
    - Track active client connections
    - Gracefully handle connect/disconnect
    - Broadcast JSON payloads to all connected clients
    """

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            "WebSocket client connected  (%d active)",
            len(self.active_connections),
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection from the active pool."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(
            "WebSocket client disconnected  (%d active)",
            len(self.active_connections),
        )

    async def broadcast_json(self, data: dict) -> None:
        """
        Send a JSON message to every connected client.
        Automatically removes stale / broken connections.
        """
        stale: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                stale.append(connection)

        for ws in stale:
            self.disconnect(ws)
            logger.warning("Removed stale WebSocket connection")

    @property
    def client_count(self) -> int:
        """Return the number of currently connected clients."""
        return len(self.active_connections)
