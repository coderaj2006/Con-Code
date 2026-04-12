import { useState, FC, useRef } from 'react';
import { User, Sun, Moon, Languages, MapPin, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageBottomSheet } from './LanguageBottomSheet';
import { useTranslation } from '../context/TranslationContext';
import { useLocation } from '../context/LocationContext';
import { API_BASE as API_BASE_URL } from '../config';


interface HeaderProps {
  isSunlightMode: boolean;
  setIsSunlightMode: (val: boolean) => void;
}

export const Header: FC<HeaderProps> = ({ isSunlightMode, setIsSunlightMode }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [citySearchError, setCitySearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { availableLanguages, currentLanguage } = useTranslation();
  const { coords, isLocating, requestGPS, setManualCity } = useLocation();

  const selectedLang = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];

  const locationLabel = coords.city
    ? coords.city
    : coords.source === 'gps'
    ? `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`
    : 'Set Location';

  const handleCitySearch = async () => {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    setCitySearchError('');
    try {
      const res = await fetch(`${API_BASE_URL}/weather-by-city?city=${encodeURIComponent(cityInput.trim())}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      // Fallback: store city name only, lat/lon from weather-by-city isn't returned
      // So we call our own backend endpoint that returns weather; store city name + trigger re-fetch via context
      setManualCity(data.city || cityInput.trim(), coords.lat, coords.lon);
      // Trigger a proper geocode via backend
      const geocodeRes = await fetch(`${API_BASE_URL}/geocode?city=${encodeURIComponent(cityInput.trim())}`);
      if (geocodeRes.ok) {
        const geo = await geocodeRes.json();
        setManualCity(geo.city, geo.lat, geo.lon);
      } else {
        setManualCity(data.city || cityInput.trim(), coords.lat, coords.lon);
      }
      setCityInput('');
      setShowLocationPanel(false);
    } catch {
      setCitySearchError('City not found. Try another name.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGPS = () => {
    requestGPS();
    setShowLocationPanel(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-emerald-800 text-white shadow-lg transition-all">
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Logo + Location */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-black text-white tracking-tight leading-none">KISAAN AI</h1>
            {/* Location pill */}
            <button
              onClick={() => { setShowLocationPanel(s => !s); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="flex items-center gap-1 text-[10px] font-bold text-white/70 tracking-widest uppercase hover:text-white transition-colors"
            >
              {isLocating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <MapPin className="w-3 h-3 text-neon-agri" />
              }
              <span className="max-w-[120px] truncate">{isLocating ? 'Locating…' : locationLabel}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* GPS Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGPS}
            title="Use my GPS location"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-emerald-700/50 border border-white/10 transition-all active:bg-emerald-600"
          >
            {isLocating
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Navigation className={`w-5 h-5 ${coords.source === 'gps' ? 'text-neon-agri' : 'text-white'}`} />
            }
          </motion.button>

          {/* Language Switcher */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLangOpen(true)}
            className="flex items-center gap-2 bg-emerald-700/50 hover:bg-emerald-700 px-4 py-2.5 rounded-2xl border border-white/10 transition-all shadow-md active:shadow-inner"
          >
            <span className="text-xs font-black uppercase tracking-wider">{selectedLang.native.split(' ')[0]}</span>
            <div className="w-1 h-1 rounded-full bg-neon-agri animate-pulse" />
          </motion.button>

          {/* Sunlight Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSunlightMode(!isSunlightMode)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-emerald-700/50 border border-white/10 transition-all active:bg-emerald-600"
          >
            {isSunlightMode ? <Sun className="w-5 h-5 text-neon-agri" /> : <Moon className="w-5 h-5 text-white" />}
          </motion.button>

          {/* Profile */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-md active:scale-95"
          >
            <User className="w-6 h-6 text-emerald-900" />
          </motion.button>
        </div>
      </div>

      {/* Location Panel */}
      <AnimatePresence>
        {showLocationPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-emerald-900/80 backdrop-blur-sm"
          >
            <div className="px-4 py-3 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Enter city manually</p>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                  placeholder="e.g. Pune, Ludhiana, Nagpur…"
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-bold bg-white/10 text-white placeholder-white/30 border border-white/20 outline-none focus:border-neon-agri"
                />
                <button
                  onClick={handleCitySearch}
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-neon-agri text-black font-black text-sm disabled:opacity-50"
                >
                  {isSearching ? '…' : 'Go'}
                </button>
              </div>
              {citySearchError && <p className="text-red-400 text-xs font-bold">{citySearchError}</p>}
              <button
                onClick={handleGPS}
                className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" /> Use my GPS location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LanguageBottomSheet isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </header>
  );
};
