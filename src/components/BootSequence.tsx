import { useState, useEffect, useRef } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BIOS_LOGS = [
  { text: 'Initializing Deep-Cover Kernel v2.4... [OK]', delay: 200 },
  { text: 'Mounting Virtual File System... [OK]', delay: 150 },
  { text: 'Verifying AES-256 Crypto Matrices... [OK]', delay: 1500 }, // Tension hang
  { text: 'Bypassing Network Telemetry... [DONE]', delay: 100 },
  { text: 'Loading Decoy Environment...', delay: 100 }
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [started, setStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    try {
       document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) {}
    setStarted(true);
  };

  useEffect(() => {
    if (!started) return;

    let isActive = true;
    let currentLogIndex = 0;

    const processNextLog = async () => {
      if (currentLogIndex >= BIOS_LOGS.length) {
         // Final 1 second hold before hard cut
         setTimeout(() => {
            if (isActive) onComplete();
         }, 1000);
         return;
      }

      const log = BIOS_LOGS[currentLogIndex];
      
      // Wait for delay
      await new Promise(r => setTimeout(r, log.delay));
      
      if (!isActive) return;

      setLogs(prev => [...prev, log.text]);
      currentLogIndex++;
      
      processNextLog();
    };

    processNextLog();

    return () => { isActive = false; };
  }, [started, onComplete]);

  // Auto-scroll logic if logs exceed height
  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);

  if (!started) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[999999]">
         <button 
           onClick={handleStart}
           className="text-white font-bold font-mono text-3xl tracking-[1em] uppercase hover:text-emerald-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transition-all animate-[pulse_2s_infinite] select-none focus:outline-none"
         >
            [ ENTER ]
         </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-emerald-500 font-mono text-sm p-6 overflow-hidden z-[999999] cursor-none flex flex-col">
       <div className="flex-1 overflow-y-hidden flex flex-col justify-end pb-12 opacity-90">
          {logs.map((log, i) => (
             <div key={i} className="mb-1">{log}</div>
          ))}
          <div ref={bottomRef} />
       </div>
    </div>
  );
}
