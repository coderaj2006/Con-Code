import { FC } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// ─── Shared Types ────────────────────────────────────────────────────────────
export interface AgentState {
  phase: 'IDLE' | 'ANALYZING' | 'COMPLETE' | 'ERROR' | 'WAIT_FOR_DATA';
  is_thinking: boolean;
  progress_pct: number;
}

export interface DiagnosisPayload {
  diagnosis: string;
  confidence_score: number;
  sources: string[];
  organic_remedy: string;
  chemical_remedy: string;
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

export const DiagnosisDisplay: FC<DiagnosisDisplayProps> = ({ result, onClose, isSunlightMode }) => {
  const { payload, agent_state } = result;

  const urgencyColor =
    payload.urgency_level === 'High'
      ? 'bg-red-500'
      : payload.urgency_level === 'Medium'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      className={`rounded-[2.5rem] shadow-2xl overflow-hidden border-2 ${
        isSunlightMode ? 'bg-black border-white text-white' : 'bg-white border-agri-green/20 text-gray-900'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${isSunlightMode ? 'border-white/20' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          {agent_state.phase === 'ANALYZING' ? (
            <Loader2 className="w-5 h-5 animate-spin text-agri-green" />
          ) : result.diagnosis_status === 'ERROR' ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className={`w-5 h-5 ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`} />
          )}
          <span className={`text-xs font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`}>
            AI Diagnosis
          </span>
          {payload.urgency_level && (
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${urgencyColor}`}>
              {payload.urgency_level} Risk
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
            isSunlightMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        <p className={`text-sm leading-relaxed ${isSunlightMode ? 'text-white/80' : 'text-gray-600'}`}>
          {payload.diagnosis}
        </p>

        {/* Confidence */}
        {payload.confidence_score > 0 && (
          <div>
            <div className="flex justify-between text-xs font-bold uppercase mb-1">
              <span className={isSunlightMode ? 'text-white/60' : 'text-gray-400'}>Confidence</span>
              <span className={isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}>
                {Math.round(payload.confidence_score * 100)}%
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${isSunlightMode ? 'bg-white/10' : 'bg-gray-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${payload.confidence_score * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}
                className={`h-2 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-agri-green'}`}
              />
            </div>
          </div>
        )}

        {/* Remedies Section */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          {/* Organic Remedy */}
          <div className={`p-4 rounded-3xl border-2 ${isSunlightMode ? 'bg-white/5 border-neon-agri/30' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isSunlightMode ? 'bg-neon-agri' : 'bg-emerald-500'}`} />
              <p className={`text-[11px] font-black uppercase tracking-widest ${isSunlightMode ? 'text-neon-agri' : 'text-emerald-700'}`}>
                Organic Remedy
              </p>
            </div>
            <p className={`text-sm leading-snug font-medium ${isSunlightMode ? 'text-white' : 'text-gray-700'}`}>
              {payload.organic_remedy}
            </p>
          </div>

          {/* Chemical Remedy */}
          <div className={`p-4 rounded-3xl border-2 ${isSunlightMode ? 'bg-white/5 border-amber-500/30' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isSunlightMode ? 'bg-amber-500' : 'bg-amber-500'}`} />
              <p className={`text-[11px] font-black uppercase tracking-widest ${isSunlightMode ? 'text-amber-600' : 'text-amber-700'}`}>
                Chemical Remedy
              </p>
            </div>
            <p className={`text-sm leading-snug font-medium ${isSunlightMode ? 'text-white' : 'text-gray-700'}`}>
              {payload.chemical_remedy}
            </p>
          </div>
        </div>

        {/* RAG sources */}
        {result.rag_entities?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.rag_entities.map((entity, i) => (
              <span
                key={i}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                  isSunlightMode ? 'bg-white/5 border-white/20 text-white/60' : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}
              >
                {entity}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
