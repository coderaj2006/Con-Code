// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC } from 'react';

interface SkeletonCardProps {
  type?: 'weather' | 'status' | 'history' | 'action';
  isSunlightMode?: boolean;
}

export const SkeletonCard: FC<SkeletonCardProps> = ({ type = 'status', isSunlightMode }) => {
  return (
    <div className={`w-full card-agri-dark ${isSunlightMode ? 'bg-black border-2 border-white' : ''}`}>
      {/* Shimmer progress bar at top */}
      <div className="shimmer-bar mb-5">
        <div className="shimmer-bar-inner" />
      </div>

      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
        <div className="flex-grow space-y-2">
          <div className={`h-3 w-20 rounded-full skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
          <div className={`h-6 w-28 rounded-full skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
        </div>
      </div>

      {type === 'history' && (
        <div className={`mt-4 pt-4 border-t space-y-3 ${isSunlightMode ? 'border-white/20' : 'border-agri-soil/10'}`}>
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className={`h-8 w-8 rounded-lg skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
                <div className="space-y-1">
                  <div className={`h-3 w-24 rounded-full skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
                  <div className={`h-2 w-16 rounded-full skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
                </div>
              </div>
              <div className={`h-4 w-4 rounded-full skeleton ${isSunlightMode ? 'bg-white/20' : ''}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/*
 * Changes Made:
 * - Added shimmer-bar at top (replaces "Loading..." text)
 * - Skeleton uses agri-soil tones via CSS class
 * - Border divider uses agri-soil/10
 */
