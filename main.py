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
from fastapi import FastAPI, Request, status, UploadFile, File, Form, Depends
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

from models import init_db, get_db, FarmerProfile, DiagnosisHistory, Notification, ChatSession, ChatMessage
from fcm_service import send_fcm_notification

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Kisaan AI Proactive Loop", description="Hackathon MVP Phase 3 - Autonomous Agri-Assistant")

# Infinite Loop Background Task
async def proactive_weather_monitor():
    """
    Runs infinitely. Iterates through farmers, checks weather.
    If anomalies found, triggers Notification DB and Push Notifications via FCM.
    """
    # Wait a few seconds for FastAPI to finish mounting before first run
    await asyncio.sleep(5)
    from models import AsyncSessionLocal
    while True:
        try:
            logger.info("Executing async proactive weather monitor cycle...")
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(FarmerProfile).where(FarmerProfile.fcm_token.isnot(None)))
                farmers = result.scalars().all()
                for farmer in farmers:
                    lat, lon = (farmer.latitude or 28.6139), (farmer.longitude or 77.2090)
                    try:
                        _, weather_alerts = await fetch_weather_and_alerts(lat, lon)
                        # Instead of just alerting, let's proactively save state if danger exists
                        if weather_alerts.has_alert:
                            title = "⚠️ URGENT WEATHER ALERT"
                            message = weather_alerts.reasons[0]
                            db.add(Notification(farmer_id=farmer.id, title=title, message=message))
                            await db.commit()
                            await send_fcm_notification(farmer.fcm_token, title, message)
                    except Exception as loop_e:
                        logger.error(f"Failed worker task for farmer {farmer.id}: {loop_e}")
        except Exception as e:
            logger.error(f"Proactive monitor loop fatal crash: {e}")
            
        await asyncio.sleep(60) # Sleep for 60 seconds (Hackathon config)

@app.on_event("startup")
async def startup_event():
    os.makedirs("uploads/audio", exist_ok=True)
    await init_db()
    # Spawn the infinite loop task asynchronously
    asyncio.create_task(proactive_weather_monitor())

# Mount static files so URLs can be accessed by the browser
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Configure CORS
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

# Define schemas
class AnalyzeResponseData(BaseModel):
    weather_info: Dict[str, Any]
    weather_alerts: Dict[str, Any]
    market_prices: Optional[Dict[str, Any]]
    diagnosis: Dict[str, Any]
    speech_url: Optional[str]

class UnifiedResponse(BaseModel):
    error: Optional[str] = None
    data: Optional[AnalyzeResponseData] = None

class ChatRequest(BaseModel):
    farmer_id: int
    message: str

class ChatResponse(BaseModel):
    response: str
    speech_url: Optional[str] = None

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=status.HTTP_200_OK, content={"error": str(exc), "data": None})

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
    return {"crop": crop_name, "market_data": {"min_price": "₹15/kg", "max_price": "₹25/kg", "trend": "stable"}}

class WeatherAlertState:
    def __init__(self, has_alert, reasons):
        self.has_alert = has_alert
        self.reasons = reasons

async def fetch_weather_and_alerts(lat: float, lon: float) -> Tuple[Dict[str, Any], WeatherAlertState]:
    api_key = os.getenv("OPENWEATHERMAP_API_KEY")
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    async with httpx.AsyncClient() as client:
        current_resp = await client.get(current_url)
        if current_resp.status_code != 200:
            return {}, WeatherAlertState(False, [])
        current_data = current_resp.json()
        temp = current_data.get("main", {}).get("temp", 0)
        humidity = current_data.get("main", {}).get("humidity", 0)
        
        reasons = []
        if humidity > 85: reasons.append(f"High humidity ({humidity}%) detected. Fungal risk.")
        if temp > 40: reasons.append(f"High temp ({temp}°C) detected. Heat stress risk.")
            
        return current_data, WeatherAlertState(len(reasons) > 0, reasons)

class AgriBrain:
    @staticmethod
    async def analyze(image_b64: str, transcript: Optional[str], previous_context: Optional[str] = None) -> Dict[str, Any]:
        image_data = base64.b64decode(image_b64.split(',', 1)[1] if ',' in image_b64 else image_b64)
        img = Image.open(io.BytesIO(image_data))

        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = "You are an Expert Agronomist. Return ONLY JSON matching schema: {diagnosis:str, confidence:float, immediate_action:list, organic_alternative:str, regional_language_summary:str, market_valuation:str, government_subsidy_hint:str}\n"
        if previous_context: prompt += f"Context: {previous_context}\n"
        if transcript: prompt += f"Transcript: {transcript}\n"
        
        response = await model.generate_content_async([prompt, img])
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3].strip()
        return json.loads(text)

# API Endpoints
@app.get("/health")
async def health_check(): return {"status": "healthy"}

@app.post("/analyze/upload", response_model=UnifiedResponse)
async def analyze_crop_file_upload(
    image: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...),
    transcript: Optional[str] = Form(None),
    farmer_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """ Legacy image upload flow """
    farmer, previous_context, market_prices = None, None, None
    if farmer_id:
        result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
        farmer = result.scalars().first()
        if farmer:
            market_prices = await fetch_mandi_prices(farmer.primary_crop)
            hist = await db.execute(select(DiagnosisHistory).where(DiagnosisHistory.farmer_id == farmer_id).order_by(DiagnosisHistory.timestamp.desc()))
            latest = hist.scalars().first()
            if latest: previous_context = latest.ai_diagnosis

    weather_info, alert_state = await fetch_weather_and_alerts(lat, lon)
    
    file_id = str(uuid.uuid4())
    local_filename = f"uploads/{file_id}.jpg"
    image_bytes = await image.read()
    async with aiofiles.open(local_filename, 'wb') as f: await f.write(image_bytes)
    
    diagnosis_data = await AgriBrain.analyze(base64.b64encode(image_bytes).decode('utf-8'), transcript, previous_context)
    
    if farmer_id:
        db.add(DiagnosisHistory(farmer_id=farmer_id, crop_image_url=local_filename, ai_diagnosis=diagnosis_data.get('diagnosis')))
        await db.commit()

    speech_url = None
    if hindi_text := diagnosis_data.get("regional_language_summary"):
        speech_url = await generate_speech(hindi_text, file_id)

    return UnifiedResponse(data=AnalyzeResponseData(
        weather_info=weather_info,
        weather_alerts={"has_alert": alert_state.has_alert, "reasons": alert_state.reasons},
        market_prices=market_prices,
        diagnosis=diagnosis_data,
        speech_url=speech_url
    ))

@app.post("/chat", response_model=ChatResponse)
async def chat_advisory(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """ Standalone Multi-turn Advisory Chat """
    # Fetch or Create Chat Session
    result = await db.execute(select(ChatSession).where(ChatSession.farmer_id == req.farmer_id).order_by(ChatSession.started_at.desc()))
    session = result.scalars().first()
    if not session:
        session = ChatSession(id=str(uuid.uuid4()), farmer_id=req.farmer_id)
        db.add(session)
        await db.commit()

    # Get Historical Context (last 5 messages)
    msg_result = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session.id).order_by(ChatMessage.timestamp.asc()))
    history_records = msg_result.scalars().all()[-5:]
    
    # Save incoming user message
    db.add(ChatMessage(session_id=session.id, role="user", content=req.message))
    await db.commit()

    # Query Gemini
    model = genai.GenerativeModel('gemini-2.5-flash')
    history_arr = [{"role": msg.role, "parts": [msg.content]} for msg in history_records]
    chat = model.start_chat(history=history_arr)
    
    prompt = f"System: You are an Expert Indian Agronomist Advisory Bot. Use simple, non-technical Hindi language. Focus on soil prep, irrigation, and pesticide advice.\nUser: {req.message}"
    
    try:
        resp = await chat.send_message_async(prompt)
        ai_text = resp.text
    except Exception as e:
        logger.error(f"Chat error: {e}")
        ai_text = "माफ़ करना, मैं अभी आपकी सहायता नहीं कर पा रहा हूँ।"

    # Save outgoing AI message
    db.add(ChatMessage(session_id=session.id, role="model", content=ai_text))
    await db.commit()

    # Synthesize Audio Response
    speech_url = None
    try:
        speech_url = await generate_speech(ai_text, str(uuid.uuid4()))
    except Exception as e:
        logger.error(f"Chat TTS error: {e}")
        
    return ChatResponse(response=ai_text, speech_url=speech_url)

@app.get("/notifications/{farmer_id}")
async def get_unread_notifications(farmer_id: int, db: AsyncSession = Depends(get_db)):
    """ Pull unread proactive notifications for mobile badge updating """
    result = await db.execute(select(Notification).where(Notification.farmer_id == farmer_id).where(Notification.is_read == False))
    nots = result.scalars().all()
    
    out = []
    for n in nots:
        out.append({"id": n.id, "title": n.title, "message": n.message, "timestamp": n.timestamp})
        n.is_read = True # Mark seen
    await db.commit()
    
    return {"unread_count": len(out), "alerts": out}

@app.post("/process-voice")
async def process_voice_to_text(
    audio: UploadFile = File(...),
    farmer_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests .wav/.m4a, transcribes using Gemini Native Audio API.
    """
    try:
        audio_bytes = await audio.read()
        
        # Build the prompt for agriculture transcription
        # Using gemini-1.5-flash explicitly as it supports audio-to-text natively
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Passing audio as a list of parts: [prompt, Part(mime_type, data)]
        response = await model.generate_content_async([
            "You are a helpful agricultural assistant. Transcribe the following audio query into English text. If it is in Hindi or a regional Indian dialect, translate it accurately to English. ONLY output the transcribed text, no other conversation.",
            {
                "mime_type": audio.content_type or "audio/mpeg",
                "data": audio_bytes
            }
        ])
        
        transcript = response.text.strip()
        logger.info(f"Successfully transcribed voice for Farmer {farmer_id}: {transcript[:50]}...")
        
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Voice processing error for Farmer {farmer_id}: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Failed to process audio query. Please try typing or check your microphone settings."})

