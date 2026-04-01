import { useState, useEffect, useRef } from 'react';
import PatternLock from './PatternLock';

/**
 * Corporate Camouflage
 * The //nexus and //mirage key sequences unlock the real application.
 */

function TeamsDecoy({ hasBooted }: { hasBooted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!hasBooted) return;
    
    let stream: MediaStream | null = null;
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera access denied in DecoyOS');
      }
    }
    setupCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#201f1f] text-white font-sans cursor-default select-none relative overflow-hidden">
      {/* Teams Header */}
      <div className="flex items-center justify-between bg-[#201f1f] px-4 py-2 border-b border-gray-700">
        <div className="font-semibold text-lg flex items-center gap-2">
           <svg viewBox="0 0 24 24" width="20" height="20" fill="#5A5EB9"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
           Microsoft Teams
        </div>
        <div className="text-sm font-medium bg-[#11100f] px-4 py-1.5 rounded-md border border-gray-700 shadow-inner">Sprint Planning - Q3 Tactical</div>
        <div className="flex gap-3 text-sm items-center">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold shadow-md">OP</span>
        </div>
      </div>

      {/* Main Gallery */}
      <div className="flex-1 p-6 bg-[#11100f] flex items-center justify-center relative shadow-inner">
        <div className="relative w-full max-w-5xl aspect-video bg-[#201f1f] rounded-xl overflow-hidden shadow-2xl border border-gray-800 ring-1 ring-white/5">
           {/* Blurred Webcam */}
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className="w-full h-full object-cover backdrop-blur-3xl filter blur-[15px] transform scale-105" 
           />
           <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 shadow-lg">You (Blurred Background)</div>
           
           {/* Fake Participants Grid overlay */}
           <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4 pointer-events-none opacity-40 mix-blend-screen">
              <div className="bg-gradient-to-br from-[#2a2928] to-[#1a1918] rounded-xl flex items-center justify-center border border-gray-700/50 shadow-inner">
                <div className="w-20 h-20 rounded-full bg-indigo-600/30 flex items-center justify-center text-2xl font-bold shadow-lg">JD</div>
              </div>
              <div className="bg-gradient-to-br from-[#2a2928] to-[#1a1918] rounded-xl flex items-center justify-center border border-gray-700/50 shadow-inner">
                <div className="w-20 h-20 rounded-full bg-emerald-600/30 flex items-center justify-center text-2xl font-bold shadow-lg">SM</div>
              </div>
              <div className="bg-gradient-to-br from-[#2a2928] to-[#1a1918] rounded-xl flex items-center justify-center border border-gray-700/50 shadow-inner">
                <div className="w-20 h-20 rounded-full bg-orange-600/30 flex items-center justify-center text-2xl font-bold shadow-lg">RW</div>
              </div>
              <div className="bg-gradient-to-br from-[#2a2928] to-[#1a1918] rounded-xl flex items-center justify-center border border-gray-700/50 shadow-inner">
                <div className="w-20 h-20 rounded-full bg-pink-600/30 flex items-center justify-center text-2xl font-bold shadow-lg">TK</div>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-[#201f1f] h-20 flex items-center justify-center gap-6 border-t border-gray-700 shadow-2xl">
        <button className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-gray-700 transition border border-transparent hover:border-gray-600">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        </button>
        <button className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-gray-700 transition border border-transparent hover:border-gray-600">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        </button>
        <button className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-gray-700 transition border border-transparent hover:border-gray-600">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20 18H4V6h16v12zM4 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4zm6 10l-4-4 4-4v8z"/></svg>
        </button>
        <button className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#c4314b] hover:bg-[#a3273e] text-white font-bold transition shadow-lg ml-6">
          Leave
        </button>
      </div>
    </div>
  );
}

interface DecoyOSProps {
  onUnlock?: (mode: 'real' | 'honeypot') => void;
  hasBooted?: boolean;
}

export default function DecoyOS({ onUnlock, hasBooted }: DecoyOSProps) {
  const [focusedCell, setFocusedCell] = useState('B3');
  const [decoyMode, setDecoyMode] = useState<'excel' | 'teams'>('excel');
  const [showPatternLock, setShowPatternLock] = useState<'real' | 'honeypot' | null>(null);

  // Matrix generation
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const rows = Array.from({ length: 40 }, (_, i) => i + 1);

  // Fake Data
  const fakeData: Record<string, string> = {
    'A1': 'Q3 Corporate Budget',
    'B2': 'Category', 'C2': 'Projected', 'D2': 'Actual', 'E2': 'Variance',
    'B3': 'Marketing', 'C3': '$45,000', 'D3': '$42,500', 'E3': '5.56%',
    'B4': 'R&D', 'C4': '$120,000', 'D4': '$135,000', 'E4': '-12.5%',
    'B5': 'Operations', 'C5': '$85,000', 'D5': '$80,000', 'E5': '5.88%',
    'B6': 'Travel', 'C6': '$15,000', 'D6': '$18,200', 'E6': '-21.3%',
    'B7': 'Software', 'C7': '$30,000', 'D7': '$29,000', 'E7': '3.33%',
    'B8': 'Total', 'C8': '$295,000', 'D8': '$304,700', 'E8': '-3.28%',
  };

  // Keyboard event listeners nuked per user override. Trigger is now UI-based.

  return (
    <>
      {decoyMode === 'excel' ? (
        <div className="flex flex-col h-screen w-full bg-white text-gray-800 font-sans cursor-default select-none transition-opacity duration-300">
          {/* Excel Header */}
          <div className="flex items-center justify-between bg-[#107c41] text-white px-2 py-1 select-none shadow-md z-10 relative">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 font-semibold ml-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM12.8 19h-2l-1.6-3.3-1.6 3.3H5.4l2.5-4.5-2.2-4.1h2.1l1.3 2.9 1.4-2.9h1.9l-2.2 4.1 2.6 4.5z"/></svg>
                Excel
              </div>
              <span className="opacity-80">|</span>
              <span className="font-semibold px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">File</span>
              <span className="font-semibold px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Home</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Insert</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Draw</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Page Layout</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Formulas</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Data</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">Review</span>
              <span className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition">View</span>
              <span 
                className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition text-white/90" 
                onClick={() => setShowPatternLock('real')}
              >
                Help
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm px-3 py-1 bg-white/10 rounded cursor-pointer hover:bg-white/20 transition mix-blend-screen shadow-inner">Share</span>
            </div>
          </div>

          {/* Ribbon */}
          <div className="flex items-center bg-[#f3f2f1] border-b border-gray-300 py-1.5 px-3 gap-4 text-xs select-none relative z-10 shadow-sm">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <div className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition">B</div>
              <div className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center italic cursor-pointer shadow-sm transition">I</div>
              <div className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center underline cursor-pointer shadow-sm transition">U</div>
            </div>
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <select className="bg-white border text-black border-gray-300 rounded px-1 py-0.5 text-xs outline-none shadow-sm cursor-pointer">
                <option>Calibri</option>
                <option>Arial</option>
              </select>
              <select className="bg-white border text-black border-gray-300 rounded px-1 py-0.5 text-xs outline-none shadow-sm cursor-pointer">
                <option>11</option>
                <option>12</option>
                <option>14</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition">$</div>
              <div className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition">%</div>
            </div>
          </div>

          {/* Formula Bar */}
          <div className="flex items-center bg-white border-b border-gray-300 text-sm select-none relative z-10 shadow-sm">
            <div className="px-3 border-r border-gray-300 py-1 flex-shrink-0 w-16 text-center shadow-inner font-semibold text-black bg-[#f3f2f1]">{focusedCell}</div>
            <div className="px-2 border-r border-gray-300 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer flex-shrink-0 transition font-serif italic">fx</div>
            <div className="px-3 py-1 flex-1 font-mono text-black">{fakeData[focusedCell] || ''}</div>
          </div>

          {/* Grid */}
          <div 
            className="flex-1 overflow-auto bg-[#e6e6e6]"
            onKeyDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          >
            <div className="flex">
              <div className="w-10 flex-shrink-0 bg-[#f3f2f1] border-r border-b border-gray-300 sticky left-0 z-20 shadow-sm"></div>
              {cols.map((col) => (
                <div key={col} className="w-24 flex-shrink-0 bg-[#f3f2f1] border-r border-b border-gray-300 text-center py-1 text-xs text-black shadow-sm font-semibold sticky top-0 z-10 hover:bg-[#e1dfdd] cursor-pointer transition-colors">
                  {col}
                </div>
              ))}
            </div>
            
            {rows.map((row) => (
              <div key={row} className="flex">
                <div className="w-10 flex-shrink-0 bg-[#f3f2f1] border-r border-b border-gray-300 text-center text-xs py-1.5 text-black font-semibold sticky left-0 shadow-sm hover:bg-[#e1dfdd] cursor-pointer transition-colors">
                  {row}
                </div>
                {cols.map((col) => {
                  const cellId = `${col}${row}`;
                  const isFocused = focusedCell === cellId;
                  const val = fakeData[cellId] || '';
                  const isHeader = row === 2 && col !== 'A';
                  const isTotal = row === 8 && col !== 'A';
                  
                  return (
                    <div 
                      key={cellId} 
                      onMouseDown={() => {
                        setFocusedCell(cellId);
                      }}
                      className={`
                        w-24 flex-shrink-0 border-r border-b border-gray-300 px-0 py-0 text-xs text-black bg-white overflow-hidden whitespace-nowrap
                        ${isFocused ? 'border-2 border-[#107c41] outline-none z-0 relative shadow-[0_0_0_2px_rgba(16,124,65,0.2)]' : ''}
                        ${isHeader ? 'font-bold border-b-[3px] border-black bg-gray-50' : ''}
                        ${isTotal ? 'font-bold border-t-[3px] border-black bg-gray-100' : ''}
                      `}
                    >
                      <input 
                        type="text" 
                        className="w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-1.5 py-1.5 font-inherit cursor-text" 
                        defaultValue={val} 
                        onKeyDown={(e) => e.stopPropagation()} 
                        spellCheck={false}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tabs / Footer */}
          <div className="flex items-center justify-between bg-[#f3f2f1] border-t border-gray-300 text-xs px-2 py-1 select-none relative z-10 shadow-md">
            <div className="flex items-center">
              <div className="px-2 py-1 text-gray-500 hover:bg-gray-200 rounded cursor-pointer mr-2 transition">◀ ▶</div>
              <div className="px-4 py-1.5 bg-white border-b-[3px] border-[#107c41] font-bold text-[#107c41] cursor-pointer shadow-sm z-10 relative">Sheet1</div>
              <div className="px-4 py-1.5 text-black hover:bg-gray-200 cursor-pointer font-medium transition">Expenses</div>
              <div className="px-4 py-1.5 text-black hover:bg-gray-200 cursor-pointer font-medium transition">Revenue</div>
              <div className="px-3 py-1.5 text-black hover:bg-gray-200 rounded cursor-pointer ml-2 text-lg leading-none transition">+</div>
            </div>
            <div className="flex items-center gap-4 text-gray-600 px-4 font-semibold text-black">
              <span>Ready</span>
              <span className="flex items-center gap-1 font-mono">100% <span className="text-gray-400">-</span><input type="range" className="w-20 accent-[#107c41]" /><span className="text-gray-400">+</span></span>
            </div>
          </div>
        </div>
      ) : (
        <TeamsDecoy hasBooted={hasBooted} />
      )}

      {/* Secret Stealth Mode Overlay Toggle */}
      <div className="fixed bottom-3 right-4 z-[90]">
        <button 
          onClick={() => setDecoyMode(m => m === 'excel' ? 'teams' : 'excel')} 
          className="text-[10px] text-gray-400/50 hover:text-gray-400 transition-colors uppercase tracking-widest font-mono"
        >
          {decoyMode === 'excel' ? '/// TEAMS' : '/// EXCEL'}
        </button>
      </div>

      {showPatternLock && (
        <PatternLock 
          onSuccess={() => onUnlock?.(showPatternLock)}
          onDuress={() => {
            console.warn('[DURESS PROTOCOL] Secondary Pattern Registered. Evacuating DB constructs.');
            const dbs = ['deep-cover-evidence-locker', 'DeepCoverLocker', 'IntruderLogs'];
            dbs.forEach(db => window.indexedDB.deleteDatabase(db));
            localStorage.clear();
            sessionStorage.clear();
            onUnlock?.('honeypot');
            setShowPatternLock(null);
          }}
          onCancel={() => setShowPatternLock(null)}
        />
      )}
    </>
  );
}
