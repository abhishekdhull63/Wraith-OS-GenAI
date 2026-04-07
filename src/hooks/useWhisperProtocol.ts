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
  onWipeMemory: () => void;
  onLog?: (type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS', msg: string) => void;
}

export function useWhisperProtocol({ onLockdown, onWipeMemory, onLog }: UseWhisperProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
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
        onLog?.('INFO', '🎙️ VOICE COMMAND: Dark Channel is not available in PS-21.');
      } else if (transcript.includes('wipe memory')) {
        onLog?.('ERROR', '🎙️ VOICE COMMAND: EXECUTING FULL DATABASE PURGE.');
        onWipeMemory();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if the protocol hasn't been explicitly deactivated
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isListening, onLockdown, onWipeMemory, onLog]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Whisper Protocol Offline: Browser lacks native SpeechRecognition APIs.');
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
      } catch (e) {
        // Already started
      }
    }
  }, [isListening, onLog]);

  return { isListening, toggleListening };
}
