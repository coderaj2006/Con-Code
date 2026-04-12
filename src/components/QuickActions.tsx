import { FC, useRef, useState, ChangeEvent } from 'react';
import { Camera, Mic, ShoppingCart, Info, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isMandiOpen, setIsMandiOpen] = useState(false);
  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);

  const [agentState, setAgentState] = useState<AgentState>({
    phase: 'IDLE',
    is_thinking: false,
    progress_pct: 0,
  });

  const executeScan = () => {
    if (onScanClick) onScanClick();
    setShowScanOptions(true);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowScanOptions(false);
    setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 20 });
    setDiagnosisResult(null);

    const doScan = async (lat: number, lon: number) => {
      try {
        setAgentState({ phase: 'ANALYZING', is_thinking: true, progress_pct: 60 });
        const result = await analyzeCrop(file, lat, lon, currentLanguage, getAuthHeaders());

        const status = result.diagnosis_status;
        if (status === 'ERROR' || status === 'RESCAN_REQUIRED' || result.agent_state?.phase === 'ERROR') {
          const msg = result.payload?.diagnosis || 'Image not clear, please re-scan.';
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
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
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
      action: () => setIsMandiOpen(true),
    },
    {
      id: 'advisory',
      label: t('advisory'),
      sub: 'Expert Tips',
      icon: Info,
      color: 'bg-olive-600',
      action: () => setIsExpertOpen(true),
    },
  ];

  return (
    <>
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileChange}
      />

      {/* Full-screen loading overlay */}
      <AnimatePresence>
        {agentState.is_thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={`rounded-[2.5rem] p-8 flex flex-col items-center gap-5 shadow-2xl border-2 ${
                isSunlightMode ? 'bg-black border-white' : 'bg-white border-agri-green/20'
              }`}
            >
              <Loader2 className="w-14 h-14 animate-spin text-agri-green" />
              <div className="text-center">
                <p className={`text-base font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`}>
                  Analysing Crop
                </p>
                <p className={`text-xs mt-1 ${isSunlightMode ? 'text-white/60' : 'text-gray-400'}`}>
                  Dr. Kisaan AI is scanning your plant…
                </p>
              </div>
              {/* Progress bar */}
              <div className={`w-48 h-2 rounded-full ${isSunlightMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                <motion.div
                  animate={{ width: `${agentState.progress_pct}%` }}
                  transition={{ ease: 'easeInOut', duration: 0.4 }}
                  className={`h-2 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`}
                />
              </div>
              <span className={`text-xs font-bold ${isSunlightMode ? 'text-white/50' : 'text-gray-400'}`}>
                {agentState.progress_pct}%
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera / Gallery bottom sheet */}
      <AnimatePresence>
        {showScanOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/50"
            onClick={() => setShowScanOptions(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-md rounded-t-[2.5rem] p-6 pb-10 shadow-2xl border-t-2 ${
                isSunlightMode ? 'bg-black border-white' : 'bg-white border-agri-green/20'
              }`}
            >
              <div className={`w-10 h-1 rounded-full mx-auto mb-6 ${isSunlightMode ? 'bg-white/30' : 'bg-gray-200'}`} />
              <p className={`text-xs font-black uppercase tracking-widest text-center mb-5 ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`}>
                Choose Image Source
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setShowScanOptions(false); cameraInputRef.current?.click(); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all active:scale-95 ${
                    isSunlightMode ? 'bg-white/5 border-white/20 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-wider">Camera</span>
                </button>
                <button
                  onClick={() => { setShowScanOptions(false); galleryInputRef.current?.click(); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all active:scale-95 ${
                    isSunlightMode ? 'bg-white/5 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-wider">Gallery</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
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
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border relative z-10 ${
                isSunlightMode ? 'bg-white text-black' : 'bg-white/20 border-white/20'
              }`}>
                <action.icon className="w-8 h-8" />
              </div>
              <span className={`text-sm font-black uppercase tracking-widest relative z-10 ${isSunlightMode ? 'text-neon-agri' : ''}`}>
                {action.label}
              </span>
              <span className={`text-[10px] font-bold uppercase opacity-60 mt-1 relative z-10 ${isSunlightMode ? 'text-white' : ''}`}>
                {action.sub}
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
