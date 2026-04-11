import { useEffect, useRef, FC } from 'react';
import { MessageSquare, Camera, Mic, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../App';

interface ChatOverlayProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  messages: ChatMessage[];
  selectedLanguage: { code: string; name: string };
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const ChatOverlay: FC<ChatOverlayProps> = ({
  isOpen,
  setIsOpen,
  messages,
  selectedLanguage,
  isRecording,
  onStartRecording,
  onStopRecording
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Speech Synthesis Logic
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'ai') {
      const textToSpeak = lastMessage.content;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      const voices = window.speechSynthesis.getVoices();
      const targetLang = selectedLanguage.code === 'en' ? 'en-US' : selectedLanguage.code === 'hi' ? 'hi-IN' : selectedLanguage.code;

      const voice = voices.find(v => v.lang.startsWith(targetLang));
      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    }
  }, [messages, selectedLanguage.code]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-agri-green text-white rounded-full shadow-2xl flex items-center justify-center z-40 btn-press border-4 border-white transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-8 h-8" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] shadow-2xl z-50 transition-transform duration-500 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '85vh' }}>
        <div className="flex flex-col items-center pt-3 pb-4 border-b border-gray-50">
          <ChevronDown className="w-12 h-6 text-gray-200 mb-1" />
          <h3 className="text-xl font-black text-agri-green">SMART ADVISORY</h3>
        </div>

        <div ref={scrollRef} className="px-6 h-[calc(100%-160px)] overflow-y-auto pt-6 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Recent Insights</p>
              <p className="text-[10px] text-gray-300 mt-1">Scan a plant or ask a question to start</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`${msg.role === 'user' ? 'bg-agri-amber/10 border-agri-amber/20 rounded-tr-none' : 'bg-agri-green text-white rounded-tl-none shadow-lg'} border rounded-2xl px-5 py-4 max-w-[85%]`}>
                {msg.type === 'analysis' && msg.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/20 pb-2 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Diagnosis</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${msg.data.urgency_level === 'High' ? 'bg-alert-red' : 'bg-blue-500'}`}>
                        {msg.data.urgency_level} Risk
                      </span>
                    </div>
                    <p className="font-black text-lg leading-tight">{msg.data.disease_name}</p>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                      <p className="text-[10px] font-black uppercase opacity-60 mb-2">Organic Action Plan</p>
                      <ul className="space-y-1.5">
                        {msg.data.organic_cure.map((step: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2">
                            <span className="font-black text-agri-amber text-xs">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs opacity-80 italic leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <p className={`${msg.role === 'user' ? 'text-agri-green-dark' : 'text-white'} font-medium`}>
                    {msg.content}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{msg.role === 'ai' ? 'Kisaan AI' : 'You'} • {msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 flex items-center gap-4 border-t border-gray-100">
          <button className="w-14 h-14 bg-white border-2 border-agri-green text-agri-green rounded-2xl flex items-center justify-center btn-press">
            <Camera className="w-8 h-8 text-agri-green" />
          </button>

          <button 
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            className={`flex-grow h-14 rounded-2xl flex items-center justify-center gap-3 btn-press shadow-xl transition-all duration-300 ${isRecording ? 'bg-alert-red scale-105 animate-pulse' : 'bg-agri-green text-white'}`}
          >
            <Mic className={`w-7 h-7 ${isRecording ? 'animate-bounce' : ''}`} />
            <span className="font-black uppercase tracking-widest">
              {isRecording ? 'Listening...' : 'Hold to Talk'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
