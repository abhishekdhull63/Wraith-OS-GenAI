import { useState, useRef, useEffect } from 'react';
import { Eye, Sun, ScanLine } from 'lucide-react';
import { OpticalReceiver } from '../lib/optical/receiver';

interface ArgusTerminalProps {
  onIntelReceived: (text: string) => void;
  onLog: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
  defaultTxPayload?: string;
}

export default function ArgusTerminal({ onIntelReceived, onLog, defaultTxPayload }: ArgusTerminalProps) {
  // TX State
  const [isStrobing, setIsStrobing] = useState(false);
  const [txPayload, setTxPayload] = useState(defaultTxPayload || 'NEXUS-ACTUAL: PROJECT ARGUS ESTABLISHED.');
  const [fps, setFps] = useState(15);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const txRafRef = useRef<number | null>(null);

  // RX State
  const [isReceiving, setIsReceiving] = useState(false);
  const [rxProgress, setRxProgress] = useState({ received: 0, total: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const receiverRef = useRef<OpticalReceiver | null>(null);

  // ── TRANSMITTER LOGIC ──
  const startStrobeSequence = async () => {
    onLog('INFO', '👁️ ARGUS Matrix generating strobe arrays...');

    let toggle = false;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Force dimensions explicitly if they resolved to 0
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 300;
        canvas.height = 300;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      console.log('Strobe frame painted');

      // Flash black and white
      ctx.fillStyle = toggle ? '#FFFFFF' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the payload text
      ctx.fillStyle = toggle ? '#000000' : '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txPayload || 'STROBE', canvas.width / 2, canvas.height / 2);

      toggle = !toggle;

      // Throttle to ~10fps so it doesn't crash React
      setTimeout(() => { txRafRef.current = requestAnimationFrame(draw); }, 100);
    };
    draw();
  };

  const stopStrobeSequence = () => {
    if (txRafRef.current) cancelAnimationFrame(txRafRef.current);
  };

  // The Main Run Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isStrobing && txPayload) {
      timeoutId = setTimeout(() => {
        startStrobeSequence();
      }, 100);
    } else {
      stopStrobeSequence();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      stopStrobeSequence();
    };
  }, [isStrobing, txPayload]);

  // Sync defaultTxPayload prop changes (from Wraith CLI argus command)
  useEffect(() => {
    if (defaultTxPayload !== undefined) {
      setTxPayload(defaultTxPayload);
      setIsStrobing(true);
    }
  }, [defaultTxPayload]);

  // Global Hardware Trigger Override
  useEffect(() => {
    const handleArgusTrigger = (e: any) => {
      onLog('WARNING', `⚠️ GLOBAL BUS TRIGGER CAUGHT: ARGUS MATRIX OVERRIDE [${e.detail}]`);
      setTxPayload(e.detail);
      setIsStrobing(true);
    };
    window.addEventListener('WRAITH_ARGUS_TRIGGER', handleArgusTrigger);
    return () => window.removeEventListener('WRAITH_ARGUS_TRIGGER', handleArgusTrigger);
  }, []);

  // ── RECEIVER LOGIC ──
  const startRx = async () => {
    if (!videoRef.current) return;
    setIsReceiving(true);
    setRxProgress({ received: 0, total: 0 });
    onLog('INFO', '👁️ ARGUS Optical Link listening. Awaiting QR signatures...');

    receiverRef.current = new OpticalReceiver(
      (received: number, total: number) => {
        setRxProgress({ received, total });
      },
      (payload: string) => {
        onLog('SUCCESS', '👁️ ARGUS LINK SOLID: Raw visual payload reconstruction complete.');
        onIntelReceived(payload);
        setIsReceiving(false);
      },
      (err: any) => {
        onLog('ERROR', err.message || 'Unknown Optical Error');
        setIsReceiving(false);
      }
    );

    try {
      await receiverRef.current.start(videoRef.current);
    } catch (e) {
      setIsReceiving(false);
    }
  };

  const stopRx = () => {
    setIsReceiving(false);
    if (receiverRef.current) receiverRef.current.stop();
  };

  useEffect(() => {
    return () => {
      if (txRafRef.current) cancelAnimationFrame(txRafRef.current);
      if (receiverRef.current) receiverRef.current.stop();
    };
  }, []);

  return (
    <div className="bg-white text-black rounded-xl border-4 border-black p-4 shadow-2xl relative overflow-hidden font-mono">
      {/* High-Contrast B/W Theme for maximum optical recognition fidelity */}
      
      <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className={`w-5 h-5 ${isStrobing || isReceiving ? 'animate-pulse' : ''}`} />
          <h3 className="text-sm font-black uppercase tracking-[0.3em]">PROJECT ARGUS</h3>
        </div>
        <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 uppercase tracking-widest border border-black">OPTICAL AIR-GAP DEFEAT</span>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[250px] mb-4">
        {/* TRANSMITTER VIEW */}
        <div className="border-4 border-black flex flex-col relative bg-gray-100">
           <div className="absolute top-0 left-0 w-full bg-black text-white text-[9px] p-1 font-bold text-center tracking-widest z-20 border-b-2 border-black">TX: HIGH-SPEED STROBE</div>
           
           <div className="flex-1 relative mt-6">
              <canvas 
                 ref={canvasRef} 
                 width={300} height={300} 
                 className="absolute inset-0 w-full h-full bg-black" 
                 style={{ display: 'block', zIndex: 1 }}
              />
              
              {!isStrobing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="text-gray-400 text-[10px] text-center uppercase tracking-widest flex flex-col items-center gap-2">
                     <Sun className="w-6 h-6" />
                     Strobe Engine Offline
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* RECEIVER VIEW */}
  <div className="border-4 border-black flex flex-col relative bg-black overflow-hidden group">
    <div className="absolute top-0 left-0 w-full bg-white text-black text-[9px] p-1 font-bold text-center tracking-widest z-10 border-b-2 border-black">RX: WEBCAM ISOLATION</div>

    <video
      ref={videoRef}
      className={`w-full h-full object-cover transition-opacity ${isReceiving ? 'opacity-100' : 'opacity-0'}`}
      muted playsInline
    />

    {!isReceiving && (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 text-[10px] uppercase tracking-widest">
        <ScanLine className="w-6 h-6 mb-2" />
        Scanner Offline
      </div>
    )}

    {isReceiving && (
      <>
        {/* Cyberpunk Scanner Box Overlay */}
        <div className="absolute inset-0 border-[4px] border-emerald-500 m-8 opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.8)] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-emerald-400 opacity-70 animate-[scan_2s_ease-in-out_infinite] pointer-events-none shadow-[0_0_15px_rgba(16,185,129,1)]" />

        {/* Progress Overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/80 border-2 border-emerald-500 text-emerald-400 p-2 text-[10px] font-bold">
          <div className="flex justify-between mb-1">
            <span>ACQUIRING CHUNKS:</span>
            <span>{rxProgress.received}/{rxProgress.total || '?'}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-900 border border-emerald-500/50">
            <div className="h-full bg-emerald-500" style={{ width: rxProgress.total > 0 ? `${(rxProgress.received / rxProgress.total) * 100}%` : '0%' }} />
          </div>
        </div>
      </>
    )}
  </div>
      </div >

    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black tracking-widest bg-black text-white px-2 py-0.5">TX RATE</span>
        <input
          type="range" min="5" max="30" step="1"
          value={fps} onChange={(e) => setFps(parseInt(e.target.value))}
          disabled={isStrobing}
          className="flex-1 accent-black h-2 bg-gray-200"
        />
        <span className="text-xs font-black min-w-[50px]">{fps} FPS</span>
      </div>

      <textarea
        className="w-full p-2 text-[10px] font-mono border-2 border-black resize-none h-16 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
        placeholder="Payload to broadcast..."
        value={txPayload}
        onChange={(e) => setTxPayload(e.target.value)}
        disabled={isStrobing}
      />

      <div className="grid grid-cols-2 gap-3 pb-1">
        <button
          id="argus-engage-btn"
          onClick={() => setIsStrobing(!isStrobing)}
          className={`py-2 text-[11px] font-black uppercase tracking-widest border-4 border-black transition-colors ${isStrobing ? 'bg-red-500 text-white border-red-600' : 'bg-white hover:bg-gray-100 text-black'}`}
        >
          {isStrobing ? 'Halt Broadcast' : 'Engage Strobe'}
        </button>

        <button
          onClick={isReceiving ? stopRx : startRx}
          className={`py-2 text-[11px] font-black uppercase tracking-widest border-4 border-black transition-colors ${isReceiving ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-black hover:bg-gray-800 text-white'}`}
        >
          {isReceiving ? 'Cancel Extraction' : 'Scan Network'}
        </button>
      </div>
    </div>
      
    </div >
  );
}
