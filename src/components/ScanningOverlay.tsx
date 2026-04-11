import { FC } from 'react';
import { Camera } from 'lucide-react';

interface ScanningOverlayProps {
  isVisible: boolean;
}

export const ScanningOverlay: FC<ScanningOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-agri-green/60 backdrop-blur-md animate-fade-in">
      <div className="relative">
        {/* Scanner Ring */}
        <div className="w-32 h-32 rounded-3xl border-4 border-white/20 flex items-center justify-center relative overflow-hidden bg-white/10 shadow-2xl">
          <Camera className="w-16 h-16 text-white animate-pulse" />
          
          {/* Animated Scanner Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
        </div>
        
        {/* Floating Particles/Bubbles for flair */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-agri-amber/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-white/20 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-white text-2xl font-black uppercase tracking-widest animate-bounce">
          Scanning Plant...
        </h3>
        <p className="text-white/70 text-sm mt-2 font-medium italic">
          Gemini AI is identifying pests & disease
        </p>
      </div>

      {/* Inline styles for the scan animation since it's specific to this component */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(128px); }
          100% { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
