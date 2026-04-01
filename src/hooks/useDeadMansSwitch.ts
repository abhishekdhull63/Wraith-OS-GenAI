import { useState, useEffect, useRef } from 'react';

const LOCK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const BURN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function useDeadMansSwitch(onLock: () => void, onBurn: () => void) {
  const [timeUntilBurnStr, setTimeUntilBurnStr] = useState<string>('05:00');
  const lastActivity = useRef<number>(Date.now());
  const hasLocked = useRef<boolean>(false);

  useEffect(() => {
    const handleActivity = () => {
      lastActivity.current = Date.now();
      // Reset lock flag if they came back before burn
      hasLocked.current = false; 
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'wheel'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    const interval = setInterval(() => {
      const inactiveFor = Date.now() - lastActivity.current;
      
      // Calculate remaining time to burn to show in UI
      const remainingToBurn = Math.max(0, BURN_TIMEOUT_MS - inactiveFor);
      const mins = Math.floor(remainingToBurn / 60000);
      const secs = Math.floor((remainingToBurn % 60000) / 1000);
      setTimeUntilBurnStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

      if (inactiveFor >= LOCK_TIMEOUT_MS && !hasLocked.current) {
        hasLocked.current = true;
        onLock();
      }

      if (inactiveFor >= BURN_TIMEOUT_MS) {
        onBurn();
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, [onLock, onBurn]);

  return { timeUntilBurnStr };
}
