export type SpeechResultCallback = (text: string) => void;
export type SpeechStateCallback = (isRecording: boolean) => void;

class SpeechService {
  private recognition: any;
  private isSupported: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.isSupported = true;
    } else {
      console.warn('Speech Recognition is not supported in this browser.');
    }
  }

  start(lang: string, onResult: SpeechResultCallback, onStateChange: SpeechStateCallback) {
    if (!this.isSupported) return;

    let fullTranscript = '';
    this.recognition.lang = lang;
    this.recognition.onstart = () => onStateChange(true);
    this.recognition.onend = () => {
      onStateChange(false);
      if (fullTranscript.trim()) {
        onResult(fullTranscript.trim());
        fullTranscript = ''; // Reset for next session
      }
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onStateChange(false);
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          if (transcript.trim()) {
            console.log('SpeechService: Final result captured:', transcript);
            onResult(transcript.trim());
          }
        }
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export const speechService = new SpeechService();
