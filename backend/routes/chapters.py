from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from .. import schemas
from .. import pinecone_crud

router = APIRouter(
    prefix="/chapters",
    tags=["chapters"],
    responses={404: {"description": "Chapter not found"}}
)

@router.post("/", response_model=schemas.ChapterResponse, status_code=status.HTTP_201_CREATED,
            summary="Create a new chapter",
            description="Add a new chapter to a book")
def create_chapter(chapter: schemas.ChapterCreate):
    """Create a new chapter in Pinecone"""
    try:
        return pinecone_crud.create_chapter(
            book_id=chapter.book_id,
            chapter_number=chapter.chapter_number,
            title=chapter.title
        )
    except ValueError as e:
        # Convert ValueError to HTTP 400 Bad Request
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                           detail=f"Error creating chapter: {str(e)}")

@router.get("/", response_model=List[schemas.ChapterResponse],
           summary="Get all chapters",
           description="Retrieve a list of all chapters")
def get_chapters(book_id: Optional[str] = None):
    """Get all chapters, optionally filtered by book_id"""
    return pinecone_crud.get_chapters(book_id=book_id)

@router.get("/{chapter_id}", response_model=schemas.ChapterResponse,
          summary="Get chapter by ID",
          description="Retrieve a specific chapter by its ID")
def get_chapter(chapter_id: str):
    """Get a specific chapter by ID"""
    db_chapter = pinecone_crud.get_chapter(chapter_id)
    if db_chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return db_chapter