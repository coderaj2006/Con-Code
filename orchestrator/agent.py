"""
Vision Orchestrator — Gemini 1.5 Flash multimodal pipeline.
Accepts raw image bytes, injects weather + RAG context, returns structured JSON.
"""
import json
import asyncio
import io
import logging
import time
import hashlib
import numpy as np
import google.generativeai as genai
from PIL import Image
from config import config
from tools.weather_agent import get_weather_context
from orchestrator.static_knowledge import AGRI_KNOWLEDGE

logger = logging.getLogger(__name__)

# ── Sustainability State ──────────────────────────────────────────────────────
_analysis_cache = {}          # {md5_hash: (timestamp, result_dict)}
_CACHE_TTL = 600              # 10 minutes in seconds
_current_key_idx = 0          # Tracks the currently active Gemini API key

# Initial configuration handled by config.py

def _rotate_api_key():
    global _current_key_idx
    if len(config.GEMINI_API_KEYS) > 1:
        _current_key_idx = (_current_key_idx + 1) % len(config.GEMINI_API_KEYS)
        new_key = config.GEMINI_API_KEYS[_current_key_idx]
        genai.configure(api_key=new_key)
        logger.info(f"🔄 API Key Rotated to Index {_current_key_idx}")
        return True
    return False

# ── Image processing constants ────────────────────────────────────────────────
MAX_DIMENSION = 1024          # Resize longest edge to this before sending
JPEG_QUALITY  = 85            # Compression quality (good balance of size/detail)
BLUR_THRESHOLD = 50.0         # Laplacian variance below this = too blurry (Optimized from 80.0)
CONFIDENCE_THRESHOLD = 0.5    # Minimum AI confidence required (Optimized from default)


def _preprocess_image(image_bytes: bytes) -> tuple[Image.Image, float, bool]:
    """
    Open any JPG/PNG/WEBP image, resize to MAX_DIMENSION on the longest edge,
    and check for blur via Laplacian variance.
    Returns (PIL Image in RGB, variance_value, is_too_blurry).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize while preserving aspect ratio
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        scale = MAX_DIMENSION / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # Blur detection via Laplacian variance on grayscale
    gray = np.array(img.convert("L"), dtype=np.float32)
    laplacian = np.array([
        [0,  1, 0],
        [1, -4, 1],
        [0,  1, 0],
    ])
    from scipy.ndimage import convolve
    lap = convolve(gray, laplacian)
    variance = float(lap.var())
    is_blurry = variance < BLUR_THRESHOLD

    logger.info(f"Image preprocessed: {img.size}, blur_variance={variance:.1f}, blurry={is_blurry}")
    return img, variance, is_blurry


def _create_rescan_response(message: str, diagnosis_status: str = "RESCAN_REQUIRED") -> dict:
    """Helper to generate a consistent rescan response with specific messaging."""
    return {
        "agent_state": {"phase": "RESCAN_REQUIRED", "is_thinking": False, "progress_pct": 0},
        "payload": {
            "diagnosis": message,
            "disease_name": "N/A",
            "organic_remedy": "N/A",
            "chemical_remedy": "N/A",
            "severity": "Low",
            "urgency_level": "Low",
            "confidence_score": 0.0,
            "sources": [],
        },
        "diagnosis_status": diagnosis_status,
        "rag_entities": [],
        "next_step": "RESCAN_REQUIRED",
    }


async def run_analysis_workflow(
    image_bytes: bytes,
    user_text: str,
    lat: float,
    lon: float,
    preferred_language: str,
) -> dict:
    """
    Multimodal crop diagnosis via Gemini 1.5 Flash with Request Sustainability Logic.
    """
    # ── 1. Duplicate Detection (10m Cache) ────────────────────────────────────
    img_hash = hashlib.md5(image_bytes).hexdigest()
    now = time.time()
    if img_hash in _analysis_cache:
        timestamp, cached_result = _analysis_cache[img_hash]
        if now - timestamp < _CACHE_TTL:
            logger.info(f"🚀 Cache Hit: Serving diagnosis for hash {img_hash[:8]}")
            return cached_result
    
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    # ── 2. Preprocess image (Strict resize + blur check) ──────────────────────
    try:
        img, variance, is_blurry = _preprocess_image(image_bytes)
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        return _create_rescan_response("Unable to process image. Please ensure it is a valid format.")

    if is_blurry:
        logger.warning(f"Image rejected: too blurry (Variance: {variance:.1f})")
        return _create_rescan_response(
            "Image is too blurry. Please hold your phone steady and re-scan the plant."
        )

    # ── 3. Parallel context gathering ────────────────────────────────────────
    weather_context = "Field conditions unavailable."
    rag_context = "No expert knowledge available."

    try:
        weather_context = await asyncio.to_thread(get_weather_context, lat, lon)
    except Exception as e:
        logger.warning(f"Weather context failed: {e}")

    # ── 3. Expert Context (Static Injection fallback) ─────────────────────────
    rag_context = AGRI_KNOWLEDGE

    # ── 4. Vision prompt ──────────────────────────────────────────────────────
    prompt = f"""You are Dr. Kisaan, an expert AI Agricultural Botanist.
You have access to a specialized Expert Knowledge Base (RAG) containing verified agricultural manuals.

TASK: Analyze this crop image. Identify any disease, pest, or deficiency.

CONTEXT:
- Farmer Notes: {user_text or "None provided"}
- Field Conditions: {weather_context}
- Expert Knowledge Base (CRITICAL): {rag_context}

STRICT RULES:
1. Respond entirely in {preferred_language}.
2. **PRIORITIZE** information from the "Expert Knowledge Base" above for specific treatment steps.
3. Identify the disease_name, provide a diagnosis (1-2 sentences), and offer organic/chemical remedies.
4. Confidence score must be a float 0.0-1.0.

OUTPUT ONLY JSON:
{{
  "agent_state": {{"phase": "COMPLETE", "is_thinking": false, "progress_pct": 100}},
  "payload": {{
    "disease_name": "...",
    "diagnosis": "...",
    "organic_remedy": "...",
    "chemical_remedy": "...",
    "severity": "Medium",
    "urgency_level": "Medium",
    "confidence_score": 0.92,
    "sources": ["Gemini 1.5 Flash", "Field-Context", "Agri-RAG"]
  }},
  "diagnosis_status": "SUCCESS",
  "rag_entities": ["disease name"],
  "next_step": "DISPLAY_RESULTS"
}}"""

    # ── 5. Gemini vision call with Rotation Support ───────────────────────────
    max_retries = len(config.GEMINI_API_KEYS)
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async([prompt, img])
            text = response.text.strip()
            # Strip markdown fences
            if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text: text = text.split("```")[1].split("```")[0].strip()

            result = json.loads(text)

            # Post-Analysis Confidence check
            confidence = result.get("payload", {}).get("confidence_score", 0.0)
            if confidence < CONFIDENCE_THRESHOLD:
                return _create_rescan_response(
                    f"AI confidence is too low ({int(confidence*100)}%). Please try again with better light."
                )

            # Store in cache before returning
            _analysis_cache[img_hash] = (time.time(), result)
            return result

        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                logger.error(f"Quota exceeded (Key #{_current_key_idx + 1}). Attempting rotation...")
                if _rotate_api_key():
                    continue  # Retry with new key
            
            logger.error(f"Vision workflow error: {e}", exc_info=True)
            return _create_rescan_response(
                "Diagnosis failed. Please check your connection and try again.",
                diagnosis_status="ERROR"
            )
    
    return _create_rescan_response("All API keys reached quota limits. Please try again later.")
