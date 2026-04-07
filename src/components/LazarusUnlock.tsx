import { useState, useRef, useEffect } from 'react';
import { ScanLine, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { reconstructMasterKey } from '../lib/crypto/shamir';

interface LazarusUnlockProps {
  onUnlocked: () => void;
}

export default function LazarusUnlock({ onUnlocked }: LazarusUnlockProps) {
  const [scannedShares, setScannedShares] = useState<Set<string>>(new Set());
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err) {
        setErrorObj('Camera access denied. Cannot reconstruct Horcruxes.');
      }
    };

    startCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const scanFrame = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // We use jsQR synchronously here because it's a single static scan, not 30FPS stream video
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code && code.data.length > 50) {
          // Potential share found
          setScannedShares((prev) => {
            const next = new Set(prev);
            next.add(code.data);
            return next;
          });
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  };

  // Check threshold
  useEffect(() => {
    if (scannedShares.size >= 3) {
      setIsScanning(false);
      try {
        const seed = reconstructMasterKey(Array.from(scannedShares));
        sessionStorage.setItem('oppenheimer_seed', seed);
        // We do NOT clear localStorage oppenheimer_active, because it remains structurally split.
        // Once unlocked for this session, they have access.
        onUnlocked();
      } catch (e: any) {
        setErrorObj(e.message);
        // Clear bad shares
        setTimeout(() => {
          setScannedShares(new Set());
          setErrorObj(null);
          setIsScanning(true);
          rafRef.current = requestAnimationFrame(scanFrame);
        }, 3000);
      }
    }
  }, [scannedShares, onUnlocked]);

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-red-500 font-mono flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full border-4 border-red-600 bg-red-950/20 shadow-[0_0_50px_rgba(220,38,38,0.3)] p-8 flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 mb-4 animate-[pulse_2s_ease-in-out_infinite]" />
        <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 text-center text-red-500">
          OPPENHEIMER PROTOCOL ACTIVE
        </h1>
        <h2 className="text-lg font-bold text-red-400 mb-6 text-center">
          Master Encryption Key Missing from RAM. Reconstitution Required.
        </h2>

        <div className="relative w-full max-w-md aspect-video border-4 border-red-800 bg-black overflow-hidden mb-6 flex items-center justify-center group">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 border-2 border-red-500/50 m-8 pointer-events-none shadow-[0_0_30px_rgba(220,38,38,0.4)_inset]" />
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 opacity-80 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(220,38,38,1)]" />

          {!isScanning && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-black text-red-500 text-xl tracking-widest z-20">
              <Cpu className="w-6 h-6 mr-3 animate-spin" /> DERIVING POLYNOMIAL...
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-4">
          {[0, 1, 2].map((i) => {
            const isScanned = i < scannedShares.size;
            return (
              <div
                key={i}
                className={`w-16 h-16 border-2 flex items-center justify-center transition-all ${isScanned ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-black border-red-900'}`}
              >
                {isScanned ? (
                  <CheckCircle2 className="w-8 h-8 text-black" />
                ) : (
                  <ScanLine className="w-6 h-6 text-red-900" />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm font-bold tracking-widest text-red-400 mb-2">
          SCANNED HORCRUXES: {scannedShares.size} / 3
        </p>

        {errorObj && (
          <div className="mt-4 p-3 bg-red-950 border border-red-500 text-red-400 text-xs text-center max-w-md">
            {errorObj}
          </div>
        )}
      </div>
    </div>
  );
}
