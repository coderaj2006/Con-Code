import { useRef, useState, useEffect, FC, ChangeEvent } from 'react';
import { Camera, Mic } from 'lucide-react';
import { analyzeCrop, fileToBase64 } from '../services/api';
import { ChatMessage } from '../App';

interface HeroActionsProps {
  selectedLanguage: { code: string; name: string };
  isAnalysing: boolean;
  setIsAnalysing: (val: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  onVoiceHelp: () => void;
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
  onVoiceHelp
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
      const base64 = await fileToBase64(file);
      const result = await analyzeCrop(base64, selectedLanguage.name);
      
      addChatMessage({
        role: 'ai',
        type: 'analysis',
        content: result.description,
        data: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (error) {
      console.error(error);
      addChatMessage({
        role: 'ai',
        type: 'text',
        content: 'Sorry, I failed to analyze the image. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsAnalysing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="px-4 py-6 grid grid-cols-2 gap-4">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />

      <button 
        onClick={handleScanClick}
        disabled={isAnalysing}
        className={`flex flex-col items-center justify-center bg-agri-green text-white rounded-[2.5rem] p-6 shadow-agri-lg btn-press aspect-square relative group overflow-hidden ${isAnalysing ? 'opacity-90' : ''}`}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4 border border-white/20">
          {isAnalysing ? (
            <div className="spinner"></div>
          ) : (
            <Camera className="w-10 h-10" />
          )}
        </div>
        <span className="text-xl font-black uppercase tracking-wider text-center line-clamp-2">
          {isAnalysing ? 'Analysing' : 'Scan Plant'}
        </span>
        <span className="text-[0.65rem] opacity-70 mt-1 font-medium italic text-center px-2">
          {isAnalysing ? TIPS[tipIndex] : 'Detect Pests & Health'}
        </span>
      </button>

      <button 
        onClick={onVoiceHelp}
        className="flex flex-col items-center justify-center bg-agri-amber text-agri-green-dark rounded-[2.5rem] p-6 shadow-agri-lg btn-press aspect-square relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity"></div>
        <div className="w-16 h-16 bg-white/40 rounded-3xl flex items-center justify-center mb-4 border border-white/40">
          <Mic className="w-10 h-10" />
        </div>
        <span className="text-xl font-black uppercase tracking-wider text-agri-green leading-none text-center">Voice Help</span>
        <span className="text-[0.65rem] text-agri-green opacity-70 mt-1 font-medium italic text-center px-2">Talk to Advisor</span>
      </button>
    </div>
  );
};
