import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Battery,
  BatteryCharging,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { KeystrokeDynamics, generateBiometricProfile, saveBiometricProfile } from '../lib/security/keystrokeDynamics';

interface OpsecDashboardProps {
  motionActive: boolean;
  faradayActive: boolean;
  vaultEncrypted: boolean;
  onToggleFaraday?: () => void;
  onArmOppenheimer?: () => void;
}

export default function OpsecDashboard({
  motionActive,
  faradayActive,
  vaultEncrypted,
  onToggleFaraday,
  onArmOppenheimer,
}: OpsecDashboardProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [memoryUsed, setMemoryUsed] = useState<number>(0);

  // Biometric Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibPasses, setCalibPasses] = useState(0);
  const [calibInput, setCalibInput] = useState('');
  const [samples, setSamples] = useState<any[]>([]);
  const kdRef = useRef<KeystrokeDynamics | null>(null);

  useEffect(() => {
    // Battery Status API (Native Browser)
    let batteryTick: any;
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          const updateBattery = () => {
            setBatteryLevel(battery.level * 100);
            setIsCharging(battery.charging);
          };
          updateBattery();
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);

          batteryTick = () => {
            battery.removeEventListener('levelchange', updateBattery);
            battery.removeEventListener('chargingchange', updateBattery);
          };
        })
        .catch(() => {
          /* Ignore on unsupported browsers */
        });
    }

    // Memory Gauge (Native Browser)
    const memInterval = setInterval(() => {
      const perf = performance as any;
      if (perf && perf.memory) {
        setMemoryUsed(perf.memory.usedJSHeapSize / (1024 * 1024)); // MB
      }
    }, 2000);

    return () => {
      if (batteryTick) batteryTick();
      clearInterval(memInterval);
    };
  }, []);


  return (
    <div className="mb-6 p-4 bg-black/40 border border-emerald-500/20 rounded-xl space-y-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
      <div className="flex items-center gap-2 mb-3 border-b border-emerald-500/10 pb-2">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase shadow-emerald-400/50">
          OPSEC TELEMETRY
        </h3>
      </div>

      <div className="space-y-3 font-mono text-[10px] uppercase tracking-wider">
        {/* Hardware Telemetry */}
        <div className="flex items-center justify-between text-gray-400">
          <span className="flex items-center gap-1.5">
            {isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5" />
            )}
            SYSTEM PWR
          </span>
          <span
            className={
              batteryLevel && batteryLevel < 20 && !isCharging
                ? 'text-red-400 animate-pulse font-bold'
                : 'text-emerald-400 font-bold'
            }
          >
            {batteryLevel !== null ? `${Math.round(batteryLevel)}%` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-400 border-b border-emerald-500/10 pb-3">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" /> VRAM PRESS
          </span>
          <span className="text-emerald-400 font-bold">{memoryUsed > 0 ? `${Math.round(memoryUsed)} MB` : 'N/A'}</span>
        </div>

        {/* Counter-Measures */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">SENTINEL NET</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${motionActive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${motionActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
              />
              {motionActive ? 'ARMED' : 'FAIL'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">AIR-GAP CAGE</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${faradayActive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${faradayActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {faradayActive ? 'SEALED' : 'BREACH'}
              <button
                onClick={onToggleFaraday}
                className={`ml-2 text-[8px] px-1.5 py-0.5 rounded border ${faradayActive ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
              >
                {faradayActive ? 'DISARM' : 'ARM'}
              </button>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">AES-GCM LOCK</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${vaultEncrypted ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {vaultEncrypted ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <ShieldAlert className="w-3 h-3 animate-bounce" />
              )}
              {vaultEncrypted ? 'SECURE' : 'EXPOSED'}
            </span>
          </div>


          <div className="flex items-center justify-between pt-2 mt-2 border-t border-emerald-500/10">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3 text-cyan-500" /> PHANTOM TYPIST
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-red-900/50">
            <span className="text-gray-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-red-500" /> NUCLEAR OPTION
            </span>
            <button
              onClick={onArmOppenheimer}
              className="text-[9px] px-2 py-0.5 font-bold bg-red-600 hover:bg-red-500 text-black border border-red-500 rounded uppercase shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-colors tracking-widest"
            >
              FRACTURE KEY
            </button>
          </div>
        </div>
      </div>

      {isCalibrating && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border border-cyan-500/30 rounded-xl">
          <Fingerprint className="w-12 h-12 text-cyan-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-2 font-bold text-center">
            Biometric Calibration
          </h3>
          <p className="text-cyan-500/50 text-[10px] font-mono text-center mb-6 max-w-[200px]">
            Type the master sequence `//nexus` {5 - calibPasses} more times at your natural cadence.
          </p>

          <input
            type="password"
            autoFocus
            value={calibInput}
            onChange={(e) => setCalibInput(e.target.value)}
            onKeyDown={(e) => kdRef.current?.logKeydown(e.key)}
            onKeyUp={async (e) => {
              kdRef.current?.logKeyup(e.key);
              if (calibInput + e.key === '//nexus') {
                const feats = kdRef.current?.extractFeatures(7);
                if (feats) {
                  const newSamples = [...samples, feats];
                  setSamples(newSamples);
                  if (newSamples.length >= 5) {
                    const profile = generateBiometricProfile(newSamples);
                    if (profile) await saveBiometricProfile(profile);
                    setIsCalibrating(false);
                  } else {
                    setCalibPasses((p) => p + 1);
                  }
                }
                setCalibInput('');
                kdRef.current?.clear();
              }
            }}
            className="bg-transparent border-b-2 border-cyan-500/50 text-cyan-300 font-mono text-center outline-none w-32 pb-1"
          />

          <button
            onClick={() => setIsCalibrating(false)}
            className="mt-8 text-[9px] text-gray-500 hover:text-red-400 uppercase tracking-widest"
          >
            Abort
          </button>
        </div>
      )}
    </div>
  );
}
