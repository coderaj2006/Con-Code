import httpx
import asyncio
import json
import os

async def test_kisaan_ai():
    url = "http://localhost:8000/analyze/upload"
    
    image_path = "test_plant.jpg" 
    
    if not os.path.exists(image_path):
        print(f"⚠️  Please place a sample image named '{image_path}' in this directory first.")
        return

    # Data to send as regular form fields
    data_payload = {
        "lat": "28.6139",  # New Delhi
        "lon": "77.2090",
        "transcript": "My crop is completely wilting today and the leaves look burnt.",
        "farmer_id": "1"  # Our dummy DB user "Ramesh"
    }

    print("Sending FIRST request. This will initialize the DB, seed Ramesh, and create the first scan history...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            with open(image_path, "rb") as f:
                files = {"image": (image_path, f, "image/jpeg")}
                response = await client.post(url, data=data_payload, files=files)
            
            print(f"Status Code: {response.status_code}")
            with open("response_1.json", "w", encoding="utf-8") as f:
                json.dump(response.json(), f, indent=2, ensure_ascii=False)
            print("First response saved to 'response_1.json'!")
            
            # --- SECOND REQUEST TO TEST AI LONGITUDINAL CONTEXT MEMORY ---
            print("\nWaiting a few seconds... Now sending a SECOND scan for the same farmer...")
            await asyncio.sleep(2)
            
            # Change the transcript slightly to simulate follow up
            data_payload["transcript"] = "Here is an updated photo. It looks like it spread further up the stem since my last scan."
            
            with open(image_path, "rb") as f:
                files = {"image": (image_path, f, "image/jpeg")}
                response2 = await client.post(url, data=data_payload, files=files)
            
            print(f"Status Code: {response2.status_code}")
            with open("response_2.json", "w", encoding="utf-8") as f:
                json.dump(response2.json(), f, indent=2, ensure_ascii=False)
            print("Second response saved to 'response_2.json'!")
            print("-> Open both response_1.json and response_2.json to see how the AI gained memory of the previous scan!")

        except Exception as e:
            print(f"Connection Error: {e}")
            print("Did you make sure to start the server using 'uvicorn main:app --reload' in another terminal?")

if __name__ == "__main__":
    asyncio.run(test_kisaan_ai())
