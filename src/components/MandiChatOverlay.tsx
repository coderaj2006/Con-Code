// LAYOUT FIX ONLY — State, effects, and handlers are untouched.
import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { API_BASE } from '../config';


interface MandiMessage {
  role: 'user' | 'ai';
  content: string;
  priceData?: { crop: string; market: string; price: number; trend: string }[];
  timestamp: string;
}

interface MandiChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isSunlightMode?: boolean;
}

const QUICK_QUERIES = [
  'Wheat price today',
  'Best market for Tomato',
  'Mustard rates comparison',
  'Potato price trend',
];

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const MandiChatOverlay: FC<MandiChatOverlayProps> = ({ isOpen, onClose, isSunlightMode }) => {
  const { getAuthHeaders } = useAuth();
  const { currentLanguage } = useTranslation();
  const [messages, setMessages] = useState<MandiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'ai',
        content: 'Namaste! Ask me about today\'s mandi prices. I\'ll compare rates across Jaipur, Tonk, and Ajmer for you. 🌾',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }, [isOpen]);

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: MandiMessage = {
      role: 'user', content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/mandi-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ message: query, language: currentLanguage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response || 'Unable to fetch prices right now.',
        priceData: data.price_summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Mandi service is temporarily unavailable. Please try again.',
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
            className="fixed inset-0 z-[51] flex items-end sm:items-center justify-center bg-agri-soil-deep/40 p-4"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 flex flex-col w-full max-w-lg mx-auto h-[90vh] max-h-[90vh] rounded-3xl z-[52] overflow-hidden ${
              isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-agri-offwhite border-t border-agri-soil/20'
            }`}
          >
            {/* Zone 1 — Header (flex-none) */}
            <div className={`flex-none flex items-center justify-between px-6 pt-5 pb-4 border-b ${
              isSunlightMode ? 'border-white/20' : 'border-agri-soil/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isSunlightMode ? 'bg-white' : 'bg-agri-green'
                }`}>
                  <TrendingUp className={`w-5 h-5 ${isSunlightMode ? 'text-black' : 'text-agri-cream'}`} />
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                    Mandi Prices
                  </h3>
                  <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>RAG-Powered Price AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close mandi chat"
                className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                  isSunlightMode ? 'bg-white/10 text-white' : 'bg-agri-cream text-agri-soil'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick query chips (flex-none) */}
            <div className={`flex-none flex gap-2 overflow-x-auto px-4 py-2 border-b scrollbar-hide ${
              isSunlightMode ? 'border-white/10' : 'border-agri-soil/10'
            }`}>
              {QUICK_QUERIES.map(q => (
                <button
                  key={q}
                  onClick={() => sendQuery(q)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 min-h-[44px] rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                    isSunlightMode
                      ? 'border-white/20 text-white/70 hover:border-white hover:text-white'
                      : 'border-agri-soil/20 text-agri-soil hover:border-agri-green hover:text-agri-green'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Zone 2 — Message List (flex-1 + min-h-0 is the critical fix) */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] px-4 py-3 rounded-2xl border ${
                    msg.role === 'user'
                      ? (isSunlightMode ? 'bg-white/10 border-white text-white rounded-tr-none' : 'bg-agri-green/10 border-agri-green/20 text-agri-soil-deep rounded-tr-none')
                      : (isSunlightMode ? 'bg-black border-2 border-[#39FF14] text-white rounded-tl-none' : 'bg-agri-cream border-agri-soil/15 text-agri-soil-deep rounded-tl-none')
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>

                    {/* Price summary cards */}
                    {msg.priceData && msg.priceData.length > 0 && (
                      <div className={`mt-3 rounded-xl overflow-hidden border divide-y ${
                        isSunlightMode ? 'border-white/20 divide-white/10' : 'border-agri-soil/15 divide-agri-soil/10'
                      }`}>
                        {msg.priceData.map((p, i) => (
                          <div key={i} className={`flex items-center justify-between px-3 py-2 ${
                            isSunlightMode ? 'bg-white/5' : 'bg-agri-offwhite'
                          }`}>
                            <div>
                              <p className={`text-sm font-medium ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`}>{p.crop}</p>
                              <p className={`text-xs ${isSunlightMode ? 'text-white/50' : 'text-agri-soil/60'}`}>{p.market}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-semibold ${isSunlightMode ? 'text-white' : 'text-agri-soil-deep'}`}>
                                ₹{p.price.toLocaleString()}
                              </span>
                              {p.trend === 'up'
                                ? <TrendingUp className="w-4 h-4 text-agri-green" />
                                : p.trend === 'down'
                                ? <TrendingDown className="w-4 h-4 text-agri-terra" />
                                : null
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs mt-1 px-1 ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>
                    {msg.role === 'ai' ? 'Mandi AI' : 'You'} • {msg.timestamp}
                  </span>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${
                    isSunlightMode ? 'bg-black border-[#39FF14]' : 'bg-agri-cream border-agri-soil/15'
                  }`}>
                    <div className="shimmer-bar w-24"><div className="shimmer-bar-inner" /></div>
                    <Loader2 className={`w-4 h-4 animate-spin mt-1 ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-green'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Zone 3 — Input Footer (flex-none + pinned) */}
            <div className={`flex-none border-t px-4 py-3 flex gap-3 ${
              isSunlightMode ? 'bg-black border-white/20' : 'bg-agri-offwhite border-agri-soil/10'
            }`}>
              <label htmlFor="mandi-input" className="sr-only">Ask about crop prices</label>
              <input
                id="mandi-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
                placeholder="Ask about crop prices..."
                className={`flex-1 px-4 py-3 min-h-[44px] rounded-2xl text-sm font-medium outline-none border-2 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 transition-all ${
                  isSunlightMode
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/30 focus:border-[#39FF14]'
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
                    ? (isSunlightMode ? 'bg-white text-black' : 'bg-agri-green text-agri-cream')
                    : (isSunlightMode ? 'bg-white/10 text-white/30' : 'bg-agri-soil/10 text-agri-soil/40')
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
 * - User bubble: agri-green/10, AI bubble: agri-cream
 * - Price cards: divide-y divide-agri-soil/10, trend icons agri-green/agri-terra
 * - Loading: shimmer-bar replaces spinner text
 * - Input: agri-cream bg, focus:ring-agri-green, label htmlFor
 * - All buttons min-h-[44px] with focus rings
 */
