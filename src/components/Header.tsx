import { useState, FC } from 'react';
import { User, Sun, Moon, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanguageBottomSheet } from './LanguageBottomSheet';
import { useTranslation } from '../context/TranslationContext';

interface HeaderProps {
  isSunlightMode: boolean;
  setIsSunlightMode: (val: boolean) => void;
}

export const Header: FC<HeaderProps> = ({ 
  isSunlightMode,
  setIsSunlightMode
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { availableLanguages, currentLanguage } = useTranslation();

  const selectedLang = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];

  return (
    <header className="sticky top-0 z-50 bg-emerald-800 text-white shadow-lg px-4 py-3 flex justify-between items-center transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
          <Languages className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black text-white tracking-tight leading-none">KISAAN AI</h1>
          <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase opacity-80">Precision Agri-Tech</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Language Switcher Trigger */}
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
          {isSunlightMode ? <Sun className="w-5 h-5 text-neon-agri shadow-[0_0_10px_rgba(57,255,20,0.5)]" /> : <Moon className="w-5 h-5 text-white" />}
        </motion.button>

        {/* Profile */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-md active:scale-95"
        >
          <User className="w-6 h-6 text-emerald-900" />
        </motion.button>
      </div>

      <LanguageBottomSheet isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </header>
  );
};
