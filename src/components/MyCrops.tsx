import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Leaf } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { useAuth } from '../context/AuthContext';

interface MyCropsProps {
  isSunlightMode?: boolean;
}

const MOCK_CROPS = [
  { id: 'tomato',   growth: 72, lastWatered: '2 hours ago' },
  { id: 'wheat',    growth: 45, lastWatered: '1 day ago' },
  { id: 'potato',   growth: 88, lastWatered: 'Today' },
];

export const MyCrops: FC<MyCropsProps> = ({ isSunlightMode }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Put the user's primary crop first
  const crops = user?.crop
    ? [
        { id: user.crop.toLowerCase(), growth: 65, lastWatered: 'Today' },
        ...MOCK_CROPS.filter(c => c.id !== user.crop.toLowerCase()).slice(0, 2),
      ]
    : MOCK_CROPS;

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
      <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
        <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`} />
        {t('my_crops')}
      </h2>

      <div className="space-y-6">
        {crops.map((crop) => (
          <div key={crop.id} className="group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isSunlightMode ? 'bg-white text-black border-white' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'
                }`}>
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <p className={`font-black text-base uppercase tracking-tight ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
                    {crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}
                  </p>
                  <p className={`text-[10px] font-bold uppercase ${isSunlightMode ? 'text-white/60' : 'text-zinc-500'}`}>
                    {crop.lastWatered} • {t('status_good')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>
                  {crop.growth}%
                </span>
                <ChevronRight className={`w-5 h-5 ${isSunlightMode ? 'text-white' : 'text-zinc-600 group-hover:text-emerald-500 transition-colors'}`} />
              </div>
            </div>
            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isSunlightMode ? 'bg-white/20' : 'bg-zinc-800'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${crop.growth}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <button className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
        isSunlightMode ? 'bg-white text-black hover:bg-neon-agri' : 'bg-zinc-800 text-white hover:bg-zinc-700'
      }`}>
        {t('view_detailed_progress')}
      </button>
    </div>
  );
};
