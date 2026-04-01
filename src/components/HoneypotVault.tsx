import { useState } from 'react';
import { Database, Search, Lock, Download, Trash2, FileText } from 'lucide-react';

interface FakeEntry {
  id: string;
  title: string;
  type: string;
  date: string;
  content: string;
}

const FAKE_DOCUMENTS: FakeEntry[] = [
  {
    id: 'f-1',
    title: 'Q3 Marketing Budget Draft',
    type: 'SPREADSHEET',
    date: 'Oct 14, 2025',
    content: 'Total allocation: $450,000. Social Media $200k, Influencer $150k, Events $100k...'
  },
  {
    id: 'f-2',
    title: 'Apartment Lease Agreement - Unit 4B',
    type: 'DOCUMENT',
    date: 'Nov 02, 2025',
    content: 'The tenant agrees to pay $2,400 monthly rent. No pets allowed without written consent...'
  },
  {
    id: 'f-3',
    title: 'Grocery List & Meal Prep',
    type: 'NOTE',
    date: 'Yesterday',
    content: 'Oats, Almond Milk, Chicken breast, Broccoli, Brown Rice, Apples...'
  },
  {
    id: 'f-4',
    title: 'Gym Routine (Push/Pull/Legs)',
    type: 'NOTE',
    date: 'Last Week',
    content: 'Push: Bench 4x8, OHP 3x10, Tricep pushdowns 3x12. Pull: Pullups 4x8, Rows 3x10. Legs: Squats 4x8...'
  }
];

export default function HoneypotVault() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<FakeEntry | null>(null);

  const filtered = FAKE_DOCUMENTS.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border-t-4 border-t-emerald-500/50">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              SecureVault <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase tracking-widest border border-red-500/30">Honeypot Active</span>
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Local Storage Drive (C:)
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-white/5 flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search personal files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:border-emerald-500/50 outline-none"
          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden min-h-[400px]">
        {/* List */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto">
          {filtered.map(entry => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                selectedEntry?.id === entry.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-400' : 'hover:bg-white/5 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono font-bold text-gray-300 truncate pr-2">
                  {entry.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span className="uppercase text-emerald-400/70">{entry.type}</span>
                <span>{entry.date}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500 font-mono">
              No files found.
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="w-2/3 bg-black/20 flex flex-col">
          {selectedEntry ? (
            <div className="flex-1 flex flex-col h-full animate-fade-in p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-200 mb-1">{selectedEntry.title}</h4>
                  <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Lock className="w-3 h-3" /> Unlocked
                    </span>
                    <span>|</span>
                    <span>{selectedEntry.date}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 overflow-y-auto relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedEntry.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm font-mono">Select a file to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
