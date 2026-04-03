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
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isError, setIsError] = useState(false);
  
  // Chronos Telemetry State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const chronosSensors = useChronosSensors(isCalibrating);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Live timestamp ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setCommandHistory(prev => [...prev, cmdLine]);
    setHistoryIndex(-1);
    setInputStr('');

    // Instant commands (no latency)
    if (command === 'clear') {
      setHistory([]);
      return;
    }
    if (command === 'chronos' && args[0] === '--calibrate') {
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
      return;
    }

    // Fake network latency for all other commands
    setHistory(h => [...h, { text: '[SYSTEM] Processing...', type: 'system' }]);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
    setHistory(h => h.filter(entry => entry.text !== '[SYSTEM] Processing...'));
    
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
      } else if (command === 'whoami') {
         await pushSystemMessage('UNAUTHORIZED QUERY. Access logged and reported to local authorities.');
      } else if (command === 'sudo') {
         await pushSystemMessage('Nice try. This incident will be reported.');
      } else {
         await pushSystemMessage(`bash: ${command}: command not found`);
         setIsError(true);
         setTimeout(() => setIsError(false), 300);
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
        {/* Scanline Overlay */}
        <div className="scanlines absolute inset-0 z-10" />
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto no-scrollbar p-4 space-y-1 text-xs">
           {history.map((h, i) => (
              <div key={i} className={h.type === 'cmd' 
                 ? 'text-slate-100 font-bold mt-2 text-glow-cyan' 
                 : 'text-gray-400 pl-4 border-l-2 border-gray-600 text-glow-cyan'}>
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
           <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Line — Invisible overlay pattern */}
      <form onSubmit={handleExecute} className={`flex items-center bg-[#181818] p-3 border-t border-gray-700 gap-2 ${isError ? 'animate-error-shake' : ''}`}>
         <span className="text-slate-400 font-bold text-sm whitespace-nowrap"><span className="opacity-50">[{timestamp}]</span> root@deep-cover:~#</span>
         <div className="flex-1 relative h-5">
            {/* Real input — invisible but captures all keystrokes */}
            <input 
               ref={inputRef}
               type="text" 
               autoCapitalize="off"
               autoComplete="off"
               spellCheck="false"
               className="absolute inset-0 w-full h-full bg-transparent border-none outline-none opacity-0 font-mono text-sm z-10"
               value={inputStr}
               onChange={(e) => setInputStr(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'ArrowUp') {
                     e.preventDefault();
                     setHistoryIndex(prev => {
                        const newIdx = prev === -1 ? commandHistory.length - 1 : Math.max(0, prev - 1);
                        if (commandHistory[newIdx]) setInputStr(commandHistory[newIdx]);
                        return newIdx;
                     });
                  }
                  if (e.key === 'ArrowDown') {
                     e.preventDefault();
                     setHistoryIndex(prev => {
                        const newIdx = prev + 1;
                        if (newIdx >= commandHistory.length) {
                           setInputStr('');
                           return -1;
                        }
                        setInputStr(commandHistory[newIdx]);
                        return newIdx;
                     });
                  }
               }}
            />
            {/* Visible text + block cursor */}
            <div className="flex items-center h-full pointer-events-none">
               <span className={`${isError ? 'text-red-500' : 'text-slate-200'} font-mono text-sm whitespace-pre transition-colors`}>{inputStr}</span>
               <span className={`${isError ? 'text-red-500' : 'text-cyan-400'} font-mono text-sm transition-colors`} style={{ animation: 'blink-cursor 1s step-end infinite' }}>█</span>
            </div>
         </div>
      </form>
    </div>
  );
}
