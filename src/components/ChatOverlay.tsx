import { useEffect, useRef, FC, useCallback } from 'react';
import { MessageSquare, Camera, Mic, ChevronDown, Volume2 } from 'lucide-react';
import { ChatMessage } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatOverlayProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  messages: ChatMessage[];
  selectedLanguage: { code: string; name: string };
  isUIActive: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isSunlightMode?: boolean;
  onSendMessage?: (text: string) => void;
}

export const ChatOverlay: FC<ChatOverlayProps> = ({
  isOpen,
  setIsOpen,
  messages,
  selectedLanguage,
  isUIActive,
  onStartRecording,
  onStopRecording,
  isSunlightMode,
  onSendMessage
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // --- Audio Playback: use backend gTTS speech_url if available ---
  const playAudio = useCallback((url: string) => {
    try {
      const audio = new Audio(url);
      audio.play().catch(() => {
        // Audio blocked by browser autoplay policy — user must interact first
      });
    } catch (_e) { /* silent fail */ }
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'ai') return;

    if (lastMessage.speech_url) {
      // Backend gTTS MP3 — plays the regional language audio
      playAudio(lastMessage.speech_url);
    } else if (lastMessage.content) {
      // Fallback: browser Web Speech API if no server audio
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      const voices = window.speechSynthesis.getVoices();
      const targetLang = selectedLanguage.code === 'en' ? 'en-US'
        : selectedLanguage.code === 'hi' ? 'hi-IN'
        : selectedLanguage.code;
      const voice = voices.find(v => v.lang.startsWith(targetLang));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, selectedLanguage.code, playAudio]);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 border-4 transition-all ${
          isSunlightMode 
          ? 'bg-black border-white text-neon-agri' 
          : 'bg-agri-green text-white border-white'
        }`}
      >
        <MessageSquare className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[3rem] shadow-2xl z-50 flex flex-col overflow-hidden ${
                isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-white'
              }`} 
              style={{ height: '85vh' }}
            >
              <div className={`flex flex-col items-center pt-3 pb-4 border-b ${
                isSunlightMode ? 'border-white/20' : 'border-gray-50'
              }`}>
                <ChevronDown className={`w-12 h-6 mb-1 ${isSunlightMode ? 'text-white/40' : 'text-gray-200'}`} />
                <h3 className={`text-xl font-black uppercase tracking-widest ${
                  isSunlightMode ? 'text-neon-agri' : 'text-agri-green'
                }`}>AI Advisory</h3>
              </div>

              <div ref={scrollRef} className={`px-6 h-[calc(100%-160px)] overflow-y-auto pt-6 space-y-6 scroll-smooth ${
                isSunlightMode ? 'bg-black' : 'bg-white'
              }`}>
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed ${
                      isSunlightMode ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <MessageSquare className={`w-10 h-10 ${isSunlightMode ? 'text-white/20' : 'text-gray-300'}`} />
                    </div>
                    <p className={`font-bold uppercase tracking-widest text-xs ${isSunlightMode ? 'text-white/40' : 'text-gray-400'}`}>No Recent Insights</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={msg.type === 'analysis' ? { type: 'spring', delay: 0.2 } : {}}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`border rounded-2xl px-5 py-4 max-w-[90%] ${
                      msg.role === 'user' 
                        ? (isSunlightMode ? 'bg-white/10 border-white text-white' : 'bg-agri-amber/10 border-agri-amber/20 text-agri-green-dark rounded-tr-none') 
                        : (isSunlightMode ? 'bg-black border-2 border-neon-agri text-white' : 'bg-agri-green text-white border-transparent rounded-tl-none shadow-lg shadow-agri-green/20')
                    }`}>
                      {msg.type === 'analysis' && msg.data ? (
                        <div className="space-y-4">
                          <div className={`flex items-center gap-2 border-b pb-2 mb-2 ${isSunlightMode ? 'border-white/20' : 'border-white/20'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isSunlightMode ? 'bg-white text-black' : 'bg-white/20'}`}>DIAGNOSIS</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${msg.data.urgency_level === 'High' ? 'bg-alert-red' : 'bg-blue-500'}`}>
                              {msg.data.urgency_level} Risk
                            </span>
                          </div>
                          <p className={`font-black text-2xl leading-none ${isSunlightMode ? 'text-neon-agri' : 'text-white'}`}>{msg.data.disease_name}</p>
                          <div className={`p-4 rounded-xl border ${isSunlightMode ? 'bg-white/5 border-white/20' : 'bg-white/10 border-white/10'}`}>
                            <p className="text-[10px] font-black uppercase opacity-60 mb-3">Organic Action Plan</p>
                            <ul className="space-y-2">
                              {msg.data.organic_cure.map((step: string, i: number) => (
                                <li key={i} className="text-sm flex gap-3">
                                  <span className={`font-black text-xs ${isSunlightMode ? 'text-neon-agri' : 'text-agri-amber'}`}>{i + 1}.</span>
                                  <span className="font-medium leading-snug">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className={`text-xs leading-relaxed ${isSunlightMode ? 'text-white' : 'opacity-80 italic'}`}>{msg.content}</p>
                        </div>
                      ) : (
                        <p className="font-bold leading-relaxed">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    {/* Follow-up Question Chip — rendered only on AI messages that have a suggestion */}
                    {msg.role === 'ai' && msg.follow_up_question && onSendMessage && (
                      <button
                        onClick={() => onSendMessage(msg.follow_up_question!)}
                        className={`mt-2 text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                          isSunlightMode
                            ? 'bg-black border-neon-agri text-neon-agri hover:bg-neon-agri hover:text-black'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                      >
                        💬 {msg.follow_up_question}
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <span className={`text-[10px] font-bold uppercase ${isSunlightMode ? 'text-white/40' : 'text-gray-400'}`}>
                        {msg.role === 'ai' ? 'Kisaan AI' : 'You'} • {msg.timestamp}
                      </span>
                      {/* Replay button — only for AI messages with a speech_url */}
                      {msg.role === 'ai' && msg.speech_url && (
                        <button
                          onClick={() => playAudio(msg.speech_url!)}
                          title="Replay audio"
                          className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 ${
                            isSunlightMode ? 'text-neon-agri hover:bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className={`mt-auto p-6 flex items-center gap-4 border-t ${
                isSunlightMode ? 'bg-black border-white/20' : 'bg-gray-50 border-gray-100'
              }`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg ${
                    isSunlightMode ? 'bg-black border-white text-white' : 'bg-white border-agri-green text-agri-green'
                  }`}
                >
                  <Camera className="w-8 h-8" />
                </motion.button>

                <motion.button 
                  onMouseDown={(e) => { e.preventDefault(); onStartRecording(); }}
                  onMouseUp={(e) => { e.preventDefault(); onStopRecording(); }}
                  onMouseLeave={(e) => { e.preventDefault(); isUIActive && onStopRecording(); }}
                  onTouchStart={(e) => { e.preventDefault(); onStartRecording(); }}
                  onTouchEnd={(e) => { e.preventDefault(); onStopRecording(); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-grow h-14 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all duration-300 border-2 ${
                    isUIActive 
                      ? (isSunlightMode ? 'bg-neon-agri border-white text-black' : 'bg-alert-red border-transparent text-white scale-105') 
                      : (isSunlightMode ? 'bg-black border-neon-agri text-neon-agri' : 'bg-agri-green border-transparent text-white')
                  }`}
                >
                  <Mic className={`w-7 h-7 ${isUIActive ? 'animate-mic-pulse' : ''}`} />
                  <span className="font-black uppercase tracking-widest text-sm">
                    {isUIActive ? 'Listening...' : 'Hold to Talk'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes mic-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-mic-pulse {
          animation: mic-pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </>
  );
};
