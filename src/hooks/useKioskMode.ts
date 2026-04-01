import { useCallback } from 'react';

/**
 * useKioskMode
 * Hijacks the browser window to force a full-screen layout, removing standard UI elements
 * to simulate a bare-metal OS trap.
 */
export function useKioskMode() {
  const enterKioskMode = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
    } catch (err) {
      console.error('[Kiosk Mode] Failed to acquire fullscreen lock. Device may block autonomous fullscreen expansions.', err);
    }
  }, []);

  return { enterKioskMode };
}
