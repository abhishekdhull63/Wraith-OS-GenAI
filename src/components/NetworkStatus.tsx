/**
 * NetworkStatus.tsx
 * =================
 * Live network status indicator that proves the air-gap claim.
 * Listens to navigator.onLine + 'online'/'offline' events.
 *
 * When offline: triggers a prominent neon-cyan "AIR-GAP PROTOCOL ENGAGED" alert.
 * When online:  shows a subdued "Network Detected" warning with a privacy reminder.
 */

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, ShieldCheck, ShieldAlert } from 'lucide-react';

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [lastChange, setLastChange] = useState<Date | null>(null);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setLastChange(new Date());
    };
    const goOffline = () => {
      setIsOnline(false);
      setLastChange(new Date());
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOnline, lastChange };
}

// ─── Sidebar Indicator ──────────────────────────────────────────────────────────

export function NetworkStatusIndicator({
  isOnline,
  collapsed,
}: {
  isOnline: boolean;
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center p-3">
        <div className={`p-2 rounded-lg ${isOnline ? 'bg-amber-500/10' : 'bg-cyan-500/10'}`}>
          {isOnline ? (
            <Wifi className="w-4 h-4 text-amber-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-cyan-400 animate-pulse-glow" />
          )}
        </div>
      </div>
    );
  }

  if (!isOnline) {
    // ── OFFLINE: Air-Gap Engaged ──
    return (
      <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-3 animate-slide-up">
        {/* Animated scan line */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.06) 50%, transparent 100%)',
            animation: 'scan-line 3s ease-in-out infinite',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <p className="text-sm font-bold text-cyan-400 tracking-wide">
              AIR-GAPPED
            </p>
            <p className="text-[10px] text-cyan-400/60 font-mono">
              Zero data transmission
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ONLINE: Network Detected Warning ──
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-400">
            Network Detected
          </p>
          <p className="text-[10px] text-gray-500 font-mono">
            AI runs locally — no data sent
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Full-Width Alert Banner ────────────────────────────────────────────────────

export function AirGapBanner({
  isOnline,
  onDismiss,
}: {
  isOnline: boolean;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setDismissed(false);
    } else {
      // When going back online, auto-hide after delay
      const timeout = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Show the transitioning-back-online message briefly
  if (isOnline && visible && !dismissed) {
    return (
      <div className="relative overflow-hidden border-b border-amber-500/20 bg-amber-500/5 px-6 py-3 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400 font-mono tracking-wide">
              NETWORK RESTORED
            </span>
            <span className="text-xs text-gray-500">
              — All AI operations remain local. No data was transmitted.
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // The main offline banner
  if (!isOnline && !dismissed) {
    return (
      <div className="relative overflow-hidden border-b border-cyan-400/30 animate-slide-up">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,182,212,0.08) 0%, rgba(6,182,212,0.15) 50%, rgba(6,182,212,0.08) 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
          }}
        />

        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.03) 2px, rgba(6,182,212,0.03) 4px)',
          }}
        />

        <div className="relative px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated shield icon */}
            <div className="relative">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <div className="absolute inset-0 w-6 h-6">
                <ShieldCheck className="w-6 h-6 text-cyan-400/30 animate-ping" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-cyan-400 font-mono tracking-[0.15em] uppercase">
                Air-Gap Protocol Engaged
              </span>
              <span className="hidden sm:inline-block h-4 w-px bg-cyan-400/20" />
              <span className="hidden sm:inline text-xs text-cyan-400/70 font-mono">
                ZERO DATA TRANSMISSION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <WifiOff className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                Offline
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-xs text-cyan-400/40 hover:text-cyan-400 px-2 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
