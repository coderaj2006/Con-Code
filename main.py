import os
import io
import base64
import json
import logging
import datetime
import uuid
import aiofiles
import asyncio
from typing import Optional, List, Dict, Any, Tuple
from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from gtts import gTTS

from models import init_db, get_db, FarmerProfile, DiagnosisHistory, Notification

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Kisaan AI", description="Hackathon MVP for small farmers")

@app.on_event("startup")
async def startup_event():
    os.makedirs("uploads/audio", exist_ok=True)
    await init_db()

# Mount static files so URLs can be accessed by the browser
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Configure CORS for Frontend teammates
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    farmer_id: Optional[int] = Field(None, description="ID of the farmer for longitudinal tracking.")

class GeminiDiagnosis(BaseModel):
    diagnosis: str
    confidence: float
    immediate_action: List[str]
    organic_alternative: str
    regional_language_summary: str
    market_valuation: str = Field(..., description="A short valuation text based on market prices")
    government_subsidy_hint: str = Field(..., description="Details on applicable subsidies or schemes")

class WeatherAlert(BaseModel):
    has_alert: bool
    reasons: List[str]

class AnalyzeResponseData(BaseModel):
    weather_info: Dict[str, Any]
    weather_alerts: WeatherAlert
    market_prices: Optional[Dict[str, Any]]
    diagnosis: Dict[str, Any]
    speech_url: Optional[str] = Field(None, description="URL to the generated Hindi voice MP3 of the advice.")

class UnifiedResponse(BaseModel):
    error: Optional[str] = None
    data: Optional[AnalyzeResponseData] = None
    
class VoiceProcessResponse(BaseModel):
    transcript: str

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"error": str(exc), "data": None}
    )

# Audio Utility
def _generate_speech_sync(text: str, filename: str, lang: str = 'hi'):
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(filename)

async def generate_speech(text: str, file_id: str, lang: str = 'hi') -> str:
    local_path = f"uploads/audio/{file_id}.mp3"
    await asyncio.to_thread(_generate_speech_sync, text, local_path, lang)
    return f"http://localhost:8000/static/audio/{file_id}.mp3"

# Mock Mandi Market API Utility
async def fetch_mandi_prices(crop_name: str) -> Dict[str, Any]:
    crop_name = crop_name.lower()
    mock_db = {
        "tomato": {"min_price": "₹15/kg", "max_price": "₹25/kg", "trend": "stable"},
        "wheat": {"min_price": "₹2125/quintal", "max_price": "₹2200/quintal", "trend": "upward"},
        "rice": {"min_price": "₹2040/quintal", "max_price": "₹2100/quintal", "trend": "stable"},
    }
    prices = mock_db.get(crop_name, {"min_price": "N/A", "max_price": "N/A", "trend": "unknown"})
    return {"crop": crop_name, "market_data": prices}

# Weather Agent Utility
async def fetch_weather_and_alerts(lat: float, lon: float) -> Tuple[Dict[str, Any], WeatherAlert]:
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    if not api_key:
        raise ValueError("OPENWEATHERMAP_API_KEY is not set.")
    
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    async with httpx.AsyncClient() as client:
        current_resp = await client.get(current_url)
        current_resp.raise_for_status()
        current_data = current_resp.json()
        
        forecast_resp = await client.get(forecast_url)
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()
        
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
            "forecast_preview": forecast_data.get("list", [])[:8]
        }
        return weather_info, alert

# Background Worker for Anomaly Scans
async def check_weather_anomalies():
    """
    Background Task: Scans all users, checks their weather, logs alerts in Notifications DB.
    Because SQLAlchemy Async Sessions don't map cleanly to background tasks after endpoint closure,
    we spawn a new local session here.
    """
    from models import AsyncSessionLocal
    logger.info("Executing async weather anomaly background scan for all farmers...")
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(FarmerProfile))
            farmers = result.scalars().all()
            
            for farmer in farmers:
                # We need a lat/lon. For MVP, we mock New Delhi per user if not stored.
                lat, lon = (28.6139, 77.2090) 
                
                try:
                    _, weather_alerts = await fetch_weather_and_alerts(lat, lon)
                    if weather_alerts.has_alert:
                        message = f"ALERT: {weather_alerts.reasons[0]}"
                        new_noti = Notification(farmer_id=farmer.id, message=message)
                        db.add(new_noti)
                        await db.commit()
                        logger.warning(f"Saved DB Notification for Farmer {farmer.name}: {message}")
                except Exception as loop_err:
                    logger.error(f"Error checking weather for Farmer {farmer.id}: {loop_err}")
    except Exception as e:
        logger.error(f"Background worker failure: {e}")

# AgriBrain Utility
class AgriBrain:
    @staticmethod
    async def analyze(image_b64: str, transcript: Optional[str], previous_context: Optional[str] = None) -> Dict[str, Any]:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set.")
            
        try:
            if ',' in image_b64:
                image_b64 = image_b64.split(',', 1)[1]
            image_data = base64.b64decode(image_b64)
            img = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {e}")

        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"{PROMPTS['agronomist_system_prompt']}\n\n"
        
        if previous_context:
            prompt += f"--- LONGITUDINAL CONTEXT ---\nThe farmer submitted a scan recently with this diagnosis: {previous_context}\nPlease use this context to determine if the plant is recovering or if the issue has escalated.\n\n"
        
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
  "regional_language_summary": "A short summary in standard Hindi.",
  "market_valuation": "Insight into how this issue might affect market price.",
  "government_subsidy_hint": "Any standard Indian Govt subsidies or schemes that might help."
}
"""
        response = await model.generate_content_async([prompt, img])
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        try:
            parsed_json = json.loads(response_text)
            GeminiDiagnosis(**parsed_json) 
            return parsed_json
        except json.JSONDecodeError:
            raise Exception(f"Failed to parse JSON from Gemini response. Raw response: {response_text[:100]}...")

# API Endpoints
@app.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze/upload", response_model=UnifiedResponse)
async def analyze_crop_file_upload(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(..., description="The plant image file."),
    lat: float = Form(..., description="Latitude of the farmer's location."),
    lon: float = Form(..., description="Longitude of the farmer's location."),
    transcript: Optional[str] = Form(None, description="Optional voice/text transcript."),
    farmer_id: Optional[int] = Form(None, description="ID of the farmer for longitudinal tracking."),
    db: AsyncSession = Depends(get_db)
):
    """
    A Frontend-friendly endpoint that accepts standard 'multipart/form-data' file uploads.
    """
    farmer = None
    previous_context = None
    market_prices = None
    
    if farmer_id:
        result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
        farmer = result.scalars().first()
        
        if farmer:
            market_prices = await fetch_mandi_prices(farmer.primary_crop)
            seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
            hist_result = await db.execute(
                select(DiagnosisHistory)
                .where(DiagnosisHistory.farmer_id == farmer_id)
                .where(DiagnosisHistory.timestamp >= seven_days_ago)
                .order_by(DiagnosisHistory.timestamp.desc())
            )
            latest_history = hist_result.scalars().first()
            if latest_history:
                previous_context = f"Found issue on {latest_history.timestamp.strftime('%Y-%m-%d')}: {latest_history.ai_diagnosis}"

    weather_info = {}
    weather_alerts = WeatherAlert(has_alert=False, reasons=["Weather data unavailable"])
    try:
        weather_info, weather_alerts = await fetch_weather_and_alerts(lat, lon)
    except Exception as e:
        logger.warning(f"Weather API failed: {e}")
    
    file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
    file_id = str(uuid.uuid4())
    local_filename = f"uploads/{file_id}.{file_ext}"
    
    image_bytes = await image.read()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    async with aiofiles.open(local_filename, 'wb') as out_file:
        await out_file.write(image_bytes)
    
    diagnosis_data = await AgriBrain.analyze(image_base64, transcript, previous_context=previous_context)
    
    if farmer_id:
        summary = diagnosis_data.get('diagnosis', 'No specific diagnosis extracted')
        new_history = DiagnosisHistory(
            farmer_id=farmer_id,
            crop_image_url=local_filename,
            ai_diagnosis=summary,
            weather_at_time=json.dumps(weather_info.get("current", {}))
        )
        db.add(new_history)
        await db.commit()

    # Audio Pipeline
    speech_url = None
    try:
        hindi_text = diagnosis_data.get("regional_language_summary")
        if hindi_text:
            speech_url = await generate_speech(hindi_text, file_id)
    except Exception as audio_err:
        logger.error(f"TTS Engine Failed: {audio_err}")

    # Kick off asynchronous background weather checker
    background_tasks.add_task(check_weather_anomalies)

    response_data = AnalyzeResponseData(
        weather_info=weather_info,
        weather_alerts=weather_alerts,
        market_prices=market_prices,
        diagnosis=diagnosis_data,
        speech_url=speech_url
    )
    return UnifiedResponse(data=response_data, error=None)

@app.post("/process-voice", response_model=VoiceProcessResponse)
async def process_voice(
    audio: UploadFile = File(..., description="The raw voice recording (.wav, .m4a, .mp3)")
):
    """
    Natively streams audio into Gemini to transcribe local dialects into standard plain-text transcripts.
    This replaces the need for OpenAI Whisper.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    file_ext = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
    file_id = str(uuid.uuid4())
    local_filename = f"uploads/audio/{file_id}.{file_ext}"
    
    audio_bytes = await audio.read()
    async with aiofiles.open(local_filename, 'wb') as out_file:
        await out_file.write(audio_bytes)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        # We process offline to the disk then upload directly to gemini File API
        gemini_file = await asyncio.to_thread(genai.upload_file, path=local_filename)
        prompt = "Transcribe the speech in this audio exactly. Do not add any extra commentary or analysis. If it is in hindi or local dialect, translate it accurately to English text."
        response = await model.generate_content_async([prompt, gemini_file])
        return VoiceProcessResponse(transcript=response.text.strip())
    except Exception as e:
        logger.error(f"Gemini Audio processing failed: {e}")
        raise ValueError(f"Transcription failed: {str(e)}")

# Run with command: uvicorn main:app --reload
