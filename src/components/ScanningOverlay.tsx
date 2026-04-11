import { FC, useRef, useEffect } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { motion } from 'framer-motion';

interface ScanningOverlayProps {
  isVisible: boolean;
  onCancel?: () => void;
  onUpload?: (file: File) => void;
}

export const ScanningOverlay: FC<ScanningOverlayProps> = ({ 
  isVisible, 
  onCancel,
  onUpload 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-agri-green/60 backdrop-blur-md animate-fade-in">
      {/* Cancel Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onCancel}
        className="absolute top-8 right-8 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all border border-white/20 z-10"
        aria-label={t('btn_cancel')}
      >
        <X className="w-6 h-6" />
      </motion.button>

      <div className="relative">
        {/* Scanner Ring */}
        <div className="w-32 h-32 rounded-3xl border-4 border-white/20 flex items-center justify-center relative overflow-hidden bg-white/10 shadow-2xl">
          <Camera className="w-16 h-16 text-white animate-pulse" />
          
          {/* Animated Scanner Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_2s_infinite_ease-in-out]"></div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-agri-amber/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-white/20 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="mt-8 text-center px-6">
        <h3 className="text-white text-2xl font-black uppercase tracking-widest animate-bounce">
          Scanning Plant...
        </h3>
        <p className="text-white/70 text-sm mt-2 font-medium italic mb-8">
          Gemini AI is identifying pests & disease
        </p>

        {/* Gallery Upload Button */}
        <div className="flex flex-col items-center gap-4">
          <input 
            type="file" 
            id="gallery-input"
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGalleryClick}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-emerald-400/50 bg-transparent text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-400/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            {t('btn_upload_gallery')}
          </motion.button>
        </div>
      </div>

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
