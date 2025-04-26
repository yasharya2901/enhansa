from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime
import uuid
from typing import List, Optional

# User operations
def get_user(db: Session, user_id: uuid.UUID):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# Reading history operations
def create_reading_history(db: Session, user_id: uuid.UUID, book_id: str, chapter_id: Optional[str] = None, chunk_id: Optional[str] = None):
    db_history = models.ReadingHistory(
        user_id=user_id,
        book_id=book_id,
        chapter_id=chapter_id,
        chunk_id=chunk_id
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_user_reading_history(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.ReadingHistory)\
        .filter(models.ReadingHistory.user_id == user_id)\
        .order_by(models.ReadingHistory.read_at.desc())\
        .offset(skip).limit(limit).all()

def get_last_read(db: Session, user_id: uuid.UUID, book_id: str):
    """Get the last read position for a specific book by a user"""
    return db.query(models.ReadingHistory)\
        .filter(
            models.ReadingHistory.user_id == user_id,
            models.ReadingHistory.book_id == book_id
        )\
        .order_by(models.ReadingHistory.read_at.desc())\
        .first()

# User favorites operations
def add_favorite(db: Session, user_id: uuid.UUID, book_id: str):
    # Check if already favorited
    existing = db.query(models.UserFavorite)\
        .filter(
            models.UserFavorite.user_id == user_id,
            models.UserFavorite.book_id == book_id
        ).first()
    
    if existing:
        return existing
    
    db_favorite = models.UserFavorite(
        user_id=user_id,
        book_id=book_id
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

def remove_favorite(db: Session, user_id: uuid.UUID, book_id: str):
    db_favorite = db.query(models.UserFavorite)\
        .filter(
            models.UserFavorite.user_id == user_id,
            models.UserFavorite.book_id == book_id
        ).first()
    
    if db_favorite:
        db.delete(db_favorite)
        db.commit()
        return True
    return False

def get_user_favorites(db: Session, user_id: uuid.UUID):
    return db.query(models.UserFavorite)\
        .filter(models.UserFavorite.user_id == user_id)\
        .order_by(models.UserFavorite.added_at.desc())\
        .all()
