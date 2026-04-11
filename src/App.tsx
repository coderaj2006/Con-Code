import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertCard } from './components/AlertCard';
import { QuickActions } from './components/QuickActions';
import { MyCrops } from './components/MyCrops';
import { CropStatus } from './components/CropStatus';
import { ChatOverlay } from './components/ChatOverlay';
import { BottomNav } from './components/BottomNav';
import { ScanningOverlay } from './components/ScanningOverlay';
import { WeatherAlertResponse, sendMessage } from './services/api';
import { weatherService } from './services/weatherService';
import { speechService } from './services/speech';
import { SkeletonCard } from './components/SkeletonCard';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TranslationProvider, useTranslation } from './context/TranslationContext';

export interface ChatMessage {
  role: 'user' | 'ai';
  type: 'voice' | 'text' | 'analysis';
  content: string;
  data?: any;
  timestamp: string;
}

function AppContent() {
  const { currentLanguage } = useTranslation();
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherAlertResponse | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUIActive, setIsUIActive] = useState(false);
  const [isSunlightMode, setIsSunlightMode] = useState(() => {
    return localStorage.getItem('sunlight-mode') === 'true';
  });
  const [isWeatherDataLoading, setIsWeatherDataLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('sunlight-mode', isSunlightMode.toString());
    if (isSunlightMode) {
      document.body.classList.add('sunlight-mode');
    } else {
      document.body.classList.remove('sunlight-mode');
    }
  }, [isSunlightMode]);

  useEffect(() => {
    // Initial weather fetch (Delhi coordinates)
    setIsWeatherDataLoading(true);
    weatherService.getWeather(28.6139, 77.2090)
      .then(data => setWeatherData(data))
      .catch(err => console.error('Weather fetch error', err))
      .finally(() => setIsWeatherDataLoading(false));
  }, []);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    if (msg.role === 'ai') setIsChatOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      type: 'voice',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addChatMessage(userMsg);

    try {
      const response = await sendMessage(text, currentLanguage);
      addChatMessage({
        role: 'ai',
        type: 'text',
        content: response.content,
        timestamp: response.timestamp
      });
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'ai',
        type: 'text',
        content: 'I had trouble connecting to the backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  const handleVoiceHelp = () => {
    setIsChatOpen(true);
  };

  const getBCP47Language = (code: string) => {
    const map: Record<string, string> = {
      'en': 'en-US', 'hi': 'hi-IN', 'pa': 'pa-IN', 'gu': 'gu-IN', 'mr': 'mr-IN',
      'kn': 'kn-IN', 'ml': 'ml-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 'as': 'as-IN', 'bgc': 'hi-IN'
    };
    return map[code] || 'en-US';
  };

  useEffect(() => {
    if (isUIActive && !isRecording) {
      const langCode = getBCP47Language(currentLanguage);
      speechService.start(
        langCode,
        (text) => handleSendMessage(text),
        (recording) => setIsRecording(recording)
      );
    }
    return () => {
      if (!isUIActive && isRecording) {
        speechService.stop();
      }
    };
  }, [isUIActive, isRecording, currentLanguage]);

  const onStartRecording = () => setIsUIActive(true);
  const onStopRecording = () => {
    setIsUIActive(false);
    speechService.stop();
  };

  useEffect(() => {
    return () => setIsUIActive(false);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center">
      <div className="w-full max-w-md bg-zinc-950 min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden pb-12">
        <Header
          isSunlightMode={isSunlightMode}
          setIsSunlightMode={setIsSunlightMode}
        />

        <main className="flex-grow scroll-smooth px-4 pt-6 pb-32 space-y-6">
          <section>
            <ErrorBoundary>
              {isWeatherDataLoading ? (
                <SkeletonCard type="weather" />
              ) : (
                <AlertCard weatherData={weatherData} isSunlightMode={isSunlightMode} />
              )}
            </ErrorBoundary>
          </section>

          <section>
            <ErrorBoundary>
              <QuickActions 
                onScan={() => setIsAnalysing(true)} 
                onVoice={handleVoiceHelp} 
                isSunlightMode={isSunlightMode} 
              />
            </ErrorBoundary>
          </section>

          <section>
            <ErrorBoundary>
              <CropStatus isSunlightMode={isSunlightMode} />
            </ErrorBoundary>
          </section>

          <section>
            <ErrorBoundary>
              <MyCrops isSunlightMode={isSunlightMode} />
            </ErrorBoundary>
          </section>
        </main>

        <BottomNav isSunlightMode={isSunlightMode} />

        <AnimatePresence>
          {isChatOpen && (
            <ChatOverlay
              isOpen={isChatOpen}
              setIsOpen={setIsChatOpen}
              messages={chatMessages}
              selectedLanguage={{ code: currentLanguage, name: '' }}
              isUIActive={isUIActive}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              isSunlightMode={isSunlightMode}
            />
          )}
        </AnimatePresence>

        <ScanningOverlay isVisible={isAnalysing} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <TranslationProvider>
        <AppContent />
      </TranslationProvider>
    </ToastProvider>
  );
}

export default App;
