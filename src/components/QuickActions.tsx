import { FC, useRef, useState, ChangeEvent } from 'react';
import { Camera, Mic, ShoppingCart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/TranslationContext';
import { useAuth } from '../context/AuthContext';
import { analyzeCrop } from '../services/api';
import { OrchestratorResponse, AgentState } from './DiagnosisDisplay';
import { MandiChatOverlay } from './MandiChatOverlay';
import { ExpertChatOverlay } from './ExpertChatOverlay';

interface QuickActionsProps {
  onScanClick?: () => void;
  onVoice: () => void;
  isSunlightMode?: boolean;
  setDiagnosisResult: (result: OrchestratorResponse | null) => void;
}

export const QuickActions: FC<QuickActionsProps> = ({ onScanClick, onVoice, isSunlightMode, setDiagnosisResult }) => {
  const { showToast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMandiOpen, setIsMandiOpen] = useState(false);
  const [isExpertOpen, setIsExpertOpen] = useState(false);

  const [agentState, setAgentState] = useState<AgentState>({
    phase: 'IDLE',
    is_thinking: false,
    progress_pct: 0,
  });

  const executeScan = () => {
    if (onScanClick) onScanClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 20 });
    setDiagnosisResult(null);

    const doScan = async (lat: number, lon: number) => {
      try {
        setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 60 });
        const result = await analyzeCrop(file, lat, lon, currentLanguage, getAuthHeaders());

        if (result.diagnosis_status === 'ERROR' || result.agent_state?.phase === 'ERROR') {
          const msg = result.payload?.diagnosis || 'Diagnosis failed. Please try again.';
          showToast(msg, 'error');
          setAgentState({ phase: 'ERROR', is_thinking: false, progress_pct: 0 });
          return;
        }

        setAgentState(result.agent_state);
        if (result.next_step === 'DISPLAY_RESULTS') setDiagnosisResult(result);
      } catch (err: any) {
        showToast(err?.message || 'Diagnosis failed. Please try again.', 'error');
        setAgentState({ phase: 'ERROR', is_thinking: false, progress_pct: 0 });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(
        pos => doScan(pos.coords.latitude, pos.coords.longitude),
        ()  => doScan(28.6139, 77.2090),
        { timeout: 10000, enableHighAccuracy: false },
      );
    } catch {
      doScan(28.6139, 77.2090);
    }
  };

  const actions = [
    {
      id: 'scan',
      label: agentState.is_thinking ? 'Analysing...' : t('scan_plant'),
      sub: 'AI Diagnosis',
      icon: Camera,
      color: 'bg-emerald-600',
      action: executeScan,
    },
    {
      id: 'voice',
      label: t('voice_help'),
      sub: 'Talk to AI',
      icon: Mic,
      color: 'bg-amber-500',
      action: onVoice,
    },
    {
      id: 'mandi',
      label: t('mandi_prices'),
      sub: 'Live Rates',
      icon: ShoppingCart,
      color: 'bg-blue-600',
      action: () => setIsMandiOpen(true),   // ← opens RAG chat
    },
    {
      id: 'advisory',
      label: t('advisory'),
      sub: 'Expert Tips',
      icon: Info,
      color: 'bg-olive-600',
      action: () => setIsExpertOpen(true),   // ← opens Expert Chat
    },
  ];

  return (
    <>
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
              } ${action.id === 'scan' && agentState.is_thinking ? 'opacity-90 cursor-not-allowed' : ''}`}
            >
              {action.id === 'scan' && agentState.is_thinking && (
                <div
                  className="absolute left-0 bottom-0 top-0 bg-black/20"
                  style={{ width: `${agentState.progress_pct}%`, transition: 'width 0.3s ease-in-out' }}
                />
              )}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border relative z-10 ${
                isSunlightMode ? 'bg-white text-black' : 'bg-white/20 border-white/20'
              }`}>
                {action.id === 'scan' && agentState.is_thinking ? (
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
        <style>{`.bg-olive-600 { background-color: #6B8E23; }`}</style>
      </div>

      <MandiChatOverlay
        isOpen={isMandiOpen}
        onClose={() => setIsMandiOpen(false)}
        isSunlightMode={isSunlightMode}
      />

      <ExpertChatOverlay
        isOpen={isExpertOpen}
        onClose={() => setIsExpertOpen(false)}
        isSunlightMode={isSunlightMode}
      />
    </>
  );
};
