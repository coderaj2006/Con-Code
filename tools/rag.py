import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config import config

def search_agri_knowledge(query: str) -> str:
    """
    Live implementation of the RAG search tool for agricultural knowledge.
    Queries the local ChromaDB.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        persist_dir = os.path.join(base_dir, "chroma_db")
        
        if not os.path.exists(persist_dir):
            print("WARNING: ChromaDB not found. Returning empty context. Please run scripts/ingest_data.py.")
            return "No RAG context available yet."

        print(f"DEBUG: Calling localized RAG search_agri_knowledge with query='{query}'")
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-2-preview", 
            google_api_key=config.GEMINI_API_KEY
        )
        
        # Use modern langchain_chroma
        vectorstore = Chroma(
            persist_directory=persist_dir, 
            embedding_function=embeddings
        )
        
        # Retrieve top 3 most relevant chunks
        docs = vectorstore.similarity_search(query, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])
        return context
    except Exception as e:
        print(f"ERROR: RAG search failed: {e}")
        return "No RAG context available due to error."
