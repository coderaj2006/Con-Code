import requests
import logging
from config import config

logger = logging.getLogger(__name__)

# ── Risk Severity Levels ──────────────────────────────────────────────────────
SEVERITY_CRITICAL = "CRITICAL"   # Red  — immediate action required
SEVERITY_WARNING  = "WARNING"    # Yellow — caution advised
SEVERITY_INFO     = "INFO"       # Blue  — optimal / advisory
SEVERITY_NORMAL   = "NORMAL"     # No alert


def score_risk(temp: float, humidity: float, precipitation_24h: float, condition: str) -> list[dict]:
    """
    Risk Scoring Engine.
    Returns a list of alert dicts sorted by severity (CRITICAL first).
    Each alert: { severity, title, message, action }
    """
    alerts = []

    # ── CRITICAL: Immediate Fungal Risk ──────────────────────────────────────
    if humidity > 90 and 20 <= temp <= 25:
        alerts.append({
            "severity": SEVERITY_CRITICAL,
            "title": "Immediate Fungal Risk",
            "message": f"Humidity {humidity:.0f}% + Temp {temp:.1f}°C — ideal conditions for fungal disease spread.",
            "action": "Apply fungicide immediately. Avoid overhead irrigation.",
        })

    # ── CRITICAL: Extreme Heat ────────────────────────────────────────────────
    if temp > 42:
        alerts.append({
            "severity": SEVERITY_CRITICAL,
            "title": "Extreme Heat Stress",
            "message": f"Temperature {temp:.1f}°C — severe heat stress risk for all crops.",
            "action": "Irrigate early morning. Provide shade for nursery plants.",
        })

    # ── WARNING: Heavy Rain / Postpone Spraying ───────────────────────────────
    if precipitation_24h > 10:
        alerts.append({
            "severity": SEVERITY_WARNING,
            "title": "Heavy Rain Predicted",
            "message": f"Expected {precipitation_24h:.1f}mm rain in next 12–24 hours.",
            "action": "Postpone spraying and fertilizer application.",
        })

    # ── WARNING: High Humidity (moderate) ────────────────────────────────────
    if 85 < humidity <= 90 and not any(a["severity"] == SEVERITY_CRITICAL for a in alerts):
        alerts.append({
            "severity": SEVERITY_WARNING,
            "title": "High Humidity",
            "message": f"Humidity at {humidity:.0f}% — elevated fungal and pest risk.",
            "action": "Monitor crops closely. Ensure good field drainage.",
        })

    # ── WARNING: Frost Risk ───────────────────────────────────────────────────
    if temp < 5:
        alerts.append({
            "severity": SEVERITY_WARNING,
            "title": "Frost Risk",
            "message": f"Temperature {temp:.1f}°C — frost may damage young plants.",
            "action": "Cover nursery beds. Avoid irrigation tonight.",
        })

    # ── INFO: Optimal Sowing Conditions ──────────────────────────────────────
    if 25 <= temp <= 30 and humidity < 75 and precipitation_24h < 5:
        alerts.append({
            "severity": SEVERITY_INFO,
            "title": "Optimal Sowing Conditions",
            "message": f"Temp {temp:.1f}°C, Humidity {humidity:.0f}% — ideal for sowing Kharif crops.",
            "action": "Good time to sow seeds or transplant seedlings.",
        })

    # ── INFO: Good Spray Window ───────────────────────────────────────────────
    if precipitation_24h < 2 and humidity < 80 and condition.lower() not in ("rain", "drizzle", "thunderstorm"):
        if not any(a["severity"] in (SEVERITY_CRITICAL, SEVERITY_WARNING) for a in alerts):
            alerts.append({
                "severity": SEVERITY_INFO,
                "title": "Good Spray Window",
                "message": "Low rain risk and moderate humidity.",
                "action": "Safe to apply pesticides or foliar fertilizers today.",
            })

    # Sort: CRITICAL → WARNING → INFO
    order = {SEVERITY_CRITICAL: 0, SEVERITY_WARNING: 1, SEVERITY_INFO: 2, SEVERITY_NORMAL: 3}
    alerts.sort(key=lambda a: order.get(a["severity"], 9))
    return alerts


def get_weather(lat: float, lon: float) -> dict:
    """Real-time weather fetching with robust error handling."""
    api_key = config.OPENWEATHERMAP_API_KEY
    if not api_key:
        logger.warning("OpenWeatherMap API key is missing. Using mock fallback.")
        return _mock_weather_fallback(lat, lon)

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        precipitation = data.get("rain", {}).get("1h", 0.0) * 24
        return {
            "temperature": data.get("main", {}).get("temp", 0.0),
            "humidity": data.get("main", {}).get("humidity", 0.0),
            "precipitation_24h": round(precipitation, 2),
            "condition": data.get("weather", [{}])[0].get("main", "Unknown"),
        }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return _mock_weather_fallback(lat, lon)


def get_weather_context(lat: float, lon: float) -> str:
    """Human-readable context string for injection into the Advisory Agent."""
    weather = get_weather(lat, lon)
    temp = weather.get("temperature", 0)
    humidity = weather.get("humidity", 0)
    condition = weather.get("condition", "Unknown")
    precipitation = weather.get("precipitation_24h", 0)

    context = f"Current air temperature is {temp}°C with {humidity}% humidity. Skies are {condition}."

    alerts = score_risk(temp, humidity, precipitation, condition)
    for alert in alerts:
        if alert["severity"] in (SEVERITY_CRITICAL, SEVERITY_WARNING):
            context += f" {alert['severity']}: {alert['message']} {alert['action']}"

    return context


def _mock_weather_fallback(lat: float, lon: float) -> dict:
    """Fallback when API is down or key is missing."""
    if lat > 20.0:
        return {"temperature": 28.5, "humidity": 75.0, "precipitation_24h": 5.0, "condition": "Cloudy"}
    return {"temperature": 32.0, "humidity": 45.0, "precipitation_24h": 0.0, "condition": "Sunny"}
