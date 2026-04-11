import { FC, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Leaf } from 'lucide-react';
import { cropService, CropData } from '../services/cropService';

interface MyCropsProps {
  isSunlightMode?: boolean;
}

export const MyCrops: FC<MyCropsProps> = ({ isSunlightMode }) => {
  const [crops, setCrops] = useState<CropData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    cropService.fetchMyCrops()
      .then(data => setCrops(data))
      .catch(err => console.error('Crop fetch error', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className={`card-agri-dark ${isSunlightMode ? 'bg-black border-4 border-white' : ''}`}>
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`}></span>
          My Crops
        </h2>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 skeleton rounded-xl" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 skeleton" />
                    <div className="h-3 w-16 skeleton" />
                  </div>
                </div>
                <div className="h-6 w-12 skeleton" />
              </div>
              <div className="h-2.5 w-full skeleton rounded-full" />
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
        <span className={`w-1.5 h-6 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`}></span>
        My Crops
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
                    {crop.name}
                  </p>
                  <p className={`text-[10px] font-bold uppercase ${isSunlightMode ? 'text-white/60' : 'text-zinc-500'}`}>
                    {crop.lastWatered} • {crop.health}
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

            {/* Progress Bar */}
            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isSunlightMode ? 'bg-white/20' : 'bg-zinc-800'}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${crop.growth}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isSunlightMode ? 'bg-neon-agri' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <button className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
        isSunlightMode ? 'bg-white text-black hover:bg-neon-agri' : 'bg-zinc-800 text-white hover:bg-zinc-700'
      }`}>
        View Detailed Progress
      </button>
    </div>
  );
};
