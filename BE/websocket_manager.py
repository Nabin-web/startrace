from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import List
from jose import jwt, JWTError
from config import settings
from database import get_db
from models import User
from sqlalchemy.orm import Session


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                self.disconnect(connection)
    
    async def broadcast_update(self):
        await self.broadcast('{"event": "csv_list_updated"}')


manager = ConnectionManager()


def get_user_from_token_ws(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "access":
            return None
    except JWTError:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    return user

