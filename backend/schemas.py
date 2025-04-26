from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    username: str = Field(..., description="Username for the account")

class UserCreate(UserBase):
    password: str = Field(..., description="User's password (will be hashed)")

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email for login")
    password: str = Field(..., description="User's password")

class UserResponse(UserBase):
    id: UUID = Field(..., description="The unique identifier for the user")
    is_active: bool = Field(..., description="Whether the user account is active")
    created_at: datetime = Field(..., description="When the user account was created")
    last_login: Optional[datetime] = Field(None, description="When the user last logged in")
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Book schemas
class BookCreate(BaseModel):
    title: str = Field(..., description="The title of the book")

class BookResponse(BookCreate):
    id: str = Field(..., description="The unique identifier for the book")

# Chapter schemas
class ChapterCreate(BaseModel):
    book_id: str = Field(..., description="ID of the book this chapter belongs to")
    chapter_number: int = Field(..., description="Chapter number within the book")
    title: str = Field(..., description="Title of the chapter")

class ChapterResponse(ChapterCreate):
    id: str = Field(..., description="The unique identifier for the chapter")

# Chunk schemas
class ChunkCreate(BaseModel):
    book_id: str = Field(..., description="ID of the book this chunk belongs to")
    chapter_number: int = Field(..., description="Chapter number within the book")
    original_text: str = Field(..., description="Original text content of the chunk")

class ChunkResponse(BaseModel):
    id: str = Field(..., description="The unique identifier for the chunk")
    book_id: str = Field(..., description="ID of the book this chunk belongs to")
    chapter_id: str = Field(..., description="ID of the chapter this chunk belongs to")
    chunk_index: int = Field(..., description="Index of this chunk within the chapter")
    original_text: str = Field(..., description="Original text content of the chunk")

# Search schemas
class SearchQuery(BaseModel):
    query: str = Field(..., description="Search query text")
    book_id: Optional[str] = Field(None, description="Optional book ID to limit search to")
    limit: int = Field(5, description="Maximum number of results to return")

class SearchResult(BaseModel):
    chunks: List[Dict[str, Any]] = Field(..., description="List of matching chunks with scores")