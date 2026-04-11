import { FC } from 'react';
import { Camera, Mic, ShoppingCart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/TranslationContext';

interface QuickActionsProps {
  onScan: () => void;
  onVoice: () => void;
  isSunlightMode?: boolean;
}

export const QuickActions: FC<QuickActionsProps> = ({ onScan, onVoice, isSunlightMode }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleComingSoon = (featureKey: string) => {
    showToast(`${t(featureKey)}: ${t('coming_soon')}`, 'info');
  };

  const actions = [
    { 
      id: 'scan',
      label: t('scan_plant'), 
      sub: 'AI Diagnosis',
      icon: Camera, 
      color: 'bg-emerald-600',
      action: onScan 
    },
    { 
      id: 'voice',
      label: t('voice_help'), 
      sub: 'Talk to AI',
      icon: Mic, 
      color: 'bg-amber-500',
      action: onVoice 
    },
    { 
      id: 'mandi',
      label: t('mandi_prices'), 
      sub: 'Live Rates',
      icon: ShoppingCart, 
      color: 'bg-blue-600',
      action: () => handleComingSoon('mandi_prices')
    },
    { 
      id: 'advisory',
      label: t('advisory'), 
      sub: 'Expert Tips',
      icon: Info, 
      color: 'bg-olive-600',
      action: () => handleComingSoon('advisory')
    },
  ];

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-6">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action}
            className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-xl text-white transition-all border-2 ${
              isSunlightMode 
                ? 'bg-black border-white' 
                : `${action.color} border-white/10`
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
              isSunlightMode ? 'bg-white text-black' : 'bg-white/20 border-white/20'
            }`}>
              <action.icon className="w-8 h-8" />
            </div>
            <span className={`text-sm font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : ''}`}>
              {action.label}
            </span>
            <span className={`text-[10px] font-bold uppercase opacity-60 mt-1 ${isSunlightMode ? 'text-white' : ''}`}>
              AI ASSISTANT
            </span>
          </motion.button>
        ))}
      </div>

      <style>{`
        .bg-olive-600 { background-color: #6B8E23; }
      `}</style>
    </div>
  );
};
