import { WeatherAlertResponse, getWeatherAlerts as fetchWeatherFromApi } from './api';

export const weatherService = {
  getWeather: async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const data = await fetchWeatherFromApi(lat, lon);
          resolve(data);
        } catch (error) {
          // fallback to generic message if API fails
          console.warn('Weather API failed, using unavailable status');
          resolve({
            title: 'Location Unavailable',
            message: 'Waiting for fresh weather data. Please ensure the backend is running.',
            urgency: 'N/A',
            humidity: 0,
            temperature: 0
          });
        }
      }, 800);
    });
  }
};
