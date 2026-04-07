import { useEffect, useRef, useState } from 'react';
import { getAllEntries } from '../lib/locker';

interface Point {
  x: number;
  y: number;
}
interface Node extends Point {
  id: string;
  label: string;
  type: string;
}
interface Edge {
  from: string;
  to: string;
}

export default function ConspiracyBoard({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    getAllEntries().then((entries) => {
      // Disperse elements broadly across the conceptual canvas viewport bounds initially
      const newNodes = entries.map((e, i) => ({
        id: e.id,
        label: e.label,
        type: e.type,
        x: 300 + (i % 4) * 220 + Math.random() * 80,
        y: 200 + Math.floor(i / 4) * 180 + Math.random() * 80,
      }));
      setNodes(newNodes);
      setIsLoading(false);
    });
  }, []);

  // Canvas Hardware Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Auto-scale correctly to inner screen sizes
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw static resolved connection routes
      ctx.strokeStyle = '#ef4444'; // Red conspiracy string
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 12;

      edges.forEach((edge) => {
        const n1 = nodes.find((n) => n.id === edge.from);
        const n2 = nodes.find((n) => n.id === edge.to);
        if (n1 && n2) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      });

      // Draw active uncommitted link trace
      if (linkingFromId) {
        const n1 = nodes.find((n) => n.id === linkingFromId);
        if (n1) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges, linkingFromId, mousePos]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col pt-12 animate-fade-in font-inter">
      <div className="absolute top-6 left-8 flex items-center justify-between right-8 z-10 pointer-events-none">
        <div>
          <h1 className="text-3xl font-bold tracking-[0.2em] text-red-500 uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            Link Analysis Board
          </h1>
          <p className="text-xs text-gray-400 font-mono tracking-widest mt-2 uppercase">
            Entity graph tracking. Drag blocks to move. SHIFT+Drag to establish hard redline vectors.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-mono text-xs hover:bg-red-500/20 pointer-events-auto transition-colors"
        >
          Collapse Board
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-pulse text-red-500 font-mono tracking-[0.3em] font-bold">RECOVERING VECTORS...</div>
        </div>
      )}

      <div
        className="flex-1 relative overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

          if (dragNodeId) {
            setNodes((ns) =>
              ns.map((n) => (n.id === dragNodeId ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n)),
            );
          }
        }}
        onMouseUp={() => {
          setDragNodeId(null);
          setLinkingFromId(null);
        }}
        onMouseLeave={() => {
          setDragNodeId(null);
          setLinkingFromId(null);
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block touch-none" />

        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-black/80 border border-white/10 p-4 rounded bg-gradient-to-b from-white/[0.05] to-transparent shadow-2xl backdrop-blur-xl cursor-grab active:cursor-grabbing w-56 transition-all select-none"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              borderColor: linkingFromId === node.id || dragNodeId === node.id ? '#ef4444' : 'rgba(255,255,255,0.1)',
              boxShadow: linkingFromId === node.id || dragNodeId === node.id ? '0 0 30px rgba(239,68,68,0.2)' : '',
            }}
            onMouseDown={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                setLinkingFromId(node.id);
              } else {
                setDragNodeId(node.id);
              }
            }}
            onMouseUp={() => {
              if (linkingFromId && linkingFromId !== node.id) {
                // Ensure no duplicate string ties
                if (
                  !edges.find(
                    (e) =>
                      (e.from === linkingFromId && e.to === node.id) || (e.from === node.id && e.to === linkingFromId),
                  )
                ) {
                  setEdges([...edges, { from: linkingFromId, to: node.id }]);
                }
              }
              setLinkingFromId(null);
            }}
          >
            <div className="text-[10px] text-gray-500 flex justify-between uppercase mb-2 font-mono border-b border-white/5 pb-1">
              <span>{node.type}</span>
              <span className="text-red-400 font-bold">NODE</span>
            </div>
            <div className="font-semibold text-sm line-clamp-2 text-gray-200 leading-tight">{node.label}</div>
            <div className="text-[9px] text-gray-600 font-mono mt-3 uppercase tracking-widest text-center">
              Shift+Drag to Link
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
