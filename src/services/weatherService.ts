import { WeatherAlertResponse, getWeatherAlerts as fetchWeatherFromApi } from './api';

export const weatherService = {
  getWeather: async (lat: number, lon: number): Promise<WeatherAlertResponse> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const data = await fetchWeatherFromApi(lat, lon);
          resolve(data);
        } catch (error) {
          // fallback to mock if API fails
          console.warn('Weather API failed, using mock data');
          resolve({
            title: 'Normal Conditions',
            message: 'Clear skies in Jodhpur. Optimal conditions for harvesting.',
            urgency: 'Low',
            humidity: 45,
            temperature: 32
          });
        }
      }, 800);
    });
  }
};
