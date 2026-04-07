import { useEffect } from 'react';

export function useFaradayCage(isArmed: boolean, onBreach: () => void) {
  useEffect(() => {
    if (!isArmed) return;

    const handleOnline = () => {
      onBreach();
    };

    // If already online when armed, breach instantly
    if (navigator.onLine) {
      handleOnline();
    }

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isArmed, onBreach]);
}
