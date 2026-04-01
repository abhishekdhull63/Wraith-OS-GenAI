import { useEffect, useRef, useState } from 'react';

/**
 * FaradayMonitor — Network Tripwire
 * ==================================
 * Fires `onBreach` when the network transitions from OFFLINE → ONLINE
 * AFTER the user has been working in air-gapped mode. This prevents
 * a false breach on initial load when the browser is already online.
 *
 * The key insight: only trigger on a *transition*, not on initial state.
 */
export function useFaradayMonitor(
  onBreach: () => void, 
  onLog?: (type: 'WARNING' | 'ERROR' | 'INFO', msg: string) => void
) {
  const [isBreached, setIsBreached] = useState(false);
  const initialLoadRef = useRef(true);
  const wasOfflineRef = useRef(!navigator.onLine);

  useEffect(() => {
    // Skip breach detection on initial mount — we only care about transitions
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 3000); // Give 3s grace period after mount

    const handleOnline = () => {
      // Ignore the first load — only trigger if we were previously offline
      if (initialLoadRef.current) return;
      if (!wasOfflineRef.current) return; // Only trigger on offline→online transition

      setIsBreached(true);
      onLog?.('ERROR', 'NETWORK BREACH DETECTED: Internet connection re-established. Faraday Cage compromised. LOCKING OS.');
      onBreach();
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      onLog?.('INFO', '🛡️ Network disconnected — Air-gap established.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onBreach, onLog]);

  return isBreached;
}
