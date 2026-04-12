import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, TrendingUp, Loader2, ShoppingCart } from 'lucide-react';
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

  // Welcome message on open
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

  const trendColor = (t: string) =>
    t === 'up' ? 'text-emerald-400' : t === 'down' ? 'text-red-400' : 'text-zinc-400';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[3rem] z-50 flex flex-col overflow-hidden ${
              isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-zinc-900'
            }`}
            style={{ height: '85vh' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${
              isSunlightMode ? 'border-white/20' : 'border-zinc-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isSunlightMode ? 'bg-white' : 'bg-blue-600'
                }`}>
                  <ShoppingCart className={`w-5 h-5 ${isSunlightMode ? 'text-black' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className={`text-base font-black uppercase tracking-widest ${
                    isSunlightMode ? 'text-neon-agri' : 'text-white'
                  }`}>Mandi Prices</h3>
                  <p className="text-[10px] font-bold uppercase text-zinc-500">RAG-Powered Price AI</p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-full ${
                isSunlightMode ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick query chips */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_QUERIES.map(q => (
                <button key={q} onClick={() => sendQuery(q)}
                  className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                    isSunlightMode
                      ? 'border-white/20 text-white/70 hover:border-neon-agri hover:text-neon-agri'
                      : 'border-zinc-700 text-zinc-400 hover:border-blue-500 hover:text-blue-400'
                  }`}>
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] px-4 py-3 rounded-2xl border ${
                    msg.role === 'user'
                      ? (isSunlightMode ? 'bg-white/10 border-white text-white rounded-tr-none' : 'bg-blue-600/20 border-blue-500/30 text-white rounded-tr-none')
                      : (isSunlightMode ? 'bg-black border-2 border-neon-agri text-white rounded-tl-none' : 'bg-zinc-800 border-zinc-700 text-white rounded-tl-none')
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>

                    {/* Price summary cards */}
                    {msg.priceData && msg.priceData.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.priceData.map((p, i) => (
                          <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                            isSunlightMode ? 'bg-white/5' : 'bg-zinc-700/50'
                          }`}>
                            <div>
                              <p className={`text-xs font-black uppercase ${isSunlightMode ? 'text-neon-agri' : 'text-emerald-400'}`}>{p.crop}</p>
                              <p className="text-[10px] text-zinc-500 uppercase font-bold">{p.market}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">₹{p.price.toLocaleString()}</span>
                              <TrendingUp className={`w-3.5 h-3.5 ${trendColor(p.trend)}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1 px-1">
                    {msg.role === 'ai' ? 'Mandi AI' : 'You'} • {msg.timestamp}
                  </span>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${
                    isSunlightMode ? 'bg-black border-neon-agri' : 'bg-zinc-800 border-zinc-700'
                  }`}>
                    <Loader2 className={`w-4 h-4 animate-spin ${isSunlightMode ? 'text-neon-agri' : 'text-blue-400'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className={`p-4 border-t flex gap-3 ${
              isSunlightMode ? 'bg-black border-white/20' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuery(input)}
                placeholder="Ask about crop prices..."
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold outline-none border-2 ${
                  isSunlightMode
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/30 focus:border-neon-agri'
                    : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500'
                }`}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendQuery(input)}
                disabled={!input.trim() || loading}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  input.trim() && !loading
                    ? (isSunlightMode ? 'bg-white text-black' : 'bg-blue-600 text-white')
                    : (isSunlightMode ? 'bg-white/10 text-white/30' : 'bg-zinc-700 text-zinc-500')
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
