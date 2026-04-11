import { useRef, useState, useEffect, FC, ChangeEvent } from 'react';
import { Camera, Mic } from 'lucide-react';
import { analyzeCrop } from '../services/api';
import { ChatMessage } from '../App';
import { motion } from 'framer-motion';

interface HeroActionsProps {
  selectedLanguage: { code: string; name: string };
  isAnalysing: boolean;
  setIsAnalysing: (val: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  onVoiceHelp: () => void;
  isSunlightMode?: boolean;
}

const TIPS = [
  "AI is checking for 100+ pests...",
  "Did you know? Crop rotation prevents soil disease.",
  "Check leaves for yellow spots early morning.",
  "Healthy soil needs organic compost.",
];

export const HeroActions: FC<HeroActionsProps> = ({ 
  selectedLanguage, 
  isAnalysing, 
  setIsAnalysing, 
  addChatMessage,
  onVoiceHelp,
  isSunlightMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (isAnalysing) {
      interval = window.setInterval(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
      }, 3000);
    } else {
      setTipIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalysing]);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalysing(true);
    addChatMessage({
      role: 'user',
      type: 'analysis',
      content: 'Scanning crop image...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    try {
      // Get browser location or default to Delhi — silent fallback, no UI warning
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await processImage(file, latitude, longitude);
        },
        async (_error) => {
          // Silent fallback to Jaipur/Delhi defaults — no UI warning shown
          await processImage(file, 28.6139, 77.2090);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );

      const processImage = async (imgFile: File, lat: number, lon: number) => {
        const result = await analyzeCrop(imgFile, lat, lon, selectedLanguage.name);
        
        addChatMessage({
          role: 'ai',
          type: 'analysis',
          // Corrected: result.payload.diagnosis is the canonical diagnosis string in the Orchestrator schema
          content: result?.payload?.diagnosis ?? 'Scan complete. Check the diagnosis panel for full results.',
          data: result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setIsAnalysing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
    } catch (error) {
      console.error(error);
      addChatMessage({
        role: 'ai',
        type: 'text',
        content: 'Sorry, I failed to analyze the image. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-6"
    >
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />

      {/* Main Action: Scan Plant */}
      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleScanClick}
        disabled={isAnalysing}
        className={`col-span-2 flex flex-col items-center justify-center p-8 shadow-agri-lg relative group overflow-hidden ${
          isSunlightMode 
          ? 'bg-black border-4 border-white text-white rounded-[3rem]' 
          : 'bg-agri-green text-white rounded-[3rem] shadow-agri-glow'
        } ${isAnalysing ? 'opacity-90' : ''}`}
      >
        {!isSunlightMode && <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity"></div>}
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border ${
          isSunlightMode ? 'bg-white text-black border-white' : 'bg-white/20 border-white/20'
        }`}>
          {isAnalysing ? (
            <div className="spinner"></div>
          ) : (
            <Camera className="w-12 h-12" />
          )}
        </div>
        <span className={`text-2xl font-black uppercase tracking-wider text-center ${isSunlightMode ? 'text-neon-agri' : ''}`}>
          {isAnalysing ? 'Analysing' : 'Scan Plant'}
        </span>
        <span className={`text-xs mt-2 font-medium italic text-center px-4 ${isSunlightMode ? 'text-white' : 'opacity-70'}`}>
          {isAnalysing ? TIPS[tipIndex] : 'Detect Pests, Disease & Soil Health'}
        </span>
      </motion.button>

      {/* Secondary Action: Voice Help */}
      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onVoiceHelp}
        className={`col-span-2 flex items-center justify-center gap-6 p-6 shadow-agri-lg relative group overflow-hidden ${
          isSunlightMode 
          ? 'bg-black border-4 border-white text-white rounded-[2.5rem]' 
          : 'bg-agri-amber text-agri-green-dark rounded-[2.5rem]'
        }`}
      >
        {!isSunlightMode && <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity"></div>}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
          isSunlightMode ? 'bg-white text-black border-white' : 'bg-white/40 border-white/40'
        }`}>
          <Mic className="w-8 h-8" />
        </div>
        <div className="text-left">
          <span className={`text-xl font-black uppercase tracking-wider block ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`}>Voice Help</span>
          <span className={`text-xs font-medium italic ${isSunlightMode ? 'text-white' : 'text-agri-green/70'}`}>Talk to AI Expert</span>
        </div>
      </motion.button>
    </motion.div>
  );
};
