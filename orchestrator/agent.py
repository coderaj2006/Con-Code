import json
import asyncio
import io
import logging
import google.generativeai as genai
from pydantic import BaseModel
from PIL import Image
from config import config
from tools.weather_agent import get_weather, get_weather_context
from tools.rag import search_agri_knowledge

logger = logging.getLogger(__name__)

# Ensure Gemini API Key is configured
genai.configure(api_key=config.GEMINI_API_KEY)

async def run_analysis_workflow(image_bytes: bytes, user_text: str, lat: float, lon: float, preferred_language: str) -> dict:
    """
    Multi-modal Orchestrator via Gemini 1.5 Flash. 
    Consolidates Vision, Weather Context, and RAG into a single structured insight.
    """
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    
    # 1. Gather Context (Weather Context Injection & RAG)
    try:
        weather_context = await asyncio.to_thread(get_weather_context, lat, lon)
    except Exception:
        weather_context = "Environmental conditions are currently unavailable."
        
    try:
        rag_context = await asyncio.to_thread(search_agri_knowledge, user_text or "crop health")
    except Exception:
        rag_context = "No additional expert context available."

    # 2. Unified Vision & Synthesis Prompt
    prompt = f"""
    ROLE: Expert AI Agricultural Botanist (Dr. Kisaan).
    TASK: Identify the pest/disease in this image and provide organic and chemical remedies in JSON format.
    
    CONTEXTUAL AWARENESS:
    - User Notes: {user_text}
    - Field Conditions: {weather_context}
    - Expert Knowledge: {rag_context}
    
    OUTPUT REQUIREMENTS:
    - Translate all strings into {preferred_language}.
    - Ensure 'diagnosis' is concise (2 sentences).
    - 'organic_remedy' and 'chemical_remedy' must be specific treatment steps.
    
    RETURN ONLY THIS JSON SCHEMA:
    {{
      "agent_state": {{"phase": "COMPLETED", "is_thinking": false, "progress_pct": 100}},
      "payload": {{
        "diagnosis": "Localized diagnosis in {preferred_language}",
        "organic_remedy": "Specific organic steps in {preferred_language}",
        "chemical_remedy": "Specific chemical steps in {preferred_language}",
        "confidence_score": 0.95,
        "sources": ["Gemini 1.5 Flash", "Field-Context", "Agri-RAG"]
      }},
      "diagnosis_status": "SUCCESS",
      "rag_entities": ["disease_name", "pest_name"],
      "next_step": "DISPLAY_RESULTS"
    }}
    
    If non-agricultural, return phase: "ERROR" and diagnosis_status: "NON_CROP".
    """

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        response = await model.generate_content_async([prompt, img])
        
        # Robust JSON Extraction & Parsing to Dictionary
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # Ensures it is a dictionary before returning to FastAPI
        result_dict = json.loads(text)
        return result_dict
    except Exception as e:
        logger.error(f"Vision Workflow error: {e}")
        return {
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {
                "diagnosis": "I had trouble analyzing this scan. Please try again with better lighting.", 
                "organic_remedy": "N/A", 
                "chemical_remedy": "N/A",
                "confidence_score": 0.0,
                "sources": []
            },
            "diagnosis_status": "ERROR",
            "next_step": "RESCAN_REQUIRED"
        }
