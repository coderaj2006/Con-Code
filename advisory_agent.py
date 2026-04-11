import json
import asyncio
import google.generativeai as genai
from config import config
from tools.rag import search_agri_knowledge
from tools.weather_agent import get_weather_context

# Configure Gemini
genai.configure(api_key=config.GEMINI_API_KEY)

async def get_advice(query: str, lat: float, lon: float, preferred_language: str = "hi") -> dict:
    """
    Core Advisory Agent with RAG loop and Weather Context Injection.
    Fulfills the 'Full System Recovery' mandate for cohesiveness.
    """
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    
    # 1. Expert Knowledge Retrieval (RAG)
    try:
        expert_context = await asyncio.to_thread(search_agri_knowledge, query)
        is_expert = "No RAG context available" not in expert_context and expert_context.strip() != ""
    except Exception:
        expert_context = ""
        is_expert = False
        
    # 2. Environmental Context Injection
    try:
        weather_context = await asyncio.to_thread(get_weather_context, lat, lon)
    except Exception:
        weather_context = "Field conditions are currently unavailable."

    # 3. Decision Logic: Expert vs General
    source_notification = "Using Expert Guides" if is_expert else "Using General Knowledge (Expert Guides unavailable)"
    
    prompt = f"""
    ROLE: Dr. Kisaan, a symphathetic and expert agricultural advisor.
    CONTEXT:
    - Weather: {weather_context}
    - Expert RAG Docs: {expert_context if is_expert else 'NONE AVAILABLE'}
    
    TASK: Answer the user's query precisely in {preferred_language}.
    If Expert RAG Docs are provide, prioritize them. If not, use your general knowledge.
    Always mention the current weather conditions briefly if relevant to the advice.
    
    QUERY: {query}
    
    RESPONSE FORMAT (JSON):
    {{
      "response": "Detailed advisory in {preferred_language}",
      "source_type": "{'EXPERT_GUIDE' if is_expert else 'GENERAL_KNOWLEDGE'}",
      "notification": "{source_notification}",
      "audio_summary": "Short 2-sentence summary for TTS in {preferred_language}",
      "language_code": "{preferred_language}"
    }}
    """

    try:
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        return {
            "response": "I'm sorry, I'm having trouble processing that right now.",
            "source_type": "ERROR",
            "notification": "Service interruption",
            "audio_summary": "Please try again later.",
            "language_code": preferred_language
        }
