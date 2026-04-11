import { FC } from 'react';

interface SkeletonCardProps {
  type?: 'weather' | 'status' | 'history' | 'action';
  isSunlightMode?: boolean;
}

export const SkeletonCard: FC<SkeletonCardProps> = ({ type = 'status', isSunlightMode }) => {
  return (
    <div className={`w-full animate-pulse card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Pulsing Circle for Icon */}
        <div className={`w-12 h-12 rounded-2xl overflow-hidden relative ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}>
          <div className="absolute inset-0 skeleton"></div>
        </div>

        <div className="flex-grow space-y-2">
          {/* Thin Pulsing Line for Label */}
          <div className={`h-3 w-20 rounded-full skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
          
          <div className="flex items-baseline gap-2">
            {/* Thicker Pulsing Line for Main Text */}
            <div className={`h-6 w-24 rounded-full skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
          </div>
        </div>
      </div>

      {type === 'history' && (
        <div className={`mt-4 pt-4 border-t space-y-3 ${isSunlightMode ? 'border-white' : 'border-zinc-800'}`}>
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className={`h-8 w-8 rounded-lg skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
                <div className="space-y-1">
                  <div className={`h-3 w-24 rounded-full skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
                  <div className={`h-2 w-16 rounded-full skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
                </div>
              </div>
              <div className={`h-4 w-4 rounded-full skeleton ${isSunlightMode ? 'bg-white' : 'bg-zinc-800'}`}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
