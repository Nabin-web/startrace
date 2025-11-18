from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File as FastAPIFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import timedelta
import csv
import io

from database import get_db, engine, Base, SessionLocal
from models import User, File
from auth import (
    get_current_user, get_current_admin,
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    get_current_user as get_user_from_token
)
from schemas import UserCreate, UserResponse, Token, FileResponse
from config import settings
from websocket_manager import manager

app = FastAPI(title="CSV File Manager API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)

# Initialize database
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    # Create default admin user if it doesn't exist
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        print({admin})
        if not admin:
            admin = User(
                username="admin",
                # password_hash="admin123",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Default admin user created: username=admin, password=admin123")
    except Exception as e:
        print(f"Error during startup: {e}")
        db.rollback()
    finally:
        db.close()


# Auth endpoints
@app.post("/api/auth/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        password_hash=hashed_password,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


# User endpoints
@app.get("/api/files", response_model=List[FileResponse])
def list_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(File).all()
    result = []
    for file in files:
        result.append(FileResponse(
            id=file.id,
            name=file.name,
            size=file.size,
            created_at=file.created_at,
            uploader_id=file.uploader_id,
            uploader_username=file.uploader_rel.username
        ))
    return result


@app.get("/api/files/{file_id}")
def get_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(path=file_record.file_path, filename=file_record.name)


@app.get("/api/files/{file_id}/content")
def get_file_content(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Read and parse CSV
    with open(file_record.file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        headers = list(rows[0].keys()) if rows else []
    
    return {"headers": headers, "rows": rows}


# Admin endpoints
@app.post("/api/admin/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # Validate file extension
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Save file
    file_path = os.path.join(settings.upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    # Create database record
    file_record = File(
        name=file.filename,
        size=file_size,
        uploader_id=current_user.id,
        file_path=file_path
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    
    # Broadcast update via WebSocket
    await manager.broadcast_update()
    
    return FileResponse(
        id=file_record.id,
        name=file_record.name,
        size=file_record.size,
        created_at=file_record.created_at,
        uploader_id=file_record.uploader_id,
        uploader_username=current_user.username
    )


@app.delete("/api/admin/files/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete file from disk
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    
    # Delete from database
    db.delete(file_record)
    db.commit()
    
    # Broadcast update via WebSocket
    await manager.broadcast_update()
    
    return {"message": "File deleted successfully"}


@app.get("/api/admin/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    users = db.query(User).all()
    return users


@app.delete("/api/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    from websocket_manager import get_user_from_token_ws
    from database import SessionLocal
    
    await manager.connect(websocket)
    
    # Try to get token from query params
    token = None
    query_string = websocket.scope.get("query_string", b"").decode()
    if query_string:
        params = query_string.split("&")
        for param in params:
            if "=" in param:
                key, value = param.split("=", 1)
                if key == "token":
                    token = value
                    break
    
    # Authenticate user if token provided
    if token:
        db = SessionLocal()
        try:
            user = get_user_from_token_ws(token, db)
        finally:
            db.close()
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Handle ping/pong or other client messages if needed
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

