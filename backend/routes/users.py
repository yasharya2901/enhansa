from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from .. import schemas, models, crud
from ..database import get_db
from ..auth import get_current_active_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "User data not found"}}
)

# Reading history endpoints
@router.post("/history", status_code=status.HTTP_201_CREATED,
            summary="Record reading history",
            description="Record a user's reading activity")
def create_reading_history(
    book_id: str, 
    chapter_id: str = None, 
    chunk_id: str = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record a new reading history entry for the current user"""
    return crud.create_reading_history(
        db=db, 
        user_id=current_user.id, 
        book_id=book_id, 
        chapter_id=chapter_id,
        chunk_id=chunk_id
    )

@router.get("/history", 
          summary="Get reading history",
          description="Get the user's reading history")
def get_reading_history(
    skip: int = 0, 
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reading history for the current user"""
    return crud.get_user_reading_history(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/history/last-read/{book_id}",
          summary="Get last read position",
          description="Get the user's last read position for a specific book")
def get_last_read(
    book_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the last read position for a specific book"""
    return crud.get_last_read(db, user_id=current_user.id, book_id=book_id)

# Favorites endpoints
@router.post("/favorites/{book_id}", 
           status_code=status.HTTP_201_CREATED,
           summary="Add favorite",
           description="Add a book to the user's favorites")
def add_favorite(
    book_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a book to the user's favorites"""
    return crud.add_favorite(db, user_id=current_user.id, book_id=book_id)

@router.delete("/favorites/{book_id}",
             summary="Remove favorite",
             description="Remove a book from the user's favorites")
def remove_favorite(
    book_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a book from the user's favorites"""
    success = crud.remove_favorite(db, user_id=current_user.id, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"status": "success", "message": "Book removed from favorites"}

@router.get("/favorites",
          summary="Get favorites",
          description="Get the user's favorite books")
def get_favorites(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the user's favorite books"""
    return crud.get_user_favorites(db, user_id=current_user.id)
