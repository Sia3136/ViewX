import asyncio
import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as redis

router = APIRouter()

import os
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis_client = None
        self.pubsub = None
        self.listen_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Start listening to redis if this is the first connection
        if len(self.active_connections) == 1:
            await self.start_redis_listener()

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        
        # Stop listening if no connections
        if len(self.active_connections) == 0:
            if self.listen_task:
                self.listen_task.cancel()
            if self.pubsub:
                asyncio.create_task(self.pubsub.close())
            if self.redis_client:
                asyncio.create_task(self.redis_client.close())

    async def start_redis_listener(self):
        self.redis_client = redis.from_url(REDIS_URL)
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe("alerts")
        
        self.listen_task = asyncio.create_task(self._listen_to_redis())

    async def _listen_to_redis(self):
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = message["data"].decode("utf-8")
                    await self.broadcast(data)
        except asyncio.CancelledError:
            pass

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle disconnected clients that weren't cleaned up
                pass

<<<<<<< HEAD
manager = ConnectionManager()

@router.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket):
=======
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from src.core.security import SECRET_KEY, ALGORITHM
import jwt
from jwt.exceptions import InvalidTokenError

manager = ConnectionManager()

@router.websocket("/alerts")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=1008)
        return
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise InvalidTokenError()
    except InvalidTokenError:
        await websocket.close(code=1008)
        return
        
>>>>>>> 0754b75 (first addition)
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client, just keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
