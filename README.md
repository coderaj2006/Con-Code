# Kisaan AI Backend - Hackathon MVP Architecture

We have successfully built a robust, production-ready backend architecture for the **Kisaan AI** hackathon project. 

This document serves as an exhaustive summary of our technical milestones, featuring multi-modal intelligence, persistence layers, and native voice integrations.

## 1. Core Technology Stack
- **Framework:** FastAPI (Python) - blazing fast, async-native, providing auto-generated Swagger UI documentation.
- **AI Engine:** Google Generative AI SDK (Gemini 2.5 Flash) for multimodal vision and predictive reasoning.
- **Data Validation:** Pydantic - strictly typing every payload to guarantee the frontend receives predictable, exact data schemas.
- **Database Layer:** SQLAlchemy mapped to an Async SQLite Engine (`aiosqlite`) to maintain high-speed concurrency constraints without docker setups.
- **External APIs:** OpenWeatherMap for dynamic fetching of localized weather constraints.
- **Voice / Speech Engines:** Native Gemini File APIs (Transcription) and `gTTS` (Synthesis).
- **Security:** `python-dotenv` isolating secrets via `.env.example` configurations.

---

## 2. Advanced Implemented Functionalities

### 🗣️ Native Voice Integration (Multimodal)
Unlike standard text-based bots, our backend can actually hear the farmer.
- **Zero-Dependency Transcription:** We programmed an endpoint (`POST /process-voice`) that securely ingests `.m4a`/`.wav` recordings from mobile devices. It streams the raw audio directly into **Gemini 2.5's Native Audio processing API**.
- **Dialect Support:** The AI automatically transcribes regional agricultural dialects directly into structured English text. This allows illiterate farmers to securely use the diagnostic engine without typing.

### 🔊 Text-To-Speech (TTS) Engine
- **Automated Synthesis:** Whenever the AI generates a Hindi diagnosis summary for the farmer, the backend triggers `gTTS` to natively synthesize an `.mp3` audio file of the prognosis.
- **Static File Mounting:** Uvicorn securely hosts a dedicated `/static/audio/` volume. The `/analyze/upload` payload instantly returns a clickable `speech_url`, allowing the React/Mobile frontends to instantly play the diagnosis back to the farmer through an interactive audio player.

### 🧠 The "AgriBrain" Module (Gemini AI)
We built a dedicated class that processes both plant images and voice transcripts simultaneously.
- **Custom Persona:** Locked the System Prompt into acting strictly as an "Expert Indian Agronomist".
- **Structured JSON Fallbacks:** Forced the LLM to output highly reliable data matching our `GeminiDiagnosis` schema.
  - Contains `diagnosis`, `confidence`, `immediate_action`, `organic_alternative`, and a Native-language translation summary.
  - **Market Intelligence:** The schema extracts a contextual `market_valuation` and relevant `government_subsidy_hint` based on the visual diagnosis.

### ⏱️ Longitudinal AI Memory (Predictive Analysis)
Unlike standard one-shot APIs, our backend leverages SQLAlchemy to enforce **memory mapping**.
- **Farmer Profiles:** A `FarmerProfile` is uniquely stored in the DB alongside a rolling 7-day `DiagnosisHistory` table.
- **Prompt Injection:** When a farmer scans a plant, the backend routes their previous scan results directly into the Gemini prompt as a `--- LONGITUDINAL CONTEXT ---` parameter. 
- **Predictive Healing/Escalation:** This allows the AI to visibly acknowledge previous ailments, analyze the new image, and accurately determine if the biological pathogen is spreading, healing, or stabilizing over time.

### ⚙️ Asynchronous Proactive Workers
- **Weather Anomaly Scanner:** We bound `check_weather_anomalies` to FastAPI's built-in `BackgroundTasks`. 
- Every single time an image is uploaded, while the user reads their analysis, the server silently scans the entire SQLite Database. It evaluates the atmospheric temperature and humidity for *every registered farmer location*. 
- If dangerous thresholds are crossed (e.g., Humidity >85%, Temp >40°C), the background worker silently commits a critical `ALERT` into a `Notification` database table without blocking HTTP threads.

### 📈 Market & Pricing Services
- Integrated a mock `Mandi Market API` layer (`fetch_mandi_prices`) that returns localized price brackets (Min/Max trending data) depending on the farmer's registered `primary_crop`.

### 🌦️ Proactive Weather Agent
- **Dynamic Localization:** The backend securely accepts dynamic Latitude and Longitude floats straight from the user's mobile browser.
- **Graceful Failovers:** The weather fetcher is wrapped in error-handling logic so the core scan never crashes if external dependencies fail.

---

## 3. Tooling & Verification
We implemented a multi-stage `test_api.py` orchestrator script proving the backend functions entirely standalone and validates the Multi-Part uploading, Database AI memory retrieval, and MP3 generation pipeline.
Dependency structures are perfectly aligned using standard `requirements.txt` environments.
