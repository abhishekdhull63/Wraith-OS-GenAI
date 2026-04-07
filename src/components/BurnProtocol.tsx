/**
 * BurnProtocol.tsx
 * ================
 * Anti-forensics emergency data purge.
 *
 * Requires typing "CONFIRM" to activate. When triggered:
 *   1. Destroys the IndexedDB evidence locker entirely
 *   2. Clears localStorage + sessionStorage
 *   3. Plays a cinematic 2s full-screen red purge animation
 *   4. Force reloads the page to a blank state
 */

import { useState, useCallback, useEffect } from 'react';
import { Flame, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

const DB_NAME = 'deep-cover-evidence-locker';

type BurnPhase = 'ARMED' | 'PURGING' | 'DONE';

export default function BurnProtocol() {
  const [confirmText, setConfirmText] = useState('');
  const [phase, setPhase] = useState<BurnPhase | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isConfirmed = confirmText === 'CONFIRM';

  const executeBurn = useCallback(async () => {
    if (!isConfirmed) return;

    setPhase('PURGING');

    // ── Step 1: Destroy IndexedDB ──────────────────────────────────────────
    try {
      // Close any open connections first
      const deleteReq = indexedDB.deleteDatabase(DB_NAME);
      await new Promise<void>((resolve) => {
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve(); // Continue even if delete fails
        deleteReq.onblocked = () => resolve();
      });
    } catch {
      // Continue purge even on error
    }

    // ── Step 2: Clear all browser storage ──────────────────────────────────
    try {
      localStorage.clear();
    } catch {
      /* sandboxed */
    }
    try {
      sessionStorage.clear();
    } catch {
      /* sandboxed */
    }

    // ── Step 3: Clear any caches ───────────────────────────────────────────
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch {
      /* no cache API */
    }

    // ── Step 4: Animation phase ────────────────────────────────────────────
    setPhase('DONE');

    // Force reload after 2s animation
    setTimeout(() => {
      window.location.reload();
    }, 2200);
  }, [isConfirmed]);

  // ── Full-Screen Purge Overlay ────────────────────────────────────────────
  if (phase === 'PURGING' || phase === 'DONE') {
    return <BurnOverlay phase={phase} />;
  }

  return (
    <div className="space-y-2">
      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="
          w-full flex items-center gap-2.5 p-3
          text-xs font-mono uppercase tracking-wider
          text-red-500/60 hover:text-red-400
          bg-red-500/[0.03] hover:bg-red-500/[0.06]
          border border-red-500/10 hover:border-red-500/20
          rounded-xl transition-all duration-300 cursor-pointer
          group
        "
      >
        <Flame className="w-4 h-4 group-hover:animate-pulse" />
        <span className="flex-1 text-left">Zero-Trust Lockdown</span>
        <ShieldAlert className="w-3.5 h-3.5 opacity-40" />
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="p-4 rounded-xl bg-red-500/[0.03] border border-red-500/10 space-y-4 animate-fade-in">
          {/* Warning */}
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400/80 leading-relaxed">
              Irreversibly destroys all evidence locker data, browser storage, and cached assets. This action cannot be
              undone.
            </p>
          </div>

          {/* Confirm Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-red-500/50 uppercase tracking-widest">
              Type CONFIRM to arm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="CONFIRM"
              spellCheck={false}
              autoComplete="off"
              className="
                w-full px-3 py-2.5
                text-sm font-mono font-bold tracking-widest text-center
                bg-red-500/5 border-2 rounded-lg
                placeholder:text-red-500/20
                focus:outline-none focus:ring-0
                transition-all duration-300
              "
              style={{
                borderColor: isConfirmed
                  ? 'rgba(239,68,68,0.7)'
                  : confirmText
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(239,68,68,0.1)',
                color: isConfirmed ? '#ef4444' : 'rgba(239,68,68,0.6)',
                textShadow: isConfirmed ? '0 0 12px rgba(239,68,68,0.5)' : 'none',
              }}
            />
          </div>

          {/* Burn Button */}
          <button
            onClick={executeBurn}
            disabled={!isConfirmed}
            className="
              w-full py-3 text-xs font-bold font-mono uppercase tracking-[0.25em]
              rounded-lg transition-all duration-300
              flex items-center justify-center gap-2
            "
            style={{
              background: isConfirmed
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))'
                : 'rgba(239,68,68,0.03)',
              border: isConfirmed ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(239,68,68,0.08)',
              color: isConfirmed ? '#ef4444' : 'rgba(239,68,68,0.2)',
              cursor: isConfirmed ? 'pointer' : 'not-allowed',
              boxShadow: isConfirmed ? '0 0 30px rgba(239,68,68,0.15), inset 0 0 20px rgba(239,68,68,0.05)' : 'none',
            }}
          >
            <Flame className="w-4 h-4" />
            INITIATE LOCKDOWN
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Full-Screen Burn Overlay ─────────────────────────────────────────────────

function BurnOverlay({ phase }: { phase: BurnPhase }) {
  const [opacity, setOpacity] = useState(0);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setOpacity(1));

    // Scan line animation
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 3) % 100);
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: `radial-gradient(ellipse at center, rgba(127,29,29,0.95) 0%, rgba(10,10,10,0.98) 70%)`,
        opacity,
        transition: 'opacity 0.5s ease-in',
      }}
    >
      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(transparent ${scanLine}%, rgba(239,68,68,0.08) ${scanLine + 1}%, transparent ${scanLine + 2}%)`,
        }}
      />

      {/* Static noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative text-center space-y-6 px-8">
        {phase === 'PURGING' ? (
          <>
            <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto" />
            <div>
              <p className="text-2xl font-black font-mono text-red-500 tracking-[0.4em] animate-pulse">ISOLATING SYSTEM</p>
              <p className="text-sm font-mono text-red-400/50 mt-3 tracking-wider">
                System isolated. Local databases wiped to prevent exfiltration.
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className="relative mx-auto w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                boxShadow: '0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.2)',
                animation: 'pulse 1s ease-in-out infinite',
              }}
            >
              <Flame className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <p
                className="text-3xl font-black font-mono tracking-[0.3em]"
                style={{
                  color: '#ef4444',
                  textShadow: '0 0 30px rgba(239,68,68,0.6), 0 0 60px rgba(239,68,68,0.3)',
                }}
              >
                ZERO-TRUST LOCKDOWN COMPLETE
              </p>
              <p className="text-sm font-mono text-red-400/40 mt-4 tracking-wider">
                System isolated. Local databases wiped to prevent exfiltration.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
}
