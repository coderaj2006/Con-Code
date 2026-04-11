import { FC, useRef, useState, ChangeEvent } from 'react';
import { Camera, Mic, ShoppingCart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/TranslationContext';
import { analyzeCrop } from '../services/api';
import { OrchestratorResponse, AgentState } from './DiagnosisDisplay';

interface QuickActionsProps {
  onScanClick?: () => void;
  onVoice: () => void;
  isSunlightMode?: boolean;
  setDiagnosisResult: (result: OrchestratorResponse | null) => void;
}

export const QuickActions: FC<QuickActionsProps> = ({ onScanClick, onVoice, isSunlightMode, setDiagnosisResult }) => {
  const { showToast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [agentState, setAgentState] = useState<AgentState>({
    phase: 'IDLE',
    is_thinking: false,
    progress_pct: 0
  });

  const handleComingSoon = (featureKey: string) => {
    showToast(`${t(featureKey)}: ${t('coming_soon')}`, 'info');
  };

  const executeScan = () => {
    if (onScanClick) onScanClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 20 });
    setDiagnosisResult(null);

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await processScanRound(file, position.coords.latitude, position.coords.longitude);
        },
        async (_error) => {
          // Silent fallback to Jaipur/Delhi defaults — no UI warning shown
          await processScanRound(file, 28.6139, 77.2090);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } catch (e) {
      handleScanError();
    }
  };

  const processScanRound = async (file: File, lat: number, lon: number) => {
    try {
      setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 60 });
      // Call our actual orchestrator api
      const result = await analyzeCrop(file, lat, lon, currentLanguage);
      
      setAgentState(result.agent_state);
      
      if (result.next_step === 'DISPLAY_RESULTS') {
        setDiagnosisResult(result);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
       handleScanError();
    }
  };

  const handleScanError = () => {
    const errorResponse: OrchestratorResponse = {
      agent_state: { phase: 'ERROR', is_thinking: false, progress_pct: 0 },
      payload: {
        diagnosis: "Unable to process request based on RAG context. Please retry scan.",
        confidence_score: 0.0,
        sources: []
      },
      diagnosis_status: "ERROR",
      rag_entities: [],
      next_step: "WAIT_FOR_DATA"
    };
    setAgentState(errorResponse.agent_state);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Scan Error", "error");
  };

  const actions = [
    { 
      id: 'scan',
      label: agentState.is_thinking ? 'Analysing...' : t('scan_plant'), 
      sub: 'AI Diagnosis',
      icon: Camera, 
      color: 'bg-emerald-600',
      action: executeScan 
    },
    { 
      id: 'voice',
      label: t('voice_help'), 
      sub: 'Talk to AI',
      icon: Mic, 
      color: 'bg-amber-500',
      action: onVoice 
    },
    { 
      id: 'mandi',
      label: t('mandi_prices'), 
      sub: 'Live Rates',
      icon: ShoppingCart, 
      color: 'bg-blue-600',
      action: () => handleComingSoon('mandi_prices')
    },
    { 
      id: 'advisory',
      label: t('advisory'), 
      sub: 'Expert Tips',
      icon: Info, 
      color: 'bg-olive-600',
      action: () => handleComingSoon('advisory')
    },
  ];

  return (
    <div className="relative">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      <div className="grid grid-cols-2 gap-6">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action}
            disabled={action.id === 'scan' && agentState.is_thinking}
            className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-xl text-white transition-all border-2 relative overflow-hidden ${
              isSunlightMode 
                ? 'bg-black border-white' 
                : `${action.color} border-white/10`
            } ${(action.id === 'scan' && agentState.is_thinking) ? 'opacity-90 cursor-not-allowed' : ''}`}
          >
            {(action.id === 'scan' && agentState.is_thinking) && (
              <div 
                className="absolute left-0 bottom-0 top-0 bg-black/20"
                style={{ width: `${agentState.progress_pct}%`, transition: 'width 0.3s ease-in-out' }}
              />
            )}
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border relative z-10 ${
              isSunlightMode ? 'bg-white text-black' : 'bg-white/20 border-white/20'
            }`}>
              {(action.id === 'scan' && agentState.is_thinking) ? (
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                 <action.icon className="w-8 h-8" />
              )}
            </div>
            <span className={`text-sm font-black uppercase tracking-widest relative z-10 ${isSunlightMode ? 'text-neon-agri' : ''}`}>
              {action.label}
            </span>
            <span className={`text-[10px] font-bold uppercase opacity-60 mt-1 relative z-10 ${isSunlightMode ? 'text-white' : ''}`}>
              {action.id === 'scan' && agentState.is_thinking ? `${agentState.progress_pct}%` : 'AI ASSISTANT'}
            </span>
          </motion.button>
        ))}
      </div>

      <style>{`
        .bg-olive-600 { background-color: #6B8E23; }
      `}</style>
    </div>
  );
};
