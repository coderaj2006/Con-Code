import requests
from config import config

def get_weather(lat: float, lon: float) -> dict:
    """
    Real implementation using OpenWeatherMap API.
    """
    api_key = config.OPENWEATHERMAP_API_KEY
    if not api_key:
        print("WARNING: OpenWeatherMap API key is missing. Falling back to mock data.")
        return _mock_weather_fallback(lat, lon)

    print(f"DEBUG: Calling OpenWeatherMap API for lat={lat}, lon={lon}")
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # OpenWeatherMap gives rain in recent 1h or 3h rather than 24h by default in standard endpoint
        # Will approximate or use available data
        precipitation = data.get("rain", {}).get("1h", 0.0) * 24
        
        return {
            "temperature": data.get("main", {}).get("temp", 0.0),
            "humidity": data.get("main", {}).get("humidity", 0.0),
            "precipitation_24h": round(precipitation, 2),
            "condition": data.get("weather", [{}])[0].get("main", "Unknown")
        }
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to fetch weather data: {e}")
        return _mock_weather_fallback(lat, lon)

def _mock_weather_fallback(lat: float, lon: float) -> dict:
    # Keep the old behavior as fallback
    if lat > 20.0:
        return {"temperature": 28.5, "humidity": 85.0, "precipitation_24h": 12.0, "condition": "Cloudy"}
    else:
        return {"temperature": 32.0, "humidity": 40.0, "precipitation_24h": 0.0, "condition": "Sunny"}
