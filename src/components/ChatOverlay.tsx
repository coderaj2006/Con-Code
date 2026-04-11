import { useEffect, useRef, FC, useState } from 'react';
import { MessageSquare, Camera, Mic, ChevronDown, Square } from 'lucide-react';
import { ChatMessage } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';

interface ChatOverlayProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  messages: ChatMessage[];
  selectedLanguage: { code: string; name: string };
  isUIActive: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isSunlightMode?: boolean;
}

const Waveform = () => (
  <div className="flex items-end gap-[2px] h-4 px-2">
    {[0.6, 1, 0.8, 0.5].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: ['20%', '100%', '20%'] }}
        transition={{ 
          duration: 0.8, 
          repeat: Infinity, 
          delay: i * 0.1,
          ease: "easeInOut"
        }}
        className="w-[3px] bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
      />
    ))}
  </div>
);

export const ChatOverlay: FC<ChatOverlayProps> = ({
  isOpen,
  setIsOpen,
  messages,
  isUIActive,
  onStartRecording,
  onStopRecording,
  isSunlightMode
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAudioMessageIdx, setActiveAudioMessageIdx] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Audio Playback Logic
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setActiveAudioMessageIdx(null);
  };

  const handleAudioPlayback = (audioUrl: string, messageIdx: number) => {
    stopAudio();
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setActiveAudioMessageIdx(messageIdx);
    
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => {
      setIsPlayingAudio(false);
      setActiveAudioMessageIdx(null);
    };
    audio.onerror = () => {
      setIsPlayingAudio(false);
      setActiveAudioMessageIdx(null);
    };

    audio.play().catch(err => {
      console.error('Audio playback failed', err);
      setIsPlayingAudio(false);
    });
  };

  useEffect(() => {
    const lastIdx = messages.length - 1;
    const lastMessage = messages[lastIdx];
    if (lastMessage && lastMessage.role === 'ai' && lastMessage.speech_url) {
      handleAudioPlayback(lastMessage.speech_url, lastIdx);
    }
  }, [messages]);

  useEffect(() => {
    if (isUIActive) stopAudio();
  }, [isUIActive]);

  useEffect(() => {
    return () => stopAudio();
  }, [isOpen]);

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

                {messages.map((msg, idx) => {
                  const isThisMessagePlaying = activeAudioMessageIdx === idx && isPlayingAudio;
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={msg.type === 'analysis' ? { type: 'spring', delay: 0.2 } : {}}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`relative border rounded-2xl px-5 py-4 max-w-[90%] group ${
                        msg.role === 'user' 
                          ? (isSunlightMode ? 'bg-white/10 border-white text-white' : 'bg-agri-amber/10 border-agri-amber/20 text-agri-green-dark rounded-tr-none') 
                          : (isSunlightMode ? 'bg-black border-2 border-neon-agri text-white' : 'bg-agri-green text-white border-transparent rounded-tl-none shadow-lg shadow-agri-green/20')
                      }`}>
                        {/* Audio Waveform Overlay */}
                        {isThisMessagePlaying && (
                          <div className="absolute -top-3 -right-2 bg-zinc-900 border border-emerald-500/50 rounded-full py-1 shadow-lg flex items-center gap-1">
                            <Waveform />
                            <button 
                              onClick={(e) => { e.stopPropagation(); stopAudio(); }}
                              className="pr-2 text-emerald-500 hover:text-white transition-colors"
                              title={t('stop_audio')}
                            >
                              <Square className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        )}

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
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <span className={`text-[10px] font-bold uppercase ${isSunlightMode ? 'text-white/40' : 'text-gray-400'}`}>{msg.role === 'ai' ? 'Kisaan AI' : 'You'} • {msg.timestamp}</span>
                      </div>
                    </motion.div>
                  );
                })}
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
