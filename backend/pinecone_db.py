import pinecone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Pinecone client
api_key = os.getenv("PINECONE_API_KEY")
environment = os.getenv("PINECONE_ENVIRONMENT")

if not api_key or not environment:
    raise ValueError("Missing Pinecone API key or environment. Please set PINECONE_API_KEY and PINECONE_ENVIRONMENT in your .env file.")

# Constants
INDEX_NAME = "books-index"

# Initialize connection with Pinecone
pinecone_client = pinecone.Pinecone(
    api_key=api_key,
    region=environment
)

# Get or create index
def get_or_create_index():
    """Get the Pinecone index or create it if it doesn't exist"""
    # Check if index exists
    indexes = pinecone_client.list_indexes()
    index_exists = any(idx.name == INDEX_NAME for idx in indexes.indexes)
    
    if not index_exists:
        # Create index with text embedding capability
        pinecone_client.create_index(
            name=INDEX_NAME,
            dimension=768,  # Using OpenAI's embedding dimension
            metric="cosine",
            spec={
                "serverless": {
                    "cloud": "aws",
                    "region": "us-east-1"
                }
            }
        )
        print(f"Created new Pinecone index: {INDEX_NAME}")
    
    # Get index using the new API
    return pinecone_client.Index(INDEX_NAME)

# Get the index
index = get_or_create_index()
