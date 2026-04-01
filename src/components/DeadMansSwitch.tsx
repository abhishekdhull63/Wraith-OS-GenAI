/**
 * DeadMansSwitch.tsx
 * ==================
 * Inactivity-triggered anti-forensics purge.
 *
 * Listens for user activity (mousemove, keydown, click). If no activity
 * occurs for INACTIVITY_TIMEOUT_MS, a full-screen red warning modal appears,
 * initiating a countdown (COUNTDOWN_MS).
 *
 * If the user does not type the exact ABORT_CODE within the countdown, it
 * triggers the same destruction logic as BurnProtocol (wiping DB, storage, caches).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Skull, AlertTriangle } from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_MS = 60 * 1000; // 60 seconds
const ABORT_CODE = 'ABORT';
const DB_NAME = 'deep-cover-evidence-locker';

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DeadMansSwitch({ onLog }: { onLog?: (type: 'INFO' | 'WARNING' | 'ERROR', msg: string) => void }) {
  const [isTriggered, setIsTriggered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_MS / 1000);
  const [abortInput, setAbortInput] = useState('');

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Execute Purge (same logic as BurnProtocol) ────────────────────────────
  const executePurge = useCallback(async () => {
    onLog?.('ERROR', "💀 DEAD MAN'S SWITCH EXPIRED. INITIATING PURGE.");
    
    // 1. Destroy IndexedDB
    try {
      const deleteReq = indexedDB.deleteDatabase(DB_NAME);
      await new Promise<void>((resolve) => {
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
        deleteReq.onblocked = () => resolve();
      });
    } catch {}

    // 2. Clear storages
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    // 3. Clear caches
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((n) => caches.delete(n)));
    } catch {}

    // Force reload
    window.location.reload();
  }, [onLog]);

  // ── Activity Tracking ───────────────────────────────────────────────────────
  const updateActivity = useCallback(() => {
    if (isTriggered) return; // Ignore activity once triggered (requires abort code)
    lastActivityRef.current = Date.now();
  }, [isTriggered]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, updateActivity, { passive: true }));

    // Check inactivity every second
    checkIntervalRef.current = setInterval(() => {
      if (isTriggered) return;
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        setIsTriggered(true);
        setTimeLeft(COUNTDOWN_MS / 1000);
        onLog?.('WARNING', "⚠️ OPERATOR INACTIVITY DETECTED. DEAD MAN'S SWITCH INITIATED.");
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isTriggered, updateActivity, onLog]);

  // ── Countdown Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTriggered) return;

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          executePurge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isTriggered, executePurge]);

  // ── Abort Handler ───────────────────────────────────────────────────────────
  const handleAbort = useCallback(() => {
    if (abortInput === ABORT_CODE) {
      setIsTriggered(false);
      setAbortInput('');
      lastActivityRef.current = Date.now();
      onLog?.('INFO', "🛡️ DEAD MAN'S SWITCH ABORTED. OPERATOR RETURNED.");
    }
  }, [abortInput, onLog]);

  useEffect(() => {
    if (abortInput === ABORT_CODE) handleAbort();
  }, [abortInput, handleAbort]);

  // If not triggered, mount silently
  if (!isTriggered) return null;

  // ── Active Overlay ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(153,27,27,0.95) 0%, rgba(0,0,0,0.98) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="max-w-xl w-full p-8 rounded-3xl border border-red-500/30 text-center space-y-8 animate-slide-up"
        style={{
          background: 'rgba(50,0,0,0.6)',
          boxShadow: '0 0 100px rgba(239,68,68,0.2), inset 0 0 40px rgba(239,68,68,0.1)',
        }}
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-ping absolute inset-0" />
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center relative border border-red-500/30">
              <Skull className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1
            className="text-4xl font-black font-mono tracking-[0.2em] text-red-500"
            style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}
          >
            OPERATOR ABSENT
          </h1>
          <div className="flex items-center justify-center gap-2 text-red-400 font-mono text-sm max-w-sm mx-auto">
            <AlertTriangle className="w-4 h-4" />
            <p>DEAD MAN'S SWITCH INITIATED</p>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
            No activity detected for {(INACTIVITY_TIMEOUT_MS / 60000).toFixed(0)} minutes. 
            Automated defensive purge protocol is active. All vault data will be permanently destroyed.
          </p>
        </div>

        <div className="py-6 border-y border-red-500/20">
          <p className="text-sm font-mono text-red-500/60 uppercase tracking-widest mb-3">
            T-MINUS
          </p>
          <p
            className="text-7xl font-mono font-bold tracking-tight text-white"
            style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}
          >
            00:{timeLeft.toString().padStart(2, '0')}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
            Type "{ABORT_CODE}" to cancel purge sequence
          </p>
          <input
            type="text"
            value={abortInput}
            onChange={(e) => setAbortInput(e.target.value.toUpperCase())}
            placeholder="ENTER OVERRIDE CODE"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            className="
              w-full max-w-xs mx-auto block px-4 py-3
              text-lg font-mono font-bold tracking-widest text-center
              bg-black/50 border-2 border-red-500/30 rounded-xl
              text-white placeholder:text-red-500/30
              focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10
              transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]
            "
          />
        </div>
      </div>
    </div>
  );
}
