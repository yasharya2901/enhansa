from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .auth import get_current_active_user

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Book App API",
    description="API for managing books, chapters, and text chunks with vector embeddings and user authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/", tags=["root"], summary="API Root", 
         description="Welcome endpoint for the Book App API")
def read_root():
    return {"message": "Welcome to the Book App API"}

# Include routers
from .routes import books, chapters, chunks, auth, users

# Auth routes
app.include_router(auth.router)

# User routes
app.include_router(users.router)

# Content routes
app.include_router(books.router)
app.include_router(chapters.router)
app.include_router(chunks.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)