import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class Config:
    _keys = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEYS = [k.strip() for k in _keys.split(",") if k.strip()]
    GEMINI_API_KEY = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else None
    OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

config = Config()

# ── Global AI Boot ──────────────────────────────────────────────────────────
if config.GEMINI_API_KEY:
    genai.configure(api_key=config.GEMINI_API_KEY)
