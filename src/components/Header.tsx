// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { useState, FC, useRef } from 'react';
import { Leaf, Sun, Moon, Languages, MapPin, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageBottomSheet } from './LanguageBottomSheet';
import { useTranslation } from '../context/TranslationContext';
import { useLocation } from '../context/LocationContext';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8002';

interface HeaderProps {
  isSunlightMode: boolean;
  setIsSunlightMode: (val: boolean) => void;
}

export const Header: FC<HeaderProps> = ({ isSunlightMode, setIsSunlightMode }) => {
  /* INJECT LOGIC HERE — DO NOT REMOVE */
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
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityInput.trim())}&limit=1&appid=`
      );
      setManualCity(data.city || cityInput.trim(), coords.lat, coords.lon);
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
  /* END LOGIC */

  return (
    <header className={`sticky top-0 z-50 transition-all ${
      isSunlightMode
        ? 'bg-black border-b-2 border-white text-white'
        : 'bg-agri-green text-agri-cream border-b border-agri-green/80'
    }`}>
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Logo + Location */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
            isSunlightMode ? 'bg-white/10 border-white/30' : 'bg-agri-cream/20 border-agri-cream/20'
          }`}>
            <Leaf className={`w-6 h-6 ${isSunlightMode ? 'text-white' : 'text-agri-cream'}`} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-xl font-semibold tracking-tight leading-none ${
              isSunlightMode ? 'text-white' : 'text-agri-cream'
            }`}>KISAAN AI</h1>
            <button
              onClick={() => { setShowLocationPanel(s => !s); setTimeout(() => inputRef.current?.focus(), 100); }}
              aria-label="Change location"
              title="Change location"
              className={`flex items-center gap-1 text-xs font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-agri-cream/50 focus:ring-offset-1 rounded ${
                isSunlightMode ? 'text-white/70 hover:text-white' : 'text-agri-cream/70 hover:text-agri-cream'
              }`}
            >
              {isLocating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <MapPin className="w-3 h-3" />
              }
              <span className="max-w-[120px] truncate">{isLocating ? 'Locating…' : locationLabel}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGPS}
            title="Use my GPS location"
            aria-label="Use my GPS location"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-agri-cream/50 focus:ring-offset-2 ${
              isSunlightMode
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-agri-cream/10 border-agri-cream/20 text-agri-cream'
            }`}
          >
            {isLocating
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Navigation className="w-5 h-5" />
            }
          </motion.button>

          {/* Language Switcher */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLangOpen(true)}
            aria-label="Change language"
            title="Change language"
            className={`flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-agri-cream/50 focus:ring-offset-2 ${
              isSunlightMode
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-agri-cream/10 border-agri-cream/20 text-agri-cream'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span className="text-xs font-medium">{selectedLang.native.split(' ')[0]}</span>
          </motion.button>

          {/* Sunlight Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSunlightMode(!isSunlightMode)}
            aria-label={isSunlightMode ? 'Disable sunlight mode' : 'Enable sunlight mode'}
            title={isSunlightMode ? 'Disable sunlight mode' : 'Enable sunlight mode'}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-agri-cream/50 focus:ring-offset-2 ${
              isSunlightMode
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-agri-cream/10 border-agri-cream/20 text-agri-cream'
            }`}
          >
            {isSunlightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
            className={`overflow-hidden border-t ${
              isSunlightMode ? 'border-white/20 bg-black' : 'border-agri-cream/20 bg-agri-green/90 backdrop-blur-sm'
            }`}
          >
            <div className="px-4 py-3 space-y-2">
              <p className={`text-xs font-medium uppercase tracking-widest ${
                isSunlightMode ? 'text-white/50' : 'text-agri-cream/60'
              }`}>Enter city manually</p>
              <div className="flex gap-2">
                <label htmlFor="city-search-input" className="sr-only">City name</label>
                <input
                  id="city-search-input"
                  ref={inputRef}
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                  placeholder="e.g. Pune, Ludhiana, Nagpur…"
                  className={`flex-1 px-3 py-2 min-h-[44px] rounded-xl text-sm font-medium border outline-none focus:outline-none focus:ring-2 focus:ring-agri-cream/50 focus:ring-offset-1 ${
                    isSunlightMode
                      ? 'bg-white/10 text-white placeholder-white/30 border-white/20'
                      : 'bg-agri-cream/10 text-agri-cream placeholder-agri-cream/30 border-agri-cream/20'
                  }`}
                />
                <button
                  onClick={handleCitySearch}
                  disabled={isSearching}
                  className={`px-4 py-2 min-h-[44px] rounded-xl font-semibold text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-agri-cream/50 ${
                    isSunlightMode ? 'bg-white text-black' : 'bg-agri-cream text-agri-soil-deep'
                  }`}
                >
                  {isSearching ? '…' : 'Go'}
                </button>
              </div>
              {citySearchError && <p className="text-agri-terra text-xs font-medium">{citySearchError}</p>}
              <button
                onClick={handleGPS}
                className={`flex items-center gap-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-agri-cream/50 rounded ${
                  isSunlightMode ? 'text-white/60 hover:text-white' : 'text-agri-cream/60 hover:text-agri-cream'
                }`}
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

/*
 * Changes Made:
 * - bg-emerald-800 → bg-agri-green
 * - Text colors → agri-cream on green bg
 * - User icon removed, replaced with Leaf icon
 * - All buttons min-h-[44px] min-w-[44px] with focus rings
 * - Location panel restyled to cream/soil palette
 */
