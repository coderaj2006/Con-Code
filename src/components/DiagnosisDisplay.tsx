// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import { FC } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// ─── Shared Types ────────────────────────────────────────────────────────────
export interface AgentState {
  phase: 'IDLE' | 'ANALYZING' | 'COMPLETE' | 'COMPLETED' | 'ERROR' | 'WAIT_FOR_DATA' | 'RESCAN_REQUIRED';
  is_thinking: boolean;
  progress_pct: number;
}

export interface DiagnosisPayload {
  disease_name?: string;
  diagnosis: string;
  confidence_score: number;
  sources: string[];
  organic_remedy?: string;
  chemical_remedy?: string;
  urgency_level?: 'High' | 'Medium' | 'Low';
}

export interface OrchestratorResponse {
  agent_state: AgentState;
  payload: DiagnosisPayload;
  diagnosis_status: string;
  rag_entities: string[];
  next_step: string;
  follow_up_question?: string | null;
  speech_url?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface DiagnosisDisplayProps {
  result: OrchestratorResponse;
  onClose: () => void;
  isSunlightMode?: boolean;
}

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const DiagnosisDisplay: FC<DiagnosisDisplayProps> = ({ result, onClose, isSunlightMode }) => {
  const { payload, agent_state } = result;
  const isError = result.diagnosis_status === 'ERROR'
    || result.diagnosis_status === 'NON_CROP'
    || result.diagnosis_status === 'RESCAN_REQUIRED';

  const urgencyBadge =
    payload.urgency_level === 'High'   ? 'bg-agri-terra/10 text-agri-terra border-agri-terra/30'
    : payload.urgency_level === 'Medium' ? 'bg-agri-amber/10 text-agri-amber border-agri-amber/30'
    : 'bg-agri-green/10 text-agri-green border-agri-green/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      className={`rounded-3xl overflow-hidden border mb-4 ${
        isSunlightMode ? 'bg-black border-white text-white' : 'bg-agri-offwhite border-agri-soil/20 text-agri-soil-deep'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${
        isSunlightMode ? 'border-white/20' : 'border-agri-soil/10'
      }`}>
        <div className="flex items-center gap-2">
          {agent_state.phase === 'ANALYZING' ? (
            <Loader2 className="w-5 h-5 animate-spin text-agri-green" />
          ) : isError ? (
            <AlertTriangle className="w-5 h-5 text-agri-terra" />
          ) : (
            <CheckCircle className={`w-5 h-5 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
          )}
          <div>
            <span className={`text-xs font-black uppercase tracking-widest ${
              isError ? 'text-agri-terra' : (isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green')
            }`}>
              {isError ? 'Scan Failed' : 'AI Diagnosis'}
            </span>
            {payload.disease_name && payload.disease_name !== 'N/A' && !isError && (
              <p className={`text-base font-black mt-0.5 leading-tight ${isSunlightMode ? 'text-white' : 'text-gray-900'}`}>
                {payload.disease_name}
              </p>
            )}
          </div>
          {payload.urgency_level && !isError && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${urgencyBadge}`}>
              {payload.urgency_level} Risk
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close diagnosis"
          title="Close diagnosis"
          className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
            isSunlightMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-agri-cream hover:bg-agri-soil/10 text-agri-soil-deep'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        <p className={`text-base leading-relaxed ${isSunlightMode ? 'text-white/80' : 'text-agri-soil-deep/80'}`}>
          {payload.diagnosis}
        </p>

        {/* Confidence bar */}
        {!isError && payload.confidence_score > 0 && (
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className={isSunlightMode ? 'text-white/60' : 'text-agri-soil/60'}>Confidence</span>
              <span className={isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}>
                {Math.round(payload.confidence_score * 100)}%
              </span>
            </div>
            <div className={`w-full h-1.5 rounded-full ${isSunlightMode ? 'bg-white/10' : 'bg-agri-soil/10'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${payload.confidence_score * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}
                className={`h-1.5 rounded-full ${isSunlightMode ? 'bg-[#39FF14]' : 'bg-agri-green'}`}
              />
            </div>
          </div>
        )}

        {/* Remedies */}
        {!isError && (payload.organic_remedy || payload.chemical_remedy) && (
          <div className="grid grid-cols-1 gap-3 mt-2">
            {payload.organic_remedy && payload.organic_remedy !== 'N/A' && (
              <div className={`p-4 rounded-2xl border ${
                isSunlightMode ? 'bg-white/5 border-[#39FF14]/30' : 'bg-agri-green/5 border-agri-green/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${isSunlightMode ? 'bg-[#39FF14]' : 'bg-agri-green'}`} />
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'
                  }`}>Organic Remedy</p>
                </div>
                <p className={`text-sm leading-snug ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                  {payload.organic_remedy}
                </p>
              </div>
            )}
            {payload.chemical_remedy && payload.chemical_remedy !== 'N/A' && (
              <div className={`p-4 rounded-2xl border ${
                isSunlightMode ? 'bg-white/5 border-agri-amber/30' : 'bg-agri-amber/5 border-agri-amber/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-agri-amber" />
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isSunlightMode ? 'text-agri-amber' : 'text-agri-amber'
                  }`}>Chemical Remedy</p>
                </div>
                <p className={`text-sm leading-snug ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                  {payload.chemical_remedy}
                </p>
              </div>
            )}
          </div>
        )}

        {/* RAG entity tags */}
        {result.rag_entities?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {result.rag_entities.map((entity, i) => (
              <span key={i} className={`text-xs font-medium px-2 py-1 rounded-full border ${
                isSunlightMode ? 'bg-white/5 border-white/20 text-white/60' : 'bg-agri-cream border-agri-soil/20 text-agri-soil/70'
              }`}>
                {entity}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/*
 * Changes Made:
 * - Dark bg → agri-offwhite surface
 * - Urgency badges use agri-terra/agri-amber/agri-green with border (color + text)
 * - Confidence bar → agri-green, h-1.5
 * - Remedy cards: agri-green/5 and agri-amber/5 tinted backgrounds
 * - Close button min-h/w 44px with focus ring
 * - Body text text-base
 */
