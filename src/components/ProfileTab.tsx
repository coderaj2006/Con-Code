// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Sun, Globe, ChevronRight, LogOut, Shield, Smartphone } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { LanguageBottomSheet } from './LanguageBottomSheet';
import { useAuth } from '../context/AuthContext';

interface ProfileTabProps {
  isSunlightMode?: boolean;
  setIsSunlightMode?: (val: boolean) => void;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const ProfileTab: FC<ProfileTabProps> = ({ isSunlightMode, setIsSunlightMode }) => {
  const { currentLanguage, availableLanguages } = useTranslation();
  const { user, logout } = useAuth();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const selectedLang = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];
  /* END LOGIC */

  const Row = ({ icon: Icon, label, value, onClick, toggle, toggleVal }: any) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={label}
      className={`w-full flex items-center justify-between px-4 py-4 min-h-[44px] rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
        isSunlightMode
          ? 'bg-white/5 border-white/10 hover:border-white/30 text-white'
          : 'bg-agri-offwhite border-agri-soil/15 hover:border-agri-soil/30 text-agri-soil-deep'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isSunlightMode ? 'bg-white/10' : 'bg-agri-cream'
        }`}>
          <Icon className={`w-5 h-5 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
        </div>
        <span className={`text-base font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>{label}</span>
      </div>
      {toggle !== undefined ? (
        <div
          role="switch"
          aria-checked={toggleVal}
          onClick={e => { e.stopPropagation(); onClick?.(); }}
          className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
            toggleVal ? 'bg-agri-green' : (isSunlightMode ? 'bg-white/20' : 'bg-agri-soil/20')
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${toggleVal ? 'left-5' : 'left-0.5'}`} />
        </div>
      ) : value ? (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>{value}</span>
          <ChevronRight className={`w-5 h-5 ${isSunlightMode ? 'text-white/30' : 'text-agri-soil/40'}`} />
        </div>
      ) : (
        <ChevronRight className={`w-5 h-5 ${isSunlightMode ? 'text-white/30' : 'text-agri-soil/40'}`} />
      )}
    </motion.button>
  );

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-3 border-4 ${
          isSunlightMode ? 'bg-white border-[#39FF14]' : 'bg-agri-green border-agri-green-mid'
        }`}>
          <User className={`w-10 h-10 ${isSunlightMode ? 'text-black' : 'text-agri-cream'}`} />
        </div>
        <p className={`text-xl font-semibold tracking-tight ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
          {user?.name || 'Farmer'}
        </p>
        <p className={`text-sm font-medium ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
          {user?.crop || 'Kisaan AI Member'}
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <p className={`text-xs font-medium uppercase tracking-widest px-1 mb-2 ${
          isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'
        }`}>Preferences</p>
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
        <p className={`text-xs font-medium uppercase tracking-widest px-1 mb-2 ${
          isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'
        }`}>App Info</p>
        <Row icon={Smartphone} label="Version" value="1.0.0" onClick={() => {}} />
        <Row icon={Shield}     label="Privacy Policy"  onClick={() => {}} />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={logout}
        aria-label="Sign out"
        className={`w-full min-h-[44px] py-3 rounded-2xl text-base font-medium flex items-center justify-center gap-2 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-terra focus:ring-offset-2 ${
          isSunlightMode
            ? 'border-white text-white hover:bg-white/10'
            : 'border-agri-terra/30 text-agri-terra hover:bg-agri-terra/5'
        }`}
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </motion.button>

      <LanguageBottomSheet isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </div>
  );
};

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite / agri-cream surfaces
 * - Avatar bg-agri-green border-agri-green-mid
 * - Row items: text-base font-medium, min-h-[44px], focus rings
 * - Toggle: bg-agri-green when on, role="switch" aria-checked
 * - Sign out: agri-terra border, focus:ring-agri-terra
 */
