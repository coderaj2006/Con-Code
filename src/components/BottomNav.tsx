import { FC } from 'react';
import { Home, Grid, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  isSunlightMode?: boolean;
}

export const BottomNav: FC<BottomNavProps> = ({ isSunlightMode }) => {
  const tabs = [
    { label: 'Home', icon: Home, active: true },
    { label: 'Fields', icon: Grid, active: false },
    { label: 'Reports', icon: FileText, active: false },
    { label: 'Profile', icon: User, active: false },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-6 py-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t transition-all ${
      isSunlightMode ? 'bg-black border-white text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
    }`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.label}
          whileTap={{ scale: 0.9 }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            tab.active 
              ? (isSunlightMode ? 'text-neon-agri' : 'text-emerald-500') 
              : ''
          }`}
        >
          <tab.icon className={`w-6 h-6 ${tab.active ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            tab.active ? '' : 'text-zinc-600'
          }`}>
            {tab.label}
          </span>
          {tab.active && (
            <motion.div 
              layoutId="nav-active-pill"
              className={`w-1 h-1 rounded-full mt-0.5 ${isSunlightMode ? 'bg-neon-agri' : 'bg-emerald-500'}`} 
            />
          )}
        </motion.button>
      ))}
    </nav>
  );
};
