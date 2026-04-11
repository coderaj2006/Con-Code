import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Sun, Globe, ChevronRight, LogOut, Shield, Smartphone } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { LanguageBottomSheet } from './LanguageBottomSheet';

interface ProfileTabProps {
  isSunlightMode?: boolean;
  setIsSunlightMode?: (val: boolean) => void;
}

export const ProfileTab: FC<ProfileTabProps> = ({ isSunlightMode, setIsSunlightMode }) => {
  const { currentLanguage, availableLanguages } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const selectedLang = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];

  const Row = ({ icon: Icon, label, value, onClick, toggle, toggleVal }: any) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
        isSunlightMode ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSunlightMode ? 'bg-white/10' : 'bg-zinc-700'}`}>
          <Icon className={`w-4.5 h-4.5 ${isSunlightMode ? 'text-neon-agri' : 'text-emerald-400'}`} />
        </div>
        <span className={`text-sm font-black uppercase tracking-wide ${isSunlightMode ? 'text-white' : 'text-white'}`}>{label}</span>
      </div>
      {toggle !== undefined ? (
        <div
          onClick={e => { e.stopPropagation(); onClick?.(); }}
          className={`w-11 h-6 rounded-full transition-all relative ${toggleVal ? 'bg-emerald-500' : (isSunlightMode ? 'bg-white/20' : 'bg-zinc-600')}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleVal ? 'left-5' : 'left-0.5'}`} />
        </div>
      ) : value ? (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase ${isSunlightMode ? 'text-white/50' : 'text-zinc-500'}`}>{value}</span>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        </div>
      ) : (
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      )}
    </motion.button>
  );

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-3 border-4 ${
          isSunlightMode ? 'bg-white border-neon-agri' : 'bg-yellow-400 border-white/20'
        }`}>
          <User className={`w-10 h-10 ${isSunlightMode ? 'text-black' : 'text-emerald-900'}`} />
        </div>
        <p className={`font-black text-lg uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
          Farmer Profile
        </p>
        <p className="text-xs font-bold uppercase text-zinc-500">Kisaan AI Member</p>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <p className={`text-[10px] font-black uppercase tracking-widest px-1 mb-2 ${isSunlightMode ? 'text-white/40' : 'text-zinc-600'}`}>
          Preferences
        </p>
        <Row
          icon={Globe}
          label="Language"
          value={selectedLang.native.split(' ')[0]}
          onClick={() => setIsLangOpen(true)}
        />
        <Row
          icon={Sun}
          label="Sunlight Mode"
          toggle
          toggleVal={isSunlightMode}
          onClick={() => setIsSunlightMode?.(!isSunlightMode)}
        />
        <Row
          icon={Bell}
          label="Notifications"
          toggle
          toggleVal={notificationsOn}
          onClick={() => setNotificationsOn(v => !v)}
        />
      </div>

      <div className="space-y-2">
        <p className={`text-[10px] font-black uppercase tracking-widest px-1 mb-2 ${isSunlightMode ? 'text-white/40' : 'text-zinc-600'}`}>
          App Info
        </p>
        <Row icon={Smartphone} label="Version" value="1.0.0" onClick={() => {}} />
        <Row icon={Shield}     label="Privacy Policy"  onClick={() => {}} />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border-2 ${
          isSunlightMode ? 'border-white text-white hover:bg-white/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
        }`}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </motion.button>

      <LanguageBottomSheet isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </div>
  );
};
