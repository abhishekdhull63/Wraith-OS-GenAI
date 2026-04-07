/**
 * VaultInterrogation.tsx
 * ======================
 * Global Database Search — Local RAG UI for the Evidence Locker.
 *
 * Searches all IndexedDB entries in real-time as the user types.
 * Highlights matching keywords across content, labels, and threat levels.
 * Zero external dependencies — powered by native browser APIs only.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Database,
  FileText,
  Shield,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  AlertTriangle,
} from 'lucide-react';
import { getAllEntries } from '../lib/locker';
import type { SecureEntry } from '../lib/locker';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface VaultInterrogationProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
  /** Pushes selected content into the Traffic Anomaly Engine */
  onLoadToAnalyzer?: (content: string) => void;
  /** Force re-query when vault changes */
  refreshKey?: number;
}

interface SearchMatch {
  entry: SecureEntry;
  /** Text fragments with match highlights */
  contentFragments: HighlightFragment[];
  labelFragments: HighlightFragment[];
  matchCount: number;
}

interface HighlightFragment {
  text: string;
  isMatch: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Split text into fragments, marking substrings that match the query.
 * Case-insensitive.
 */
function highlightText(text: string, query: string): HighlightFragment[] {
  if (!query.trim()) return [{ text, isMatch: false }];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      isMatch: regex.test(part) || part.toLowerCase() === query.toLowerCase(),
    }));
}

/**
 * Count total keyword occurrences in a string.
 */
function countMatches(text: string, query: string): number {
  if (!query.trim()) return 0;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return (text.match(regex) || []).length;
}

/**
 * Extract a context window around the first match.
 */
function extractContext(text: string, query: string, windowChars = 150): string {
  if (!query.trim()) return text.slice(0, windowChars * 2);

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, windowChars * 2);

  const start = Math.max(0, idx - windowChars);
  const end = Math.min(text.length, idx + query.length + windowChars);

  let fragment = text.slice(start, end);
  if (start > 0) fragment = '…' + fragment;
  if (end < text.length) fragment = fragment + '…';

  return fragment;
}

// ─── Threat Level Colors ────────────────────────────────────────────────────────

const THREAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  MODERATE: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

function getThreatColors(level: string) {
  const key = Object.keys(THREAT_COLORS).find((k) => level.toUpperCase().includes(k));
  return THREAT_COLORS[key || 'MODERATE'];
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function VaultInterrogation({ onLog, onLoadToAnalyzer, refreshKey }: VaultInterrogationProps) {
  const [query, setQuery] = useState('');
  const [executedQuery, setExecutedQuery] = useState('');
  const [allEntries, setAllEntries] = useState<SecureEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load entries from IndexedDB ─────────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await getAllEntries();
      setAllEntries(entries);
    } catch {
      /* Failed to load vault entries */
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + re-load on refreshKey change
  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshKey]);

  // ── Filter & Rank Results ───────────────────────────────────────────────────
  const searchResults: SearchMatch[] = useMemo(() => {
    if (!executedQuery.trim()) return [];

    const q = executedQuery.trim();

    const matches: SearchMatch[] = [];

    for (const entry of allEntries) {
      const contentCount = countMatches(entry.content, q);
      const labelCount = countMatches(entry.label, q);
      const threatCount = countMatches(entry.threat_level, q);
      const idCount = countMatches(entry.id, q);
      const hashCount = countMatches(entry.digital_fingerprint, q);

      const totalMatches = contentCount + labelCount + threatCount + idCount + hashCount;

      if (totalMatches === 0) continue;

      const contextFragment = extractContext(entry.content, q);

      matches.push({
        entry,
        contentFragments: highlightText(contextFragment, q),
        labelFragments: highlightText(entry.label, q),
        matchCount: totalMatches,
      });
    }

    // Sort by match count descending
    matches.sort((a, b) => b.matchCount - a.matchCount);

    return matches;
  }, [executedQuery, allEntries]);

  const handleClear = useCallback(() => {
    setQuery('');
    setExecutedQuery('');
    setExpandedId(null);
    inputRef.current?.focus();
  }, []);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-IN', {
      hour12: false,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Database className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-100">Vault Interrogation</h3>
          <p className="text-xs text-gray-500">
            Global Database Search · {allEntries.length} record{allEntries.length !== 1 ? 's' : ''} indexed
          </p>
        </div>
        {executedQuery && searchResults.length > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
            {searchResults.length} HIT{searchResults.length !== 1 ? 'S' : ''}
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const q = query.trim();
              setExecutedQuery(q);
              if (q.length > 2) {
                onLog?.('INFO', `🔍 Vault search: "${q}"`);
              }
            }
          }}
          placeholder="Search intel files… (names, threats, content) — press Enter to search"
          spellCheck={false}
          autoComplete="off"
          className="
            w-full pl-12 pr-10 py-3.5
            text-sm font-mono text-gray-200
            bg-black/40 border border-white/10 rounded-xl
            placeholder:text-gray-600
            focus:outline-none focus:border-amber-500/40 focus:bg-black/50
            focus:shadow-[0_0_20px_rgba(245,158,11,0.08)]
            transition-all duration-300
          "
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {executedQuery.trim().length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-3 font-mono">Querying locker…</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Shield className="w-8 h-8 text-gray-700 mx-auto" />
              <p className="text-sm text-gray-500">No matching intelligence found</p>
              <p className="text-[10px] text-gray-600 font-mono">Try different keywords or broader search terms</p>
            </div>
          ) : (
            searchResults.map((match) => {
              const isExpanded = expandedId === match.entry.id;
              const threatColors = getThreatColors(match.entry.threat_level);

              return (
                <div
                  key={match.entry.id}
                  className="
                    rounded-xl border border-white/5
                    bg-white/[0.015] hover:bg-white/[0.03]
                    transition-all duration-200
                    overflow-hidden
                  "
                >
                  {/* Result Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : match.entry.id)}
                    className="w-full text-left p-4 flex items-start gap-3 cursor-pointer"
                  >
                    <div className="mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Label with highlights */}
                      <p className="text-sm font-semibold text-gray-200 truncate">
                        <FileText className="w-3.5 h-3.5 inline mr-1.5 text-gray-500" />
                        {match.labelFragments.map((f, i) =>
                          f.isMatch ? (
                            <mark key={i} className="bg-amber-400/20 text-amber-300 rounded px-0.5">
                              {f.text}
                            </mark>
                          ) : (
                            <span key={i}>{f.text}</span>
                          ),
                        )}
                      </p>

                      {/* Content preview with highlights */}
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                        {match.contentFragments.map((f, i) =>
                          f.isMatch ? (
                            <mark key={i} className="bg-amber-400/20 text-amber-300 rounded px-0.5">
                              {f.text}
                            </mark>
                          ) : (
                            <span key={i}>{f.text}</span>
                          ),
                        )}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full border ${threatColors.bg} ${threatColors.text} ${threatColors.border}`}
                        >
                          {match.entry.threat_level}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(match.entry.timestamp)}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">{match.entry.type}</span>
                        <span className="text-[10px] text-amber-500/70 font-mono font-bold">
                          {match.matchCount} match{match.matchCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 animate-fade-in">
                      <div className="h-px bg-white/5" />

                      {/* Full content with highlighting */}
                      <div
                        className="
                          p-3 rounded-lg bg-black/40 border border-white/5
                          font-mono text-xs text-gray-300 leading-relaxed
                          max-h-[250px] overflow-y-auto whitespace-pre-wrap
                        "
                      >
                        {highlightText(match.entry.content, executedQuery).map((f, i) =>
                          f.isMatch ? (
                            <mark key={i} className="bg-amber-400/25 text-amber-300 rounded px-0.5">
                              {f.text}
                            </mark>
                          ) : (
                            <span key={i}>{f.text}</span>
                          ),
                        )}
                      </div>

                      {/* Hash & ID */}
                      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600">
                        <span className="flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" />
                          SHA-256: {match.entry.digital_fingerprint.slice(0, 24)}…
                        </span>
                        <span>ID: {match.entry.id}</span>
                      </div>

                      {/* Action: Load to Analyzer */}
                      {onLoadToAnalyzer && (
                        <button
                          onClick={() => {
                            onLoadToAnalyzer(match.entry.content);
                            onLog?.('INFO', `📋 Loaded ${match.entry.id} into Traffic Anomaly Engine`);
                          }}
                          className="
                            w-full py-2.5 text-xs font-semibold text-amber-400
                            bg-amber-500/5 border border-amber-500/20 rounded-lg
                            hover:bg-amber-500/10 hover:border-amber-500/30
                            transition-all duration-200 flex items-center justify-center gap-2
                            cursor-pointer
                          "
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Load into Traffic Anomaly Engine
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Empty state (no search yet) */}
      {!executedQuery.trim() && allEntries.length > 0 && (
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-gray-600 font-mono">
            {allEntries.length} classified file{allEntries.length !== 1 ? 's' : ''} ready for interrogation
          </p>
        </div>
      )}

      {!executedQuery.trim() && allEntries.length === 0 && !isLoading && (
        <div className="text-center py-6 space-y-2">
          <Database className="w-8 h-8 text-gray-700 mx-auto" />
          <p className="text-xs text-gray-600 font-mono">
            Vault is empty — analyze intel to populate the evidence locker
          </p>
        </div>
      )}
    </section>
  );
}
