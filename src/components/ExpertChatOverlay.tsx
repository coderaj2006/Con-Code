/**
 * Expert Chat Overlay — Compassionate Agri-Scientist
 * Dedicated RAG-powered advisory window.
 * Does NOT move or affect Scan Plant or Mandi Prices buttons.
 */
import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sprout, Loader2, Mic, Volume2 } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8002';

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

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Welcome message on first open
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
          language: currentLanguage !== 'en' ? currentLanguage : null, // null = auto-detect
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

  const dark = isSunlightMode;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[3rem] z-50 flex flex-col overflow-hidden ${
              dark ? 'bg-black border-t-4 border-x-4 border-emerald-400' : 'bg-zinc-950'
            }`}
            style={{ height: '90vh' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 pt-5 pb-4 border-b ${
              dark ? 'border-emerald-400/30' : 'border-zinc-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  dark ? 'bg-emerald-400' : 'bg-emerald-600'
                }`}>
                  <Sprout className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-widest ${
                    dark ? 'text-emerald-400' : 'text-emerald-400'
                  }`}>Expert Advisory</h3>
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    Compassionate Agri-Scientist • RAG Powered
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested questions — shown only when no user messages yet */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendQuery(q.replace(/^[^\s]+\s/, ''))}
                    className={`flex-shrink-0 text-[10px] font-bold px-3 py-2 rounded-2xl border transition-all whitespace-nowrap ${
                      dark
                        ? 'border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10'
                        : 'border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : (dark
                          ? 'bg-zinc-900 border border-emerald-400/30 text-white rounded-tl-none'
                          : 'bg-zinc-800 border border-zinc-700 text-white rounded-tl-none')
                  }`}>
                    {/* Render response with line breaks preserved */}
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('•') ? 'ml-1 my-0.5' : line.startsWith('🌱') || line.startsWith('💊') || line.startsWith('⚠️') ? 'font-black text-emerald-400 mt-2 mb-1' : 'my-0.5'}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[9px] font-bold uppercase text-zinc-600">
                      {msg.role === 'ai' ? 'Agri-Scientist' : 'You'} • {msg.timestamp}
                    </span>
                    {msg.role === 'ai' && msg.sourceType === 'EXPERT_GUIDE' && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Expert Guide
                      </span>
                    )}
                    {msg.role === 'ai' && msg.speechUrl && (
                      <button
                        onClick={() => playAudio(msg.speechUrl!)}
                        className="text-zinc-600 hover:text-emerald-400 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${
                    dark ? 'bg-zinc-900 border-emerald-400/30' : 'bg-zinc-800 border-zinc-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wide">
                        Consulting knowledge base...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className={`p-4 border-t flex gap-3 flex-shrink-0 ${
              dark ? 'bg-black border-emerald-400/20' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
                placeholder={currentLanguage === 'hi' ? 'अपना सवाल लिखें...' : 'Ask about your crops...'}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-medium outline-none border-2 transition-all ${
                  dark
                    ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:border-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-emerald-500'
                }`}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendQuery(input)}
                disabled={!input.trim() || loading}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  input.trim() && !loading
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
