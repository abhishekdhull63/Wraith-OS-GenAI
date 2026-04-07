import { useEffect } from 'react';
import { ShieldAlert, Skull } from 'lucide-react';

export default function SecurityBreach() {
  useEffect(() => {
    // Hardware AudioContext Klaxon (Square Wave Generator)
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Master volume limiter
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5; // Aggressive volume but bounds-safe
    gainNode.connect(ctx.destination);

    let isPlaying = true;
    let osc: OscillatorNode | null = null;

    const playKlaxon = () => {
      if (!isPlaying) return;
      osc = ctx.createOscillator();
      osc.type = 'square';

      // Classic air-raid siren sweep emulation: 800Hz dropping to 300Hz aggressively
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);

      osc.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      // Loop mechanistically
      osc.onended = () => {
        setTimeout(() => {
          if (isPlaying) playKlaxon();
        }, 100);
      };
    };

    // Ignite klaxon loop
    playKlaxon();

    return () => {
      isPlaying = false;
      if (osc) {
        osc.disconnect();
      }
      gainNode.disconnect();
      if (ctx.state !== 'closed') ctx.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[999999999] bg-red-950 flex flex-col items-center justify-center animate-[pulse_0.4s_infinite] cursor-none select-none overflow-hidden">
      {/* Military / Hazard strip overlays */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_30px,rgba(255,0,0,0.15)_30px,rgba(255,0,0,0.15)_60px)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-6 mb-8">
          <ShieldAlert className="w-24 h-24 md:w-32 md:h-32 text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,1)] animate-bounce" />
          <Skull
            className="w-24 h-24 md:w-32 md:h-32 text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,1)] animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-[0.2em] text-center uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          CRITICAL BREACH
        </h1>
        <p className="mt-6 text-red-400 font-mono text-2xl tracking-[0.5em] text-center uppercase font-bold text-shadow-sm">
          TAMPERING DETECTED. PURGING MEMORY.
        </p>
      </div>

      {/* Subliminal raw error readouts */}
      <div className="absolute top-6 left-6 text-xs font-mono text-red-500/70 space-y-1">
        <div>SYS_ERR: DOM_INSPECTOR_HOOK_ENGAGED</div>
        <div>CORE_PROTOCOL: BURN ON READ ACTIVE</div>
        <div className="text-white font-bold animate-pulse">STATUS: PURGING AES-GCM MATRICES</div>
      </div>

      <div className="absolute bottom-6 right-6 text-xs font-mono text-red-500/70 text-right space-y-1">
        <div>INDEXED_DB: FORMATTING</div>
        <div>LOCAL_STORAGE: ZEROED</div>
      </div>
    </div>
  );
}
