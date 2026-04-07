import { useEffect, useState } from 'react';

/**
 * useSentinelDaemon
 * Monitors for DevTools invocation, context menu actions, and unusual window resizing (F12 pane).
 * If triggered, perfectly traps state into a 'breached' metric.
 */
export function useSentinelDaemon(isActive: boolean) {
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const trap = () => setBreached(true);

    // Block Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      trap();
    };

    // Block Native DevTools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        trap();
      }

      const key = e.key.toLowerCase();

      // Ctrl+Shift+I or Cmd+Option+I
      if ((e.ctrlKey && e.shiftKey && key === 'i') || (e.metaKey && e.altKey && key === 'i')) {
        e.preventDefault();
        trap();
      }

      // Ctrl+Shift+J or Cmd+Option+J
      if ((e.ctrlKey && e.shiftKey && key === 'j') || (e.metaKey && e.altKey && key === 'j')) {
        e.preventDefault();
        trap();
      }

      // Ctrl+U or Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && key === 'u') {
        e.preventDefault();
        trap();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Advanced window size comparison trap
    // ~160px delta usually implies side/bottom docked DevTools has mechanically squashed the viewport
    const interval = setInterval(() => {
      // If window is minimized, dimensions collapse artificially. We ignore this state.
      if (window.innerWidth === 0 || window.innerHeight === 0) return;

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // Browsers normally have some chrome (title bar). > 160px diff natively identifies Developer Tools dock.
      if (widthDiff > 160 || heightDiff > 160) {
        trap();
      }
    }, 500);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [isActive]);

  return { breached };
}
