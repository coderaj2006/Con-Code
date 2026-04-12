// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Leaf } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { useAuth } from '../context/AuthContext';

interface MyCropsProps {
  isSunlightMode?: boolean;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
const MOCK_CROPS = [
  { id: 'tomato', growth: 72, lastWatered: '2 hours ago' },
  { id: 'wheat',  growth: 45, lastWatered: '1 day ago' },
  { id: 'potato', growth: 88, lastWatered: 'Today' },
];

export const MyCrops: FC<MyCropsProps> = ({ isSunlightMode }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const crops = user?.crop
    ? [
        { id: user.crop.toLowerCase(), growth: 65, lastWatered: 'Today' },
        ...MOCK_CROPS.filter(c => c.id !== user.crop.toLowerCase()).slice(0, 2),
      ]
    : MOCK_CROPS;
  /* END LOGIC */

  return (
    <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
      <h2 className={`text-lg font-medium mb-5 flex items-center gap-2 ${
        isSunlightMode ? 'text-white' : 'text-agri-soil-deep'
      }`}>
        <Leaf className={`w-5 h-5 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
        {t('my_crops')}
      </h2>

      <div className="space-y-5">
        {crops.map((crop) => (
          <div key={crop.id} className="group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isSunlightMode ? 'bg-white text-black border-white' : 'bg-agri-green/10 text-agri-green border-agri-green/20'
                }`}>
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-base font-medium ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                    {crop.id.charAt(0).toUpperCase() + crop.id.slice(1)}
                  </p>
                  <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
                    {crop.lastWatered} • {t('status_good')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-green'}`}>
                  {crop.growth}%
                </span>
                <ChevronRight className={`w-5 h-5 ${
                  isSunlightMode ? 'text-white/40' : 'text-agri-soil/40 group-hover:text-agri-green transition-colors'
                }`} />
              </div>
            </div>
            {/* Growth bar */}
            <div className={`h-2 w-full rounded-full overflow-hidden ${
              isSunlightMode ? 'bg-white/20' : 'bg-agri-soil/10'
            }`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${crop.growth}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${isSunlightMode ? 'bg-[#39FF14]' : 'bg-agri-green'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <button className={`w-full mt-6 min-h-[44px] py-3 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 border ${
        isSunlightMode
          ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          : 'bg-agri-cream text-agri-green border-agri-green/40 hover:bg-agri-green/10'
      }`}>
        {t('view_detailed_progress')}
      </button>
    </div>
  );
};

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite surface
 * - Crop name text-base font-medium, meta text-xs text-agri-soil/60
 * - Growth bar bg-agri-green
 * - CTA button: ghost style with border-agri-green/40 (secondary button spec)
 * - min-h-[44px] + focus ring on CTA
 */
