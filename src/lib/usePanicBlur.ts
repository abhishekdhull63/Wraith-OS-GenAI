import { useEffect, useRef } from 'react';

/**
 * usePanicBlur
 * Listens for the 'Escape' key being pressed 3 times within 1000ms globally.
 * When triggered, it forcefully pauses and mutes all active audio/video elements
 * and triggers the provided onPanic callback to lock the application state.
 */
export function usePanicBlur(onPanic: () => void) {
  const escapeTapsRef = useRef<number[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        const now = Date.now();
        const taps = escapeTapsRef.current;
        taps.push(now);

        // Filter taps that occurred within the last 1000ms
        const recentTaps = taps.filter(time => now - time <= 1000);
        escapeTapsRef.current = recentTaps;

        if (recentTaps.length >= 3) {
          // PANIC BLUR TRIGGERED
          escapeTapsRef.current = []; // Reset

          console.warn('[PANIC BLUR] Triple-Esc detected. Ejecting dashboard and cutting all comms.');

          // Mute all active standard media elements (TTS engines relying on audio tags)
          document.querySelectorAll('audio, video').forEach((media) => {
            const el = media as HTMLMediaElement;
            el.pause();
            el.muted = true;
          });
          
          // Note: any Web Audio API AudioContexts should be closed by component unmounts,
          // but if global contexts exist, they should be suspended proactively here.
          // (Our DeepCoverDashboard tears down its own AudioContext on unmount).

          onPanic();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPanic]);
}
