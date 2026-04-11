const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

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

export const analyzeCrop = async (imageBase64: string, language: string): Promise<CropAnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/analyze-crop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64, language }),
  });
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
};

export const getWeatherAlerts = async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
  const response = await fetch(`${API_BASE_URL}/weather-alerts?lat=${lat}&lon=${lon}`);
  if (!response.ok) throw new Error('Weather fetch failed');
  return response.json();
};

export const sendMessage = async (text: string, language: string): Promise<{ content: string; timestamp: string }> => {
  console.log('API: Sending message to backend:', { text, language });
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!response.ok) {
    console.error('API: Chat failed with status:', response.status);
    throw new Error('Chat failed');
  }
  const data = await response.json();
  console.log('API: Received response:', data);
  return data;
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
