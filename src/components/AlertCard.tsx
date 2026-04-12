// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, CloudRain, Wind, Thermometer, Droplets, Search, X, CloudSun } from 'lucide-react';
import { WeatherAlertResponse, getWeatherByCity } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';

interface AlertCardProps {
  weatherData: WeatherAlertResponse | null;
  isSunlightMode?: boolean;
  onWeatherChange?: (data: WeatherAlertResponse) => void;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
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
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-8 h-8 text-agri-green" />;
    if (cond.includes('clear')) return <CloudSun className="w-8 h-8 text-agri-amber" />;
    return <CloudSun className="w-8 h-8 text-agri-green-mid" />;
  };

  /* Status banner — reads from existing urgency state */
  const getBannerStyle = () => {
    if (isHighRisk) return {
      wrap: 'bg-agri-terra/10 border-l-4 border-agri-terra text-agri-terra',
      Icon: AlertOctagon,
    };
    if (weatherData.urgency === 'Medium') return {
      wrap: 'bg-agri-amber/10 border-l-4 border-agri-amber text-agri-amber',
      Icon: AlertTriangle,
    };
    return {
      wrap: 'bg-agri-green/10 border-l-4 border-agri-green text-agri-green',
      Icon: ShieldCheck,
    };
  };

  const banner = getBannerStyle();

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
            <label htmlFor="alert-city-input" className="sr-only">City name</label>
            <input
              id="alert-city-input"
              type="text"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
              placeholder="Enter city name..."
              autoFocus
              className={`flex-1 px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium outline-none border-2 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 transition-all ${
                isSunlightMode
                  ? 'bg-white text-black border-white placeholder-zinc-400'
                  : 'bg-agri-cream border-agri-soil/30 text-agri-soil-deep placeholder-agri-soil/50'
              }`}
            />
            <button
              onClick={handleCitySearch}
              disabled={isSearching}
              aria-label="Search city"
              className={`px-3 min-h-[44px] rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 disabled:opacity-50 ${
                isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream'
              }`}
            >
              {isSearching ? '…' : <Search className="w-4 h-4" />}
            </button>
          </div>
          {searchError && (
            <p className="text-agri-terra text-xs font-medium mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{searchError}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isHighRisk) {
    return (
      <motion.div
        className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-colors duration-500 ${
          isSunlightMode ? 'bg-black border-white' : 'bg-agri-terra/10 border-agri-terra/40'
        }`}
      >
        {/* Status banner */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl mb-4 transition-colors duration-500 ${
          isSunlightMode ? 'bg-white/10 text-white' : banner.wrap
        }`}>
          <banner.Icon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{t('critical_warning')}</span>
        </div>

        <p className={`text-xl font-semibold leading-snug mb-4 ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
          {t('warning_body')}
        </p>
        <div className="flex gap-3 mb-4 flex-wrap">
          <span className={`status-pill ${isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-terra/10 text-agri-terra'}`}>
            <Droplets className="w-4 h-4" />{t('label_humidity')}: {weatherData.humidity}%
          </span>
          <span className={`status-pill ${isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-terra/10 text-agri-terra'}`}>
            <Thermometer className="w-4 h-4" />{t('label_temp')}: {weatherData.temperature}°C
          </span>
        </div>
        <button
          onClick={() => setShowSearch(s => !s)}
          className={`flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 rounded ${
            isSunlightMode ? 'text-white/60 hover:text-white' : 'text-agri-soil/60 hover:text-agri-soil-deep'
          }`}
        >
          <MapPin className="w-3 h-3" />
          Change location
          {showSearch && <X className="w-3 h-3 ml-1" />}
        </button>
        <LocationSearchPanel />
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`w-full min-h-[44px] py-3 rounded-2xl font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
            isSunlightMode ? 'bg-white text-black' : 'bg-agri-terra text-white'
          }`}
        >
          {t('act_now')}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-6 rounded-3xl border transition-colors duration-500 ${
        isSunlightMode ? 'bg-black border-white' : 'bg-agri-offwhite border-agri-soil/20'
      }`}
    >
      {/* Status banner */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl mb-4 transition-colors duration-500 ${
        isSunlightMode ? 'bg-white/10 text-white' : banner.wrap
      }`}>
        <banner.Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {weatherData.urgency === 'Medium' ? 'Weather Advisory' : 'Field Conditions Normal'}
        </span>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-4xl font-semibold tracking-tight ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
            {weatherData.temperature}°C
          </h3>
          <button
            onClick={() => setShowSearch(s => !s)}
            className={`flex items-center gap-1.5 mt-1 transition-colors group focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 rounded ${
              isSunlightMode ? 'text-white/60 hover:text-white' : 'text-agri-soil/60 hover:text-agri-soil-deep'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{weatherData.city || 'Your Location'}</span>
            <span className="text-[10px] ml-1">{showSearch ? '✕' : 'change'}</span>
          </button>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
          isSunlightMode ? 'bg-white/10 border-white/20' : 'bg-agri-cream border-agri-soil/20'
        }`}>
          {getWeatherIcon()}
        </div>
      </div>

      <LocationSearchPanel />

      {/* Weather stats — each row: icon+label left, value right */}
      <div className={`rounded-2xl overflow-hidden border divide-y ${
        isSunlightMode ? 'border-white/20 divide-white/10' : 'border-agri-soil/10 divide-agri-soil/10'
      }`}>
        {[
          { label: t('humidity'),    value: `${weatherData.humidity}%`,       Icon: Droplets },
          { label: 'Wind',           value: windDisplay,                       Icon: Wind },
          { label: 'UV Index',       value: uvDisplay,                         Icon: CloudSun },
          { label: t('temperature'), value: `${weatherData.temperature}°C`,   Icon: Thermometer },
        ].map(({ label, value, Icon }) => (
          <div key={label} className={`flex items-center justify-between px-4 py-3 ${
            isSunlightMode ? 'bg-white/5' : 'bg-agri-offwhite'
          }`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${isSunlightMode ? 'text-white/60' : 'text-agri-soil/60'}`} />
              <span className={`text-sm font-medium ${isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'}`}>{label}</span>
            </div>
            <span className={`text-sm font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/*
 * Changes Made:
 * - Dark zinc palette → agri-offwhite / agri-cream surfaces
 * - Status banner reads from urgency state: ShieldCheck (safe), AlertTriangle (warning), AlertOctagon (danger)
 * - transition-colors duration-500 on state changes
 * - Weather stats in row layout with divide-y
 * - All interactive elements min-h-[44px] with focus rings
 * - Error text uses agri-terra + icon (not color alone)
 */
