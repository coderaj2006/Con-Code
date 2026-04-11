const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface CropAnalysisResponse {
  disease_name: string;
  organic_cure: string[];
  urgency_level: string;
  description: string;
}

export interface WeatherAlertResponse {
  title: string;
  message: string;
  urgency: string;
  humidity: number;
  temperature: number;
}

export interface DiagnosisHistoryItem {
  id: number;
  farmer_id: number;
  timestamp: string;
  crop_image_url: string | null;
  ai_diagnosis: string | null;
  weather_at_time: string | null;
}

export interface MandiPriceResponse {
  crop: string;
  market_data: {
    min_price: string;
    max_price: string;
    trend: string;
  };
}

export const analyzeCrop = async (file: File, lat: number, lon: number, language: string): Promise<CropAnalysisResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('lat', lat.toString());
  formData.append('lon', lon.toString());
  formData.append('transcript', `Language preference: ${language}`);
  formData.append('farmer_id', '1');

  const response = await fetch(`${API_BASE_URL}/analyze/upload`, {
    method: 'POST',
    body: formData, // No headers needed so browser sets multipart boundary
  });
  if (!response.ok) throw new Error('Analysis failed');
  const result = await response.json();
  
  const diagnosisData = result.data.diagnosis;
  return {
    disease_name: diagnosisData.diagnosis?.substring(0, 50) + "..." || "Issue Detected",
    organic_cure: [diagnosisData.organic_alternative || "No organic cure found"],
    urgency_level: 'High',
    description: diagnosisData.diagnosis || "Please refer to history."
  };
};

export const getWeatherAlerts = async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
  const response = await fetch(`${API_BASE_URL}/weather-alerts?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Weather fetch failed');
  return response.json();
};

export const sendMessage = async (text: string, language: string): Promise<{ content: string; timestamp: string; speech_url?: string }> => {
  console.log('API: Sending message to backend:', { text, language });
  
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, farmer_id: 1 }),
  });

  if (!response.ok) {
    console.error('API: Chat failed with status:', response.status);
    throw new Error('Chat connection failed');
  }

  const data = await response.json();
  console.log('API: Received real response:', data);
  
  return { 
    content: data.rag_advice || data.response || "No advice received", 
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    speech_url: data.speech_url
  };
};

export const getFarmerHistory = async (farmerId: number): Promise<DiagnosisHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/history/farmer/${farmerId}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
};

export const getHistoryDetail = async (id: number): Promise<DiagnosisHistoryItem> => {
  const response = await fetch(`${API_BASE_URL}/history/${id}`);
  if (!response.ok) throw new Error('Failed to fetch history detail');
  return response.json();
};

export const getMandiPrices = async (crop: string): Promise<MandiPriceResponse> => {
  const response = await fetch(`${API_BASE_URL}/mandi/${crop}`);
  if (!response.ok) throw new Error('Failed to fetch mandi prices');
  return response.json();
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
