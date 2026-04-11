"""
Vision Orchestrator — Gemini 1.5 Flash multimodal pipeline.
Accepts raw image bytes, injects weather + RAG context, returns structured JSON.
"""
import json
import asyncio
import io
import logging
import google.generativeai as genai
from PIL import Image
from config import config
from tools.weather_agent import get_weather_context
from tools.rag import search_agri_knowledge

logger = logging.getLogger(__name__)
genai.configure(api_key=config.GEMINI_API_KEY)


async def run_analysis_workflow(
    image_bytes: bytes,
    user_text: str,
    lat: float,
    lon: float,
    preferred_language: str,
) -> dict:
    """
    Multimodal crop diagnosis via Gemini 1.5 Flash.
    Returns OrchestratorResponse-compatible dict.
    """
    model = genai.GenerativeModel("gemini-1.5-flash-latest")

    # ── 1. Parallel context gathering ────────────────────────────────────────
    weather_context = "Field conditions unavailable."
    rag_context = "No expert knowledge available."

    try:
        weather_context = await asyncio.to_thread(get_weather_context, lat, lon)
    except Exception as e:
        logger.warning(f"Weather context failed: {e}")

    try:
        rag_context = await asyncio.to_thread(
            search_agri_knowledge, user_text or "crop disease pest identification"
        )
    except Exception as e:
        logger.warning(f"RAG context failed: {e}")

    # ── 2. Vision prompt ──────────────────────────────────────────────────────
    prompt = f"""You are Dr. Kisaan, an expert AI Agricultural Botanist powered by Gemini 1.5 Flash.

TASK: Analyze this crop image. Identify any disease, pest, or deficiency present.

CONTEXT:
- Farmer Notes: {user_text or "None provided"}
- Field Conditions: {weather_context}
- Expert Knowledge Base: {rag_context}

STRICT RULES:
1. Respond entirely in language: {preferred_language}
2. diagnosis: 1-2 sentences identifying the specific disease/pest/condition
3. organic_remedy: 2-3 concrete organic treatment steps
4. chemical_remedy: 2-3 specific chemical steps with product names
5. severity: one of "Low", "Medium", "High"
6. confidence_score: float 0.0-1.0
7. urgency_level: one of "Low", "Medium", "High"
8. rag_entities: list of [disease_name, pest_name] as strings

OUTPUT ONLY THIS JSON — NO MARKDOWN, NO EXTRA TEXT:
{{
  "agent_state": {{"phase": "COMPLETE", "is_thinking": false, "progress_pct": 100}},
  "payload": {{
    "diagnosis": "...",
    "organic_remedy": "...",
    "chemical_remedy": "...",
    "severity": "Medium",
    "urgency_level": "Medium",
    "confidence_score": 0.92,
    "sources": ["Gemini 1.5 Flash", "Field-Context", "Agri-RAG"]
  }},
  "diagnosis_status": "SUCCESS",
  "rag_entities": ["disease name", "pest name"],
  "next_step": "DISPLAY_RESULTS"
}}

If the image is NOT a crop/plant, return diagnosis_status "NON_CROP" and phase "ERROR"."""

    # ── 3. Gemini vision call ─────────────────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        response = await model.generate_content_async([prompt, img])

        text = response.text.strip()
        # Strip markdown fences if Gemini wraps output
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)

        # Validate required structure
        if "payload" not in result or "agent_state" not in result:
            raise ValueError("Incomplete JSON from Gemini")

        return result

    except Exception as e:
        logger.error(f"Vision workflow error: {e}", exc_info=True)
        return {
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {
                "diagnosis": "Diagnosis failed. Please retake the photo in good lighting and try again.",
                "organic_remedy": "N/A",
                "chemical_remedy": "N/A",
                "severity": "Low",
                "urgency_level": "Low",
                "confidence_score": 0.0,
                "sources": [],
            },
            "diagnosis_status": "ERROR",
            "rag_entities": [],
            "next_step": "RESCAN_REQUIRED",
        }
