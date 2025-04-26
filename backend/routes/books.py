from fastapi import APIRouter, HTTPException, status
from typing import List
from .. import schemas
from .. import pinecone_crud

router = APIRouter(
    prefix="/books",
    tags=["books"],
    responses={404: {"description": "Book not found"}}
)

@router.post("/", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED,
            summary="Create a new book",
            description="Add a new book with the provided title")
def create_book(book: schemas.BookCreate):
    """Create a new book in Pinecone"""
    try:
        return pinecone_crud.create_book(book.title)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                           detail=f"Error creating book: {str(e)}")

@router.get("/", response_model=List[schemas.BookResponse],
           summary="Get all books",
           description="Retrieve a list of all books")
def get_books():
    """Get all books from Pinecone"""
    try:
        return pinecone_crud.get_books()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                           detail=f"Error retrieving books: {str(e)}")

@router.get("/{book_id}", response_model=schemas.BookResponse,
          summary="Get book by ID",
          description="Retrieve a specific book by its ID")
def get_book(book_id: str):
    """Get a specific book by ID"""
    try:
        db_book = pinecone_crud.get_book(book_id)
        if db_book is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        return db_book
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                           detail=f"Error retrieving book: {str(e)}")
