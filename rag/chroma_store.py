import os
import logging
import chromadb
from chromadb.utils import embedding_functions
from orchestrator.static_knowledge import AGRI_KNOWLEDGE

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "kisaan_agri_knowledge"

# ── Lazy Initializers ─────────────────────────────────────────────────────────
_client = None
_collection = None
_ef = None

def get_collection():
    global _client, _collection, _ef
    if _collection is not None:
        return _collection
    
    try:
        if _ef is None:
            # This may fail if internet is restricted or DNS fails
            _ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        if _client is None:
            _client = chromadb.PersistentClient(path=DB_PATH)
            
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=_ef
        )
        
        # Populate if fresh
        if _collection.count() == 0:
            logger.info("Initializing ChromaDB collection with AGRI_KNOWLEDGE...")
            chunks = _chunk_knowledge(AGRI_KNOWLEDGE)
            ids = [f"chunk_{i}" for i in range(len(chunks))]
            _collection.add(documents=chunks, ids=ids)
            
        return _collection
    except Exception as e:
        logger.error(f"ChromaDB/Embeddings not available: {e}")
        return None

def query_knowledge(query: str, n_results: int = 3) -> str:
    """
    Queries the ChromaDB collection for semantically relevant agricultural info.
    Returns combined chunks as a single string. Falls back gracefully on failure.
    """
    try:
        collection = get_collection()
        if not collection:
            return ""

        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        documents = results.get("documents", [[]])[0]
        return "\n\n---\n\n".join(documents) if documents else ""
    except Exception as e:
        logger.error(f"ChromaDB query failed: {e}")
        return ""
