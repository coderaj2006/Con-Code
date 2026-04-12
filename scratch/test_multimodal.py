import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

key = os.getenv("GEMINI_API_KEY", "").split(",")[0].strip()
print(f"Testing Key: {key[:10]}...")
genai.configure(api_key=key)

try:
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    # Create a tiny dummy image
    img = Image.new('RGB', (100, 100), color='red')
    response = model.generate_content(["What color is this?", img])
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"FAILED: {e}")
