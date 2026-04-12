"""
Compassionate Agri-Scientist Advisory Agent
============================================
- FAISS vector store built from /data PDFs (lazy-loaded on first query)
- GoogleGenerativeAIEmbeddings for semantic search
- Auto language detection (Hindi / English / regional)
- Mobile-optimised responses: bullet points, clear headings, simple language
- Reads weather context from tools/weather_agent.py (read-only, never modified)
"""

import os
import json
import asyncio
import logging
import hashlib
from typing import Optional

import google.generativeai as genai
from config import config

# ── Weather agent — read-only dependency (DO NOT MODIFY weather_agent.py) ────
from tools.weather_agent import get_weather_context

logger = logging.getLogger(__name__)
genai.configure(api_key=config.GEMINI_API_KEY)

# ── FAISS vector store — lazy singleton ──────────────────────────────────────
_faiss_store = None
_faiss_lock = asyncio.Lock()

def _build_faiss_store():
    """
    Builds a FAISS index from /data PDFs using GoogleGenerativeAIEmbeddings.
    Falls back gracefully if PDFs are missing or embeddings fail.
    """
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import FAISS
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        faiss_dir = os.path.join(base_dir, "faiss_index")

        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=config.GEMINI_API_KEY,
        )

        # Load from saved index if it exists
        if os.path.exists(faiss_dir):
            logger.info("Loading existing FAISS index from disk.")
            return FAISS.load_local(faiss_dir, embeddings, allow_dangerous_deserialization=True)

        # Build fresh from PDFs
        if not os.path.exists(data_dir):
            logger.warning("No /data directory found. Advisory agent will use general knowledge.")
            return None

        pdf_files = [f for f in os.listdir(data_dir) if f.endswith(".pdf")]
        if not pdf_files:
            logger.warning("No PDFs in /data. Advisory agent will use general knowledge.")
            return None

        logger.info(f"Building FAISS index from {len(pdf_files)} PDFs...")
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80)
        all_chunks = []

        for pdf in pdf_files:
            try:
                loader = PyPDFLoader(os.path.join(data_dir, pdf))
                chunks = splitter.split_documents(loader.load())
                all_chunks.extend(chunks)
                logger.info(f"  Loaded {len(chunks)} chunks from {pdf}")
            except Exception as e:
                logger.warning(f"  Skipped {pdf}: {e}")

        if not all_chunks:
            return None

        store = FAISS.from_documents(all_chunks, embeddings)
        os.makedirs(faiss_dir, exist_ok=True)
        store.save_local(faiss_dir)
        logger.info(f"FAISS index built and saved ({len(all_chunks)} chunks).")
        return store

    except Exception as e:
        logger.error(f"FAISS build failed: {e}")
        return None


async def _get_faiss_store():
    """Lazy-loads the FAISS store once, thread-safe."""
    global _faiss_store
    async with _faiss_lock:
        if _faiss_store is None:
            _faiss_store = await asyncio.to_thread(_build_faiss_store)
    return _faiss_store


def _search_faiss(store, query: str, k: int = 4) -> str:
    """Returns top-k relevant chunks as a single context string."""
    try:
        docs = store.similarity_search(query, k=k)
        return "\n\n".join(d.page_content for d in docs)
    except Exception as e:
        logger.warning(f"FAISS search failed: {e}")
        return ""


def _detect_language(text: str) -> str:
    """
    Detects language code from query text.
    Returns 'hi' for Hindi/Devanagari, 'en' otherwise.
    Falls back to 'hi' if langdetect is unavailable.
    """
    try:
        from langdetect import detect
        code = detect(text)
        # Map common codes to our supported set
        lang_map = {
            "hi": "hi", "mr": "mr", "gu": "gu", "pa": "pa",
            "bn": "bn", "te": "te", "ta": "ta", "kn": "kn",
            "ml": "ml", "en": "en",
        }
        return lang_map.get(code, "hi")
    except Exception:
        # Devanagari script detection as fallback
        if any("\u0900" <= c <= "\u097F" for c in text):
            return "hi"
        return "en"


async def get_advice(
    query: str,
    lat: float,
    lon: float,
    preferred_language: Optional[str] = None,
) -> dict:
    """
    Main advisory function.
    - Auto-detects language if preferred_language not provided
    - Searches FAISS index for relevant agricultural knowledge
    - Reads weather context (read-only, weather_agent.py untouched)
    - Returns mobile-optimised, compassionate response
    """
    model = genai.GenerativeModel("gemini-1.5-flash-latest")

    # 1. Language detection
    lang = preferred_language or _detect_language(query)

    # 2. FAISS RAG search
    rag_context = ""
    try:
        store = await _get_faiss_store()
        if store:
            rag_context = await asyncio.to_thread(_search_faiss, store, query)
    except Exception as e:
        logger.warning(f"RAG search error: {e}")

    has_rag = bool(rag_context.strip())

    # 3. Weather context — read-only call to teammate's module
    weather_context = "Field conditions currently unavailable."
    try:
        weather_context = await asyncio.to_thread(get_weather_context, lat, lon)
    except Exception as e:
        logger.warning(f"Weather context unavailable: {e}")

    # 4. Build prompt
    lang_instruction = {
        "hi": "Respond in simple Hindi (हिंदी). Use easy words a farmer would understand.",
        "en": "Respond in simple English. Avoid technical jargon.",
        "mr": "Respond in Marathi (मराठी).",
        "gu": "Respond in Gujarati (ગુજરાતી).",
        "pa": "Respond in Punjabi (ਪੰਜਾਬੀ).",
        "bn": "Respond in Bengali (বাংলা).",
        "te": "Respond in Telugu (తెలుగు).",
        "ta": "Respond in Tamil (தமிழ்).",
        "kn": "Respond in Kannada (ಕನ್ನಡ).",
        "ml": "Respond in Malayalam (മലയാളം).",
    }.get(lang, "Respond in simple Hindi.")

    prompt = f"""You are a Compassionate Agri-Scientist helping Indian farmers.
Your personality: warm, patient, encouraging — like a knowledgeable friend.

LANGUAGE RULE: {lang_instruction}

CURRENT FIELD CONDITIONS:
{weather_context}

EXPERT KNOWLEDGE BASE:
{rag_context if has_rag else "Use your general agricultural knowledge."}

FARMER'S QUESTION: {query}

RESPONSE RULES (CRITICAL for mobile readability):
1. Start with a warm 1-line acknowledgement of the farmer's concern
2. Use bullet points (•) for any list of steps or symptoms
3. Keep each bullet under 10 words
4. Use simple headings like "🌱 Problem:", "💊 Treatment:", "⚠️ Warning:"
5. Maximum 5 bullet points total
6. End with one encouraging sentence
7. Never use complex scientific names without a simple explanation

RETURN ONLY THIS JSON (no markdown fences):
{{
  "response": "Full formatted response in {lang}",
  "audio_summary": "2-sentence plain summary for text-to-speech in {lang}",
  "language_code": "{lang}",
  "source_type": "{'EXPERT_GUIDE' if has_rag else 'GENERAL_KNOWLEDGE'}",
  "notification": "{'Based on your agricultural guides' if has_rag else 'Based on general knowledge'}"
}}"""

    try:
        resp = await model.generate_content_async(prompt)
        text = resp.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Advisory agent error: {e}")
        return {
            "response": "माफ करें, अभी जवाब देने में दिक्कत हो रही है। कृपया दोबारा कोशिश करें।"
                        if lang == "hi" else
                        "Sorry, I'm having trouble right now. Please try again.",
            "audio_summary": "Please try again later.",
            "language_code": lang,
            "source_type": "ERROR",
            "notification": "Service interruption",
        }
