import { FC } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { WeatherAlertResponse } from '../services/api';

interface AlertCardProps {
  weatherData: WeatherAlertResponse | null;
}

export const AlertCard: FC<AlertCardProps> = ({ weatherData }) => {
  if (!weatherData) return null;

  const isHighRisk = weatherData.urgency === 'High';

  return (
    <div className={`mx-4 mt-4 animate-in slide-in-from-top-1 px-4 py-4 rounded-3xl text-white shadow-2xl relative overflow-hidden flex items-center gap-4 transition-all duration-500 ${isHighRisk ? 'bg-gradient-to-br from-alert-red to-orange-600 animate-pulse-red' : 'bg-gradient-to-br from-agri-green to-emerald-600'}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
      
      <div className={`flex-shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center ${isHighRisk ? 'animate-pulse' : ''}`}>
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-black uppercase tracking-widest opacity-80">
            {isHighRisk ? 'Critical Warning' : 'Weather Status'}
          </span>
          {isHighRisk && <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>}
        </div>
        <p className="text-lg font-bold leading-tight">
          {weatherData.message}
        </p>
        <div className="flex items-center gap-3 mt-1 opacity-70">
           <span className="text-[10px] font-bold uppercase transition-all">Humidity: {weatherData.humidity}%</span>
           <span className="text-[10px] font-bold uppercase transition-all">Temp: {weatherData.temperature}°C</span>
        </div>
      </div>

      <button className="flex-shrink-0 btn-press">
        <div className="bg-white/20 p-2 rounded-full border border-white/20">
          <ChevronRight className="w-6 h-6" />
        </div>
      </button>
    </div>
  );
};
