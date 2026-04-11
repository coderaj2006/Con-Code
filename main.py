import os
from contextlib import asynccontextmanager
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
from vector_service import AgriVectorDB
from ml.weather_risk_model import risk_engine

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
# ---------------------------------------------------------------------------
# Lifespan context manager — replaces deprecated @app.on_event handlers.
# FastAPI docs: https://fastapi.tiangolo.com/advanced/events/
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
      1. Ensure required runtime directories exist.
      2. Verify ChromaDB is populated (needs scripts/ingest_data.py to have been run
         against the /data PDFs — farmerbook.pdf, Field-Crop-Kharif.pdf, etc.).
      3. Initialise the async SQLite database schema.
      4. Spawn the proactive weather-monitor background task.
    Shutdown:
      Log clean termination so process managers (uvicorn, Docker) know we exited gracefully.
    """
    # ── Startup ───────────────────────────────────────────────────────────────
    # 1. Bootstrap critical runtime directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("uploads/audio", exist_ok=True)
    os.makedirs("chroma_db", exist_ok=True)

    # 2. Verify the RAG vector store is populated from /data PDFs
    chroma_populated = (
        os.path.isdir("chroma_db")
        and any(
            fname != ".gitkeep"
            for fname in os.listdir("chroma_db")
        )
    )
    if chroma_populated:
        logger.info(
            "RAG vector store (ChromaDB) is ready — "
            "agricultural guides from /data loaded into index."
        )
    else:
        logger.warning(
            "ChromaDB is EMPTY. Scan diagnosis will fall back to mock RAG context. "
            "Run `python scripts/ingest_data.py` to index the /data PDFs "
            "(farmerbook.pdf, Field-Crop-Kharif.pdf, Rice IPM guides, etc.)."
        )

    # 3. Initialise SQLite schema
    await init_db()

    # 4. Spawn the infinite proactive weather-monitor loop
    asyncio.create_task(proactive_weather_monitor())

    logger.info("Kisaan AI startup complete — lifespan ready.")

    yield  # ── Application runs here ─────────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("Kisaan AI shutting down gracefully.")


app = FastAPI(
    title="Kisaan AI Proactive Loop",
    description="Hackathon MVP Phase 3 - Autonomous Agri-Assistant",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# SIMULATION_MODE: Set to False once real Firebase + Agmarknet credentials
# are configured. When True, FCM sends mock push notifications and Mandi
# data returns static demo prices. No external billing is incurred.
# ---------------------------------------------------------------------------
SIMULATION_MODE: bool = True


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

# Startup/shutdown is handled by the lifespan context manager above.

# ---------------------------------------------------------------------------
# Bootstrap critical runtime directories BEFORE app.mount() is called.
# app.mount() is evaluated at module-import time, so the directory must
# already exist — it cannot rely on the async lifespan hook.
# ---------------------------------------------------------------------------
os.makedirs("uploads", exist_ok=True)          # Static file serving root
os.makedirs("uploads/audio", exist_ok=True)    # gTTS audio output
os.makedirs("chroma_db", exist_ok=True)        # ChromaDB vector persistence

# Mount static files so URLs can be accessed by the browser
app.mount("/static", StaticFiles(directory="uploads"), name="static")
# Dedicated audio route — speech_url points here (http://localhost:8001/audio/<file>.mp3)
app.mount("/audio", StaticFiles(directory="uploads/audio"), name="audio")

# Configure CORS - Allowing all origins for development as requested
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
    follow_up_question: Optional[str] = None

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
    # Use port 8001 and the /audio static route (not /static/audio)
    return f"http://localhost:8002/audio/{file_id}.mp3"

# Mock Mandi Market API Utility
async def fetch_mandi_prices(crop_name: str) -> Dict[str, Any]:
    return {"crop": crop_name, "market_data": {"min_price": "₹15/kg", "max_price": "₹25/kg", "trend": "stable"}}

class WeatherAlertState:
    def __init__(self, has_alert, reasons):
        self.has_alert = has_alert
        self.reasons = reasons

async def fetch_weather_and_alerts(lat: float, lon: float) -> Tuple[Dict[str, Any], WeatherAlertState]:
    try:
        api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        
        async with httpx.AsyncClient() as client:
            current_resp = await client.get(current_url, timeout=5.0)
            if current_resp.status_code != 200:
                logger.warning(f"Weather API returned {current_resp.status_code}")
                return {}, WeatherAlertState(False, [])
            current_data = current_resp.json()
            
            # Extract data for risk engine
            main = current_data.get("main", {})
            temp = main.get("temp", 0)
            humidity = main.get("humidity", 0)
            pressure = main.get("pressure", 1010)
            wind_speed = current_data.get("wind", {}).get("speed", 0)
            
            has_alert, reasons = False, []
            if risk_engine:
                try:
                    has_alert, reasons = risk_engine.predict_risk(temp, humidity, pressure, wind_speed)
                except Exception as e:
                    logger.error(f"Risk engine prediction failed: {e}")
            
            # Simple fallback rules if risk engine fails or isn't specific enough
            if not reasons:
                if humidity > 85: reasons.append(f"High humidity ({humidity}%) detected. Fungal risk.")
                if temp > 40: reasons.append(f"Extreme heat ({temp}°C) detected. Heat stress risk.")
                has_alert = len(reasons) > 0
                
            return current_data, WeatherAlertState(has_alert, reasons)
    except Exception as e:
        logger.error(f"fetch_weather_and_alerts failed: {e}")
        return {}, WeatherAlertState(False, ["Weather data temporarily unavailable."])

# API Endpoints
@app.get("/health")
async def health_check(): return {"status": "healthy"}

@app.get("/weather-alerts")
async def get_weather_alerts(lat: float, lon: float):
    try:
        weather_info, alert_state = await fetch_weather_and_alerts(lat, lon)
        city_name = weather_info.get("name", "your field")
        return {
            "title": "Weather Alert" if alert_state.has_alert else "Weather Normal",
            "message": alert_state.reasons[0] if alert_state.has_alert and alert_state.reasons else f"Conditions are favorable in {city_name}.",
            "urgency": "High" if alert_state.has_alert else "Low",
            "humidity": weather_info.get("main", {}).get("humidity", 0),
            "temperature": weather_info.get("main", {}).get("temp", 0),
            "city": city_name
        }
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        return {"title": "Error", "message": "Weather unavailable", "urgency": "N/A", "humidity": 0, "temperature": 0}

@app.post("/chat", response_model=ChatResponse)
async def chat_advisory(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """ Standalone Multi-turn Advisory Chat using cohesive Advisory Agent """
    from advisory_agent import get_advice
    from models import FarmerProfile
    from sqlalchemy import select
    
    # 1. Fetch Profile for context
    result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == req.farmer_id))
    farmer = result.scalars().first()
    lat, lon = (farmer.latitude or 28.6139, farmer.longitude or 77.2090) if farmer else (28.6139, 77.2090)
    
    # 2. Get Agentic Advice
    advice_payload = await get_advice(req.message, lat, lon)
    
    # 3. Handle regional speech
    speech_url = None
    try:
        audio_text = advice_payload.get("audio_summary", advice_payload["response"])
        lang = advice_payload.get("language_code", "hi")
        speech_url = await generate_speech(audio_text, str(uuid.uuid4()), lang=lang)
    except Exception as e:
        logger.error(f"Chat TTS error: {e}")
        
    return ChatResponse(
        response=advice_payload["response"],
        speech_url=speech_url,
        follow_up_question=advice_payload.get("notification") # Using notification as follow-up hint
    )

@app.post("/voice-chat")
async def voice_chat_advisory(
    audio: UploadFile = File(...),
    farmer_id: int = Form(1),
    db: AsyncSession = Depends(get_db)
):
    """
    Voice-First Interaction: Audio Blob -> STT -> Advisory Agent -> Response
    """
    from advisory_agent import get_advice
    from models import FarmerProfile
    from sqlalchemy import select
    
    try:
        # 1. Fetch Location for context
        result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
        farmer = result.scalars().first()
        lat, lon = (farmer.latitude or 28.6139), (farmer.longitude or 77.2090) if farmer else (28.6139, 77.2090)

        # 2. Speech to Text via Gemini
        audio_bytes = await audio.read()
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        stt_resp = await model.generate_content_async([
            "Transcribe this agricultural query exactly. Output ONLY raw text.",
            {"mime_type": audio.content_type or "audio/mpeg", "data": audio_bytes}
        ])
        transcript = stt_resp.text.strip()
        
        # 3. Route through Advisory Agent
        advice_payload = await get_advice(transcript, lat, lon)
        
        # 4. Regional TTS
        speech_url = await generate_speech(
            advice_payload.get("audio_summary", advice_payload["response"]),
            str(uuid.uuid4()),
            lang=advice_payload.get("language_code", "hi")
        )
        
        return {
            "transcript": transcript,
            "response": advice_payload["response"],
            "speech_url": speech_url,
            "notification": advice_payload.get("notification")
        }
    except Exception as e:
        logger.error(f"Voice Chat error: {e}")
        return JSONResponse(status_code=500, content={"error": "Voice advisory unavailable."})

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
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        response = await model.generate_content_async([
            "Transcribe this agricultural audio EXACTLY in its original language using native script. ONLY output raw transcribed text.",
            {
                "mime_type": audio.content_type or "audio/mpeg",
                "data": audio_bytes
            }
        ])
        
        transcript = response.text.strip()
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Voice processing error: {e}")
        return JSONResponse(status_code=500, content={"error": "Transcription failed."})

from fastapi import HTTPException
from orchestrator.agent import run_analysis_workflow

@app.post("/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...),
    transcript: Optional[str] = Form(None),
    preferred_language: str = Form("en"),
    farmer_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Fixed/analyze endpoint per Full System Recovery spec.
    """
    try:
        # 1. Read image correctly as bytes
        image_bytes = await image.read()
        
        # 2. Call the agentic workflow
        result = await run_analysis_workflow(
            image_bytes=image_bytes,
            user_text=transcript or "",
            lat=lat,
            lon=lon,
            preferred_language=preferred_language
        )
        
        # 3. Security: agent.py now returns a dict, but we double-check serialization
        if not isinstance(result, dict):
            logger.error("Agent returned non-dictionary result")
            raise HTTPException(status_code=500, detail="Internal processing error")
            
        if "agent_state" in result and result["agent_state"].get("phase") == "ERROR":
            return JSONResponse(status_code=400, content=result)
        
        # Background persistence
        if farmer_id:
            try:
                db.add(DiagnosisHistory(
                    farmer_id=farmer_id,
                    crop_image_url="uploaded_scan", 
                    ai_diagnosis=result.get("payload", {}).get("diagnosis", "Unknown")
                ))
                await db.commit()
            except Exception as e:
                logger.error(f"Failed to record diagnostic history: {e}")
                
        return result
    except Exception as e:
        logger.error(f"Critical analyze endpoint failure: {e}")
        return JSONResponse(status_code=500, content={"error": str(e), "data": None})

@app.get("/telemetry")
async def fetch_telemetry(farmer_id: int = 1, db: AsyncSession = Depends(get_db)):
    """ Pull latest history and mandi data, handling mocked fallbacks if DB is empty. """
    hist_result = await db.execute(
        select(DiagnosisHistory)
        .where(DiagnosisHistory.farmer_id == farmer_id)
        .order_by(DiagnosisHistory.timestamp.desc())
        .limit(5)
    )
    history = hist_result.scalars().all()
    
    MOCK_MANDI = [
        {"crop": "Tomato", "price": 2400, "unit": "Quintal", "trend": "up", "market": "Azadpur"},
        {"crop": "Wheat", "price": 2100, "unit": "Quintal", "trend": "stable", "market": "Lucknow"},
        {"crop": "Potato", "price": 1200, "unit": "Quintal", "trend": "down", "market": "Indore"}
    ]
    MOCK_HISTORY = [
        {"date": "10 Apr", "type": "Pest Scan", "result": "Early Blight", "crop": "Tomato"},
        {"date": "08 Apr", "type": "Voice Help", "result": "Fertilizer Advice", "crop": "Wheat"},
        {"date": "05 Apr", "type": "Pest Scan", "result": "Healthy", "crop": "Rice"},
    ]
    
    # Translate historical diagnosis into UI schema format safely natively
    ui_history = []
    if history:
        for h in history:
            date_str = h.timestamp.strftime("%d %b")
            ui_history.append({
                "date": date_str,
                "type": "Pest Scan",
                "result": h.ai_diagnosis[:30] + "..." if len(h.ai_diagnosis) > 30 else h.ai_diagnosis,
                "crop": "Automated Scan"
            })
    else:
        ui_history = MOCK_HISTORY
        
    return {
        "mandi": MOCK_MANDI,
        "history": ui_history
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
