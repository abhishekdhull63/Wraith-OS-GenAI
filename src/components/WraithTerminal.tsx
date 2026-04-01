import { useState, useEffect, useRef } from 'react';
import { Terminal, Crosshair, MapPin, Compass } from 'lucide-react';
import { useChronosSensors } from '../hooks/useChronosSensors';

interface WraithTerminalProps {
  onCommand: (command: string, args: string[]) => void;
  onUnlock?: () => void;
}

export default function WraithTerminal({ onCommand, onUnlock }: WraithTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<{ text: string; type: 'cmd' | 'system' }[]>([
    { text: 'DEEP-COVER WRAITH OS v1.0 [AUTHORIZED]', type: 'system' },
    { text: 'Type "help" for a list of master operator commands.', type: 'system' }
  ]);
  const [inputStr, setInputStr] = useState('');
  
  // Chronos Telemetry State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const chronosSensors = useChronosSensors(isCalibrating);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Global terminal toggle listener
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      // Diagnostic pipeline
      if (e.code === 'Backquote' || e.key === '~' || e.key === '`' || (e.ctrlKey && e.shiftKey && e.code === 'KeyP')) {
          console.log("[WraithTerminal Diagnostics] Key Pressed:", e.code, "Key string:", e.key);
      }

      // Trigger condition: absolute `Backquote` code OR `Ctrl + Shift + P`
      if (
         e.code === 'Backquote' || 
         (e.ctrlKey && e.shiftKey && e.code === 'KeyP')
      ) {
         if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement).isContentEditable)) return;

         e.preventDefault(); 
         e.stopPropagation();

         setIsOpen(prev => {
            const nextState = !prev;
            if (nextState) {
               setTimeout(() => inputRef.current?.focus(), 100);
            }
            return nextState;
         });
      }
    };
    
    const handleGlobalClick = (e: MouseEvent) => {
       if (e.detail === 3) {
          setIsOpen(true);
          console.log("[WraithTerminal] TERMINAL TRIGGERED VIA TRIPLE CLICK");
       }
    };

    // Use capture phase to intercept before React Synthetic events bury it
    window.addEventListener('keydown', handleGlobalKeydown, { capture: true });
    window.addEventListener('click', handleGlobalClick, { capture: true });
    
    return () => {
       window.removeEventListener('keydown', handleGlobalKeydown, { capture: true });
       window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const pushSystemMessage = async (msg: string, delayMs: number = 20) => {
     return new Promise<void>(resolve => {
        setTimeout(() => {
           setHistory(h => [...h, { text: msg, type: 'system' }]);
           resolve();
        }, delayMs);
     });
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStr.trim()) return;

    const cmdLine = inputStr.trim().toLowerCase();
    const parts = cmdLine.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    setHistory(h => [...h, { text: `root@deep-cover:~# ${cmdLine}`, type: 'cmd' }]);
    setInputStr('');
    
    try {
      if (command === 'help') {
         await pushSystemMessage('  help                    - Display this command matrix');
         await pushSystemMessage('  status                  - Print active hardware module health');
         await pushSystemMessage('  unlock                  - Force physical environment decryption');
         await pushSystemMessage('  clear                   - Purge terminal display logs');
         await pushSystemMessage('  arm faraday             - Isolates radio network interfaces');
         await pushSystemMessage('  lockdown --burn         - Executes physical storage destruction');
         await pushSystemMessage('  sonar --transmit [file] - Engages FSK Acoustic Modem');
         await pushSystemMessage('  argus --strobe [file]   - Engages 30 FPS Optical Matrix');
         await pushSystemMessage('  shatter --horcrux       - Splinters Master Key via Shamir\'s SSC');
         await pushSystemMessage('  chronos --calibrate     - Mounts live physical geo-telemetry stream');
      } else if (command === 'status') {
         await pushSystemMessage('[SONAR: READY]');
         await pushSystemMessage('[ARGUS: ACTIVE]');
         await pushSystemMessage('[CHRONOS: CALIBRATED]');
         await pushSystemMessage('[SENTINEL: ARMED]');
         onCommand('status', []);
      } else if (command === 'unlock') {
         await pushSystemMessage('CRITICAL: FORCE-OVERRIDING DOM LAYER...', 300);
         await pushSystemMessage('[OK] DECOY OBFUSCATION DISSOLVED.', 400);
         onCommand('unlock', []);
         if (onUnlock) onUnlock();
      } else if (command === 'clear') {
         setHistory([]);
      } else if (command === 'arm' && args[0] === 'faraday') {
         await pushSystemMessage('Initializing interface isolation proxy...', 400);
         await pushSystemMessage('[OK] Wi-Fi adapter hardware override enabled.', 300);
         await pushSystemMessage('[OK] WebRTC socket closures mapped.', 300);
         onCommand('arm faraday', []);
      } else if (command === 'lockdown' && args[0] === '--burn') {
         await pushSystemMessage('WARNING: DEAD MAN PROTOCOL OVERRIDE DETECTED.', 400);
         await pushSystemMessage('Purging IndexedDB root allocations...', 600);
         await pushSystemMessage('Zeroing LocalStorage blocks...', 300);
         onCommand('lockdown --burn', []);
      } else if (command === 'sonar' && args[0] === '--transmit') {
         await pushSystemMessage('Allocating AudioContext nodes...', 300);
         const payload = args[1] || 'STREAM';
         await pushSystemMessage(`Mounting FSK payload buffer: [${payload}]`, 400);
         window.dispatchEvent(new CustomEvent('WRAITH_SONAR_TRIGGER', { detail: payload }));
         onCommand('sonar --transmit', [payload]);
      } else if (command === 'argus' && args[0] === '--strobe') {
         await pushSystemMessage('Hijacking requestAnimationFrame sequence...', 300);
         const payload = args[1] || 'STREAM';
         await pushSystemMessage(`Encoding QR Base64 Strobe matrix: [${payload}]`, 400);
         window.dispatchEvent(new CustomEvent('WRAITH_ARGUS_TRIGGER', { detail: payload }));
         onCommand('argus --strobe', [payload]);
      } else if (command === 'shatter' && args[0] === '--horcrux') {
         await pushSystemMessage('CRITICAL: Accessing PBKDF2 Master arrays...', 500);
         await pushSystemMessage('Deriving fractional polynomial logic gates...', 600);
         await pushSystemMessage('Evacuating persistent bounds...', 400);
         onCommand('shatter --horcrux', []);
      } else if (command === 'chronos' && args[0] === '--calibrate') {
         setIsCalibrating(prev => {
            const next = !prev;
            if (next) {
               pushSystemMessage('Initializing Native Geolocation & Magnetometer APIs...');
               pushSystemMessage('Mounting live coordinate matrices into HUD stream...');
            } else {
               pushSystemMessage('Terminating Chronos array streams...');
            }
            return next;
         });
      } else {
         await pushSystemMessage(`bash: ${command}: command not found`);
      }
    } catch(err) {
      await pushSystemMessage('Command pipeline crashed.');
    }
  };

  return (
    <div 
       className={`fixed top-0 left-0 w-[100vw] bg-[#1e1e1e]/95 backdrop-blur-md border-b border-gray-700 shadow-xl z-[999999] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col overflow-hidden font-mono ${isOpen ? 'h-[50vh] opacity-100 pointer-events-auto' : 'h-0 opacity-0 pointer-events-none'}`}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 bg-gray-900/40 text-gray-300 px-4 py-2 text-xs font-bold border-b border-gray-700 shadow-inner uppercase tracking-widest relative z-10">
         <Terminal className="w-3 h-3 text-gray-400" /> SYSTEM CONSOLE // ROOT
      </div>
      
      {/* History Area */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4 space-y-1 text-xs">
           {history.map((h, i) => (
              <div key={i} className={h.type === 'cmd' 
                 ? 'text-slate-100 font-bold mt-2' 
                 : 'text-gray-400 pl-4 border-l-2 border-gray-600'}>
                 {h.text}
              </div>
           ))}
           
           {/* Live Telemetry Overlay */}
           {isCalibrating && (
              <div className="mt-6 border border-gray-700 bg-gray-800/40 p-4 rounded-lg flex flex-col gap-2 font-mono text-xs text-slate-300 max-w-[400px]">
                 <div className="flex items-center justify-between text-[10px] text-gray-500 border-b border-gray-700 pb-2 mb-1">
                    <span className="flex items-center gap-2 font-bold uppercase tracking-widest"><Crosshair className="w-3 h-3" /> CHRONOS TELEMETRY [LIVE]</span>
                    <span className="text-gray-400 animate-pulse">● REC</span>
                 </div>
                 
                 {chronosSensors.error ? (
                    <div className="text-amber-500 py-2">[SYS_FAULT: {chronosSensors.error}]</div>
                 ) : (
                    <>
                       <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-gray-500"><MapPin className="w-3 h-3" /> LATITUDE</span>
                          <span className="font-bold text-slate-200">{chronosSensors.lat !== null ? chronosSensors.lat.toFixed(6) : 'AQUIRING_SAT...'}</span>
                       </div>
                       <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-gray-500"><MapPin className="w-3 h-3" /> LONGITUDE</span>
                          <span className="font-bold text-slate-200">{chronosSensors.lng !== null ? chronosSensors.lng.toFixed(6) : 'AQUIRING_SAT...'}</span>
                       </div>
                       <div className="flex justify-between items-center py-1">
                          <span className="flex items-center gap-2 text-gray-500"><Compass className="w-3 h-3" /> MAG_HEADING</span>
                          <span className="font-bold text-slate-200">{chronosSensors.heading !== null ? `${chronosSensors.heading.toFixed(1)}°` : 'CALIBRATING_GYRO...'}</span>
                       </div>
                    </>
                 )}
              </div>
           )}
        </div>
      </div>
      
      {/* Input Line */}
      <form onSubmit={handleExecute} className="flex items-center bg-[#181818] p-3 border-t border-gray-700 gap-2">
         <span className="text-slate-400 font-bold text-sm whitespace-nowrap">system@local:~%</span>
         <input 
            ref={inputRef}
            type="text" 
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
            className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-sm caret-slate-400"
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Escape') setIsOpen(false);
            }}
         />
      </form>
    </div>
  );
}
