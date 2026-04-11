const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8002';

import { OrchestratorResponse } from '../components/DiagnosisDisplay';

export interface WeatherAlertResponse {
  title: string;
  message: string;
  urgency: string;
  humidity: number;
  temperature: number;
  city?: string;
}

export const analyzeCrop = async (file: File, lat: number, lon: number, language: string): Promise<OrchestratorResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('lat', lat.toString());
  formData.append('lon', lon.toString());
  formData.append('preferred_language', language);
  formData.append('transcript', "");

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Analysis failed');
  return await response.json();
};

export const getWeatherAlerts = async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
  const response = await fetch(`${API_BASE_URL}/weather-alerts?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Weather fetch failed');
  return response.json();
};

export const sendMessage = async (text: string, language: string): Promise<{ content: string; timestamp: string; follow_up_question: string | null; speech_url: string | null }> => {
  console.log('API: Sending message to backend:', { text, language });
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, farmer_id: 1 }),
  });
  if (!response.ok) {
    console.error('API: Chat failed with status:', response.status);
    throw new Error('Chat failed');
  }
  const data = await response.json();
  console.log('API: Received response:', data);
  return {
    content: data.response,
    follow_up_question: data.follow_up_question ?? null,
    speech_url: data.speech_url ?? null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export const sendVoiceMessage = async (audioBlob: Blob, language: string): Promise<{ transcript: string; content: string; timestamp: string; follow_up_question: string | null; speech_url: string | null }> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_query.wav');
  formData.append('farmer_id', "1");

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

// ─── History ─────────────────────────────────────────────────────────────────
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

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
