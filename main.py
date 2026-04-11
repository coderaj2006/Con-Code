import os
import io
import base64
import json
import logging
from typing import Optional, List, Dict, Any, Tuple
from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Kisaan AI", description="Hackathon MVP for small farmers")

# Configure CORS for Frontend teammates
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (perfect for hackathon dev)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Prompts setup
PROMPTS = {
    "agronomist_system_prompt": """
You are an Expert Indian Agronomist. Your goal is to analyze images of crops and associated transcripts to provide accurate, actionable advice to small farmers.
Always output the response in strictly valid JSON format matching the requested schema.
Be concise, practical, and empathetic to the farmer's situation. Focus on identifying diseases, pests, or nutrient deficiencies accurately.
"""
}

# Define schemas
class AnalyzeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of the plant image.")
    lat: float = Field(..., description="Latitude of the farmer's location.")
    lon: float = Field(..., description="Longitude of the farmer's location.")
    transcript: Optional[str] = Field(None, description="Optional voice/text transcript from the farmer.")

class GeminiDiagnosis(BaseModel):
    diagnosis: str
    confidence: float
    immediate_action: List[str]
    organic_alternative: str
    regional_language_summary: str

class WeatherAlert(BaseModel):
    has_alert: bool
    reasons: List[str]

class AnalyzeResponseData(BaseModel):
    weather_info: Dict[str, Any]
    weather_alerts: WeatherAlert
    diagnosis: Dict[str, Any]

class UnifiedResponse(BaseModel):
    error: Optional[str] = None
    data: Optional[AnalyzeResponseData] = None

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_200_OK, # Hackathon stability requirement: never send 500
        content={"error": str(exc), "data": None}
    )

# Weather Agent Utility
async def fetch_weather_and_alerts(lat: float, lon: float) -> Tuple[Dict[str, Any], WeatherAlert]:
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    if not api_key:
        raise ValueError("OPENWEATHERMAP_API_KEY is not set.")
    
    # We will use OpenWeatherMap current weather & forecast endpoints
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    async with httpx.AsyncClient() as client:
        # Fetch current weather
        current_resp = await client.get(current_url)
        current_resp.raise_for_status()
        current_data = current_resp.json()
        
        # Fetch forecast (simplified MVP retrieval)
        forecast_resp = await client.get(forecast_url)
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()
        
        # Extract required fields for alerts
        temp = current_data.get("main", {}).get("temp", 0)
        humidity = current_data.get("main", {}).get("humidity", 0)
        
        reasons = []
        if humidity > 85:
            reasons.append(f"High humidity ({humidity}%) detected. Elevated risk of fungal infections.")
        if temp > 40:
            reasons.append(f"Extreme temperature ({temp}°C) detected. High risk of crop heat stress.")
            
        alert = WeatherAlert(has_alert=len(reasons) > 0, reasons=reasons)
        
        weather_info = {
            "current": current_data,
            "forecast_preview": forecast_data.get("list", [])[:8] # First 24 hours of 3-hour chunks roughly
        }
        
        return weather_info, alert

# AgriBrain Utility
class AgriBrain:
    @staticmethod
    async def analyze(image_b64: str, transcript: Optional[str]) -> Dict[str, Any]:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set.")
            
        try:
            # Check for data URI preface and strip it, e.g., 'data:image/jpeg;base64,'
            if ',' in image_b64:
                image_b64 = image_b64.split(',', 1)[1]
                
            image_data = base64.b64decode(image_b64)
            img = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {e}")

        # Choose gemini-2.5-flash for the fastest multimodal responses with high free quotas
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"{PROMPTS['agronomist_system_prompt']}\n\n"
        if transcript:
            prompt += f"Farmer Transcript/Voice Input: \"{transcript}\"\n\n"
        
        prompt += """
Please analyze the image of the plant and the transcript provided.
Respond ONLY with a JSON object matching this exact schema:
{
  "diagnosis": "Detailed explanation of what issues the plant is facing.",
  "confidence": 0.95,
  "immediate_action": ["Step 1", "Step 2"],
  "organic_alternative": "Organic/natural remedy details.",
  "regional_language_summary": "A short summary in standard Hindi or the language implied by the transcript."
}
"""
        
        # Blocking call to Gemini made via thread for asyncio compat, though genai now has async genai routines as well.
        # Calling genai SDK synchronously here on the fast API thread can block, so we'll use a local model execution or just standard await if supported
        # Note: Using standard generate_content_async for best practice integration
        response = await model.generate_content_async([prompt, img])
        
        response_text = response.text.strip()
        # Clean up markdown output to just extract JSON
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        response_text = response_text.strip()
        
        try:
            parsed_json = json.loads(response_text)
            # Automatically validating through Pydantic
            GeminiDiagnosis(**parsed_json) 
            return parsed_json
        except json.JSONDecodeError:
            raise Exception(f"Failed to parse JSON from Gemini response. Raw response: {response_text[:100]}...")

# API Endpoints
@app.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze", response_model=UnifiedResponse)
async def analyze_crop(request: AnalyzeRequest):
    # 1. Fetch Weather data & verify alerts (Graceful fail if key is still pending)
    weather_info = {}
    weather_alerts = WeatherAlert(has_alert=False, reasons=["Weather data unavailable (API key might be activating)"])
    try:
        weather_info, weather_alerts = await fetch_weather_and_alerts(request.lat, request.lon)
    except Exception as e:
        logger.warning(f"Weather API failed. Skipped weather check: {e}")
    
    # 2. Get AI Diagnosis
    diagnosis_data = await AgriBrain.analyze(request.image_base64, request.transcript)
    
    # 3. Compile final response
    response_data = AnalyzeResponseData(
        weather_info=weather_info,
        weather_alerts=weather_alerts,
        diagnosis=diagnosis_data
    )
    
    return UnifiedResponse(data=response_data, error=None)

@app.post("/analyze/upload", response_model=UnifiedResponse)
async def analyze_crop_file_upload(
    image: UploadFile = File(..., description="The plant image file."),
    lat: float = Form(..., description="Latitude of the farmer's location."),
    lon: float = Form(..., description="Longitude of the farmer's location."),
    transcript: Optional[str] = Form(None, description="Optional voice/text transcript.")
):
    """
    A Frontend-friendly endpoint that accepts standard 'multipart/form-data' file uploads.
    """
    # 1. Fetch Weather data & verify alerts (Graceful fail if key is still pending)
    weather_info = {}
    weather_alerts = WeatherAlert(has_alert=False, reasons=["Weather data unavailable (API key might be activating)"])
    try:
        weather_info, weather_alerts = await fetch_weather_and_alerts(lat, lon)
    except Exception as e:
        logger.warning(f"Weather API failed. Skipped weather check: {e}")
    
    # 2. Read file contents and encode to Base64 dynamically for AgriBrain
    image_bytes = await image.read()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # 3. Get AI Diagnosis
    diagnosis_data = await AgriBrain.analyze(image_base64, transcript)
    
    # 4. Compile final response
    response_data = AnalyzeResponseData(
        weather_info=weather_info,
        weather_alerts=weather_alerts,
        diagnosis=diagnosis_data
    )
    
    return UnifiedResponse(data=response_data, error=None)

# Entry point instructions:
# Run with command: uvicorn main:app --reload
