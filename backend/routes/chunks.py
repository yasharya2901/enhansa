from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from .. import schemas
from .. import pinecone_crud

router = APIRouter(
    prefix="/chunks",
    tags=["chunks"],
    responses={404: {"description": "Chunk not found"}}
)

@router.post("/", response_model=schemas.ChunkResponse, status_code=status.HTTP_201_CREATED,
            summary="Create a new chunk",
            description="Add a new text chunk with vector embedding")
def create_chunk(chunk: schemas.ChunkCreate):
    """Create a new chunk in Pinecone with vector embedding"""
    try:
        # Validate the book exists
        book = pinecone_crud.get_book(chunk.book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Book with ID {chunk.book_id} not found"
            )
        
        # Validate the chapter exists in this book
        chapters = pinecone_crud.get_chapters(book_id=chunk.book_id)
        chapter = next((c for c in chapters if c["chapter_number"] == chunk.chapter_number), None)
        if not chapter:
            available_chapters = [c["chapter_number"] for c in chapters]
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Chapter {chunk.chapter_number} not found in book '{book['title']}'. Available chapters: {available_chapters}"
            )
            
        # Create the chunk
        return pinecone_crud.create_chunk(
            book_id=chunk.book_id, 
            chapter_number=chunk.chapter_number, 
            original_text=chunk.original_text
        )
    except HTTPException:
        # Re-raise HTTP exceptions (we already formatted them correctly)
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                         detail=f"Error creating chunk: {str(e)}")

@router.get("/", response_model=List[schemas.ChunkResponse],
           summary="Get all chunks",
           description="Retrieve a list of all chunks with filters by book ID and chapter number")
def get_chunks(book_id: Optional[str] = None, chapter_number: Optional[int] = None):
    """Get all chunks, optionally filtered by book_id and chapter_number"""
    try:
        return pinecone_crud.get_chunks_by_book_and_chapter(book_id=book_id, chapter_number=chapter_number)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error retrieving chunks: {str(e)}"
        )

@router.get("/{chunk_id}", response_model=schemas.ChunkResponse,
          summary="Get chunk by ID",
          description="Retrieve a specific chunk by its ID")
def get_chunk(chunk_id: str):
    """Get a specific chunk by ID"""
    chunk = pinecone_crud.get_chunk(chunk_id)
    if chunk is None:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk

@router.post("/search", response_model=schemas.SearchResult,
            summary="Search chunks by semantic similarity",
            description="Search for text chunks that are semantically similar to the query")
def search_chunks(search_query: schemas.SearchQuery):
    """Search for chunks by semantic similarity"""
    try:
        results = pinecone_crud.search_chunks(
            query_text=search_query.query,
            book_id=search_query.book_id,
            top_k=search_query.limit
        )
        return {"chunks": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
