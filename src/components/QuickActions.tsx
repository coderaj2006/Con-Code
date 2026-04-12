// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC, useRef, useState, ChangeEvent } from 'react';
import { ScanLine, Mic, TrendingUp, BookOpen } from 'lucide-react';
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

/* INJECT LOGIC HERE — DO NOT REMOVE */
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
  /* END LOGIC */

  const actions = [
    {
      id: 'scan',
      label: agentState.is_thinking ? 'Analysing…' : t('scan_plant'),
      sub: 'AI Diagnosis',
      Icon: ScanLine,
      action: executeScan,
    },
    {
      id: 'voice',
      label: t('voice_help'),
      sub: 'Talk to AI',
      Icon: Mic,
      action: onVoice,
    },
    {
      id: 'mandi',
      label: t('mandi_prices'),
      sub: 'Live Rates',
      Icon: TrendingUp,
      action: () => setIsMandiOpen(true),
    },
    {
      id: 'advisory',
      label: t('advisory'),
      sub: 'Expert Tips',
      Icon: BookOpen,
      action: () => setIsExpertOpen(true),
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

        {/* Zen Bento Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const isScanning = action.id === 'scan' && agentState.is_thinking;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.97 }}
                onClick={action.action}
                disabled={isScanning}
                aria-label={action.label}
                title={action.label}
                className={`relative overflow-hidden bg-agri-offwhite rounded-3xl p-5 flex flex-col gap-3 min-h-[160px] border cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 active:scale-[0.97] ${
                  isSunlightMode
                    ? 'bg-black border-white/30 text-white'
                    : 'border-agri-soil/20 text-agri-soil-deep'
                } ${isScanning ? 'opacity-90 cursor-not-allowed' : ''}`}
              >
                {/* Scan progress overlay */}
                {isScanning && (
                  <div
                    className="absolute left-0 bottom-0 top-0 bg-agri-green/10 transition-all duration-300"
                    style={{ width: `${agentState.progress_pct}%` }}
                  />
                )}

                {/* Icon — top left */}
                <div className="relative z-10">
                  {isScanning ? (
                    <div className="w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <action.Icon className={`w-8 h-8 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
                  )}
                </div>

                {/* Feature name */}
                <p className={`text-sm font-medium relative z-10 ${
                  isSunlightMode ? 'text-white/70' : 'text-agri-soil-deep/70'
                }`}>{action.sub}</p>

                {/* Primary value */}
                <p className={`text-xl font-semibold leading-tight relative z-10 ${
                  isSunlightMode ? 'text-white' : 'text-agri-soil-deep'
                }`}>
                  {isScanning ? `${agentState.progress_pct}%` : action.label}
                </p>

                {/* Loading shimmer bar */}
                {isScanning && (
                  <div className="shimmer-bar relative z-10">
                    <div className="shimmer-bar-inner" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
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

/*
 * Changes Made:
 * - Replaced Camera/ShoppingCart/Info icons with ScanLine/TrendingUp/BookOpen per spec
 * - Bento grid layout: grid-cols-2 gap-4, min-h-[160px], rounded-3xl
 * - bg-agri-offwhite surface, border-agri-soil/20
 * - Icon w-8 h-8 at top-left, feature name text-sm, primary label text-xl font-semibold
 * - Shimmer bar replaces spinner text during loading
 * - All buttons aria-label + focus rings
 */
