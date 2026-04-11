import os
import io
import json
import logging
import uuid
import asyncio
import datetime
from contextlib import asynccontextmanager
from typing import Optional, Tuple, Dict, Any

from fastapi import FastAPI, Request, status, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from gtts import gTTS

from models import init_db, get_db, FarmerProfile, DiagnosisHistory, Notification, User
from fcm_service import send_fcm_notification
from ml.weather_risk_model import risk_engine
from auth import (
    SignupRequest, LoginRequest, TokenResponse,
    hash_password, verify_password, create_access_token,
    get_current_farmer_id, get_optional_farmer_id,
)
from orchestrator.agent import run_analysis_workflow

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Bootstrap dirs before app.mount() ────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/audio", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    chroma_populated = os.path.isdir("chroma_db") and any(
        f != ".gitkeep" for f in os.listdir("chroma_db")
    )
    if chroma_populated:
        logger.info("RAG vector store ready.")
    else:
        logger.warning("ChromaDB EMPTY — run `python scripts/ingest_data.py` to index /data PDFs.")

    await init_db()
    asyncio.create_task(proactive_weather_monitor())
    logger.info("Kisaan AI startup complete.")
    yield
    logger.info("Kisaan AI shutting down.")

app = FastAPI(title="Kisaan AI", description="AI-powered Agri-Assistant", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="uploads"), name="static")
app.mount("/audio",  StaticFiles(directory="uploads/audio"), name="audio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── Pydantic schemas ──────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    farmer_id: int = 1
    message: str

class ChatResponse(BaseModel):
    response: str
    speech_url: Optional[str] = None
    follow_up_question: Optional[str] = None

class MandiChatRequest(BaseModel):
    message: str
    language: str = "hi"

# ── Utilities ─────────────────────────────────────────────────────────────────
def _generate_speech_sync(text: str, path: str, lang: str = "hi"):
    gTTS(text=text, lang=lang, slow=False).save(path)

async def generate_speech(text: str, file_id: str, lang: str = "hi") -> str:
    path = f"uploads/audio/{file_id}.mp3"
    await asyncio.to_thread(_generate_speech_sync, text, path, lang)
    base = os.getenv("VITE_API_URL", "http://localhost:8002")
    return f"{base}/audio/{file_id}.mp3"

class WeatherAlertState:
    def __init__(self, has_alert: bool, reasons: list):
        self.has_alert = has_alert
        self.reasons = reasons

async def fetch_weather_and_alerts(lat: float, lon: float) -> Tuple[Dict[str, Any], WeatherAlertState]:
    try:
        api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            if resp.status_code != 200:
                return {}, WeatherAlertState(False, [])
            data = resp.json()

        main = data.get("main", {})
        temp, humidity = main.get("temp", 0), main.get("humidity", 0)
        pressure = main.get("pressure", 1010)
        wind_speed = data.get("wind", {}).get("speed", 0)

        has_alert, reasons = False, []
        if risk_engine:
            try:
                has_alert, reasons = risk_engine.predict_risk(temp, humidity, pressure, wind_speed)
            except Exception as e:
                logger.error(f"Risk engine error: {e}")

        if not reasons:
            if humidity > 85: reasons.append(f"High humidity ({humidity}%) — fungal risk.")
            if temp > 40:     reasons.append(f"Extreme heat ({temp}°C) — heat stress risk.")
            has_alert = len(reasons) > 0

        return data, WeatherAlertState(has_alert, reasons)
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        return {}, WeatherAlertState(False, [])

# ── Background task ───────────────────────────────────────────────────────────
async def proactive_weather_monitor():
    await asyncio.sleep(5)
    from models import AsyncSessionLocal
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(FarmerProfile).where(FarmerProfile.fcm_token.isnot(None)))
                for farmer in result.scalars().all():
                    lat = farmer.latitude or 28.6139
                    lon = farmer.longitude or 77.2090
                    try:
                        _, alerts = await fetch_weather_and_alerts(lat, lon)
                        if alerts.has_alert:
                            title = "⚠️ URGENT WEATHER ALERT"
                            msg = alerts.reasons[0]
                            db.add(Notification(farmer_id=farmer.id, title=title, message=msg))
                            await db.commit()
                            await send_fcm_notification(farmer.fcm_token, title, msg)
                    except Exception as e:
                        logger.error(f"Monitor task farmer {farmer.id}: {e}")
        except Exception as e:
            logger.error(f"Monitor loop crash: {e}")
        await asyncio.sleep(60)

# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled: {exc}", exc_info=True)
    return JSONResponse(status_code=200, content={"error": str(exc), "data": None})

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/signup", response_model=TokenResponse, tags=["Auth"])
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new farmer account."""
    # Check phone not already taken
    existing = await db.execute(select(User).where(User.phone == req.phone))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Phone number already registered.")

    # Create FarmerProfile
    farmer = FarmerProfile(
        name=req.name,
        location=req.location,
        primary_crop=req.primary_crop,
        latitude=28.6139,
        longitude=77.2090,
    )
    db.add(farmer)
    await db.flush()  # get farmer.id

    # Create User with hashed password
    user = User(
        phone=req.phone,
        hashed_password=hash_password(req.password),
        farmer_id=farmer.id,
    )
    db.add(user)
    await db.commit()

    token = create_access_token(farmer.id, req.name)
    return TokenResponse(access_token=token, farmer_id=farmer.id, name=req.name)


@app.post("/login", response_model=TokenResponse, tags=["Auth"])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with phone + password, returns JWT."""
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone or password.")

    # Get farmer name
    farmer_result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == user.farmer_id))
    farmer = farmer_result.scalars().first()
    name = farmer.name if farmer else "Farmer"

    token = create_access_token(user.farmer_id, name)
    return TokenResponse(access_token=token, farmer_id=user.farmer_id, name=name)


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "version": "2.0"}


@app.get("/weather-alerts", tags=["Weather"])
async def get_weather_alerts(lat: float, lon: float):
    try:
        weather_info, alert_state = await fetch_weather_and_alerts(lat, lon)
        city_name = weather_info.get("name", "your field")
        return {
            "title": "Weather Alert" if alert_state.has_alert else "Weather Normal",
            "message": alert_state.reasons[0] if alert_state.has_alert and alert_state.reasons
                       else f"Conditions are favorable in {city_name}.",
            "urgency": "High" if alert_state.has_alert else "Low",
            "humidity": weather_info.get("main", {}).get("humidity", 0),
            "temperature": weather_info.get("main", {}).get("temp", 0),
            "city": city_name,
        }
    except Exception as e:
        logger.error(f"Weather endpoint error: {e}")
        return {"title": "Error", "message": "Weather unavailable", "urgency": "N/A",
                "humidity": 0, "temperature": 0, "city": "Unknown"}


@app.get("/telemetry", tags=["Data"])
async def fetch_telemetry(farmer_id: int = 1, db: AsyncSession = Depends(get_db)):
    hist_result = await db.execute(
        select(DiagnosisHistory)
        .where(DiagnosisHistory.farmer_id == farmer_id)
        .order_by(DiagnosisHistory.timestamp.desc())
        .limit(5)
    )
    history = hist_result.scalars().all()

    MOCK_MANDI = [
        {"crop": "Tomato",  "price": 2400, "unit": "Quintal", "trend": "up",     "market": "Azadpur"},
        {"crop": "Wheat",   "price": 2100, "unit": "Quintal", "trend": "stable", "market": "Jaipur"},
        {"crop": "Potato",  "price": 1200, "unit": "Quintal", "trend": "down",   "market": "Indore"},
        {"crop": "Mustard", "price": 5200, "unit": "Quintal", "trend": "up",     "market": "Jaipur"},
    ]
    MOCK_HISTORY = [
        {"date": "10 Apr", "type": "Pest Scan",  "result": "Early Blight",      "crop": "Tomato"},
        {"date": "08 Apr", "type": "Voice Help", "result": "Fertilizer Advice", "crop": "Wheat"},
        {"date": "05 Apr", "type": "Pest Scan",  "result": "Healthy",           "crop": "Rice"},
    ]

    ui_history = []
    if history:
        for h in history:
            date_str = h.timestamp.strftime("%d %b")
            diag = h.ai_diagnosis or "Unknown"
            ui_history.append({
                "date": date_str,
                "type": "Pest Scan",
                "result": diag[:30] + "..." if len(diag) > 30 else diag,
                "crop": "Automated Scan",
            })
    else:
        ui_history = MOCK_HISTORY

    return {"mandi": MOCK_MANDI, "history": ui_history}


# ═══════════════════════════════════════════════════════════════════════════════
# PROTECTED ENDPOINTS (require JWT)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/analyze", tags=["Vision"])
async def analyze_crop(
    image: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...),
    transcript: Optional[str] = Form(None),
    preferred_language: str = Form("en"),
    db: AsyncSession = Depends(get_db),
    farmer_id: int = Depends(get_current_farmer_id),
):
    """
    Protected vision endpoint.
    Accepts image file + location, returns structured diagnosis JSON.
    FormData keys: image, lat, lon, transcript (optional), preferred_language
    """
    # Validate content type
    if not image.content_type or not image.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={
            "status": "error", "message": "Please upload a valid image file.",
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {"diagnosis": "Invalid file type.", "organic_remedy": "N/A",
                        "chemical_remedy": "N/A", "severity": "Low",
                        "urgency_level": "Low", "confidence_score": 0.0, "sources": []},
            "diagnosis_status": "ERROR", "rag_entities": [], "next_step": "RESCAN_REQUIRED",
        })

    image_bytes = await image.read()
    if not image_bytes:
        return JSONResponse(status_code=400, content={
            "status": "error", "message": "Empty file received.",
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {"diagnosis": "Empty file.", "organic_remedy": "N/A",
                        "chemical_remedy": "N/A", "severity": "Low",
                        "urgency_level": "Low", "confidence_score": 0.0, "sources": []},
            "diagnosis_status": "ERROR", "rag_entities": [], "next_step": "RESCAN_REQUIRED",
        })

    try:
        result = await run_analysis_workflow(
            image_bytes=image_bytes,
            user_text=transcript or "",
            lat=lat,
            lon=lon,
            preferred_language=preferred_language,
        )

        if not isinstance(result, dict):
            raise ValueError("Agent returned non-dict")

        # Persist diagnosis
        try:
            diagnosis_text = result.get("payload", {}).get("diagnosis", "Unknown")
            db.add(DiagnosisHistory(
                farmer_id=farmer_id,
                crop_image_url="uploaded_scan",
                ai_diagnosis=diagnosis_text,
            ))
            await db.commit()
        except Exception as db_err:
            logger.error(f"History persistence failed: {db_err}")

        return result

    except Exception as e:
        logger.error(f"/analyze failure: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": "Diagnosis failed. Please try again.",
            "agent_state": {"phase": "ERROR", "is_thinking": False, "progress_pct": 0},
            "payload": {"diagnosis": "Diagnosis failed. Please try again with a clearer image.",
                        "organic_remedy": "N/A", "chemical_remedy": "N/A",
                        "severity": "Low", "urgency_level": "Low",
                        "confidence_score": 0.0, "sources": []},
            "diagnosis_status": "ERROR", "rag_entities": [], "next_step": "RESCAN_REQUIRED",
        })


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_advisory(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    farmer_id: int = Depends(get_current_farmer_id),
):
    """Protected text chat endpoint."""
    from advisory_agent import get_advice

    result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
    farmer = result.scalars().first()
    lat, lon = (farmer.latitude or 28.6139, farmer.longitude or 77.2090) if farmer else (28.6139, 77.2090)

    advice = await get_advice(req.message, lat, lon)

    speech_url = None
    try:
        audio_text = advice.get("audio_summary", advice["response"])
        lang = advice.get("language_code", "hi")
        speech_url = await generate_speech(audio_text, str(uuid.uuid4()), lang=lang)
    except Exception as e:
        logger.error(f"Chat TTS error: {e}")

    return ChatResponse(
        response=advice["response"],
        speech_url=speech_url,
        follow_up_question=advice.get("notification"),
    )


@app.post("/voice-chat", tags=["Chat"])
async def voice_chat_advisory(
    audio: UploadFile = File(...),
    farmer_id: int = Form(1),
    db: AsyncSession = Depends(get_db),
):
    """
    Voice pipeline: audio blob → Gemini STT → Advisory Agent → TTS response.
    Note: farmer_id from form (no JWT on voice for easier mobile use).
    """
    from advisory_agent import get_advice

    try:
        result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
        farmer = result.scalars().first()
        lat, lon = (farmer.latitude or 28.6139, farmer.longitude or 77.2090) if farmer else (28.6139, 77.2090)

        audio_bytes = await audio.read()
        model = genai.GenerativeModel("gemini-1.5-flash-latest")

        # STT via Gemini multimodal
        stt_resp = await model.generate_content_async([
            "Transcribe this agricultural query exactly. Output ONLY the raw transcribed text, nothing else.",
            {"mime_type": audio.content_type or "audio/webm", "data": audio_bytes},
        ])
        transcript = stt_resp.text.strip()

        advice = await get_advice(transcript, lat, lon)

        speech_url = await generate_speech(
            advice.get("audio_summary", advice["response"]),
            str(uuid.uuid4()),
            lang=advice.get("language_code", "hi"),
        )

        return {
            "transcript": transcript,
            "response": advice["response"],
            "speech_url": speech_url,
            "notification": advice.get("notification"),
        }
    except Exception as e:
        logger.error(f"Voice chat error: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Voice advisory unavailable. Please try again."})


@app.post("/mandi-chat", tags=["Mandi"])
async def mandi_chat(
    req: MandiChatRequest,
    farmer_id: int = Depends(get_current_farmer_id),
):
    """
    RAG-powered Mandi price chatbot.
    Returns comparative price analysis across markets.
    """
    from mandi_agent import get_mandi_advice

    try:
        result = await get_mandi_advice(req.message, req.language)
        return result
    except Exception as e:
        logger.error(f"Mandi chat error: {e}")
        return JSONResponse(status_code=500, content={"error": "Mandi service unavailable."})


@app.get("/notifications/{farmer_id}", tags=["Notifications"])
async def get_unread_notifications(
    farmer_id: int,
    db: AsyncSession = Depends(get_db),
    _: int = Depends(get_current_farmer_id),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.farmer_id == farmer_id)
        .where(Notification.is_read == False)
    )
    nots = result.scalars().all()
    out = []
    for n in nots:
        out.append({"id": n.id, "title": n.title, "message": n.message, "timestamp": str(n.timestamp)})
        n.is_read = True
    await db.commit()
    return {"unread_count": len(out), "alerts": out}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
