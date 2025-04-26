import uuid
from .pinecone_db import index
from .utils import generate_id

# Constants
VECTOR_DIM = 768

# Book operations
def create_book(title):
    """Create a new book in Pinecone"""
    book_id = generate_id()
    
    # Store book metadata
    metadata = {
        "type": "book",
        "title": title,
    }
    
    # Books don't need embeddings, but Pinecone requires at least one non-zero value
    # Create a placeholder vector with a single non-zero value
    placeholder_vector = [0.0] * 768
    placeholder_vector[0] = 1.0  # Set first element to 1.0
    
    index.upsert(
        vectors=[{
            "id": book_id,
            "values": placeholder_vector,
            "metadata": metadata
        }]
    )
    
    return {"id": book_id, "title": title}

def get_books():
    """Get all books from Pinecone"""
    try:
        # Fetch all vectors with type=book using the new Pinecone API format
        query_response = index.query(
            vector=[1.0] + [0.0] * 767,  # Dummy vector with one non-zero value
            filter={"type": "book"},
            top_k=100,  # Adjust as needed
            include_metadata=True
        )
        
        books = []
        # Access matches attribute in the new API response
        for match in query_response.matches:
            books.append({
                "id": match.id,
                "title": match.metadata.get("title")
            })
        
        return books
    except Exception as e:
        print(f"Error fetching books: {e}")
        return []

def get_book(book_id):
    """Get a specific book by ID"""
    try:
        # Fetch the specific book by ID with new Pinecone API format
        fetch_response = index.fetch(ids=[book_id])
        
        # The new API returns an object with vectors as an attribute
        vectors = fetch_response.vectors
        
        if book_id in vectors:
            vector_data = vectors[book_id]
            return {
                "id": book_id,
                "title": vector_data.metadata.get("title")
            }
        return None
    except Exception as e:
        print(f"Error fetching book: {e}")
        return None

# Chapter operations
def create_chapter(book_id, chapter_number, title):
    """Create a new chapter in Pinecone"""
    # First check if the book exists
    book = get_book(book_id)
    if not book:
        raise ValueError(f"Book with ID {book_id} does not exist")
    
    # Check if chapter with the same number already exists for this book
    existing_chapters = get_chapters(book_id=book_id)
    for chapter in existing_chapters:
        if chapter["chapter_number"] == chapter_number:
            raise ValueError(f"Chapter {chapter_number} already exists for book {book_id}")
    
    # Generate new chapter ID
    chapter_id = generate_id()
    
    # Store chapter metadata
    metadata = {
        "type": "chapter",
        "book_id": book_id,
        "chapter_number": chapter_number,
        "title": title
    }
    
    # Chapters also use placeholder vectors with at least one non-zero value
    placeholder_vector = [0.0] * 768
    placeholder_vector[0] = 1.0  # Set first element to 1.0
    
    index.upsert(
        vectors=[{
            "id": chapter_id,
            "values": placeholder_vector,
            "metadata": metadata
        }]
    )
    
    return {
        "id": chapter_id,
        "book_id": book_id,
        "chapter_number": chapter_number,
        "title": title
    }

def get_chapters(book_id=None):
    """Get all chapters, optionally filtered by book_id"""
    try:
        # Prepare filter
        filter_dict = {"type": "chapter"}
        if book_id:
            filter_dict["book_id"] = book_id
        
        # Query for chapters using the new Pinecone API format
        query_response = index.query(
            vector=[1.0] + [0.0] * 767,  # Dummy vector with one non-zero value
            filter=filter_dict,
            top_k=1000,  # Adjust as needed
            include_metadata=True
        )
        
        chapters = []
        # Access matches attribute in the new API response
        for match in query_response.matches:
            chapters.append({
                "id": match.id,
                "book_id": match.metadata.get("book_id"),
                "chapter_number": match.metadata.get("chapter_number"),
                "title": match.metadata.get("title")
            })
        
        # Sort by chapter number
        chapters.sort(key=lambda x: x["chapter_number"])
        
        return chapters
    except Exception as e:
        print(f"Error fetching chapters: {e}")
        return []

def get_chapter(chapter_id):
    """Get a specific chapter by ID"""
    try:
        # Fetch the specific chapter by ID using the new Pinecone API format
        fetch_response = index.fetch(ids=[chapter_id])
        
        # Access vectors attribute in the new API response
        vectors = fetch_response.vectors
        
        if chapter_id in vectors:
            vector_data = vectors[chapter_id]
            return {
                "id": chapter_id,
                "book_id": vector_data.metadata.get("book_id"),
                "chapter_number": vector_data.metadata.get("chapter_number"),
                "title": vector_data.metadata.get("title")
            }
        return None
    except Exception as e:
        print(f"Error fetching chapter: {e}")
        return None

# Chunk operations
def create_chunk(book_id, chapter_number, original_text):
    """Create a new chunk with automatic index assignment"""
    try:
        # The validation for book existence and chapter existence is now done at the API route level
        # Here we focus on finding the chapter and creating the chunk
        
        # Find the chapter ID using book_id and chapter_number
        chapters = get_chapters(book_id=book_id)
            
        # Find the matching chapter by number
        chapter = next((c for c in chapters if c["chapter_number"] == chapter_number), None)
        
        # If somehow we reach here without a chapter (should be caught by route handler), raise error
        if not chapter:
            raise ValueError(f"Chapter {chapter_number} not found for book {book_id}")
        
        # Extract chapter ID
        chapter_id = chapter["id"]
        
        # Find existing chunks for this chapter to determine the next index
        existing_chunks = get_chunks(chapter_id=chapter_id)
        
        # Determine next chunk index - start at 0 or increment from highest
        chunk_index = 0
        if existing_chunks:
            # Find the highest index
            chunk_index = max(chunk["chunk_index"] for chunk in existing_chunks) + 1
        
        # Generate a unique ID for the new chunk
        chunk_id = generate_id()
        
        # Prepare metadata for the chunk
        metadata = {
            "type": "chunk",
            "book_id": book_id,
            "chapter_id": chapter_id,
            "chunk_index": chunk_index,
            "original_text": original_text
        }
    except Exception as e:
        # Catch any unexpected errors during preparation
        print(f"Error preparing chunk data: {e}")
        raise ValueError(f"Failed to prepare chunk data: {str(e)}")
    
    # Use Pinecone's sparse embedding capability
    # Store the chunk in Pinecone with a placeholder vector since our index doesn't support text embedding
    try:
        # Create a placeholder vector (768 dimensions with one non-zero value)
        placeholder_vector = [1.0] + [0.0] * 767  # 768-dimensional vector with one non-zero value
        
        index.upsert(
            vectors=[{
                "id": chunk_id,
                "metadata": metadata,
                "values": placeholder_vector  # Use placeholder vector instead of None
                # Removed 'text' field as the error shows it's not supported in current index
            }]
        )
        
        # Return the newly created chunk information
        return {
            "id": chunk_id,
            "book_id": book_id,
            "chapter_id": chapter_id,
            "chunk_index": chunk_index,
            "original_text": original_text
        }
    except Exception as e:
        print(f"Error storing chunk in Pinecone: {e}")
        raise ValueError(f"Failed to store chunk in database: {str(e)}")

def get_chunks_by_book_and_chapter(book_id=None, chapter_number=None):
    """Get chunks filtered by book_id and chapter_number"""
    try:
        # If only book_id is provided, use the original function
        if book_id and not chapter_number:
            return get_chunks(book_id=book_id)
        
        # If both book_id and chapter_number are provided, find the chapter_id first
        if book_id and chapter_number:
            # Get the chapters for this book
            chapters = get_chapters(book_id=book_id)
            chapter = next((c for c in chapters if c["chapter_number"] == chapter_number), None)
            
            if not chapter:
                # If chapter not found, return empty list
                return []
                
            # Use the chapter_id to get chunks
            chapter_id = chapter["id"]
            return get_chunks(chapter_id=chapter_id)
            
        # If neither is provided, return all chunks
        return get_chunks()
    except Exception as e:
        print(f"Error fetching chunks by book and chapter: {e}")
        return []

def get_chunks(chapter_id=None, book_id=None):
    """Get chunks, optionally filtered by chapter_id or book_id"""
    try:
        # Prepare filter
        filter_dict = {"type": "chunk"}
        if chapter_id:
            filter_dict["chapter_id"] = chapter_id
        elif book_id:
            filter_dict["book_id"] = book_id
        
        # Query for chunks using the new Pinecone API format
        query_response = index.query(
            vector=[1.0] + [0.0] * 767,  # Dummy vector with one non-zero value
            filter=filter_dict,
            top_k=1000,  # Adjust as needed
            include_metadata=True
        )
        
        chunks = []
        # Access matches attribute in the new API response
        for match in query_response.matches:
            chunks.append({
                "id": match.id,
                "book_id": match.metadata.get("book_id"),
                "chapter_id": match.metadata.get("chapter_id"),
                "chunk_index": match.metadata.get("chunk_index"),
                "original_text": match.metadata.get("original_text")
            })
        
        # Sort by chunk index
        chunks.sort(key=lambda x: x["chunk_index"])
        
        return chunks
    except Exception as e:
        print(f"Error fetching chunks: {e}")
        return []

def get_chunk(chunk_id):
    """Get a specific chunk by ID"""
    try:
        # Fetch the specific chunk by ID using the new Pinecone API format
        fetch_response = index.fetch(ids=[chunk_id])
        
        # Access vectors attribute in the new API response
        vectors = fetch_response.vectors
        
        if chunk_id in vectors:
            vector_data = vectors[chunk_id]
            return {
                "id": chunk_id,
                "book_id": vector_data.metadata.get("book_id"),
                "chapter_id": vector_data.metadata.get("chapter_id"),
                "chunk_index": vector_data.metadata.get("chunk_index"),
                "original_text": vector_data.metadata.get("original_text")
            }
        return None
    except Exception as e:
        print(f"Error fetching chunk: {e}")
        return None

def search_chunks(query_text, book_id=None, top_k=5):
    """Search for chunks by text match since our index doesn't support text embeddings"""
    try:
        # Prepare filter
        filter_dict = {"type": "chunk"}
        if book_id:
            filter_dict["book_id"] = book_id
        
        # Since we can't use semantic search with the current index config, we'll filter by book_id
        # and return chunks based on metadata
        
        # Create a placeholder vector for the query
        placeholder_vector = [1.0] + [0.0] * 767
        
        # Query Pinecone using the placeholder vector
        query_response = index.query(
            vector=placeholder_vector,  # Use placeholder instead of None
            # Removed text parameter as it's not supported
            filter=filter_dict,
            top_k=100,  # Increase to get more candidates for filtering
            include_metadata=True
        )
        
        # Since we can't do semantic search, we'll do basic text matching on the results
        # This isn't as good but will work until you can enable text embeddings in Pinecone
        results = []
        for match in query_response.matches:
            original_text = match.metadata.get("original_text", "")
            
            # Simple text matching - check if query text appears in the chunk
            # This is a basic fallback since we can't do proper semantic search
            if query_text.lower() in original_text.lower():
                results.append({
                    "id": match.id,
                    "book_id": match.metadata.get("book_id"),
                    "chapter_id": match.metadata.get("chapter_id"),
                    "chunk_index": match.metadata.get("chunk_index"),
                    "original_text": original_text,
                    "score": 1.0  # Default score since we're not doing actual similarity
                })
        
        # Limit results to requested top_k
        return results[:top_k]
    except Exception as e:
        print(f"Error searching chunks: {e}")
        return []
