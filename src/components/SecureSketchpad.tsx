import { useState, useRef, useEffect } from 'react';
import { PenTool, Save, X, Eraser } from 'lucide-react';
import { saveToLocker } from '../lib/locker';

interface SecureSketchpadProps {
  onClose: () => void;
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

export default function SecureSketchpad({ onClose, onLog }: SecureSketchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill black background for dark mode sketch
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8'; // Sky blue ink
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onLog?.('INFO', '🧹 Canvas wiped');
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current || isSaving) return;
    setIsSaving(true);
    onLog?.('INFO', '🔒 Encrypting sketch payload via AES-GCM...');

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await saveToLocker(dataUrl, 'VISION', 'CRITICAL', `Operator Sketch — ${new Date().toLocaleTimeString()}`, false);
      onLog?.('SUCCESS', '✅ Sketch encrypted and secured in the Vault');
      onClose();
    } catch {
      onLog?.('ERROR', '❌ Failed to encrypt sketch payload');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
      <div className="glass-card overflow-hidden shadow-2xl w-full max-w-4xl flex flex-col relative border-cyan-500/30">
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-widest font-bold">
            <PenTool className="w-5 h-5" />
            SECURE SKETCHPAD //
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="relative bg-[#0a0a0a] flex-1 flex items-center justify-center p-6 z-10">
          <canvas
            ref={canvasRef}
            width={850}
            height={550}
            className="border border-white/5 rounded-lg shadow-inner cursor-crosshair touch-none max-w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/30 relative z-10">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors reveal-btn"
          >
            <Eraser className="w-4 h-4" />
            CLEAR INK
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest border border-cyan-500/30 transition-colors disabled:opacity-50 reveal-btn"
          >
            {isSaving ? (
              <span className="animate-pulse">ENCRYPTING...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ENCRYPT & SAVE TO VAULT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
