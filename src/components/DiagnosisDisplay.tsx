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
  disease_name?: string;
  urgency_level?: 'Low' | 'Medium' | 'High';
  organic_cure?: string[];
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
        {payload.disease_name && (
          <p className={`font-black text-2xl leading-none ${isSunlightMode ? 'text-neon-agri' : 'text-agri-green'}`}>
            {payload.disease_name}
          </p>
        )}

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

        {/* Organic cure steps */}
        {payload.organic_cure && payload.organic_cure.length > 0 && (
          <div className={`p-4 rounded-2xl border ${isSunlightMode ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isSunlightMode ? 'text-white/50' : 'text-gray-400'}`}>
              Organic Action Plan
            </p>
            <ul className="space-y-2">
              {payload.organic_cure.map((step, i) => (
                <li key={i} className="text-sm flex gap-3">
                  <span className={`font-black text-xs flex-shrink-0 ${isSunlightMode ? 'text-neon-agri' : 'text-agri-amber'}`}>
                    {i + 1}.
                  </span>
                  <span className={`font-medium leading-snug ${isSunlightMode ? 'text-white' : 'text-gray-700'}`}>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
