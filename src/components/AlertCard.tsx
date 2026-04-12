import { FC, useState } from 'react';
import { AlertTriangle, MapPin, CloudRain, Wind, Thermometer, Droplets, Search, X, Sun } from 'lucide-react';
import { WeatherAlertResponse, getWeatherByCity } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';

interface AlertCardProps {
  weatherData: WeatherAlertResponse | null;
  isSunlightMode?: boolean;
  onWeatherChange?: (data: WeatherAlertResponse) => void;
}

export const AlertCard: FC<AlertCardProps> = ({ weatherData, isSunlightMode, onWeatherChange }) => {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleCitySearch = async () => {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const data = await getWeatherByCity(cityInput.trim());
      onWeatherChange?.(data);
      setShowSearch(false);
      setCityInput('');
    } catch {
      setSearchError('City not found. Try another name.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!weatherData) return null;

  const isHighRisk = weatherData.urgency === 'High';
  const windDisplay = weatherData.wind_speed != null ? `${weatherData.wind_speed}km/h` : '—';
  const uvDisplay = weatherData.uv_index ?? '—';

  const getWeatherIcon = () => {
    const cond = weatherData.condition?.toLowerCase() ?? '';
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-10 h-10 text-blue-400" />;
    if (cond.includes('clear')) return <Sun className="w-10 h-10 text-yellow-400" />;
    return <CloudRain className="w-10 h-10 text-blue-400" />;
  };

  const LocationSearchPanel = () => (
    <AnimatePresence>
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
              placeholder="Enter city name..."
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold outline-none border ${
                isSunlightMode
                  ? 'bg-white text-black border-white placeholder-zinc-400'
                  : 'bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500'
              }`}
              autoFocus
            />
            <button
              onClick={handleCitySearch}
              disabled={isSearching}
              className={`px-3 py-2 rounded-xl font-black text-sm transition-all ${
                isSunlightMode ? 'bg-white text-black' : 'bg-blue-500 text-white'
              } disabled:opacity-50`}
            >
              {isSearching ? '...' : <Search className="w-4 h-4" />}
            </button>
          </div>
          {searchError && (
            <p className="text-red-400 text-xs font-bold mt-1.5">{searchError}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

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
        <div className="flex gap-4 mb-4">
          <div className="status-pill bg-black/20 text-white border border-white/10">{t('label_humidity')}: {weatherData.humidity}%</div>
          <div className="status-pill bg-black/20 text-white border border-white/10">{t('label_temp')}: {weatherData.temperature}°C</div>
        </div>
        <button
          onClick={() => setShowSearch(s => !s)}
          className="flex items-center gap-1.5 text-white/60 text-xs font-bold mb-3 hover:text-white transition-colors"
        >
          <MapPin className="w-3 h-3" />
          Change location
          {showSearch && <X className="w-3 h-3 ml-1" />}
        </button>
        <LocationSearchPanel />
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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 border-2 ${
        isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-4xl font-black ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
            {weatherData.temperature}°C
          </h3>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="flex items-center gap-1.5 mt-1 text-zinc-400 hover:text-white transition-colors group"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              {weatherData.city || 'Your Location'}
            </span>
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 ml-1 font-bold">
              {showSearch ? '✕' : 'change'}
            </span>
          </button>
        </div>
        <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700">
          {getWeatherIcon()}
        </div>
      </div>

      <LocationSearchPanel />

      <div className="grid grid-cols-4 gap-2 mt-4">
        <WeatherStat label={t('humidity')} value={`${weatherData.humidity}%`} icon={Droplets} isSunlightMode={isSunlightMode} />
        <WeatherStat label="Wind" value={windDisplay} icon={Wind} isSunlightMode={isSunlightMode} />
        <WeatherStat label="UV Index" value={uvDisplay} icon={Sun} isSunlightMode={isSunlightMode} />
        <WeatherStat label={t('temperature')} value={`${weatherData.temperature}°C`} icon={Thermometer} isSunlightMode={isSunlightMode} />
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
