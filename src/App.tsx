import { useState, useCallback } from 'react';
import ExcelDecoy from './components/ExcelDecoy';
import WraithTerminal from './components/WraithTerminal';
import BootSequence from './components/BootSequence';
import DeepCoverDashboard from './components/DeepCoverDashboard';

/**
 * App.tsx — Original 3-Stage Boot Sequence
 * ========================================
 * Stage 1 ('decoy')     → ExcelDecoy + WraithTerminal (Unlock via `unlock` command)
 * Stage 2 ('boot')      → BootSequence (Terminal animation with ENTER prompt)
 * Stage 3 ('dashboard') → DeepCoverDashboard (Full neon intelligence console)
 */
export default function App() {
  const [appState, setAppState] = useState<'decoy' | 'boot' | 'dashboard'>('decoy');

  const handleWraithCommand = useCallback((_command: string, _args: string[]) => {
    /* Command dispatched to subsystems */
  }, []);

  // ── STAGE 1: FULL DECOY WITH HUD TERMINAL ───────────────────────────────
  if (appState === 'decoy') {
    return (
      <>
        <ExcelDecoy />
        <WraithTerminal onCommand={handleWraithCommand} onUnlock={() => setAppState('boot')} />
      </>
    );
  }

  // ── STAGE 2: THE BIOS BOOT SEQUENCE ─────────────────────────────────────
  if (appState === 'boot') {
    return <BootSequence onComplete={() => setAppState('dashboard')} />;
  }

  // ── STAGE 3: WRAITH OS ──────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      <DeepCoverDashboard isBooted={true} isUnlocked={true} onLock={() => setAppState('decoy')} />
      <WraithTerminal onCommand={handleWraithCommand} />
    </div>
  );
}
