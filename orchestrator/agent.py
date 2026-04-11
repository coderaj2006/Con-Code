import json
import asyncio
import io
import google.generativeai as genai
from pydantic import BaseModel
from PIL import Image
from config import config
from tools.weather import get_weather
from tools.rag import search_agri_knowledge

# Ensure Gemini API Key is configured
genai.configure(api_key=config.GEMINI_API_KEY)

async def run_analysis_workflow(image_bytes: bytes, user_text: str, lat: float, lon: float, preferred_language: str) -> dict:
    """
    Multi-modal Antigravity Master Agent Workflow via Gemini.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # 1. Vision & Reasoning Task
    vision_prompt = """
    You are an expert AI Agricultural Botanist.
    Analyze this crop image. Describe exactly what you see: crop type (if discernable), symptoms (spots, yellowing, etc.), pest presence, or overall health.
    Keep it concise. E.g. 'Analyzing symptoms: yellowing leaves, brown spotting on wheat.'
    If the image is completely NOT related to agriculture/plants, say 'NON_CROP_DETECTED'.
    """
    
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        # Run vision inference via thread to avoid blocking if using sync SDK, or natively async
        vision_res = await model.generate_content_async([vision_prompt, img])
        vision_description = vision_res.text.strip()
    except Exception as e:
        vision_description = "Error analyzing image."

    # Guardrail Check
    if "NON_CROP_DETECTED" in vision_description:
        return {
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {
                "diagnosis": "I couldn't identify a plant. Please ensure the crop or affected leaf is in focus and try again.", 
                "confidence_score": 0.0, 
                "sources": [],
                "treatment_plan": []
            },
            "diagnosis_status": "ERROR",
            "rag_entities": [],
            "next_step": "RESCAN_REQUIRED"
        }

    # 2. Environmental Task
    weather_data = await asyncio.to_thread(get_weather, lat, lon)
    
    # 3. Search Augmentation Task
    rag_query = vision_description
    if user_text:
        rag_query += f" User notes: {user_text}"
        
    rag_context = await asyncio.to_thread(search_agri_knowledge, rag_query)
    
    # 4. Final Synthesis Task - output strict UI Schema
    synthesis_prompt = f"""
    You are the Intelligence Orchestrator for Kisaan-Sense, an agricultural AI for Indian farmers.
    Synthesize a final, localized diagnosis based on all available context:

    - Vision Description: {vision_description}
    - Local Weather: {json.dumps(weather_data)}
    - RAG Knowledge Base Context: {rag_context}
    - Farmer's own notes: {user_text}

    ### CRITICAL OUTPUT RULES:
    1. DIAGNOSIS: Translate the 'diagnosis' string fully into {preferred_language}. It must be concise (2-3 sentences) and actionable.
    2. TREATMENT PLAN: Populate 'treatment_plan' with EXACTLY 3-4 steps. Each step MUST:
       - Be numbered (e.g. "1. ...", "2. ...")
       - Be specific and directly derived from the RAG Context above
       - Prefer organic / low-cost solutions (neem oil, copper fungicide, crop rotation)
       - Include dosage or timing where relevant (e.g. "Apply 2ml/L neem oil spray every 7 days")
       - NEVER be generic filler like "Consult an expert" — only concrete steps
    3. CONFIDENCE: Set confidence_score between 0.0 and 1.0 based on how clearly the image matches a known condition.
    4. If the image shows a healthy plant, set treatment_plan to ["1. No action required. Crop appears healthy."] and confidence_score to 1.0.

    Return ONLY a valid JSON object matching exactly this schema (no markdown, no extra text):
    {{
        "agent_state": {{
            "phase": "COMPLETED",
            "is_thinking": false,
            "progress_pct": 100
        }},
        "payload": {{
            "diagnosis": "Localized diagnosis string in {preferred_language}.",
            "confidence_score": 0.95,
            "sources": ["RAG VectorDB", "Gemini Vision Model"],
            "treatment_plan": [
                "1. First specific step from RAG context",
                "2. Second specific step with dosage/timing",
                "3. Third preventive or follow-up step"
            ]
        }},
        "diagnosis_status": "SUCCESS",
        "rag_entities": ["key", "disease", "or", "pest", "names"],
        "next_step": "DISPLAY_RESULTS"
    }}
    """
    
    try:
        final_res = await model.generate_content_async(synthesis_prompt)
        final_text = final_res.text.replace('```json', '').replace('```', '').strip()
        final_data = json.loads(final_text)
        return final_data
    except Exception as e:
        return {
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {"diagnosis": f"Synthesis failure. Try again.", "confidence_score": 0.0, "sources": [], "treatment_plan": []},
            "diagnosis_status": "ERROR",
            "rag_entities": [],
            "next_step": "RESCAN_REQUIRED"
        }
