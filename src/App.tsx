import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertCard } from './components/AlertCard';
import { HeroActions } from './components/HeroActions';
import { CropStatus } from './components/CropStatus';
import { ChatOverlay } from './components/ChatOverlay';
import { History } from './components/History';
import { ScanningOverlay } from './components/ScanningOverlay';
import { getWeatherAlerts, WeatherAlertResponse, sendMessage } from './services/api';
import { speechService } from './services/speech';

export interface ChatMessage {
  role: 'user' | 'ai';
  type: 'voice' | 'text' | 'analysis';
  content: string;
  data?: any;
  timestamp: string;
}

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en', name: 'English' });
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherAlertResponse | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW failed', err));
      });
    }

    // Initial weather fetch (Delhi coordinates)
    getWeatherAlerts(28.6139, 77.2090)
      .then(data => setWeatherData(data))
      .catch(err => console.error('Weather fetch error', err));
  }, []);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    if (msg.role === 'ai') setIsChatOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      role: 'user',
      type: 'voice',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addChatMessage(userMsg);

    try {
      const response = await sendMessage(text, selectedLanguage.name);
        
      // Add AI message
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
        content: 'I had trouble connecting to the backend. Please check your connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  const handleVoiceHelp = () => {
    setIsChatOpen(true);
  };

  const getBCP47Language = (code: string) => {
    const map: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'pa': 'pa-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'as': 'as-IN'
    };
    return map[code] || 'en-US';
  };

  const onStartRecording = () => {
    const langCode = getBCP47Language(selectedLanguage.code);
    speechService.start(
      langCode,
      (text) => handleSendMessage(text),
      (recording) => setIsRecording(recording)
    );
  };

  const onStopRecording = () => {
    speechService.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      <Header
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />

      <main className="flex-grow scroll-smooth">
        <AlertCard weatherData={weatherData} />

        <HeroActions
          selectedLanguage={selectedLanguage}
          isAnalysing={isAnalysing}
          setIsAnalysing={setIsAnalysing}
          addChatMessage={addChatMessage}
          onVoiceHelp={handleVoiceHelp}
        />

        <CropStatus />

        <History />
      </main>

      <ChatOverlay
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        messages={chatMessages}
        selectedLanguage={selectedLanguage}
        isRecording={isRecording}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-[10px] py-1 text-center font-bold tracking-widest opacity-0 hover:opacity-100 transition-opacity uppercase">
        Version 1.0.0 • Connected to Gemini AI
      </div>

      <ScanningOverlay isVisible={isAnalysing} />
    </div>
  );
}

export default App;
