import { FC } from 'react';
import { Home, Grid, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type NavTab = 'home' | 'fields' | 'reports' | 'profile';

interface BottomNavProps {
  isSunlightMode?: boolean;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export const BottomNav: FC<BottomNavProps> = ({ isSunlightMode, activeTab = 'home', onTabChange }) => {
  const tabs: { label: string; icon: any; id: NavTab }[] = [
    { label: 'Home',    icon: Home,     id: 'home' },
    { label: 'Fields',  icon: Grid,     id: 'fields' },
    { label: 'Reports', icon: FileText, id: 'reports' },
    { label: 'Profile', icon: User,     id: 'profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-6 py-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t transition-all ${
      isSunlightMode ? 'bg-black border-white text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
    }`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onTabChange?.(tab.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive
                ? (isSunlightMode ? 'text-neon-agri' : 'text-emerald-500')
                : (isSunlightMode ? 'text-white/40' : 'text-zinc-600')
            }`}
          >
            <tab.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                className={`w-1 h-1 rounded-full mt-0.5 ${isSunlightMode ? 'bg-neon-agri' : 'bg-emerald-500'}`}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};
