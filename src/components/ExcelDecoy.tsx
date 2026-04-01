import { useState } from 'react';

export default function ExcelDecoy() {
  const [focusedCell, setFocusedCell] = useState('B3');
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const rows = Array.from({ length: 40 }, (_, i) => i + 1);

  const [fakeData, setFakeData] = useState<Record<string, string>>({
    'A1': 'Q3 Corporate Budget',
    'B2': 'Category', 'C2': 'Projected', 'D2': 'Actual', 'E2': 'Variance',
    'B3': 'Marketing', 'C3': '$45,000', 'D3': '$42,500', 'E3': '5.56%',
    'B4': 'R&D', 'C4': '$120,000', 'D4': '$135,000', 'E4': '-12.5%',
    'B5': 'Operations', 'C5': '$85,000', 'D5': '$80,000', 'E5': '5.88%',
    'B6': 'Travel', 'C6': '$15,000', 'D6': '$18,200', 'E6': '-21.3%',
    'B7': 'Software', 'C7': '$30,000', 'D7': '$29,000', 'E7': '3.33%',
    'B8': 'Total', 'C8': '$295,000', 'D8': '$304,700', 'E8': '-3.28%',
  });

  const [activeTab, setActiveTab] = useState('Home');
  const [cellStyles, setCellStyles] = useState<Record<string, React.CSSProperties>>({
     'A1': { fontWeight: 'bold', fontSize: '14px' },
     'B2': { fontWeight: 'bold' }, 'C2': { fontWeight: 'bold' }, 'D2': { fontWeight: 'bold' }, 'E2': { fontWeight: 'bold' },
     'B8': { fontWeight: 'bold' }, 'C8': { fontWeight: 'bold' }, 'D8': { fontWeight: 'bold' }, 'E8': { fontWeight: 'bold' },
  });

  const toggleStyle = (prop: keyof React.CSSProperties, value: any, fallback: any = undefined) => {
    setCellStyles(prev => {
      const current = prev[focusedCell]?.[prop];
      return {
        ...prev,
        [focusedCell]: {
          ...prev[focusedCell],
          [prop]: current === value ? fallback : value
        }
      };
    });
  };

  const applyCurrency = () => {
    setFakeData(prev => {
      const val = prev[focusedCell];
      if (!val) return prev;
      const num = parseFloat(val.replace(/[^0-9.-]+/g,""));
      if (isNaN(num)) return prev;
      return { ...prev, [focusedCell]: num.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) };
    });
  };

  const applyPercent = () => {
    setFakeData(prev => {
      const val = prev[focusedCell];
      if (!val) return prev;
      const num = parseFloat(val.replace(/[^0-9.-]+/g,""));
      if (isNaN(num)) return prev;
      return { ...prev, [focusedCell]: (num / 100).toLocaleString('en-US', { style: 'percent', minimumFractionDigits: 1 }) };
    });
  };

  return (
    <div className="flex flex-col h-[100vh] w-[100vw] bg-white text-gray-800 font-sans cursor-default select-none overflow-hidden">
      {/* Excel Header */}
      <div className="flex items-center justify-between bg-[#107c41] text-white px-2 py-1 select-none shadow-md z-10 relative">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 font-semibold ml-2">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM12.8 19h-2l-1.6-3.3-1.6 3.3H5.4l2.5-4.5-2.2-4.1h2.1l1.3 2.9 1.4-2.9h1.9l-2.2 4.1 2.6 4.5z"/></svg>
            Excel
          </div>
          <span className="opacity-80">|</span>
          {['File', 'Home', 'Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].map(tab => (
             <span 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 rounded cursor-pointer transition ${activeTab === tab ? 'bg-white text-[#107c41] font-bold shadow-sm' : 'font-semibold hover:bg-white/10 text-white/90'}`}
             >
                {tab}
             </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 bg-white/10 rounded cursor-pointer hover:bg-white/20 transition mix-blend-screen shadow-inner">Share</span>
        </div>
      </div>

      {/* Ribbon */}
      <div className="flex items-center bg-[#f3f2f1] border-b border-gray-300 py-1.5 px-3 gap-4 text-xs select-none relative z-10 shadow-sm h-[42px]">
        {activeTab === 'Home' ? (
           <>
              <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                <div onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.fontWeight === 'bold' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>B</div>
                <div onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center italic cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.fontStyle === 'italic' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>I</div>
                <div onClick={() => toggleStyle('textDecoration', 'underline', 'none')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center underline cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.textDecoration === 'underline' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>U</div>
              </div>
              <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                <select 
                  className="bg-white border text-black border-gray-300 rounded px-1 py-0.5 text-xs outline-none shadow-sm cursor-pointer" 
                  value={cellStyles[focusedCell]?.fontFamily || 'Calibri'}
                  onChange={(e) => toggleStyle('fontFamily', e.target.value)}
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                </select>
                <select 
                  className="bg-white border text-black border-gray-300 rounded px-1 py-0.5 text-xs outline-none shadow-sm cursor-pointer" 
                  value={cellStyles[focusedCell]?.fontSize || '11px'}
                  onChange={(e) => toggleStyle('fontSize', e.target.value)}
                >
                  <option value="11px">11</option>
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="18px">18</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                <div onClick={() => toggleStyle('textAlign', 'left', 'left')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.textAlign === 'left' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>L</div>
                <div onClick={() => toggleStyle('textAlign', 'center', 'left')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.textAlign === 'center' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>C</div>
                <div onClick={() => toggleStyle('textAlign', 'right', 'left')} className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition ${cellStyles[focusedCell]?.textAlign === 'right' ? 'bg-gray-300' : 'bg-white hover:bg-gray-200'}`}>R</div>
              </div>
              <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                <div onClick={applyCurrency} className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition text-green-700 font-bold">$</div>
                <div onClick={applyPercent} className="w-6 h-6 bg-white hover:bg-gray-200 border border-gray-300 rounded flex items-center justify-center cursor-pointer shadow-sm transition font-bold">%</div>
              </div>
           </>
        ) : (
           <div className="flex items-center gap-6 text-gray-500 italic px-2">
              Ribbon controls for '{activeTab}' are restricted by your organization's IT policy.
           </div>
        )}
      </div>

      {/* Formula Bar */}
      <div className="flex items-center bg-white border-b border-gray-300 text-sm select-none relative z-10 shadow-sm">
        <div className="px-3 border-r border-gray-300 py-1 flex-shrink-0 w-16 text-center shadow-inner font-semibold text-black bg-[#f3f2f1]">{focusedCell}</div>
        <div className="px-2 border-r border-gray-300 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer flex-shrink-0 transition font-serif italic">fx</div>
        <input 
           className="px-3 py-1 flex-1 font-mono text-black outline-none border-none bg-transparent" 
           value={fakeData[focusedCell] || ''}
           onChange={(e) => setFakeData(prev => ({...prev, [focusedCell]: e.target.value}))}
           onKeyDown={(e) => e.stopPropagation()} 
           spellCheck={false}
        />
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
              const isHeader = row === 2 && col !== 'A';
              const isTotal = row === 8 && col !== 'A';
              
              return (
                <div 
                  key={cellId} 
                  onMouseDown={() => setFocusedCell(cellId)}
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
                    value={fakeData[cellId] || ''}
                    onChange={(e) => setFakeData(prev => ({...prev, [cellId]: e.target.value}))}
                    style={cellStyles[cellId] || {}}
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
  );
}
