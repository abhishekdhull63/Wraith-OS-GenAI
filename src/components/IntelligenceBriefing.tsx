import { useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getAllEntries } from '../lib/locker';

interface IntelligenceBriefingProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

export default function IntelligenceBriefing({ onLog }: IntelligenceBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayBriefing = useCallback(async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      onLog?.('WARNING', '🔇 Flash Briefing aborted by operator.');
      return;
    }

    try {
      const entries = await getAllEntries();
      
      let speechText = '';
      if (entries.length === 0) {
        speechText = 'Operator, there are no new intelligence files. The vault is empty and secure.';
      } else {
        const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
        const newest = sorted[0];
        speechText = `Operator, you have ${sorted.length} intelligence files. The latest entry is ${newest.label}, classified at Threat Level ${newest.threat_level}. The vault is secure.`;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.pitch = 0.95;
      utterance.rate = 1.05;
      
      // Look for a Microsoft or generic English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Microsoft') || v.name.includes('Google') || v.lang === 'en-US');
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => {
        setIsPlaying(true);
        onLog?.('INFO', '🔊 Playing Situation Briefing (Audio Intelligence)...');
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        onLog?.('SUCCESS', '✅ Briefing complete.');
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        onLog?.('ERROR', '❌ Speech synthesis subsystem failed.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
      onLog?.('ERROR', '❌ Failed to fetch locker entries for briefing.');
    }
  }, [isPlaying, onLog]);

  return (
    <button
      onClick={handlePlayBriefing}
      className={`
        px-3 py-1.5 rounded-lg border text-[10px] font-semibold font-mono tracking-widest
        flex items-center gap-2 transition-all duration-300 reveal-btn relative overflow-hidden
        ${isPlaying 
          ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          : 'bg-white/[0.05] border-white/10 text-gray-300 hover:bg-white/[0.1] hover:border-white/20 hover:text-white'
        }
      `}
    >
      <span className="relative z-10 flex items-center gap-2">
        {isPlaying ? (
          <>
            <VolumeX className="w-4 h-4 animate-pulse" />
            ABORT BRIEFING
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
            PLAY SITUATION BRIEFING
          </>
        )}
      </span>
    </button>
  );
}
