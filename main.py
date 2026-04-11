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
from fastapi import FastAPI, Request, status, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
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

# Initialize FastAPI with lifespan
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    # Startup
    os.makedirs("uploads/audio", exist_ok=True)
    await init_db()
    asyncio.create_task(proactive_weather_monitor())
    yield
    # Shutdown (cleanup if needed)

app = FastAPI(title="Kisaan AI Proactive Loop", description="Hackathon MVP Phase 3 - Autonomous Agri-Assistant", lifespan=lifespan)

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

        await asyncio.sleep(300)  # 5 min interval (was 60s, too aggressive for API quota)

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
    agent_state: str
    follow_up_question: Optional[str] = None
    rag_advice: str
    audio_summary: str
    language_code: Optional[str] = None
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

# Mandi Market Price Data (crop-specific mock — replace with real API later)
MANDI_PRICE_DATA = {
    "tomato":  {"min_price": "₹12/kg", "max_price": "₹28/kg", "trend": "rising",  "mandi": "Azadpur, Delhi"},
    "wheat":   {"min_price": "₹22/kg", "max_price": "₹26/kg", "trend": "stable",  "mandi": "Karnal, Haryana"},
    "rice":    {"min_price": "₹30/kg", "max_price": "₹42/kg", "trend": "stable",  "mandi": "Amritsar, Punjab"},
    "potato":  {"min_price": "₹8/kg",  "max_price": "₹15/kg", "trend": "falling", "mandi": "Agra, UP"},
    "onion":   {"min_price": "₹18/kg", "max_price": "₹35/kg", "trend": "rising",  "mandi": "Lasalgaon, Maharashtra"},
    "cotton":  {"min_price": "₹55/kg", "max_price": "₹72/kg", "trend": "stable",  "mandi": "Rajkot, Gujarat"},
    "maize":   {"min_price": "₹16/kg", "max_price": "₹22/kg", "trend": "falling", "mandi": "Davangere, Karnataka"},
    "mustard": {"min_price": "₹48/kg", "max_price": "₹58/kg", "trend": "rising",  "mandi": "Alwar, Rajasthan"},
    "sugarcane": {"min_price": "₹3/kg", "max_price": "₹4/kg",  "trend": "stable", "mandi": "Muzaffarnagar, UP"},
}
DEFAULT_MANDI = {"min_price": "₹15/kg", "max_price": "₹25/kg", "trend": "stable", "mandi": "Local Market"}

async def fetch_mandi_prices(crop_name: str) -> Dict[str, Any]:
    data = MANDI_PRICE_DATA.get(crop_name.lower(), DEFAULT_MANDI)
    return {"crop": crop_name, "market_data": data}

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
        pressure = current_data.get("main", {}).get("pressure", 1010)
        wind_speed = current_data.get("wind", {}).get("speed", 0)
        
        has_alert, reasons = False, []
        if risk_engine:
            has_alert, reasons = risk_engine.predict_risk(temp, humidity, pressure, wind_speed)
        else:
            if humidity > 85: reasons.append(f"High humidity ({humidity}%) detected. Fungal risk.")
            if temp > 40: reasons.append(f"High temp ({temp}°C) detected. Heat stress risk.")
            has_alert = len(reasons) > 0
            
        return current_data, WeatherAlertState(has_alert, reasons)

class AgriBrain:
    @staticmethod
    async def analyze(image_b64: str, transcript: Optional[str], previous_context: Optional[str] = None) -> Dict[str, Any]:
        image_data = base64.b64decode(image_b64.split(',', 1)[1] if ',' in image_b64 else image_b64)
        img = Image.open(io.BytesIO(image_data)).convert('RGB')

        # Fallback to Gemini (Native CV model integration reserved for teammate)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = "You are an Expert Agronomist. Return ONLY JSON matching schema: {diagnosis:str, confidence:float, immediate_action:list, organic_alternative:str, regional_language_summary:str, market_valuation:str, government_subsidy_hint:str}\n"
        if previous_context: prompt += f"Context: {previous_context}\n"
        if transcript: prompt += f"Transcript: {transcript}\n"
        
        response = await model.generate_content_async([prompt, img])
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3].strip()
        return json.loads(text)

# API Endpoints
@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API docs"""
    return RedirectResponse(url="/docs")

@app.get("/health")
async def health_check(): return {"status": "healthy"}

# Farmer Registration
class FarmerCreate(BaseModel):
    name: str
    location: str
    primary_crop: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    fcm_token: Optional[str] = None

@app.post("/farmers")
async def register_farmer(farmer: FarmerCreate, db: AsyncSession = Depends(get_db)):
    """ Register a new farmer profile """
    new_farmer = FarmerProfile(
        name=farmer.name,
        location=farmer.location,
        primary_crop=farmer.primary_crop,
        latitude=farmer.latitude,
        longitude=farmer.longitude,
        fcm_token=farmer.fcm_token
    )
    db.add(new_farmer)
    await db.commit()
    await db.refresh(new_farmer)
    return {"id": new_farmer.id, "name": new_farmer.name, "message": "Farmer registered successfully"}

@app.get("/farmers/{farmer_id}")
async def get_farmer(farmer_id: int, db: AsyncSession = Depends(get_db)):
    """ Get farmer profile by ID """
    result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == farmer_id))
    farmer = result.scalars().first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {
        "id": farmer.id, "name": farmer.name, "location": farmer.location,
        "primary_crop": farmer.primary_crop, "latitude": farmer.latitude,
        "longitude": farmer.longitude
    }

@app.get("/weather-alerts")
async def get_weather_alerts(lat: float, lon: float):
    try:
        weather_info, alert_state = await fetch_weather_and_alerts(lat, lon)
        return {
            "title": "Weather Alert" if alert_state.has_alert else "Weather Normal",
            "message": alert_state.reasons[0] if alert_state.has_alert and alert_state.reasons else "Conditions are favorable.",
            "urgency": "High" if alert_state.has_alert else "Low",
            "humidity": weather_info.get("main", {}).get("humidity", 0),
            "temperature": weather_info.get("main", {}).get("temp", 0)
        }
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        return {"title": "Error", "message": "Weather unavailable", "urgency": "N/A", "humidity": 0, "temperature": 0}

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
    # Fetch Farmer Profile
    result = await db.execute(select(FarmerProfile).where(FarmerProfile.id == req.farmer_id))
    farmer = result.scalars().first()
    
    farmer_context = "Unknown"
    market_prices = "Unknown"
    lat, lon = 28.6139, 77.2090
    if farmer:
        farmer_context = f"Location: Lat {farmer.latitude}, Long {farmer.longitude}. Primary Crop: {farmer.primary_crop}"
        lat = farmer.latitude or lat
        lon = farmer.longitude or lon
        market_prices = await fetch_mandi_prices(farmer.primary_crop)

    # Fetch Weather
    weather_info, alert_state = await fetch_weather_and_alerts(lat, lon)
    weather_context = f"Temp: {weather_info.get('main', {}).get('temp', 'N/A')}°C, Humidity: {weather_info.get('main', {}).get('humidity', 'N/A')}%. Alerts: {', '.join(alert_state.reasons) if alert_state.has_alert else 'None'}."

    # Fetch Longitudinal History (last 7 days scans)
    hist_result = await db.execute(select(DiagnosisHistory).where(DiagnosisHistory.farmer_id == req.farmer_id).order_by(DiagnosisHistory.timestamp.desc()).limit(7))
    histories = hist_result.scalars().all()
    history_context = " | ".join([h.ai_diagnosis for h in histories if h.ai_diagnosis]) or "No previous scans."

    # Fetch Vector Knowledge Base Results
    rag_hits = await AgriVectorDB.query_agri_knowledge_base(req.message)
    rag_context = "\n".join(rag_hits) if rag_hits else "No specific RAG data found."

    # Fetch or Create Chat Session
    session_result = await db.execute(select(ChatSession).where(ChatSession.farmer_id == req.farmer_id).order_by(ChatSession.started_at.desc()))
    session = session_result.scalars().first()
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
    
    prompt = f"""### ROLE
You are the Lead Architect for Kisaan AI's RAG Pipeline and act as a sympathetic "Dr. Kisaan". You are building a stateful, multi-turn diagnostic agent.

### CONTEXTUAL AWARENESS
- Farmer Profile: {farmer_context}
- Current Weather: {weather_context}
- Longitudinal History: {history_context}
- Market Data: {market_prices}
- Knowledge Base Results: {rag_context}

### OPERATIONAL GUIDELINES (GAP ANALYSIS)
1. DATA RETRIEVAL & INJECTION: You have been provided the Knowledge Base Results and the Farmer's context above. You must use this RAG context to supply accurate 'rag_advice' focused on organic solutions, subsidies, and Kharif/Rabi seasons.
2. GAP ANALYSIS: Evaluate if the user's problem is missing "Critical Variables" (e.g., if they mention a pest but don't state their irrigation status, or mention crop failure but don't specify the crop type).
3. ITERATIVE QUESTIONING: If there is missing critical data, you MUST set "agent_state" to "DISCOVERY", and prompt the user in 'follow_up_question' before giving a diagnosis. If data is sufficient, state is "DIAGNOSIS" or "ACTION".
4. OUTPUT STRUCTURE: Return exactly the JSON schema below.

### RESPONSE STRUCTURE (STRICT JSON)
Your output must be a valid JSON object matching exactly this schema:
{{
  "agent_state": "DISCOVERY|DIAGNOSIS|ACTION",
  "follow_up_question": "A string asking for the missing critical variable, or null if state is ACTION/DIAGNOSIS.",
  "rag_advice": "Detailed string containing your synthesis of the Context and User Query. Must use the Knowledge Base Results.",
  "audio_summary": "A short 2-sentence summary in the user's native regional language.",
  "language_code": "The exact ISO 639-1 2-letter code for the audio_summary (e.g., 'hi', 'mr', 'ta', 'te', 'gu'). Default 'hi'."
}}

User Query: {req.message}
"""
    
    try:
        resp = await chat.send_message_async(prompt)
        text = resp.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        parsed_resp = json.loads(text)
        
        agent_state = parsed_resp.get("agent_state", "ACTION")
        follow_up_question = parsed_resp.get("follow_up_question", None)
        rag_advice = parsed_resp.get("rag_advice", "I am sorry, I couldn't process this request.")
        audio_summary = parsed_resp.get("audio_summary", rag_advice)
        language_code = parsed_resp.get("language_code", "hi")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        agent_state = "ACTION"
        follow_up_question = None
        rag_advice = "माफ़ करना, मैं अभी आपकी सहायता नहीं कर पा रहा हूँ।"
        audio_summary = rag_advice
        language_code = "hi"
        parsed_resp = {
            "agent_state": agent_state, 
            "follow_up_question": follow_up_question,
            "rag_advice": rag_advice,
            "audio_summary": audio_summary, 
            "language_code": language_code
        }

    # Save outgoing AI message (Store JSON string to preserve context for next turns)
    db.add(ChatMessage(session_id=session.id, role="model", content=json.dumps(parsed_resp)))
    await db.commit()

    # Synthesize Audio Response strictly from the regional audio summary using the detected lang code
    speech_url = None
    try:
        # Fallback to 'hi' if language_code fails
        if audio_summary:
            speech_url = await generate_speech(audio_summary, str(uuid.uuid4()), lang=language_code)
    except Exception as e:
        logger.error(f"Chat TTS error: {e}")
        
    return ChatResponse(
        agent_state=agent_state,
        follow_up_question=follow_up_question,
        rag_advice=rag_advice,
        audio_summary=audio_summary,
        language_code=language_code,
        speech_url=speech_url
    )

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
            "You are an expert transcriber. Transcribe the following agricultural audio query EXACTLY in its original language using the native geographic script (e.g., Devanagari for Hindi, Tamil script for Tamil, Kannada, Marathi, Gujarati, etc.). Do NOT translate the query to English. ONLY output the raw transcribed text.",
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

@app.get("/mandi/{crop_name}")
async def get_mandi_prices_endpoint(crop_name: str):
    """ Fetch market prices for a specific crop """
    try:
        data = await fetch_mandi_prices(crop_name)
        return data
    except Exception as e:
        logger.error(f"Mandi price fetch failed: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to fetch market data"})

@app.get("/history/{history_id}")
async def get_history_detail(history_id: int, db: AsyncSession = Depends(get_db)):
    """ Fetch a single diagnosis history record by ID """
    result = await db.execute(select(DiagnosisHistory).where(DiagnosisHistory.id == history_id))
    history = result.scalars().first()
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
    return history

@app.get("/history/farmer/{farmer_id}")
async def get_farmer_history(farmer_id: int, db: AsyncSession = Depends(get_db)):
    """ Fetch all diagnosis records for a specific farmer """
    result = await db.execute(
        select(DiagnosisHistory)
        .where(DiagnosisHistory.farmer_id == farmer_id)
        .order_by(DiagnosisHistory.timestamp.desc())
    )
    histories = result.scalars().all()
    return histories


