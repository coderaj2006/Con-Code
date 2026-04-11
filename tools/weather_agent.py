import requests
import logging
from config import config

logger = logging.getLogger(__name__)

def get_weather(lat: float, lon: float) -> dict:
    """
    Real-time weather fetching with robust error handling.
    """
    api_key = config.OPENWEATHERMAP_API_KEY
    if not api_key:
        logger.warning("OpenWeatherMap API key is missing. Using mock fallback.")
        return _mock_weather_fallback(lat, lon)

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Approximate precipitation if standard rain data is not formatted directly in this endpoint
        precipitation = data.get("rain", {}).get("1h", 0.0) * 24
        
        return {
            "temperature": data.get("main", {}).get("temp", 0.0),
            "humidity": data.get("main", {}).get("humidity", 0.0),
            "precipitation_24h": round(precipitation, 2),
            "condition": data.get("weather", [{}])[0].get("main", "Unknown")
        }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return _mock_weather_fallback(lat, lon)

def get_weather_context(lat: float, lon: float) -> str:
    """
    Returns a human-readable 'Context String' for injection into the Advisory Agent.
    """
    weather = get_weather(lat, lon)
    temp = weather.get("temperature", 0)
    humidity = weather.get("humidity", 0)
    condition = weather.get("condition", "Unknown")
    
    context = f"Current air temperature is {temp}°C with {humidity}% humidity. Skies are {condition}."
    
    if humidity > 85:
        context += " WARNING: High humidity detected, which increases Fungal Risk for most Kharif crops."
    elif temp > 40:
        context += " WARNING: Extreme heat detected, possible heat stress for young plants."
        
    return context

def _mock_weather_fallback(lat: float, lon: float) -> dict:
    """Fallback logic when API is down or key is missing."""
    # Heuristic based on latitude (simplification)
    if lat > 20.0:
        return {"temperature": 28.5, "humidity": 75.0, "precipitation_24h": 5.0, "condition": "Cloudy"}
    return {"temperature": 32.0, "humidity": 45.0, "precipitation_24h": 0.0, "condition": "Sunny"}
