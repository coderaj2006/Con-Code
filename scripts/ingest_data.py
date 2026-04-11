import os
import time
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

import sys
# Ensure output is flushed and visible in terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

# Load Environment Variables (.env)
load_dotenv()

def ingest_data():
    """
    Individual Ingestion script (Batch Size 1) for gemini-embedding-2-preview.
    Resumable approach - does not clear existing database.
    """
    print("INGESTION SCRIPT STARTED (Individual Ingestion Mode)", flush=True)
    
    # 1. Paths Configuration
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    persist_dir = os.path.join(base_dir, "chroma_db")
    
    # 2. Resumable Check: Inform about existing database
    if os.path.exists(persist_dir):
        print(f"RESUME MODE: Existing vector database found at '{persist_dir}'. New data will be appended.", flush=True)
    else:
        print(f"FIRST RUN: Creating fresh vector database at '{persist_dir}'.", flush=True)
    
    if not os.path.exists(data_dir):
        print(f"ERROR: Data directory '{data_dir}' not found.")
        return

    # 3. Document Loading & Splitting
    pdf_files = [f for f in os.listdir(data_dir) if f.endswith('.pdf')]
    if not pdf_files:
        print(f"WARNING: No PDF files found in '{data_dir}'.")
        return

    print(f"FOUND: {len(pdf_files)} PDF documents.")
    all_chunks = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    for pdf in pdf_files:
        file_path = os.path.join(data_dir, pdf)
        print(f"LOADING & SPLITTING: {pdf}...", flush=True)
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            chunks = text_splitter.split_documents(pages)
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"SKIP ERROR: Could not process {pdf}. Error: {e}", flush=True)

    print(f"TOTAL CHUNKS PREPARED: {len(all_chunks)}", flush=True)

    # 4. Embedding & Chroma Initialization
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2-preview",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    
    vectorstore = Chroma(
        persist_directory=persist_dir, 
        embedding_function=embeddings
    )

    # 5. Individual Ingestion Loop (Batch Size 1)
    # RESUME LOGIC: Define starting point
    start_chunk = 2416  # User's requested starting point
    print(f"STARTING INGESTION: Processing chunks from {start_chunk} onwards.", flush=True)
    
    success_count = 0
    error_count = 0

    for idx, chunk in enumerate(all_chunks):
        # Skip chunks before the start_chunk (adjusting for 1-based indexing)
        if (idx + 1) < start_chunk:
            continue
        # Data Cleaning: Skip empty or very short chunks
        if len(chunk.page_content.strip()) < 10:
            continue

        try:
            # Batch Size 1: Process exactly one document at a time
            vectorstore.add_documents(documents=[chunk])
            success_count += 1
        except Exception as e:
            print(f"STOPPING: Error at Chunk {idx+1}: {e}", flush=True)
            print(f"FINAL PROGRESS BEFORE PAUSE: {idx}/{len(all_chunks)} chunks attempted.", flush=True)
            return # Stop processing so user can provide new key

        # Progress tracking: Print every 10th chunk
        if (idx + 1) % 10 == 0 or (idx + 1) == len(all_chunks):
            print(f"PROGRESS: Processed {idx + 1}/{len(all_chunks)}... [Success: {success_count}, Errors: {error_count}]", flush=True)

        # Speed Limiter: Stay under 100 RPM ceiling (~85 RPM)
        time.sleep(0.7)

    print(f"\nINGESTION COMPLETE! Final Success: {success_count}, Total Errors: {error_count}", flush=True)

if __name__ == "__main__":
    ingest_data()
