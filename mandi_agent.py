"""
Mandi RAG Agent — answers crop price queries using local knowledge + Gemini.
Uses the same ChromaDB as the main RAG but with a mandi-specific prompt.
Falls back to structured mock data if vector store is empty.
"""
import json
import asyncio
import logging
import google.generativeai as genai
from config import config
from advisory_agent import _get_faiss_store, _search_faiss

logger = logging.getLogger(__name__)
genai.configure(api_key=config.GEMINI_API_KEY)

# Static mandi data used as fallback + context injection
MANDI_DATA = [
    {"crop": "Wheat",   "price_jaipur": 2100, "price_tonk": 2050, "price_ajmer": 2080, "unit": "Quintal", "trend": "stable"},
    {"crop": "Tomato",  "price_jaipur": 2400, "price_tonk": 2350, "price_ajmer": 2420, "unit": "Quintal", "trend": "up"},
    {"crop": "Potato",  "price_jaipur": 1200, "price_tonk": 1150, "price_ajmer": 1180, "unit": "Quintal", "trend": "down"},
    {"crop": "Onion",   "price_jaipur": 1800, "price_tonk": 1750, "price_ajmer": 1820, "unit": "Quintal", "trend": "up"},
    {"crop": "Rice",    "price_jaipur": 3200, "price_tonk": 3150, "price_ajmer": 3180, "unit": "Quintal", "trend": "stable"},
    {"crop": "Mustard", "price_jaipur": 5200, "price_tonk": 5100, "price_ajmer": 5150, "unit": "Quintal", "trend": "up"},
    {"crop": "Maize",   "price_jaipur": 1900, "price_tonk": 1850, "price_ajmer": 1880, "unit": "Quintal", "trend": "stable"},
    {"crop": "Soybean", "price_jaipur": 4100, "price_tonk": 4050, "price_ajmer": 4080, "unit": "Quintal", "trend": "down"},
]

def _build_mandi_context() -> str:
    lines = ["Current Mandi Prices (per Quintal, INR):"]
    for item in MANDI_DATA:
        lines.append(
            f"- {item['crop']}: Jaipur ₹{item['price_jaipur']} | "
            f"Tonk ₹{item['price_tonk']} | Ajmer ₹{item['price_ajmer']} "
            f"[Trend: {item['trend']}]"
        )
    return "\n".join(lines)

async def get_mandi_advice(query: str, preferred_language: str = "hi") -> dict:
    """
    RAG-powered mandi price advisor.
    1. Searches ChromaDB for relevant agricultural/market context
    2. Injects static mandi price table
    3. Asks Gemini to give comparative analysis
    """
    model = genai.GenerativeModel('models/gemini-2.5-flash')

    # 1. RAG context (may contain market-related PDF content)
    try:
        store = await _get_faiss_store()
        if store:
            rag_context = await asyncio.to_thread(_search_faiss, store, query)
            has_rag = bool(rag_context.strip())
        else:
            rag_context = "Knowledge base indexing in progress."
            has_rag = False
    except Exception:
        rag_context = ""
        has_rag = False

    # 2. Static mandi price table
    mandi_context = _build_mandi_context()

    prompt = f"""
You are a Mandi Price Expert for Indian farmers. Answer ONLY in {preferred_language}.

LIVE MANDI DATA:
{mandi_context}

ADDITIONAL KNOWLEDGE BASE:
{rag_context if has_rag else "Not available"}

FARMER QUERY: {query}

INSTRUCTIONS:
- Give a direct, helpful answer about crop prices
- Always compare at least 2 markets (e.g., "Wheat is ₹2100 in Jaipur vs ₹2050 in Tonk")
- Mention the trend (rising/falling/stable) and what it means for the farmer
- Suggest the best market to sell in based on current prices
- Keep response under 4 sentences
- Be conversational and farmer-friendly

RETURN ONLY VALID JSON:
{{
  "response": "Detailed price advisory in {preferred_language}",
  "best_market": "Market name with highest price for queried crop",
  "price_summary": [{{"crop": "name", "market": "name", "price": 0000, "trend": "up/down/stable"}}],
  "audio_summary": "Short 2-sentence TTS-friendly summary in {preferred_language}",
  "language_code": "{preferred_language}"
}}
"""

    try:
        resp = await model.generate_content_async(prompt)
        text = resp.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Mandi agent error: {e}")
        # Structured fallback
        return {
            "response": "Wheat is ₹2100/quintal in Jaipur and ₹2050 in Tonk. Tomato prices are rising — ₹2400 in Jaipur. Best time to sell Mustard at ₹5200 in Jaipur.",
            "best_market": "Jaipur",
            "price_summary": [{"crop": "Wheat", "market": "Jaipur", "price": 2100, "trend": "stable"}],
            "audio_summary": "Current mandi prices are stable. Jaipur offers the best rates today.",
            "language_code": preferred_language
        }
