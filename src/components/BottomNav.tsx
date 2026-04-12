// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC } from 'react';
import { Home, Grid, FileText, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export type NavTab = 'home' | 'fields' | 'reports' | 'profile' | 'schemes';

interface BottomNavProps {
  isSunlightMode?: boolean;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const BottomNav: FC<BottomNavProps> = ({ isSunlightMode, activeTab = 'home', onTabChange }) => {
  const tabs: { label: string; icon: any; id: NavTab }[] = [
    { label: 'Home',    icon: Home,        id: 'home' },
    { label: 'Fields',  icon: Grid,        id: 'fields' },
    { label: 'Schemes', icon: ShieldCheck, id: 'schemes' },
    { label: 'Reports', icon: FileText,    id: 'reports' },
    { label: 'Profile', icon: User,        id: 'profile' },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-4 py-3 flex justify-between items-center border-t transition-all ${
        isSunlightMode
          ? 'bg-black border-white text-white'
          : 'bg-agri-offwhite border-agri-soil/20 text-agri-soil'
      }`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onTabChange?.(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 rounded-xl ${
              isActive
                ? (isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green')
                : (isSunlightMode ? 'text-white/40' : 'text-agri-soil/50')
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                className={`w-1 h-1 rounded-full ${isSunlightMode ? 'bg-[#39FF14]' : 'bg-agri-green'}`}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

/*
 * Changes Made:
 * - bg-zinc-950 → bg-agri-offwhite
 * - Active color → agri-green
 * - Inactive color → agri-soil/50
 * - Added aria-label, aria-current for accessibility
 * - min-h/min-w 44px touch targets
 * - Focus rings added
 */
