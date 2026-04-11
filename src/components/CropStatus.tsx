import { FC, useState, useEffect } from 'react';
import { Droplets, Thermometer, TestTube, Wind } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

interface CropStatusProps {
  isSunlightMode?: boolean;
}

export const CropStatus: FC<CropStatusProps> = ({ isSunlightMode }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  const vitals = [
    { label: t('humidity'), value: '85%', status: 'High', color: 'bg-red-500/20 text-red-500', icon: Wind },
    { label: t('temperature'), value: '32°C', status: 'Warm', color: 'bg-amber-500/20 text-amber-500', icon: Thermometer },
    { label: t('soil_ph'), value: '6.8', status: 'Good', color: 'bg-emerald-500/20 text-emerald-500', icon: TestTube },
    { label: t('moisture'), value: '42%', status: 'Good', color: 'bg-emerald-500/20 text-emerald-500', icon: Droplets },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/50">
          <span className="w-1.5 h-6 rounded-full bg-zinc-800 animate-pulse"></span>
          {t('live_field_status')}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 skeleton rounded-2xl" />
              <div className="h-3 w-12 skeleton" />
              <div className="h-5 w-8 skeleton" />
              <div className="h-6 w-full skeleton rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
      <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${
        isSunlightMode ? 'text-white' : 'text-white'
      }`}>
        <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-blue-500'}`}></span>
        {t('live_field_status')}
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {vitals.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
              isSunlightMode ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              <item.icon className="w-6 h-6" />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 text-center truncate w-full ${
              isSunlightMode ? 'text-white' : 'text-zinc-500'
            }`}>
              {item.label}
            </p>
            <p className={`text-base font-black mb-2 ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
              {item.value}
            </p>
            <div className={`status-pill w-full justify-center ${
              isSunlightMode ? 'bg-white text-black' : item.color
            }`}>
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
