# Kisaan AI: Merge Status & Hackathon Roadmap

This document serves as the central synchronization point for the team after the core backend and frontend merge.

## 1. Technical Breakpoints (Critical Issues)

| Item | Status | Impact |
| :--- | :--- | :--- |
| **Frontend Setup** | 🛑 BROKEN | `npm install` requires `--legacy-peer-deps` due to Vite 6 conflict. |
| **Backend Setup** | 🛑 BROKEN | `pip install` fails on `numpy` (Python 3.13 + GCC mismatch on Windows). |
| **Chat Schema** | ⚠️ MISMATCH | Backend sends RAG JSON; Frontend expects a raw string. |
| **Analysis Loop** | ⚠️ REDUNDANT | Two endpoints exist: `/analyze` (URL) and `/analyze/upload` (File). |
| **Live Telemetry** | ⚠️ MOCKED | History, Crop Status, and Mandi cards are using static data. |

---

## 2. Work Division (The 4 Phases)

### Phase 1: Environment & Base (Infrastructure)
**Owner: Backend/DevOps**
- Resolve Python 3.13 package compatibility.
- Standardize `.env.example` with all keys (Gemini, OpenWeather, Supabase).
- Fix PWA build process.

### Phase 2: API & Logic Synchronization
**Owner: Fullstack**
- Update `src/services/api.ts` to parse `agent_state`, `rag_advice`, and `follow_up_question`.
- Unify `/analyze` endpoint so both multipart and JSON logic paths use the teammate's orchestrator.

### Phase 3: Data Persistency
**Owner: Backend/Database**
- Implement `GET /history/{id}` to pull real diagnostic scans from SQLite.
- Implement `GET /mandi` to pull real market values.
- Link `AlertCard.tsx` to the `GET /weather-alerts` service.

### Phase 4: UX & Multilingual Polish
**Owner: Frontend/Design**
- Add audio playback logic for the `speech_url` returned by RAG chat.
- Polish PWA mobile responsiveness.
- Sanity test voice-to-text transcription in Hindi and other regional dialects.
