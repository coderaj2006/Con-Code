// LAYOUT FIX ONLY — State, effects, and handlers are untouched.
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

/* INJECT LOGIC HERE — DO NOT REMOVE */
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

  const audioContextRef = useRef<AudioContext | null>(null);

  const unlockAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playAudio = useCallback((url: string) => {
    unlockAudio();
    try {
      const audio = new Audio(url);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (_e) { /* silent fail */ }
  }, [unlockAudio]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'ai') return;

    if (lastMessage.speech_url) {
      playAudio(lastMessage.speech_url);
    } else if (lastMessage.content) {
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
  /* END LOGIC */

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Advisory chat"
        title="Open AI Advisory chat"
        className={`fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
          isSunlightMode
            ? 'bg-black border-white text-[#39FF14]'
            : 'bg-agri-green text-agri-cream border-agri-green-mid'
        }`}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-3xl z-50 flex flex-col overflow-hidden h-[85vh] max-h-[85vh] ${
                isSunlightMode ? 'bg-black border-t-4 border-x-4 border-white' : 'bg-agri-offwhite border-t border-agri-soil/20'
              }`}
            >
              {/* Zone 1 — Header (flex-none) */}
              <div className={`flex-none flex flex-col items-center pt-3 pb-4 border-b ${
                isSunlightMode ? 'border-white/20' : 'border-agri-soil/10'
              }`}>
                <ChevronDown className={`w-10 h-5 mb-1 ${isSunlightMode ? 'text-white/30' : 'text-agri-soil/30'}`} />
                <h3 className={`text-xl font-semibold tracking-tight ${
                  isSunlightMode ? 'text-white' : 'text-agri-soil-deep'
                }`}>AI Advisory</h3>
              </div>

              {/* Zone 2 — Message List (flex-1 + min-h-0 is the critical fix) */}
              <div ref={scrollRef} className={`flex-1 min-h-0 overflow-y-auto px-5 pt-5 space-y-5 scroll-smooth ${
                isSunlightMode ? 'bg-black' : 'bg-agri-offwhite'
              }`}>
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed ${
                      isSunlightMode ? 'bg-white/5 border-white/20' : 'bg-agri-cream border-agri-soil/20'
                    }`}>
                      <MessageSquare className={`w-8 h-8 ${isSunlightMode ? 'text-white/20' : 'text-agri-soil/30'}`} />
                    </div>
                    <p className={`text-sm font-medium ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>
                      No Recent Insights
                    </p>
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
                        ? (isSunlightMode
                            ? 'bg-white/10 border-white text-white rounded-tr-none'
                            : 'bg-agri-amber/10 border-agri-amber/20 text-agri-soil-deep rounded-tr-none')
                        : (isSunlightMode
                            ? 'bg-black border-2 border-[#39FF14] text-white rounded-tl-none'
                            : 'bg-agri-green text-agri-cream border-transparent rounded-tl-none')
                    }`}>
                      {msg.type === 'analysis' && msg.data ? (
                        <div className="space-y-4">
                          <div className={`flex items-center gap-2 border-b pb-2 mb-2 ${
                            isSunlightMode ? 'border-white/20' : 'border-agri-cream/20'
                          }`}>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              isSunlightMode ? 'bg-white text-black' : 'bg-agri-cream/20 text-agri-cream'
                            }`}>DIAGNOSIS</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              msg.data.urgency_level === 'High' ? 'bg-agri-terra text-white' : 'bg-agri-amber text-white'
                            }`}>
                              {msg.data.urgency_level} Risk
                            </span>
                          </div>
                          <p className={`font-semibold text-xl leading-tight ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-cream'}`}>
                            {msg.data.disease_name}
                          </p>
                          <div className={`p-4 rounded-xl border ${
                            isSunlightMode ? 'bg-white/5 border-white/20' : 'bg-agri-cream/10 border-agri-cream/20'
                          }`}>
                            <p className="text-xs font-medium opacity-60 mb-3">Organic Action Plan</p>
                            <ul className="space-y-2">
                              {msg.data.organic_cure.map((step: string, i: number) => (
                                <li key={i} className="text-sm flex gap-3">
                                  <span className={`font-semibold text-xs ${isSunlightMode ? 'text-[#39FF14]' : 'text-agri-amber'}`}>{i + 1}.</span>
                                  <span className="font-medium leading-snug">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-sm leading-relaxed opacity-80 italic">{msg.content}</p>
                        </div>
                      ) : (
                        <p className="text-base font-medium leading-relaxed">{msg.content}</p>
                      )}
                    </div>

                    {/* Follow-up chip */}
                    {msg.role === 'ai' && msg.follow_up_question && onSendMessage && (
                      <button
                        onClick={() => onSendMessage(msg.follow_up_question!)}
                        className={`mt-2 text-xs font-medium px-3 py-2 min-h-[44px] rounded-full border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                          isSunlightMode
                            ? 'bg-black border-[#39FF14] text-[#39FF14] hover:bg-[#39FF14] hover:text-black'
                            : 'bg-agri-cream border-agri-green/30 text-agri-green hover:bg-agri-green/10'
                        }`}
                      >
                        💬 {msg.follow_up_question}
                      </button>
                    )}

                    <div className="flex items-center gap-2 mt-2 px-1">
                      <span className={`text-xs font-medium ${isSunlightMode ? 'text-white/40' : 'text-agri-soil/50'}`}>
                        {msg.role === 'ai' ? 'Kisaan AI' : 'You'} • {msg.timestamp}
                      </span>
                      {msg.role === 'ai' && msg.speech_url && (
                        <button
                          onClick={() => playAudio(msg.speech_url!)}
                          title="Replay audio"
                          aria-label="Replay audio"
                          className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-1 ${
                            isSunlightMode ? 'text-[#39FF14]/60 hover:text-[#39FF14]' : 'text-agri-cream/60 hover:text-agri-cream'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Zone 3 — Input Footer (flex-none + pinned) */}
              <div className={`flex-none border-t p-5 flex items-center gap-3 ${
                isSunlightMode ? 'bg-black border-white/20' : 'bg-agri-cream border-agri-soil/10'
              }`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  aria-label="Take photo"
                  title="Take photo"
                  className={`min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center border-2 transition-all focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                    isSunlightMode ? 'bg-black border-white text-white' : 'bg-agri-offwhite border-agri-green text-agri-green'
                  }`}
                >
                  <Camera className="w-6 h-6" />
                </motion.button>

                <motion.button
                  onMouseDown={(e) => { e.preventDefault(); unlockAudio(); onStartRecording(); }}
                  onMouseUp={(e) => { e.preventDefault(); onStopRecording(); }}
                  onMouseLeave={(e) => { e.preventDefault(); isUIActive && onStopRecording(); }}
                  onTouchStart={(e) => { e.preventDefault(); unlockAudio(); onStartRecording(); }}
                  onTouchEnd={(e) => { e.preventDefault(); onStopRecording(); }}
                  aria-label={isUIActive ? 'Stop recording' : 'Hold to talk'}
                  aria-pressed={isUIActive}
                  className={`flex-grow min-h-[44px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 ${
                    isUIActive
                      ? (isSunlightMode ? 'bg-[#39FF14] border-white text-black' : 'bg-agri-terra border-transparent text-white scale-105')
                      : (isSunlightMode ? 'bg-black border-[#39FF14] text-[#39FF14]' : 'bg-agri-green border-transparent text-agri-cream')
                  }`}
                >
                  <Mic className={`w-6 h-6 ${isUIActive ? 'animate-mic-pulse' : ''}`} />
                  <span className="text-base font-semibold">
                    {isUIActive ? 'Listening…' : 'Hold to Talk'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/*
 * Changes Made:
 * - Dark bg → agri-offwhite / agri-cream surfaces
 * - FAB: bg-agri-green, min-h/w 44px, focus ring
 * - User bubble: agri-amber/10 tint, AI bubble: bg-agri-green text-agri-cream
 * - Follow-up chip: agri-cream bg, border-agri-green/30
 * - Mic button: bg-agri-green idle, bg-agri-terra active
 * - Camera button: border-agri-green text-agri-green
 * - All buttons aria-label + focus rings
 * - Body text text-base font-medium
 */
