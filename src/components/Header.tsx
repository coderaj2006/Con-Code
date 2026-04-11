import { useState, FC } from 'react';
import { Globe, User, ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'hr', name: 'हरयाणवी (Haryanvi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
];

interface HeaderProps {
  selectedLanguage: { code: string; name: string };
  setSelectedLanguage: (lang: { code: string; name: string }) => void;
  isSunlightMode: boolean;
  setIsSunlightMode: (val: boolean) => void;
}

export const Header: FC<HeaderProps> = ({ 
  selectedLanguage, 
  setSelectedLanguage,
  isSunlightMode,
  setIsSunlightMode
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-emerald-800 text-white shadow-lg px-4 py-3 flex justify-between items-center transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
          <Globe className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black text-white tracking-tight leading-none">KISAAN AI</h1>
          <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Precision Agri-Tech</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Pill */}
        <div className="relative">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-emerald-700/50 hover:bg-emerald-700 px-4 py-2 rounded-full border border-white/10 transition-colors"
          >
            <span className="text-xs font-black uppercase tracking-wider">{selectedLanguage.name.split(' ')[0]}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-48 bg-emerald-900 border border-emerald-700 rounded-2xl shadow-2xl py-2 overflow-hidden z-50"
              >
                <div className="max-h-64 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setIsOpen(false);
                        document.documentElement.lang = lang.code;
                      }}
                      className={`w-full text-left px-5 py-3 hover:bg-white/10 transition-colors flex items-center justify-between ${selectedLanguage.code === lang.code ? 'text-neon-agri font-black' : 'text-white/80'}`}
                    >
                      <span className="text-sm">{lang.name}</span>
                      {selectedLanguage.code === lang.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sunlight Toggle */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSunlightMode(!isSunlightMode)}
          className="p-2.5 rounded-full bg-emerald-700/50 border border-white/10"
        >
          {isSunlightMode ? <Sun className="w-5 h-5 text-neon-agri" /> : <Moon className="w-5 h-5 text-white" />}
        </motion.button>

        {/* Profile */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-md"
        >
          <User className="w-6 h-6 text-emerald-900" />
        </motion.button>
      </div>
    </header>
  );
};
