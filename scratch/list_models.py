import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY", "").split(",")[0].strip()
print(f"Testing Key: {key[:10]}...")
genai.configure(api_key=key)

try:
    print("Available Models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"FAILED to list models: {e}")
