import { FC } from 'react';
import { AlertTriangle, MapPin, CloudRain, Wind, Thermometer, Droplets } from 'lucide-react';
import { WeatherAlertResponse } from '../services/api';
import { motion } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';

interface AlertCardProps {
  weatherData: WeatherAlertResponse | null;
  isSunlightMode?: boolean;
}

export const AlertCard: FC<AlertCardProps> = ({ weatherData, isSunlightMode }) => {
  const { t } = useTranslation();
  if (!weatherData) return null;

  const isHighRisk = weatherData.urgency === 'High';

  if (isHighRisk) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className={`relative overflow-hidden p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 border-2 ${
          isSunlightMode ? 'bg-black border-white' : 'bg-red-500/90 border-red-400 shadow-red-900/40 animate-pulse-red'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isSunlightMode ? 'bg-white text-black' : 'bg-white/20 text-white'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-white">{t('critical_warning')}</h3>
              <p className={`text-xs font-bold ${isSunlightMode ? 'text-white/60' : 'text-white/70'}`}>{t('warning_subtitle')}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isSunlightMode ? 'bg-white text-black' : 'bg-red-400/30 text-white border border-red-400/30'
          }`}>Critical</div>
        </div>
        <p className={`text-2xl font-black leading-tight mb-6 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{t('warning_body')}</p>
        <div className="flex gap-4 mb-6">
          <div className="status-pill bg-black/20 text-white border border-white/10">{t('label_humidity')}: {weatherData.humidity}%</div>
          <div className="status-pill bg-black/20 text-white border border-white/10">{t('label_temp')}: {weatherData.temperature}°C</div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${
            isSunlightMode ? 'bg-white text-black' : 'bg-white text-red-600'
          }`}
        >
          {t('act_now')}
        </motion.button>
      </motion.div>
    );
  }

  // Sleek Dark Weather Card
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 border-2 ${
        isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-4xl font-black ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{weatherData.temperature}°C</h3>
          <div className="flex items-center gap-1.5 mt-1 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">{weatherData.city || 'Your Location'}</span>
          </div>
        </div>
        <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700">
          <CloudRain className="w-10 h-10 text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <WeatherStat label={t('humidity')} value={`${weatherData.humidity}%`} icon={Droplets} isSunlightMode={isSunlightMode} />
        <WeatherStat label="Wind" value="12km/h" icon={Wind} isSunlightMode={isSunlightMode} />
        <WeatherStat label="UV Index" value="Low" icon={CloudRain} isSunlightMode={isSunlightMode} />
        <WeatherStat label={t('temperature')} value={`${weatherData.temperature + 2}°C`} icon={Thermometer} isSunlightMode={isSunlightMode} />
      </div>
    </motion.div>
  );
};

const WeatherStat = ({ label, value, icon: Icon, isSunlightMode }: any) => (
  <div className={`p-3 rounded-2xl flex flex-col items-center ${isSunlightMode ? 'border-2 border-white' : 'bg-zinc-800/50 border border-zinc-800'}`}>
    <Icon className={`w-5 h-5 mb-2 ${isSunlightMode ? 'text-white' : 'text-zinc-500'}`} />
    <span className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5 text-center ${isSunlightMode ? 'text-white/60' : 'text-zinc-500'}`}>{label}</span>
    <span className={`text-xs font-black ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{value}</span>
  </div>
);
