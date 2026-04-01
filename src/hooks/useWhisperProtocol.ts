import { useState, useEffect, useCallback, useRef } from 'react';

// Extend window for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseWhisperProps {
  onLockdown: () => void;
  onOpenDarkChannel: () => void;
  onWipeMemory: () => void;
  onLog?: (type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS', msg: string) => void;
}

export function useWhisperProtocol({ onLockdown, onOpenDarkChannel, onWipeMemory, onLog }: UseWhisperProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[Whisper Protocol] Native Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      const transcript = latestResult[0].transcript.toLowerCase();

      // Command Matching
      if (transcript.includes('initiate lockdown')) {
        onLog?.('WARNING', '🎙️ VOICE COMMAND: PANIC LOCKDOWN TRIGGERED.');
        onLockdown();
      } else if (transcript.includes('open dark channel')) {
        onLog?.('SUCCESS', '🎙️ VOICE COMMAND: ROUTING TO DARK CHANNEL.');
        onOpenDarkChannel();
      } else if (transcript.includes('wipe memory')) {
        onLog?.('ERROR', '🎙️ VOICE COMMAND: EXECUTING FULL DATABASE PURGE.');
        onWipeMemory();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Whisper Protocol] Error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if the protocol hasn't been explicitly deactivated
      if (isListening) {
        try {
          recognition.start();
        } catch(e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isListening, onLockdown, onOpenDarkChannel, onWipeMemory, onLog]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Whisper Protocol Offline: Browser lacks native SpeechRecognition APIs.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      onLog?.('INFO', '🎙️ Whisper Protocol Deactivated.');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onLog?.('INFO', '🎙️ Whisper Protocol Active. Background passive listening armed.');
      } catch(e) {
         // Already started
      }
    }
  }, [isListening, onLog]);

  return { isListening, toggleListening };
}
