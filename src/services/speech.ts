export type SpeechResultCallback = (audioBlob: Blob) => void;
export type SpeechStateCallback = (isRecording: boolean) => void;

class SpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start(
    onResult: SpeechResultCallback, 
    onStateChange: SpeechStateCallback
  ) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => onStateChange(true);
      
      this.mediaRecorder.onstop = () => {
        onStateChange(false);
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          onResult(audioBlob);
        }
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
    } catch (e) {
      console.error('Microphone access denied or failing:', e);
      onStateChange(false);
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}

export const speechService = new SpeechService();
