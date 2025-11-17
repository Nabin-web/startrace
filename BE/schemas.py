from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class FileResponse(BaseModel):
    id: int
    name: str
    size: int
    created_at: datetime
    uploader_id: int
    uploader_username: str
    
    class Config:
        from_attributes = True


class FileCreate(BaseModel):
    name: str
    size: int

