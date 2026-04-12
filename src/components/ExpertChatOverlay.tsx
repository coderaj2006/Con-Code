// LAYOUT FIX ONLY — State, effects, and handlers are untouched.
import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, BookOpen, Loader2, Volume2 } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { API_BASE } from '../config';


interface ExpertMessage {
  role: 'user' | 'ai';
  content: string;
  sourceType?: string;
  speechUrl?: string | null;
  timestamp: string;
}

interface ExpertChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isSunlightMode?: boolean;
  userLat?: number;
  userLon?: number;
}

const SUGGESTED_QUESTIONS = [
  '🌿 My tomato leaves are turning yellow',
  '🐛 How to remove pests organically?',
  '💧 When should I water wheat?',
  '🌱 Best fertilizer for rice?',
  '🍂 Soil health tips for Kharif',
];

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const ExpertChatOverlay: FC<ExpertChatOverlayProps> = ({
  isOpen,
  onClose,
  isSunlightMode,
  userLat = 28.6139,
  userLon = 77.2090,
}) => {
  const { currentLanguage } = useTranslation();
  const [messages, setMessages] = useState<ExpertMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: currentLanguage === 'hi'
          ? '🙏 नमस्ते! मैं आपका कृषि वैज्ञानिक हूँ। अपनी फसल या मिट्टी के बारे में कोई भी सवाल पूछें।'
          : '🙏 Hello! I\'m your Agri-Scientist. Ask me anything about your crops, soil, or farming.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }, [isOpen]);

  const unlockAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playAudio = (url: string) => {
    unlockAudio();
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: ExpertMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/expert-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: currentLanguage !== 'en' ? currentLanguage : null,
          lat: userLat,
          lon: userLon,
        }),
      });
      const data = await res.json();
      const aiMsg: ExpertMessage = {
        role: 'ai',
        content: data.response || 'Sorry, I could not process that.',
        sourceType: data.source_type,
        speechUrl: data.speech_url ?? null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (aiMsg.speechUrl) playAudio(aiMsg.speechUrl);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Connection error. Please check your internet and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };
  /* END LOGIC */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-3xl z-[60] flex flex-col overflow-hidden h-[82vh] max-h-[82vh] ${
              isSunlightMode ? 'bg-black border-t-4 border-x-4 border-agri-green-mid' : 'bg-agri-offwhite border-t border-agri-soil/20'
            }`}
          >
            {/* Zone 1 — Header (flex-none) */}
            <div className={`flex-none flex items-center justify-between px-5 pt-5 pb-4 border-b ${
              isSunlightMode ? 'border-agri-green-mid/30' : 'border-agri-soil/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isSunlightMode ? 'bg-agri-green-mid' : 'bg-agri-green'
                }`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                    Expert Advisory
                  </h3>
                  <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
                    Compassionate Agri-Scientist • RAG Powered
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close expert chat"
                className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-cream text-agri-soil'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggested questions (flex-none) */}
            {messages.length <= 1 && (
              <div className="flex-none px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendQuery(q.replace(/^[^\s]+\s/, ''))}
                    className={`flex-shrink-0 text-xs font-medium px-3 py-2 min-h-[44px] rounded-2xl border transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                      isSunlightMode
                        ? 'border-agri-green-mid/30 text-agri-green-mid hover:bg-agri-green-mid/10'
                        : 'border-agri-soil/20 text-agri-soil hover:border-agri-green hover:text-agri-green'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Zone 2 — Message List (flex-1 + min-h-0 is the critical fix) */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? (isSunlightMode ? 'bg-agri-green text-white rounded-tr-none' : 'bg-agri-green text-agri-cream rounded-tr-none')
                      : (isSunlightMode
                          ? 'bg-zinc-900 border border-agri-green-mid/30 text-white rounded-tl-none'
                          : 'bg-agri-cream border border-agri-soil/15 text-agri-soil-deep rounded-tl-none')
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={
                        line.startsWith('•') ? 'ml-1 my-0.5' :
                        line.startsWith('🌱') || line.startsWith('💊') || line.startsWith('⚠️')
                          ? 'font-medium text-agri-green mt-2 mb-1'
                          : 'my-0.5'
                      }>
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className={`text-xs ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>
                      {msg.role === 'ai' ? 'Agri-Scientist' : 'You'} • {msg.timestamp}
                    </span>
                    {msg.role === 'ai' && msg.sourceType === 'EXPERT_GUIDE' && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-agri-green/10 text-agri-green border border-agri-green/20">
                        Expert Guide
                      </span>
                    )}
                    {msg.role === 'ai' && msg.speechUrl && (
                      <button
                        onClick={() => playAudio(msg.speechUrl!)}
                        aria-label="Replay audio"
                        title="Replay audio"
                        className={`transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-1 rounded ${
                          isSunlightMode ? 'text-white/40 hover:text-agri-green-mid' : 'text-agri-soil/40 hover:text-agri-green'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${
                    isSunlightMode ? 'bg-zinc-900 border-agri-green-mid/30' : 'bg-agri-cream border-agri-soil/15'
                  }`}>
                    <div className="shimmer-bar w-32 mb-1"><div className="shimmer-bar-inner" /></div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-agri-green" />
                      <span className={`text-xs font-medium ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>
                        Consulting knowledge base…
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Zone 3 — Input Footer (flex-none + pinned) */}
            <div className={`flex-none border-t px-4 py-3 flex gap-3 ${
              isSunlightMode ? 'bg-black border-agri-green-mid/20' : 'bg-agri-offwhite border-agri-soil/10'
            }`}>
              <label htmlFor="expert-input" className="sr-only">Ask about your crops</label>
              <input
                id="expert-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
                placeholder={currentLanguage === 'hi' ? 'अपना सवाल लिखें...' : 'Ask about your crops...'}
                className={`flex-1 px-4 py-3 min-h-[44px] rounded-2xl text-sm font-medium outline-none border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  isSunlightMode
                    ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-agri-green-mid'
                    : 'bg-agri-cream border-agri-soil/20 text-agri-soil-deep placeholder-agri-soil/40 focus:border-agri-green'
                }`}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendQuery(input)}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className={`min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  input.trim() && !loading
                    ? 'bg-agri-green text-agri-cream'
                    : (isSunlightMode ? 'bg-zinc-800 text-zinc-600' : 'bg-agri-soil/10 text-agri-soil/40')
                }`}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite / agri-cream surfaces
 * - User bubble: bg-agri-green text-agri-cream
 * - AI bubble: bg-agri-cream border-agri-soil/15
 * - Loading: shimmer-bar + Loader2 (no text-only loading)
 * - Input: agri-cream bg, focus:ring-agri-green, label htmlFor
 * - All buttons min-h-[44px] with focus rings
 * - Sprout icon replaced with BookOpen per spec
 */
