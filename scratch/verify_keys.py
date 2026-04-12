import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

keys = os.getenv("GEMINI_API_KEY", "").split(",")
for i, key in enumerate(keys):
    key = key.strip()
    print(f"\n--- Testing Key #{i+1}: {key[:10]}... ---")
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say hello")
        print(f"Success! Response: {response.text.strip()}")
    except Exception as e:
        print(f"FAILED: {e}")
