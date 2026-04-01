/**
 * SecureVault.tsx
 * ===============
 * Evidence Locker UI — displays cryptographically preserved intelligence entries.
 *
 * Features:
 *   1. Encrypted entries list with SHA-256 fingerprints and timestamps
 *   2. "Decrypting…" animation before revealing content
 *   3. Click-to-load: pipes decrypted content back to the Entity Analyzer
 *   4. Color-coded threat level badges
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Fingerprint,
  Clock,
  FileText,
  Mic,
  Eye,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Zap,
  Printer,
  Flame,
  Ghost,
  Compass
} from 'lucide-react';
import { getAllEntries, deleteEntry, logIntruder, decryptVaultContent, saveToLocker, SecureEntry } from '../lib/locker';
import { useWebLLM } from '../lib/useWebLLM';
import { encodeIntelToImage, decodeIntelFromImage } from '../lib/steganography';
import ChronosRadar from './ChronosRadar';
import { useChronosSensors } from '../hooks/useChronosSensors';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SecureVaultProps {
  /** Trigger a refresh (increment to force reload) */
  refreshKey?: number;
  /** Callback to send decrypted content to the Entity Analyzer */
  onDecryptToAnalyzer?: (content: string) => void;
  /** Callback to log to Intel Stream */
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const THREAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  HIGH:     { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  MEDIUM:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  LOW:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  TEXT: FileText,
  VOICE: Mic,
  VISION: Eye,
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function SecureVault({ refreshKey, onDecryptToAnalyzer, onLog }: SecureVaultProps) {
  const [entries, setEntries] = useState<SecureEntry[]>([]);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [vdfProgress, setVdfProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Time Capsule Form State
  const [showTimeCapsuleForm, setShowTimeCapsuleForm] = useState(false);
  const [tcPayload, setTcPayload] = useState('');
  const [tcDelay, setTcDelay] = useState<number>(50000); // Default 10 Mins equivalent
  const [tcChronosBind, setTcChronosBind] = useState(false);

  // Chronos State
  const [chronosTarget, setChronosTarget] = useState<SecureEntry | null>(null);
  const chronosSensors = useChronosSensors(showTimeCapsuleForm || chronosTarget !== null);

  const handleCreateTimeCapsule = async () => {
    if (!tcPayload) return;
    onLog?.('WARNING', `Initiating Verifiable Delay Function. Encrypting payload behind ${tcDelay.toLocaleString()} SHA-256 cycles...`);
    const seed = crypto.getRandomValues(new Uint8Array(16));
    const seedStr = Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join('');
    
    let lat = undefined, lng = undefined, hdg = undefined;
    if (tcChronosBind) {
       if (chronosSensors.lat === null || chronosSensors.heading === null) {
          onLog?.('ERROR', 'Cannot bind Chronos Lock: Hardware Sensor Arrays inactive or unauthorized.');
          return;
       }
       lat = chronosSensors.lat;
       lng = chronosSensors.lng;
       hdg = chronosSensors.heading;
       onLog?.('WARNING', `CHRONOS LOCK ENGAGED: Payload physically bounds to LAT:${lat.toFixed(4)} LNG:${lng?.toFixed(4)} HDG:${Math.round(hdg/5)*5}°`);
    }
    
    await saveToLocker(tcPayload, 'TEXT', 'CRITICAL', 'Temporal Capsule (VDF Locked)', false, false, tcDelay, seedStr, lat ?? undefined, lng ?? undefined, hdg ?? undefined);
    
    setTcPayload('');
    setShowTimeCapsuleForm(false);
    onLog?.('SUCCESS', 'Temporal Capsule mathematically locked onto disk.');
    loadEntries();
  };

  // ── LOCAL WEBGPU INFERENCE ──
  const { initEngine, isInitializing, progress, generate, engine } = useWebLLM();
  const [summaryTargetId, setSummaryTargetId] = useState<string | null>(null);
  const [summaryStream, setSummaryStream] = useState<string>('');

  const handleGenerateSummary = useCallback(async (entry: SecureEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engine) {
      onLog?.('INFO', 'Initializing WebGPU Core. Resolving Llama-3-8B weights...');
      await initEngine();
      return;
    }
    setSummaryTargetId(entry.id);
    setSummaryStream('');
    onLog?.('INFO', 'Routing payload strictly through Local WebGPU Instance...');
    try {
      await generate(`Read this intercepted file. Summarize it in 2 sentences. Note severe threats:\n\n${entry.content}`, (text) => {
        setSummaryStream(text);
      });
      onLog?.('SUCCESS', 'WebGPU Llama Inference Terminated.');
    } catch (err: any) {
      onLog?.('ERROR', `WebGPU Collapse: ${err.message}`);
      setSummaryTargetId(null);
    }
  }, [engine, initEngine, generate, onLog]);

  // ── BURN-ON-READ TIMERS ──
  const [shredTargets, setShredTargets] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimeLeft(prev => {
        const next: Record<string, number> = {};
        Object.entries(shredTargets).forEach(([id, targetTime]) => {
          const remaining = Math.max(0, targetTime - now);
          next[id] = remaining;

          if (remaining === 0 && prev[id] !== 0) {
            // TIME'S UP - Shred Data
            deleteEntry(id).then(() => {
              setEntries(curr => curr.filter(e => e.id !== id));
              setExpandedId(currId => currId === id ? null : currId);
              setShredTargets(targets => {
                const newTargets = { ...targets };
                delete newTargets[id];
                return newTargets;
              });
              onLog?.('ERROR', `🔥 SHREDDED: Burn-on-Read protocol engaged for Evidence ID [${id.split('-')[0]}]. Payload purged.`);
            });
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shredTargets, onLog]);

  // ── Load Entries ──────────────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllEntries();
      setEntries(all);
    } catch (err) {
      console.error('[SecureVault] Failed to load entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshKey]);

  // ── Decrypt Animation ─────────────────────────────────────────────────────

  const handleDecrypt = useCallback(
    async (entry: SecureEntry) => {
      if (expandedId === entry.id) {
        setExpandedId(null);
        return;
      }

      setDecryptingId(entry.id);
      onLog?.('INFO', `🔓 Decrypting evidence ${entry.id}…`);

      // ── HONEYTOKEN TRAP ──
      if (entry.isHoneytoken) {
        onLog?.('WARNING', '[HONEYTOKEN ENGAGED] Unauthorized extraction attempt logged.');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const video = document.createElement('video');
          video.srcObject = stream;
          await video.play();
          
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d')?.drawImage(video, 0, 0);
          
          const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
          await logIntruder(photoBase64);
          
          stream.getTracks().forEach(t => t.stop());
        } catch (e) {
          console.error('Honeytoken camera capture failed or denied.', e);
        }

        // Trigger Panic Blur globally (mimicking 3x Escape)
        for (let i = 0; i < 3; i++) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
        
        setDecryptingId(null);
        return; // HALT EXECUTION
      }

      // ── CHRONOS LOCK INTERCEPT ──
      if (entry.chronosLat !== undefined && entry.chronosLng !== undefined && entry.chronosHeading !== undefined) {
         setChronosTarget(entry);
         return; // Suspend decryption process until Chronos array is satisfied visually
      }

      await executeDecryption(entry);
    },
    [expandedId, onLog]
  );

  const executeDecryption = async (entry: SecureEntry, activeSensors?: typeof chronosSensors) => {
      setDecryptingId(entry.id);
      
      const vdfConfig = entry.vdfIterations && entry.vdfSeed 
          ? { iterations: entry.vdfIterations, seedStr: entry.vdfSeed }
          : undefined;

      const cParams = entry.chronosLat !== undefined && activeSensors !== undefined && activeSensors.lat !== null && activeSensors.lng !== null && activeSensors.heading !== null
          ? { lat: activeSensors.lat, lng: activeSensors.lng, heading: activeSensors.heading }
          : undefined;

      const plainContent = await decryptVaultContent(
          entry.content, entry.iv, entry.salt, vdfConfig, 
          (pct) => setVdfProgress(p => ({ ...p, [entry.id]: pct })),
          cParams
      );

      if (plainContent.startsWith('[[ ENCRYPTION ERROR')) {
        onLog?.('ERROR', `Decryption failed for Evidence ${entry.id}. Keys, Timers, or Planetary bonds mathematically rejected.`);
        setDecryptingId(null);
        return;
      }
      
      setEntries(curr => curr.map(e => e.id === entry.id ? { ...e, content: plainContent } : e));
      setExpandedId(entry.id);
      setDecryptingId(null);
      
      // Arm Burn-on-Read Timer (e.g. 30 seconds to self destruct)
      if (entry.burnOnRead && !shredTargets[entry.id]) {
         onLog?.('WARNING', `File ${entry.id} is BURN-ON-READ. Terminating local persistence arrays in 300 seconds.`);
         setShredTargets(prev => ({ ...prev, [entry.id]: Date.now() + 300000 }));
      }
      
      onLog?.('SUCCESS', `✅ Evidence ${entry.id} decrypted — integrity verified`);
  };

  // ── Delete Entry ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (expandedId === id) setExpandedId(null);
      onLog?.('WARNING', `🗑️ Evidence ${id} purged from locker`);
    },
    [expandedId, onLog],
  );

  // ── Send to Analyzer ──────────────────────────────────────────────────────

  const handleSendToAnalyzer = useCallback(
    (entry: SecureEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      onDecryptToAnalyzer?.(entry.content);
      onLog?.('INFO', '📋 Evidence loaded into Entity Analyzer');
    },
    [onDecryptToAnalyzer, onLog],
  );

  // ── Ghost Protocol (Steganography Exfiltration/Extraction) ──────────────

  const handleExfiltrateImage = useCallback((content: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onLog?.('INFO', '👻 Steganography matrix engaged. Mounting decoy vector...');
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          imgData = encodeIntelToImage(imgData, content);
          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) return;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `classified_carrier_${Date.now()}.png`;
            link.click();
            onLog?.('SUCCESS', '👻 Ghost Protocol Active. Encrypted Payload mechanically woven into image LSB arrays.');
          }, 'image/png');
        } catch(err: any) {
          onLog?.('ERROR', `Steganography Overflow: ${err.message}`);
        }
      };
      img.src = url;
    };
    input.click();
  }, [onLog]);

  const handleExtractImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onLog?.('INFO', '👻 Reverse-engineering Steganography LSB channels...');
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const secret = decodeIntelFromImage(imgData);
        if (secret) {
          onDecryptToAnalyzer?.(secret);
          onLog?.('SUCCESS', '👻 Payload extracted. Decoded string piped directly to Entity Analyzer.');
        } else {
          onLog?.('ERROR', 'No Ghost Protocol signature detected in image LSB channels.');
        }
      };
      img.src = url;
    };
    input.click();
  }, [onLog, onDecryptToAnalyzer]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="glass-card p-6 space-y-5 relative">
      {chronosTarget && (
         <ChronosRadar 
            sensors={chronosSensors}
            targetLat={chronosTarget.chronosLat as number}
            targetLng={chronosTarget.chronosLng as number}
            targetHeading={chronosTarget.chronosHeading as number}
            onUnlock={() => {
               executeDecryption(chronosTarget, chronosSensors);
               setChronosTarget(null);
            }}
            onCancel={() => setChronosTarget(null)}
         />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Secure Vault
            </h3>
            <p className="text-xs text-gray-500">
              Cryptographic Evidence Locker · IndexedDB Encrypted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
             onClick={() => setShowTimeCapsuleForm(!showTimeCapsuleForm)}
             className={`mr-2 px-3 py-1 flex items-center gap-1.5 text-xs font-mono font-bold border rounded transition-colors ${showTimeCapsuleForm ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-300'}`}
          >
             <Clock className="w-3.5 h-3.5" /> CREATE TIME CAPSULE
          </button>
          <button 
             onClick={handleExtractImage}
             className="mr-3 px-3 py-1 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-colors"
          >
             <Ghost className="w-3.5 h-3.5" /> EXTRACT VIA IMAGE
          </button>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          </span>
        </div>
      </div>

      {showTimeCapsuleForm && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
             <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
             <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-400 tracking-wide font-mono uppercase mb-1">Temporal VDF Vault</h4>
                <p className="text-xs text-amber-500/70 mb-3">Force decryptors to run millions of sequential SHA-256 hashes, creating un-bypassable physical time delays to unlock payloads.</p>
                
                <textarea 
                  value={tcPayload}
                  onChange={(e) => setTcPayload(e.target.value)}
                  placeholder="Enter classified payload to time-lock..."
                  className="w-full h-24 bg-black/50 border border-amber-500/20 rounded-lg p-3 text-amber-100 font-mono text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder-amber-500/30 mb-3 resize-none"
                />

                <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1">
                   <span>Set Delay Cycles</span>
                   <span className="font-bold">{tcDelay.toLocaleString()} Hashes</span>
                </div>
                <input 
                  type="range" min="50000" max="5000000" step="50000"
                  value={tcDelay} onChange={(e) => setTcDelay(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mb-3"
                />
                <div className="flex justify-between text-[10px] font-mono text-amber-500/50 mb-4">
                   <span>~10 Mins (50,000)</span>
                   <span>~1 Hour (300,000)</span>
                   <span>~12 Hours (5,000,000)</span>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-black/30 p-2 rounded border border-amber-500/10">
                   <div 
                      onClick={() => setTcChronosBind(!tcChronosBind)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${tcChronosBind ? 'bg-amber-500 border-amber-400 text-black' : 'bg-black border-amber-500/30'}`}
                   >
                     {tcChronosBind && <Compass className="w-3 h-3" />}
                   </div>
                   <span className="text-[10px] text-amber-500/70 uppercase tracking-widest font-mono cursor-pointer select-none" onClick={() => setTcChronosBind(!tcChronosBind)}>
                      Bind Magnetic Signature (Current Location & Heading)
                   </span>
                </div>

                <div className="flex justify-end">
                   <button 
                     onClick={handleCreateTimeCapsule}
                     disabled={!tcPayload}
                     className="px-4 py-1.5 bg-amber-500 text-black font-bold font-mono text-xs uppercase tracking-wider rounded hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Engage Temporal Lock
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-mono">Accessing vault…</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <Lock className="w-10 h-10 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-400">
              Vault Empty
            </p>
            <p className="text-xs text-gray-600 mt-1">
              High-threat intelligence will be auto-preserved here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isDecrypting = decryptingId === entry.id;
            const isExpanded = expandedId === entry.id;
            const threat = THREAT_COLORS[entry.threat_level] || THREAT_COLORS.LOW;
            const TypeIcon = TYPE_ICONS[entry.type] || FileText;

            return (
              <div key={entry.id} className="animate-slide-up">
                {/* Entry Header (clickable) */}
                <button
                  onClick={() => handleDecrypt(entry)}
                  className={`
                    w-full text-left rounded-xl border transition-all duration-300 cursor-pointer
                    ${isExpanded
                      ? 'bg-white/[0.04] border-emerald-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Decrypt/Expand Icon */}
                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                          {isDecrypting ? (
                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                          ) : isExpanded ? (
                            <Unlock className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-200 truncate">
                              {entry.label}
                            </span>
                          </div>

                          {/* Hash + Timestamp */}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-mono text-gray-600">
                              <Fingerprint className="w-3 h-3" />
                              {entry.digital_fingerprint.slice(0, 16)}…
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-mono text-gray-600">
                              <Clock className="w-3 h-3" />
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Threat Badge + Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Threat Level */}
                        <span className={`
                          px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border
                          ${threat.bg} ${threat.text} ${threat.border}
                        `}>
                          {entry.threat_level}
                        </span>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Honeytoken Trap Indicator */}
                        {entry.isHoneytoken && (
                          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400" title="Armed Honeytoken Trap">
                            <Ghost className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Burn Icon Indicator */}
                        {entry.burnOnRead && (
                          <div className={`p-1.5 rounded-lg ${shredTargets[entry.id] ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-orange-500/10 text-orange-400'}`}>
                            <Flame className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Chevron */}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Decrypting Animation */}
                    {isDecrypting && (
                      <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 animate-pulse">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-xs font-mono text-emerald-400 tracking-wider">
                          DECRYPTING… VERIFYING INTEGRITY…
                        </span>
                      </div>
                    )}

                    {/* VDF Cracking Progress Bar */}
                    {vdfProgress[entry.id] !== undefined && (
                      <div className="mt-3 p-3 flex flex-col gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 animate-pulse flex items-center gap-2">
                               <Clock className="w-3.5 h-3.5" /> CRACKING TEMPORAL LOCK (VDF)
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-500">{Math.round(vdfProgress[entry.id])}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-amber-500/20">
                            <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-200" style={{ width: `${Math.max(1, vdfProgress[entry.id])}%` }} />
                         </div>
                         <div className="text-[8px] text-amber-500/50 font-mono uppercase">Re-deriving AES-GCM Key... {(entry.vdfIterations || 0).toLocaleString()} SHA-256 primitives queued.</div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-1 p-4 rounded-b-xl bg-black/40 border border-t-0 border-emerald-500/10 animate-slide-up">
                    
                    {/* Hidden Printable Dossier (Only visible during print) */}
                    <div className="hidden print:block print:absolute print:bg-white print:text-black print:font-mono print:border-[12px] print:border-double print:border-black print:z-[9999] min-h-[1056px]">
                      <div className="border-b-4 border-black pb-6 mb-8 text-center pt-12">
                        <h1 className="text-4xl font-black tracking-widest uppercase mb-2">DECLASSIFIED // EYES ONLY</h1>
                        <h2 className="text-2xl font-bold uppercase">THREAT LEVEL: {entry.threat_level}</h2>
                        <div className="mt-4 text-sm flex justify-between px-16 font-semibold">
                          <span>DATE: {new Date(entry.timestamp).toLocaleString()}</span>
                          <span>ID: {entry.id.split('-')[0]}</span>
                        </div>
                      </div>
                      
                      <div className="text-lg leading-relaxed whitespace-pre-wrap px-16 pb-40 font-medium">
                        {entry.content}
                      </div>

                      <div className="absolute bottom-12 left-16 right-16 border-t-4 border-black pt-4 text-center text-xs">
                        <p className="font-bold mb-1">CHAIN OF CUSTODY VERIFICATION</p>
                        <p>CRYPTOGRAPHIC HASH (SHA-256): {entry.digital_fingerprint}</p>
                      </div>
                    </div>

                    {/* Integrity Bar */}
                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-400">
                          INTEGRITY VERIFIED — SHA-256: {entry.digital_fingerprint.slice(0, 32)}…
                        </span>
                      </div>
                      
                      {entry.burnOnRead && timeLeft[entry.id] !== undefined && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold animate-pulse">
                          <Flame className="w-3 h-3" />
                          SHRED IN: {Math.floor(timeLeft[entry.id] / 60000)}:{(Math.floor((timeLeft[entry.id] % 60000) / 1000)).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-gray-400 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                      {entry.content.slice(0, 800)}
                      {entry.content.length > 800 && (
                        <span className="text-gray-600">… [{entry.content.length - 800} more characters]</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {onDecryptToAnalyzer && (
                        <button
                          onClick={(e) => handleSendToAnalyzer(entry, e)}
                          className="
                            flex-1 py-2 text-[10px] font-semibold text-cyan-400
                            bg-cyan-500/5 border border-cyan-500/20 rounded-lg
                            hover:bg-cyan-500/10 hover:border-cyan-500/30
                            transition-all duration-200 flex items-center justify-center gap-1.5
                          "
                        >
                          <FileText className="w-3 h-3" />
                          To Analyzer
                        </button>
                      )}

                      {!engine ? (
                        <button
                          onClick={(e) => handleGenerateSummary(entry, e)}
                          className="
                            flex-1 py-2 text-[10px] font-semibold text-purple-400 
                            bg-purple-500/5 border border-purple-500/20 rounded-lg 
                            hover:bg-purple-500/10 hover:border-purple-500/30 
                            transition-all duration-200 flex items-center justify-center gap-1.5
                          "
                        >
                          <Zap className="w-3 h-3" />
                          {isInitializing && progress ? `Booting Llama3 (${Math.round(progress.progress * 100)}%)` : 'Init WebGPU AI'}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleGenerateSummary(entry, e)}
                          className="
                            flex-1 py-2 text-[10px] font-semibold text-purple-400 
                            bg-purple-500/5 border border-purple-500/20 rounded-lg 
                            hover:bg-purple-500/10 hover:border-purple-500/30 
                            transition-all duration-200 flex items-center justify-center gap-1.5
                          "
                        >
                          <Zap className="w-3 h-3" />
                          Llama-3 Summary
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.print();
                          onLog?.('SUCCESS', '🖨️ Dossier formatting engaged. Outputting PDF.');
                        }}
                        className="
                          flex-1 py-2 text-[10px] font-semibold text-emerald-400
                          bg-emerald-500/5 border border-emerald-500/20 rounded-lg
                          hover:bg-emerald-500/10 hover:border-emerald-500/30
                          transition-all duration-200 flex items-center justify-center gap-1.5
                        "
                      >
                        <Printer className="w-3 h-3" />
                        Export PDF
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExfiltrateImage(entry.content);
                        }}
                        className="
                          flex-1 py-2 text-[10px] font-semibold text-emerald-400
                          bg-emerald-500/5 border border-emerald-500/20 rounded-lg
                          hover:bg-emerald-500/10 hover:border-emerald-500/30
                          transition-all duration-200 flex items-center justify-center gap-1.5
                        "
                      >
                        <Ghost className="w-3 h-3" />
                        Exfiltrate Image
                      </button>
                    </div>

                    {/* Show WebGPU Summary Box if active */}
                    {summaryTargetId === entry.id && summaryStream && (
                      <div className="mt-3 p-3 bg-[#0a0510] border border-purple-500/20 rounded-lg text-xs font-mono text-purple-300 leading-relaxed shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                        <div className="mb-2 uppercase text-[9px] tracking-widest text-purple-500 font-bold border-b border-purple-500/20 pb-1">WebGPU Edge Inference (Llama-3-8B)</div>
                        {summaryStream}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
        <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Evidence is encrypted at rest in IndexedDB with SHA-256 digital fingerprints.
          Data never leaves this device. Tamper-evident chain of custody preserved locally.
        </p>
      </div>
    </section>
  );
}
