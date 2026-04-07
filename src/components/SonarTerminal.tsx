import { useState, useRef, useEffect } from 'react';
import { Radio, Send, Mic, Activity, AlertTriangle, Cpu } from 'lucide-react';
import { FSKModulator } from '../lib/acoustic/modulator';
import { FSKDemodulator } from '../lib/acoustic/demodulator';

interface SonarTerminalProps {
  defaultTxPayload?: string;
  onIntelReceived: (text: string) => void;
  onLog: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

export default function SonarTerminal({ defaultTxPayload, onIntelReceived, onLog }: SonarTerminalProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [transmitPayload, setTransmitPayload] = useState(
    defaultTxPayload || 'NEXUS-ACTUAL: BOURNE PROTOCOL INITIATED.',
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modulatorRef = useRef<FSKModulator | null>(null);
  const demodulatorRef = useRef<FSKDemodulator | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initialize Canvas Visualizer Loop
  const drawSpectrum = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(dataArray);

    ctx.fillStyle = 'rgba(0, 5, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / analyser.frequencyBinCount) * 4;
    let x = 0;

    // WebAudio Nyquist is 24kHz. 18kHz/19kHz is toward the end of the array.
    for (let i = 0; i < analyser.frequencyBinCount; i += 4) {
      const mag = dataArray[i];
      // Normalize -100dB .. -30dB
      const percent = Math.max(0, (mag + 100) / 70);
      const barHeight = percent * canvas.height;

      const nyq = analyser.context.sampleRate / 2;
      const freq = (i * nyq) / analyser.frequencyBinCount;

      // Highlight our 18kHz/19kHz target bands in Neon Green, rest in dim Gray
      if (freq >= 17500 && freq <= 19500) {
        ctx.fillStyle = mag > -75 ? '#22d3ee' : '#10b981'; // Cyan if spiking, Green if idle
      } else {
        ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0.1, percent * 0.5)})`;
      }

      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    // Call Demodulator parser passing the FFT array
    if (demodulatorRef.current && demodulatorRef.current.isListening) {
      demodulatorRef.current.pollSpectrum(dataArray);
    }

    rafRef.current = requestAnimationFrame(() => drawSpectrum(analyser));
  };

  const handleTransmit = async (overridePayload?: string | React.MouseEvent) => {
    if (isTransmitting || isReceiving) return;
    const payloadToUse = typeof overridePayload === 'string' ? overridePayload : transmitPayload;

    if (!modulatorRef.current) {
      modulatorRef.current = new FSKModulator();
      await modulatorRef.current.init();
    }

    setIsTransmitting(true);
    onLog('WARNING', '🔊 Acousto-Magnetic Transmission Armed. Broadcasting on 18/19kHz FM arrays.');

    try {
      await modulatorRef.current.transmit(payloadToUse);
      onLog('SUCCESS', '🔊 Transmission Complete. Pipeline dissolved.');
    } catch (e: any) {
      onLog('ERROR', `Transmission Failed: ${e.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Global Hardware Trigger Override
  useEffect(() => {
    const handleRemoteTrigger = async (e: any) => {
      onLog('WARNING', `⚠️ GLOBAL BUS TRIGGER CAUGHT: SONAR ACOUSTIC OVERRIDE [${e.detail}]`);
      setTransmitPayload(e.detail);
      setTimeout(() => {
        const btn = document.getElementById('sonar-transmit-btn');
        if (btn) btn.click();
      }, 100);
    };
    window.addEventListener('WRAITH_SONAR_TRIGGER', handleRemoteTrigger);
    return () => window.removeEventListener('WRAITH_SONAR_TRIGGER', handleRemoteTrigger);
  }, []);

  const handleReceive = async () => {
    if (isTransmitting) return;

    if (isReceiving) {
      if (demodulatorRef.current) demodulatorRef.current.stop();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsReceiving(false);
      onLog('WARNING', '🔇 Sonar array deactivated.');
      return;
    }

    setIsReceiving(true);
    onLog('INFO', '📡 Air-Gap Sonar Array hot. Trawling ambient noise for 18/19kHz headers...');

    demodulatorRef.current = new FSKDemodulator((payload) => {
      onIntelReceived(payload);
      onLog('SUCCESS', `📡 Acoustic Data Payload intercepted successfully. Rendered to Analyzer.`);
    });

    try {
      await demodulatorRef.current.start();
      const analyser = demodulatorRef.current.getAnalyser();
      if (analyser) {
        drawSpectrum(analyser); // Start visualizer loop which also drives polynomial reading
      }
    } catch (e: any) {
      setIsReceiving(false);
      onLog('ERROR', `Microphone fault: ${e.message}`);
    }
  };

  useEffect(() => {
    return () => {
      if (modulatorRef.current) modulatorRef.current.destroy();
      if (demodulatorRef.current) demodulatorRef.current.stop();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 shadow-[0_0_25px_rgba(16,185,129,0.05)] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 mb-4">
        <Radio
          className={`w-4 h-4 ${isTransmitting || isReceiving ? 'text-emerald-400 animate-pulse' : 'text-emerald-600'}`}
        />
        <h3 className="text-xs font-bold font-mono text-emerald-400 tracking-[0.2em] shadow-emerald-400 drop-shadow-md">
          SONAR ACOUSTIC MODEM
        </h3>
      </div>

      <div className="bg-[#050a08] border border-emerald-500/10 rounded-lg p-3 mb-4 h-24 relative overflow-hidden flex items-center justify-center">
        {isReceiving ? (
          <canvas ref={canvasRef} width={600} height={100} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-emerald-600/30 font-mono text-xs uppercase tracking-widest gap-2">
            <Activity className="w-6 h-6 opacity-30" />
            <p>Array Offline</p>
          </div>
        )}

        {/* Radar Line Sweep Effect (only during receiving) */}
        {isReceiving && (
          <div className="absolute inset-y-0 w-2 bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-emerald-400/0 animate-[sonar-sweep_3s_linear_infinite]" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[9px] text-gray-400 font-mono mb-1 uppercase tracking-wider">
            Payload Injection Block
          </label>
          <input
            type="text"
            value={transmitPayload}
            onChange={(e) => setTransmitPayload(e.target.value)}
            disabled={isTransmitting || isReceiving}
            className="w-full bg-black/50 border border-emerald-500/20 rounded px-3 py-1.5 text-xs text-emerald-400 font-mono focus:border-emerald-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="sonar-transmit-btn"
            onClick={handleTransmit}
            disabled={isTransmitting || isReceiving}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-colors ${isTransmitting ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
          >
            <Send className="w-3.5 h-3.5" />
            {isTransmitting ? 'Transmitting...' : 'Transmit FSK'}
          </button>

          <button
            onClick={handleReceive}
            disabled={isTransmitting}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-colors ${isReceiving ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
          >
            <Mic className="w-3.5 h-3.5" />
            {isReceiving ? 'Disengage Rx' : 'Engage Rx'}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-500/10 flex items-start gap-2">
        <Cpu className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <p className="text-[8px] text-gray-500 font-mono leading-tight uppercase">
          Acoustic Air-Gap bypass. Transmits data physically over speaker vibrations across ~18-19kHz. Ensure receiver
          device microphone is active within 5 meters.
        </p>
      </div>
    </div>
  );
}
