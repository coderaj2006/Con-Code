# Technical Specification Document: Kisaan-Sense AI (v2.0)

This document provides a comprehensive technical breakdown of the Kisaan-Sense agricultural intelligence platform, detailing its architecture, logic, and feature status.

---

## 1. Project Hierarchy (Filtered)
```text
C:.
├───main.py                 # Core FastAPI Application & Entry point
├───models.py               # SQLAlchemy Database Schemas
├───config.py               # Centralized SDK & Env Configuration
├───advisory_agent.py      # RAG-enabled Agricultural Chat Agent
├───orchestrator            # AI Logic Core
│   ├───agent.py            # Multimodal Vision Pipeline (Scan Plant)
│   ├───static_knowledge.py # Expert Knowledge Base for Demo Fallback
├───tools
│   ├───weather_agent.py    # Real-time Weather & Risk Scoring
├───src                     # Frontend Application (React/TSX)
│   ├───App.tsx             # Main App Layout & State
│   ├───components          # UI Modules (Hex-Grid, Chat, Diagnosis)
│   ├───services            # API & Hardware bindings (Weather, Speech, Vision)
│   └───context             # Global State (Auth, Location, Toast, Translation)
├───specs                   # Architectural Vision Documents
├───uploads                 # Local storage for scan images and audio
└───kisaan.db               # SQLite Local Persistence
```

---

## 2. Core Architecture & Data Flow

### Systems Integration
Kisaan-Sense follows a **Decoupled Client-Server Architecture**:
1.  **Frontend (UI Layer)**: Built with **Vite + React (TypeScript)**. It manages user sessions, device-level location (GPS), and hardware streams (Camera/Recording).
2.  **Backend (Intelligence Layer)**: Built with **FastAPI**. It orchestrates multiple AI agents and handles persistence.
3.  **Database (Persistence Layer)**: **SQLite** via SQLAlchemy. Stores farmer profiles and historical diagnostic telemetry.

### Logic Data Flow
- **Diagnostic Flow**: 
    - `src/services/api.ts` uploads a `multipart/form-data` payload containing raw image bytes and GPS coordinates.
    - `main.py` receives the request, injects real-time weather data from `weather_agent.py`, and hands it to `orchestrator/agent.py`.
    - `agent.py` processes the image (resizing, blur check) and queries the **Gemini 2.5 flash** model with a combined prompt (Image + Weather + Static RAG).
    - Result is saved to `kisaan.db` and returned as structured JSON.

---

## 3. Feature Audit

| Feature | Intended Function | Status | Dependencies |
| :--- | :--- | :--- | :--- |
| **Scan Plant** | Multimodal disease/pest diagnosis. | **ACTIVE** | `agent.py`, `genai`, `PIL` |
| **Advisory** | RAG-backed expert chat system. | **LIMITED** | `advisory_agent.py`, `static_knowledge.py` |
| **Mandi Prices** | Real-time commodity market rates. | **ACTIVE** | `mandi_agent.py` (simulated backup) |
| **Field Alerts** | Predictive heat stress/humidity warnings. | **ACTIVE** | `weather_agent.py`, OpenWeatherMap API |
| **SchemeMitra** | retrieval of Gov agricultural schemes. | **ACTIVE** | `SchemeMitra.tsx`, SQLite |
| **Voice Chat** | Language-agnostic voice interaction. | **ACTIVE** | `speech.ts`, `main.py` (/voice-chat) |

---

## 4. Logic & "Under the Hood"

### A. Static Context Injection (The RAG Fallback)
Due to API key restrictions for the `embedding-001` model, the system currently employs **Static Context Injection**.
- **Algorithmic Approach**: Instead of performing a vector similarity search, the `AGRI_KNOWLEDGE` baseline (from `static_knowledge.py`) is injected directly into the system prompt.
- **Logic**: 
  ```python
  prompt = f"Expert Context: {AGRI_KNOWLEDGE}\nUser Image: [Image]\nIdentify disease and treatment..."
  ```
- **Future-Proof**: The `advisory_agent.py` contains the logic to "snap" back to FAISS vector search the moment a compatible key is provided.

### B. Mathematical Pre-Filter (Blur Check)
To prevent wasteful API calls, `agent.py` performs a **Laplacian Variance Check**:
- **Equation**: `Var(Laplacian(Image)) < Threshold`
- **Threshold**: `50.0`. If variance is lower, the scan is rejected as "too blurry" before calling Gemini.

### C. Geopolitical Filtering (Location Override)
The backend implements a string-parsing filter to align the UI with user expectations in the Jaipur region:
- **Rule**: If `source_city` matches `Jagatpura`, it is remapped to `Jaipur`.

---

## 5. Environment & Constraints

### Resource Dependencies
- **Cloud Models**: `models/gemini-2.5-flash` (Vision/Speech/Logic).
- **APIs**:
    - **OpenWeatherMap**: Real-time atmospheric data.
    - **Google Generative AI**: LLM backbone.
- **Local Database**: `kisaan.db` (SQLite 3).

### UX Constraints ("Scorched Earth" Policy)
- **Zero Mock Data**: All data must be fetched from the backend or marked as "Simulation Mode" if the server is unreachable.
- **Minimalism**: No generic colors; use `emerald-800` (Agri-Green) and `neon-agri` (Accent) for branding.
- **Zero Configuration**: No onboarding forms; defaults to `farmer_id: 1` if no session is active.

---

## 6. Development Parameters
- **Frontend Port**: `5173` (Vite)
- **Backend Port**: `8002` (Uvicorn)
- **API Base**: `127.0.0.1` (to prevent CORS/localhost resolution conflicts).
