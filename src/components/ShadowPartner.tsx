import { useState, useCallback, useEffect, useMemo } from 'react';
import { Radio, Shield } from 'lucide-react';

interface ShadowPartnerProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

export default function ShadowPartner({ onLog }: ShadowPartnerProps) {
  const [engaged, setEngaged] = useState(false);

  // The Escape Hatch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && engaged) {
        setEngaged(false);
        onLog?.('WARNING', '🌑 Shadow Mode Decoy deactivated via Escape key.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent background scrolling while decoy is active
    if (engaged) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [engaged, onLog]);

  const handleEngage = useCallback(() => {
    setEngaged(true);
    onLog?.('SUCCESS', '🌑 SHADOW MODE ENGAGED — Decoy spreadsheet active.');
  }, [onLog]);

  // Generate fake spreadsheet rows (stabilized with useMemo)
  const rows = useMemo(() => {
    const generatedRows: React.ReactNode[] = [];
    const labels = ["Q3 Revenue", "Server Maintenance", "Marketing Q2", "Legal Retainer", "Office Supplies", "Vendor Payout", "Contractor 1", "Travel Exp", "Cloud AWS", "Insurance", "Payroll Tax", "Bonus Pool", "Catered Lunch", "Hardware UP", "Software Lic", "Consulting", "Event Sponsorship", "Utilities", "Recruiting", "Misc Exp"];
    const statuses = ["Paid", "Pending", "Overdue", "Processing", "Approved"];
    
    for (let i = 1; i <= 20; i++) {
      const amount = (Math.random() * 50000 + 1000).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const status = statuses[i % 5];
      generatedRows.push(
        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-xs">
          <td className="w-8 bg-gray-100 text-center border-r border-gray-300 text-gray-500 font-normal">{i}</td>
          <td className="p-0 border-r border-gray-200">
            <input type="text" className="w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-2 py-1 font-inherit cursor-text" defaultValue={labels[i-1]} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          </td>
          <td className="p-0 border-r border-gray-200 font-mono text-right">
            <input type="text" className="w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-2 py-1 font-inherit cursor-text text-right" defaultValue={amount} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          </td>
          <td className="p-0 border-r border-gray-200">
            <input type="text" className="w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-2 py-1 font-inherit cursor-text" defaultValue={`2026-03-${String((i % 28) + 1).padStart(2, '0')}`} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          </td>
          <td className="p-0 border-r border-gray-200">
            <input type="text" className={`w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-2 py-1 font-inherit cursor-text font-semibold ${status === 'Paid' ? 'text-green-700' : status === 'Overdue' ? 'text-red-700' : 'text-gray-700'}`} defaultValue={status} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          </td>
          <td className="p-0">
            <input type="text" className="w-full h-full bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 border-none m-0 px-2 py-1 font-inherit cursor-text" defaultValue={`INV-${1000 + i}`} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          </td>
        </tr>
      );
    }
    return generatedRows;
  }, []);

  return (
    <>
      {/* ── FULL SCREEN SPREADSHEET DECOY ── */}
      {engaged && (
        <div 
          className="fixed inset-0 z-[9999] bg-white text-black flex flex-col font-sans select-none overflow-hidden overscroll-none"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Fake OS Window Header / Ribbon */}
          <div className="bg-[#f3f2f1] border-b border-[#e1dfdd] flex flex-col">
            <div className="flex items-center px-4 py-2 gap-4 text-sm">
              <div className="font-semibold text-green-700 flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded-sm text-white flex items-center justify-center font-bold text-[10px]">X</div>
                Q3_Financials_Draft.xlsx
              </div>
              <div className="flex gap-4 text-gray-600 ml-4">
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">File</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">Home</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer border-b-2 border-green-600 text-black">Insert</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">Layout</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">Formulas</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">Data</span>
                <span className="hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer">Review</span>
              </div>
            </div>
            
            {/* Fake Toolbar */}
            <div className="bg-white border-b border-[#e1dfdd] px-4 py-1.5 flex items-center gap-6 shadow-sm overflow-hidden">
               <div className="flex gap-1 border-r border-gray-300 pr-4">
                 <div className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 font-serif font-bold italic">I</div>
                 <div className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold underline">U</div>
                 <div className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 line-through">ab</div>
               </div>
               <div className="flex gap-2 items-center border-r border-gray-300 pr-4">
                 <select className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-700 outline-none"><option>Calibri</option><option>Arial</option></select>
                 <select className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-700 outline-none"><option>11</option><option>12</option></select>
               </div>
               <div className="flex gap-4 text-gray-500 text-xs">
                 <span>Wrap Text</span>
                 <span>Merge & Center</span>
                 <span>$ % ,</span>
               </div>
            </div>
            
            {/* Fake Formula Bar */}
            <div className="flex items-center px-2 py-1 bg-white border-b border-[#e1dfdd] gap-2 text-sm shadow-sm">
               <div className="w-16 bg-gray-50 border border-gray-300 px-2 text-center text-gray-600">B2</div>
               <div className="px-2 font-mono text-gray-400">fx</div>
               <div className="flex-1 bg-white border border-gray-300 px-2 text-gray-700">Server Maintenance</div>
            </div>
          </div>

          {/* Spreadsheet Canvas */}
          <div className="flex-1 overflow-auto bg-[#f9f9f9] p-1">
            <table className="w-full bg-white border-collapse border border-gray-300 table-fixed">
              <thead>
                <tr className="bg-[#f3f2f1] text-gray-600 border-b border-gray-300 text-xs font-normal">
                  <th className="w-8 border-r border-gray-300 font-normal"></th>
                  <th className="w-48 border-r border-gray-300 font-normal py-1">A</th>
                  <th className="w-32 border-r border-gray-300 font-normal">B</th>
                  <th className="w-32 border-r border-gray-300 font-normal">C</th>
                  <th className="w-32 border-r border-gray-300 font-normal">D</th>
                  <th className="w-32 border-r border-gray-300 font-normal">E</th>
                  <th className="w-auto border-r border-gray-300 font-normal">F</th>
                </tr>
              </thead>
              <tbody>
                {/* Header Row */}
                <tr className="border-b border-gray-300 font-bold bg-gray-50 text-xs">
                   <td className="w-8 text-center border-r border-gray-300 text-gray-500 font-normal bg-gray-100">1</td>
                   <td className="px-2 py-1 border-r border-gray-300">Category</td>
                   <td className="px-2 py-1 border-r border-gray-300 text-right">Amount</td>
                   <td className="px-2 py-1 border-r border-gray-300">Date</td>
                   <td className="px-2 py-1 border-r border-gray-300">Status</td>
                   <td className="px-2 py-1 border-r border-gray-300">Invoice Ref</td>
                   <td className="px-2 py-1"></td>
                </tr>
                {/* Data Rows */}
                {rows}
              </tbody>
            </table>
          </div>
          
          {/* Fake Status Bar */}
          <div className="bg-[#f3f2f1] border-t border-[#e1dfdd] text-[10px] text-gray-500 px-4 py-1 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <span>Ready</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Calculate</span>
             </div>
             <div className="flex items-center gap-4">
                <span>Average: $26,100</span>
                <span>Count: 20</span>
                <span>Sum: $522,000</span>
                <div className="flex gap-1 ml-4 items-center">
                   <span className="border border-gray-300 rounded px-1">─</span>
                   <span>100%</span>
                   <span className="border border-gray-300 rounded px-1">+</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ── WIDGET TRIGGER (Only visible when dashboard is active) ── */}
      {!engaged && (
        <div className="transition-all duration-500">
          <button
            onClick={handleEngage}
            className="
              w-full flex items-center justify-center gap-3
              py-4 px-6
              text-sm font-bold tracking-wider
              text-gray-300 bg-white/[0.02]
              border border-white/10 rounded-xl
              hover:bg-cyan-500/5 hover:border-cyan-500/20 hover:text-cyan-400
              transition-all duration-300 cursor-pointer
              group
            "
          >
            <div className="relative">
              <Radio className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
              <div className="absolute inset-0 w-5 h-5 rounded-full group-hover:animate-ping group-hover:bg-cyan-400/20" />
            </div>
            <Shield className="w-4 h-4 opacity-50" />
            ENGAGE SHADOW MODE
          </button>
        </div>
      )}
    </>
  );
}
