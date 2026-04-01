import { useState, useRef, useEffect } from 'react';

interface Point { x: number; y: number; id: number; }

export default function PatternLock({ onSuccess, onDuress, onCancel }: { onSuccess: () => void, onDuress?: () => void, onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [error, setError] = useState(false);

  // The secret pattern: 0,1,2,4,6,7,8 (Z pattern on a 3x3 grid)
  const SECRET_PATTERN = [0, 1, 2, 4, 6, 7, 8];
  
  // Duress Pattern (Diagonal line representing Strike/'X')
  const DURESS_PATTERN = [0, 4, 8];

  const gridSize = 3;
  const padding = 50;
  const canvasWidth = 350;
  const canvasHeight = 350;
  
  const getNodes = () => {
    const nodes: Point[] = [];
    const stepX = (canvasWidth - padding * 2) / (gridSize - 1);
    const stepY = (canvasHeight - padding * 2) / (gridSize - 1);
    
    let id = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        nodes.push({
          x: padding + col * stepX,
          y: padding + row * stepY,
          id: id++
        });
      }
    }
    return nodes;
  };

  const nodes = getNodes();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw connecting lines
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = error ? '#ef4444' : '#10b981'; // Red on error, neon green otherwise
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    selectedNodes.forEach((nodeId, i) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        if (i === 0) ctx.moveTo(node.x, node.y);
        else ctx.lineTo(node.x, node.y);
      }
    });

    // Draw active drawing line
    if (isDrawing && mousePos && selectedNodes.length > 0) {
      const lastNodeId = selectedNodes[selectedNodes.length - 1];
      const lastNode = nodes.find(n => n.id === lastNodeId);
      if (lastNode && !error) {
         ctx.moveTo(lastNode.x, lastNode.y);
         ctx.lineTo(mousePos.x, mousePos.y);
      }
    }
    ctx.stroke();

    // Draw 3x3 node grid dots
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = selectedNodes.includes(node.id) 
        ? (error ? '#ef4444' : '#10b981') 
        : '#374151'; // Unselected gray
      ctx.fill();
      
      // Outer glow boundary for selected vectors
      if (selectedNodes.includes(node.id)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
        ctx.fill();
      }
    });

  }, [selectedNodes, isDrawing, mousePos, error]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let cx, cy;
    if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
      cx = (e as React.TouchEvent).touches[0].clientX;
      cy = (e as React.TouchEvent).touches[0].clientY;
    } else {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const checkIntersection = (pos: {x: number, y: number}) => {
    const hitRadius = 30; // forgiving tap threshold
    for (const node of nodes) {
      const dist = Math.sqrt(Math.pow(node.x - pos.x, 2) + Math.pow(node.y - pos.y, 2));
      if (dist < hitRadius && !selectedNodes.includes(node.id)) {
        setSelectedNodes(prev => [...prev, node.id]);
        if (navigator.vibrate) navigator.vibrate(20);
        break;
      }
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (error) {
      setError(false);
      setSelectedNodes([]);
    }
    const pos = getEventPos(e);
    if (!pos) return;
    setIsDrawing(true);
    setMousePos(pos);
    checkIntersection(pos);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getEventPos(e);
    if (!pos) return;
    setMousePos(pos);
    checkIntersection(pos);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (selectedNodes.length > 0) {
      const signature = selectedNodes.join(',');
      const expected = SECRET_PATTERN.join(',');
      const duressExpected = DURESS_PATTERN.join(',');

      if (signature === expected) {
        onSuccess();
      } else if (onDuress && signature === duressExpected) {
        onDuress();
      } else {
        setError(true);
        setTimeout(() => {
          setSelectedNodes([]);
          setError(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in flex-col">
       <div className="mb-8 text-center animate-pulse">
          <h2 className="text-emerald-400 font-mono tracking-[0.3em] font-bold text-xl mb-3 shadow-emerald-500/50 drop-shadow-md uppercase">Biometric Bypass</h2>
          <p className="text-gray-500 font-mono text-sm max-w-sm leading-relaxed">System restricted. Connect dots along the secondary authentication pathway.</p>
       </div>
       <div 
         ref={containerRef}
         className="relative rounded-[2rem] bg-[#0a0a0a] border border-white/5 shadow-[0_0_80px_rgba(16,185,129,0.05)] p-4 cursor-crosshair"
       >
         <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="touch-none block"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
         />
       </div>
       <button onClick={onCancel} className="mt-12 px-6 py-2 text-gray-600 font-mono text-xs hover:text-white transition-colors tracking-widest uppercase border border-transparent hover:border-white/10 rounded">
         Abort Sequence
       </button>
    </div>
  );
}
