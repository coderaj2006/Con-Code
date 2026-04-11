import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertCard } from './components/AlertCard';
import { QuickActions } from './components/QuickActions';
import { MyCrops } from './components/MyCrops';
import { CropStatus } from './components/CropStatus';
import { ChatOverlay } from './components/ChatOverlay';
import { BottomNav, NavTab } from './components/BottomNav';
import { WeatherAlertResponse, sendMessage, sendVoiceMessage } from './services/api';
import { weatherService } from './services/weatherService';
import { speechService } from './services/speech';
import { SkeletonCard } from './components/SkeletonCard';
import { AnimatePresence } from 'framer-motion';
import { DiagnosisDisplay, OrchestratorResponse } from './components/DiagnosisDisplay';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TranslationProvider, useTranslation } from './context/TranslationContext';
import { MandiPrices } from './components/MandiPrices';
import { FieldsTab } from './components/FieldsTab';
import { ProfileTab } from './components/ProfileTab';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';

export interface ChatMessage {
  role: 'user' | 'ai';
  type: 'voice' | 'text' | 'analysis';
  content: string;
  data?: any;
  timestamp: string;
  follow_up_question?: string | null;
  speech_url?: string | null;
}

function AppContent() {
  const { currentLanguage } = useTranslation();
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth();
  const [diagnosisResult, setDiagnosisResult] = useState<OrchestratorResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherAlertResponse | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUIActive, setIsUIActive] = useState(false);
  const [isSunlightMode, setIsSunlightMode] = useState(() => {
    return localStorage.getItem('sunlight-mode') === 'true';
  });
  const [isWeatherDataLoading, setIsWeatherDataLoading] = useState(true);
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  useEffect(() => {
    localStorage.setItem('sunlight-mode', isSunlightMode.toString());
    if (isSunlightMode) {
      document.body.classList.add('sunlight-mode');
    } else {
      document.body.classList.remove('sunlight-mode');
    }
  }, [isSunlightMode]);

  // --- Backend Handshake + Telemetry Pre-warming ---
  useEffect(() => {
    const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8002';
    fetch(`${API_BASE}/telemetry?farmer_id=1`)
      .then(res => {
        if (res.ok) {
          console.log('%c🚀 Kisaan-Sense Connected to Port 8002', 'color: #4ade80; font-size: 14px; font-weight: bold;');
          return res.json();
        } else {
          console.warn('⚠️ Kisaan-Sense: Backend responded with status', res.status);
          return null;
        }
      })
      .then(data => {
        if (data?.history?.length) {
          // Real scan data exists — pre-warm the history state; UI updates without a refresh
          setTelemetryHistory(data.history);
          setIsSimulationMode(false);
        } else {
          // Backend returned empty history — flag simulation mode for badge display
          setIsSimulationMode(true);
        }
      })
      .catch(() => {
        console.warn('⚠️ Kisaan-Sense: Backend not reachable on Port 8001. Is uvicorn running?');
        setIsSimulationMode(true);
      });
  }, []);

  useEffect(() => {
    // Dynamic location fetch
    setIsWeatherDataLoading(true);
    
    const fetchWeather = (lat: number, lon: number) => {
      weatherService.getWeather(lat, lon)
        .then(data => setWeatherData(data))
        .catch(err => {
          console.error('Weather fetch error', err);
          // Fallback if API fails
          setWeatherData({
            title: "Weather Error",
            message: "Unable to load real-time weather.",
            urgency: "N/A",
            humidity: 0,
            temperature: 0
          });
        })
        .finally(() => setIsWeatherDataLoading(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          console.warn('Geolocation denied. Using default (Delhi).');
          fetchWeather(28.6139, 77.2090);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(28.6139, 77.2090);
    }
  }, []);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    if (msg.role === 'ai') setIsChatOpen(true);
  };

  const handleVoiceResult = async (audioBlob: Blob) => {
    try {
      setIsRecording(false);
      
      // 1. Show optimistic user message
      const userMsg: ChatMessage = { 
        role: 'user', 
        type: 'voice',
        content: '🎤 Recording...', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setChatMessages(prev => [...prev, userMsg]);

      // 2. Call backend /voice-chat
      const data = await sendVoiceMessage(audioBlob, currentLanguage);
      
      // 3. Update user message with transcript
      setChatMessages(prev => {
        const next = [...prev];
        next[next.length - 1].content = `🎤 ${data.transcript}`;
        return next;
      });

      // 4. Add AI response
      const aiMsg: ChatMessage = {
        role: 'ai',
        type: 'text',
        content: data.content,
        timestamp: data.timestamp,
        speech_url: data.speech_url,
        follow_up_question: data.follow_up_question
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsChatOpen(true);
    } catch (error) {
      console.error('Voice message failed', error);
      addChatMessage({
        role: 'ai',
        type: 'text',
        content: 'I had trouble processing your voice query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      role: 'user', type: 'voice', content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addChatMessage(userMsg);
    try {
      const response = await sendMessage(text, currentLanguage, getAuthHeaders());
      addChatMessage({
        role: 'ai', type: 'text', content: response.content,
        follow_up_question: response.follow_up_question,
        speech_url: response.speech_url, timestamp: response.timestamp,
      });
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'ai', type: 'text', content: 'I had trouble connecting to the backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  const handleVoiceHelp = () => {
    setIsChatOpen(true);
    setIsUIActive(true); // Start recording immediately
  };

  const getBCP47Language = (code: string) => {
    const map: Record<string, string> = {
      'en': 'en-US', 'hi': 'hi-IN', 'pa': 'pa-IN', 'gu': 'gu-IN', 'mr': 'mr-IN',
      'kn': 'kn-IN', 'ml': 'ml-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 'as': 'as-IN', 'bgc': 'hi-IN'
    };
    return map[code] || 'en-US';
  };

  useEffect(() => {
    if (isUIActive) {
      speechService.start(
        (blob) => {
          handleVoiceResult(blob);
          setIsUIActive(false);
        },
        (recording) => setIsRecording(recording)
      );
    } else {
      speechService.stop();
    }
    return () => speechService.stop();
  }, [isUIActive]);

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
      {(authLoading || !user) ? (
        <AuthScreen isSunlightMode={isSunlightMode} />
      ) : (
      <div className="w-full max-w-md bg-zinc-950 min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden pb-12">
        <Header
          isSunlightMode={isSunlightMode}
          setIsSunlightMode={setIsSunlightMode}
        />

        <main className="flex-grow scroll-smooth px-4 pt-6 pb-32 space-y-6">
          {activeTab === 'home' && (
            <>
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
                  <AnimatePresence>
                    {diagnosisResult && (
                      <DiagnosisDisplay
                        result={diagnosisResult}
                        onClose={() => setDiagnosisResult(null)}
                        isSunlightMode={isSunlightMode}
                      />
                    )}
                  </AnimatePresence>
                  <QuickActions
                    onScanClick={() => {}}
                    onVoice={handleVoiceHelp}
                    isSunlightMode={isSunlightMode}
                    setDiagnosisResult={setDiagnosisResult}
                  />
                </ErrorBoundary>
              </section>

              <section>
                <ErrorBoundary>
                  <MandiPrices isSunlightMode={isSunlightMode} />
                </ErrorBoundary>
              </section>

              <section>
                <ErrorBoundary>
                  <CropStatus isSunlightMode={isSunlightMode} telemetryHistory={telemetryHistory} isSimulationMode={isSimulationMode} />
                </ErrorBoundary>
              </section>

              <section>
                <ErrorBoundary>
                  <MyCrops isSunlightMode={isSunlightMode} />
                </ErrorBoundary>
              </section>
            </>
          )}

          {activeTab === 'reports' && (
            <section>
              <ErrorBoundary>
                <CropStatus isSunlightMode={isSunlightMode} telemetryHistory={telemetryHistory} isSimulationMode={isSimulationMode} />
              </ErrorBoundary>
            </section>
          )}

          {activeTab === 'fields' && (
            <section>
              <ErrorBoundary>
                <FieldsTab isSunlightMode={isSunlightMode} />
              </ErrorBoundary>
            </section>
          )}

          {activeTab === 'profile' && (
            <section>
              <ErrorBoundary>
                <ProfileTab isSunlightMode={isSunlightMode} setIsSunlightMode={setIsSunlightMode} />
              </ErrorBoundary>
            </section>
          )}
        </main>

        <BottomNav isSunlightMode={isSunlightMode} activeTab={activeTab} onTabChange={setActiveTab} />

        <ChatOverlay
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          messages={chatMessages}
          selectedLanguage={{ code: currentLanguage, name: '' }}
          isUIActive={isUIActive}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onSendMessage={handleSendMessage}
          isSunlightMode={isSunlightMode}
        />
      </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
