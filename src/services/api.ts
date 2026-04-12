import { API_BASE } from '../config';
import { OrchestratorResponse } from '../components/DiagnosisDisplay';

const API_BASE_URL = API_BASE;

export interface WeatherAlert {
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'NORMAL';
  title: string;
  message: string;
  action: string;
}

export interface WeatherAlertResponse {
  title: string;
  message: string;
  urgency: string;
  humidity: number;
  temperature: number;
  city?: string;
  wind_speed?: number;
  uv_index?: string;
  condition?: string;
  alerts?: WeatherAlert[];
}

// ── Vision ────────────────────────────────────────────────────────────────────
export const analyzeCrop = async (
  file: File,
  lat: number,
  lon: number,
  language: string,
  authHeaders: Record<string, string> = {},
): Promise<OrchestratorResponse> => {
  const formData = new FormData();
  formData.append('image', file);          // key must match backend: image
  formData.append('lat', lat.toString());
  formData.append('lon', lon.toString());
  formData.append('preferred_language', language);
  formData.append('transcript', '');
  formData.append('farmer_id', '1');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: authHeaders,                // JWT injected here
      body: formData,
    });
  } catch (networkErr: any) {
    // Catches ERR_CONNECTION_REFUSED and other network failures
    throw new Error('Backend server not found. Please ensure the Kisaan AI server is running on port 8002.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Analysis failed. Please try again.');
  }
  return response.json();
};

// ── Weather ───────────────────────────────────────────────────────────────────
export const getWeatherAlerts = async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
  const response = await fetch(`${API_BASE_URL}/weather-alerts?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Weather fetch failed');
  return response.json();
};

export const getWeatherByCity = async (city: string): Promise<WeatherAlertResponse> => {
  const response = await fetch(`${API_BASE_URL}/weather-by-city?city=${encodeURIComponent(city)}`);
  if (!response.ok) throw new Error(`City not found: ${city}`);
  return response.json();
};

// ── Text Chat ─────────────────────────────────────────────────────────────────
export const sendMessage = async (
  text: string,
  _language: string,
  authHeaders: Record<string, string> = {},
): Promise<{ content: string; timestamp: string; follow_up_question: string | null; speech_url: string | null }> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ message: text, farmer_id: 1 }),
  });
  if (!response.ok) throw new Error('Chat failed');
  const data = await response.json();
  return {
    content: data.response,
    follow_up_question: data.follow_up_question ?? null,
    speech_url: data.speech_url ?? null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

// ── Voice Chat ────────────────────────────────────────────────────────────────
export const sendVoiceMessage = async (
  audioBlob: Blob,
  _language: string,
): Promise<{ transcript: string; content: string; timestamp: string; follow_up_question: string | null; speech_url: string | null }> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_query.wav');
  formData.append('farmer_id', '1');

  const response = await fetch(`${API_BASE_URL}/voice-chat`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Voice chat failed');
  const data = await response.json();
  return {
    transcript: data.transcript,
    content: data.response,
    follow_up_question: data.notification ?? null,
    speech_url: data.speech_url ?? null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

// ── History ───────────────────────────────────────────────────────────────────
export interface DiagnosisHistoryItem {
  id: number;
  timestamp: string;
  ai_diagnosis: string | null;
  weather_at_time: string | null;
  confidence_score: number | null;
}

export const getFarmerHistory = async (farmerId: number): Promise<DiagnosisHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/telemetry?farmer_id=${farmerId}`);
  if (!response.ok) throw new Error('History fetch failed');
  const data = await response.json();
  return data.history ?? [];
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
