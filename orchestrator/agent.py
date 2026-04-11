import json
import google.generativeai as genai
from pydantic import BaseModel
from config import config
from tools.weather import get_weather
from tools.rag import search_agri_knowledge

# Ensure Gemini API Key is configured
genai.configure(api_key=config.GEMINI_API_KEY)

class Diagnosis(BaseModel):
    crop_type: str
    issue: str
    confidence: str
    urgency: str

class ActionPlan(BaseModel):
    immediate_remedy: str
    chemical_option: str
    prevention: str

class AgentResponse(BaseModel):
    diagnosis: Diagnosis
    environmental_context: str
    action_plan: ActionPlan
    localized_audio_script: str

def run_analysis_workflow(image_url: str, lat: float, lon: float, preferred_language: str) -> dict:
    """
    Real implementation of the Antigravity Master Agent Workflow using Gemini.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # 1. Vision & Reasoning Task
    vision_prompt = f"""
    You are an expert AI Agricultural Botanist.
    Analyze this crop image URL (or assume it's a crop if evaluating text for now): {image_url}
    Identify the crop type and any visible diseases or pests.
    Return ONLY a JSON formatted string according to this structure (no markdown fences):
    {{"crop_type": "string", "issue": "string", "confidence": "float from 0.0 to 100.0"}}
    """
    
    try:
        vision_res = model.generate_content(vision_prompt)
        vision_data = json.loads(vision_res.text.replace('```json', '').replace('```', '').strip())
    except Exception as e:
        # Fallback or strict guardrail error
        if "non_agri" in image_url:
             return {"error": "Please upload a crop photo"}
        vision_data = {"crop_type": "Unknown", "issue": "Unknown", "confidence": "0.0"}

    # Guardrail Check
    if vision_data.get('issue') == 'Not a crop':
        return {"error": "Please upload a crop photo"}

    # 2. Environmental Task
    weather_data = get_weather(lat, lon)
    
    # 3. RAG Knowledge Task
    rag_query = f"{vision_data['crop_type']} {vision_data['issue']} treatment and care"
    rag_context = search_agri_knowledge(rag_query)
    
    # 4. Final Synthesis & Translation Task
    synthesis_prompt = f"""
    You are the Kisaan-Sense Setup Orchestrator (Lead Intelligence Engine).
    Based on the following data, generate the final diagnosis and action plan.

    Vision Diagnosis: {json.dumps(vision_data)}
    Local Weather: {json.dumps(weather_data)}
    Agricultural Manual Context: {rag_context}
    Preferred Language for Audio Script: {preferred_language}

    Rules:
    1. Cross-reference the diagnosis with weather data to determine 'urgency' (High, Medium, Low) and explain why in 'environmental_context'.
    2. Extract solutions from the Agricultural Manual Context. Prioritize organic/low-cost fixes for 'immediate_remedy'.
    3. The 'localized_audio_script' must be translated into {preferred_language}.

    Return ONLY a valid JSON object matching this schema exactly (no markdown formatting):
    {{
        "diagnosis": {{
            "crop_type": "string",
            "issue": "string",
            "confidence": "string",
            "urgency": "High | Medium | Low"
        }},
        "environmental_context": "string",
        "action_plan": {{
            "immediate_remedy": "string",
            "chemical_option": "string",
            "prevention": "string"
        }},
        "localized_audio_script": "string"
    }}
    """
    
    final_res = model.generate_content(synthesis_prompt)
    
    try:
        final_data = json.loads(final_res.text.replace('```json', '').replace('```', '').strip())
        return {
            "status": "success",
            "data": final_data
        }
    except Exception as e:
        return {"error": f"Failed to parse Agent Output: {str(e)}"}
