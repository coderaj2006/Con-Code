import base64
import json
import httpx
import asyncio
import os

async def test_kisaan_ai():
    url = "http://localhost:8000/analyze"
    
    # Put any plant image inside your folder to test
    image_path = "test_plant.jpg" 
    
    if not os.path.exists(image_path):
        print(f"⚠️  Please place a sample image named '{image_path}' in this directory first.")
        print("You can just download any picture of a plant leaf from Google Images and rename it.")
        return

    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error reading image: {e}")
        return

    payload = {
        "image_base64": encoded_string,
        "lat": 28.6139,  # New Delhi Coordinates for OpenWeatherMap test
        "lon": 77.2090,
        "transcript": "My plant leaves are turning yellow with brown spots, what should I do?"
    }

    print("Sending request to Kisaan AI backend (this might take a few seconds for Gemini to process)...")
    
    # Gemini processing + OpenWeatherMap fetch takes a few seconds, so we set a higher timeout
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print("\nSuccess! The response was too long and contained Hindi characters, so it was saved to 'response.json'.")
            
            with open("response.json", "w", encoding="utf-8") as f:
                json.dump(response.json(), f, indent=2, ensure_ascii=False)
            
            print("-> Open 'response.json' in your editor to see the magic!")
        except Exception as e:
            print(f"Connection Error: {e}")
            print("Did you make sure to start the server using 'uvicorn main:app --reload' in another terminal?")

if __name__ == "__main__":
    asyncio.run(test_kisaan_ai())
