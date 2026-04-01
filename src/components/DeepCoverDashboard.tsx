/**
 * DeepCoverDashboard.tsx
 * =====================
 * Main dashboard layout translated from the Nexus Streamlit app (app.py).
 *
 * Layout mapping:
 *   Streamlit st.sidebar        → Left sidebar (system status + model health)
 *   Streamlit col1 (Mission)    → Entity Analyzer panel (LLM text analysis)
 *   Streamlit col2 (Systems)    → Audio Leak Stream panel (Whisper STT)
 *   Streamlit render_shield_log → Intel Stream (bottom log)
 *   Streamlit results section   → Analysis Results (expandable)
 *
 * All AI features powered by useSecureIntelligence (100% local, zero cloud).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Shield,
  Radio,
  Mic,
  MicOff,
  Brain,
  Activity,
  Lock,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  CircleDot,
  FileText,
  VolumeX, // Added for voice masking UI
  PenTool,
  Network,
  Ghost,
  Terminal,
} from 'lucide-react';
import { useSecureIntelligence } from '../hooks/useSecureIntelligence';
import type { IntelError } from '../hooks/useSecureIntelligence';
import {
  useNetworkStatus,
  NetworkStatusIndicator,
  AirGapBanner,
} from './NetworkStatus';
// buildAnalysisPrompt removed — handleAnalyze now uses local regex analysis
import { SAMPLE_LEAKED_DOCUMENT, SAMPLE_INTEL_LABEL } from '../config/demoData';
import SecureVault from './SecureVault';
import ShadowPartner from './ShadowPartner';
import BurnProtocol from './BurnProtocol';
import VaultInterrogation from './VaultInterrogation';
import SecureFileDrop from './SecureFileDrop';
import DeadMansSwitch from './DeadMansSwitch';
import GhostProtocol from './GhostProtocol';
import DeadDrop from './DeadDrop';
import type { DeadDropHandle } from './DeadDrop';

import OpsecDashboard from './OpsecDashboard';
import IntelligenceBriefing from './IntelligenceBriefing';
import SecureSketchpad from './SecureSketchpad';
import ConspiracyBoard from './ConspiracyBoard';
import DarkChannel from './DarkChannel';
import { saveToLocker } from '../lib/locker';
import { useFaradayMonitor } from '../lib/useFaradayMonitor';
import { useWhisperProtocol } from '../hooks/useWhisperProtocol';
import { useDeadMansSwitch } from '../hooks/useDeadMansSwitch';
import { useFaradayCage } from '../hooks/useFaradayCage';
import SonarTerminal from './SonarTerminal';
import ArgusTerminal from './ArgusTerminal';
import HorcruxGenerator from './HorcruxGenerator';
import LazarusUnlock from './LazarusUnlock';
import TelemetryLog from './TelemetryLog';
import type { IncomingP2PMessage } from './TelemetryLog';
import ThreatAnalysisBoard from './ThreatAnalysisBoard';
// import WraithTerminal from './WraithTerminal'; // Removed as component is no longer rendered
// ToolCallResult removed — handleAnalyze no longer uses SDK tool calls

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DeepCoverDashboardProps {
  onLock?: () => void;
  isBooted?: boolean;
  isUnlocked?: boolean;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'BLOCKED';
  message: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogEntry['type'], string> = {
  INFO: 'text-gray-400',
  SUCCESS: 'text-emerald-400',
  WARNING: 'text-amber-400',
  ERROR: 'text-red-400',
  BLOCKED: 'text-red-500',
};

const EXAMPLE_PROMPTS = [
  'Analyze for corruption indicators and financial irregularities',
  'Extract all named entities: people, organizations, locations',
  'Identify hidden connections between mentioned parties',
  'Summarize key findings and flag anomalies',
];

// ─── Helper ─────────────────────────────────────────────────────────────────────

let logIdCounter = 0;
function createLogEntry(type: LogEntry['type'], message: string): LogEntry {
  const now = new Date();
  return {
    id: `log-${++logIdCounter}`,
    time: now.toLocaleTimeString('en-IN', { hour12: false }),
    type,
    message,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DeepCoverDashboard({ onLock, isBooted = true, isUnlocked = true }: DeepCoverDashboardProps = {}) {
  const intel = useSecureIntelligence();
  const { isOnline } = useNetworkStatus();

  // ── Entity Analyzer State ───────────────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(true);
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const deadDropRef = useRef<DeadDropHandle>(null);
  const [p2pIncoming, setP2pIncoming] = useState<IncomingP2PMessage[]>([]);

  // ── Audio Leak Stream State ─────────────────────────────────────────────────
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Whistleblower Voice Masker State ────────────────────────────────────────
  const [isVoiceMasked, setIsVoiceMasked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(0);

  // ── Intel Log State ─────────────────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // ── Faraday Cage Mode ───────────────────────────────────────────────────────
  const [isFaradayArmed, setIsFaradayArmed] = useState(false);
  
  useFaradayCage(isFaradayArmed, () => {
    addLog('ERROR', '⚡ FARADAY BREACH. SHUTTING DOWN ENCLAVE.');
    if (onLock) onLock();
    for (let i=0; i<3; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSketchpadOpen, setIsSketchpadOpen] = useState(false);
  const [isConspiracyBoardOpen, setIsConspiracyBoardOpen] = useState(false);
  const [isDarkChannelOpen, setIsDarkChannelOpen] = useState(false);

  // ── Oppenheimer State ───────────────────────────────────────────────────────
  const [showHorcruxGen, setShowHorcruxGen] = useState(false);
  const [isOppenheimerLocked, setIsOppenheimerLocked] = useState(
     localStorage.getItem('oppenheimer_active') === 'true' && !sessionStorage.getItem('oppenheimer_seed')
  );

  // ── Wraith CLI State ────────────────────────────────────────────────────────
  const [argusPayload, setArgusPayload] = useState<string | undefined>(undefined);
  const [sonarPayload, setSonarPayload] = useState<string | undefined>(undefined);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogEntries((prev) => [createLogEntry(type, message), ...prev]);
  }, []);

  // ── Audio Intercept Layer (Whisper Protocol) ─────────────────────────────────
  const { isListening: isWhisperActive, toggleListening: toggleWhisper } = useWhisperProtocol({
    onLockdown: () => {
      if (onLock) onLock();
      // Global Panic Trigger for Honeytoken/Blur consistency 
      for (let i = 0; i < 3; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    },
    onOpenDarkChannel: () => setIsDarkChannelOpen(true),
    onWipeMemory: () => {
      addLog('ERROR', 'WIPE COMMAND EXECUTED. PURGING VAULT DATA.');
      const dbs = ['deep-cover-evidence-locker', 'DeepCoverLocker', 'IntruderLogs'];
      dbs.forEach(db => window.indexedDB.deleteDatabase(db));
      window.location.reload();
    },
    onLog: addLog
  });

  // ── AUTONOMOUS DEFENSE LAYER (Dead Man’s Switch) ────────────────────────────
  const { timeUntilBurnStr } = useDeadMansSwitch(
    () => {
      addLog('WARNING', '🚷 DEAD MAN\'S SWITCH: Stage 1 Inactivity Lock Triggered.');
      if (onLock) onLock();
      for (let i = 0; i < 3; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    },
    () => {
      addLog('ERROR', '🔥 DEAD MAN\'S SWITCH: Stage 2 Purge Triggered. Executing total evaporation.');
      const dbs = ['deep-cover-evidence-locker', 'DeepCoverLocker', 'IntruderLogs'];
      dbs.forEach(db => window.indexedDB.deleteDatabase(db));
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  );

  // Auto-scroll result area during streaming
  useEffect(() => {
    if (isStreaming && resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [analysisResult, isStreaming]);

  // ── Recording Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (intel.stt.isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intel.stt.isRecording]);

  // ── Network Status Logging ──────────────────────────────────────────────────
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (prevOnlineRef.current !== isOnline) {
      prevOnlineRef.current = isOnline;
      if (!isOnline) {
        addLog('SUCCESS', '🛡️ AIR-GAP PROTOCOL ENGAGED — Zero data transmission confirmed');
      } else {
        addLog('WARNING', '⚠️ Network connection detected — AI remains local, no data sent');
      }
    }
  }, [isOnline, addLog]);

  // ── Faraday Mode Tripwire ───────────────────────────────────────────────────
  useFaradayMonitor(onLock || (() => { }), addLog);

  // ─── Whistleblower Voice Masker (Web Audio API) ───────────────────────────
  const setupVoiceMasker = useCallback((stream: MediaStream): MediaStream => {
    if (!isVoiceMasked) return stream;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const destination = ctx.createMediaStreamDestination();
    const analyser = ctx.createAnalyser();

    // Masking Filters (Muffle & Deepen)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800; // Muffle high frequencies (identity markers)

    const peq = ctx.createBiquadFilter();
    peq.type = 'peaking';
    peq.frequency.value = 300; // Boost lower frequencies
    peq.gain.value = 10;

    source.connect(lowpass);
    lowpass.connect(peq);
    peq.connect(analyser);
    analyser.connect(destination); // Connect analyser to destination for the stream

    // Visual Waveform
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas?.getContext('2d');

    const draw = () => {
      if (!canvas || !canvasCtx) {
        animationFrameRef.current = requestAnimationFrame(draw); // Keep trying if canvas not ready
        return;
      }
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = isVoiceMasked ? '#ef4444' : '#10b981'; // Red if masked, Green if raw
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };
    draw();

    return destination.stream;
  }, [isVoiceMasked]);

  const teardownVoiceMasker = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    // Clear canvas when tearing down
    if (canvasRef.current) {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);


  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsStreaming(true);
    setResultExpanded(true);
    addLog('INFO', `▶ ANALYZING INTEL [${inputText.length} chars]`);
    
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800));

    const text = inputText.toLowerCase();
    
    // 1. Keyword / Regex Threat Detection
    const triggerWords = ["vip", "target", "midnight", "breach", "classified", "weapon", "nuclear", "asset", "compromised", "payload", "transfer", "override", "hack", "$", "192.168"];
    const isThreat = triggerWords.some(word => text.includes(word.toLowerCase()));

    // 2. Entity Extraction (Proper Nouns + Stop Word Filter)
    const stopWords = new Set(["the", "is", "to", "at", "a", "an", "and", "of", "in", "on", "for", "with", "as", "by", "this", "that"]);
    const matchArray = inputText.match(/\b[A-Z][a-zA-Z]*\b/g) || [];
    
    // Filter out stop words and keep unique entities, plus specifically include trigger words if found in proper case
    let uniqueNames = [...new Set(matchArray.filter(word => !stopWords.has(word.toLowerCase())))];
    
    if (uniqueNames.length === 0) uniqueNames = ['No Entities Detected'];
    const namesList = uniqueNames[0] !== 'No Entities Detected' 
      ? `\n\nPotential Entities/Names:\n- ${uniqueNames.join('\n- ')}` 
      : '\n\nPotential Entities/Names:\n- None';

    // 3. Classification & Auto-Preservation
    if (isThreat) {
      setAnalysisResult(`Threat Level: CRITICAL\nHigh-level threat detected. Actionable intelligence extracted.${namesList}`);
      addLog('ERROR', '❌ THREAT DETECTED: Critical indicators found in text.');
      
      // Auto-save to Secure Vault if critical
      try {
         const entry = await saveToLocker(inputText, 'TEXT', 'CRITICAL', 'Auto-Intercepted Threat Payload');
         addLog('SUCCESS', `🔐 AUTO-PRESERVED: Payload secured to Vault. Hash: ${entry.digital_fingerprint.substring(0, 16)}...`);
         setVaultRefreshKey(k => k + 1);
      } catch (err: any) {
         addLog('ERROR', `Failed to secure payload to Vault: ${err.message}`);
      }
    } else {
      setAnalysisResult(`Threat Level: MINIMAL\nBenign conversation detected. No actionable intelligence found.${namesList}`);
      addLog('SUCCESS', '✅ Entity analysis complete: Benign text.');
    }
    
    setIsStreaming(false);
  }, [inputText, addLog]);

  // ── Audio: Start/Stop Recording (with Voice Masking integration) ──────────────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (intel.stt.isRecording) {
      // Stop recording
      try {
        addLog('INFO', '⏹️ Processing audio via local Whisper...');
        const result = await intel.stopSecureRecording();
        setTranscript(result);
        addLog('SUCCESS', `✅ Transcript ready [${result.length} chars]`);
      } catch (err) {
        const intelErr = err as IntelError;
        addLog('ERROR', `❌ Transcription failed: ${intelErr.message}`);
      } finally {
        teardownVoiceMasker();
      }
    } else {
      // Start recording
      try {
        addLog('INFO', `🎙️ Secure recording started${isVoiceMasked ? ' (Voice Masking ENGAGED)' : ''} — audio stays local`);
        setTranscript('');

        const rawStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const processedStream = setupVoiceMasker(rawStream);

        intel.startSecureRecording(processedStream); // Pass the processed stream
      } catch (err) {
        const intelErr = err as IntelError;
        addLog('ERROR', `❌ Recording failed: ${intelErr.message}`);
        teardownVoiceMasker(); // Ensure cleanup on error
      }
    }
  }, [intel, addLog, isVoiceMasked, setupVoiceMasker, teardownVoiceMasker]);

  // ── Global Wraith Terminal Event Listener ────────────────────────────────────
  useEffect(() => {
    const handleWraithEvent = (e: any) => {
      const { cmd, args } = e.detail;
      if (cmd === 'arm faraday') setIsFaradayArmed(true);
      if (cmd === 'lockdown --burn') {
        const dbs = ['deep-cover-evidence-locker', 'DeepCoverLocker', 'IntruderLogs'];
        dbs.forEach(db => window.indexedDB.deleteDatabase(db));
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
      if (cmd === 'sonar --transmit') setSonarPayload(args[0] || 'WRAITH CMD: STREAM');
      if (cmd === 'argus --strobe') setArgusPayload(args[0] || 'WRAITH CMD: STREAM');
    };

    window.addEventListener('wraithCommand', handleWraithEvent);
    return () => window.removeEventListener('wraithCommand', handleWraithEvent);
  }, []);


  // ── Copy Result ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!analysisResult) return;
    await navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    addLog('INFO', '📋 Analysis copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [analysisResult, addLog]);

  // ── Clear Log ───────────────────────────────────────────────────────────────
  const handleClearLog = useCallback(() => {
    setLogEntries([]);
  }, []);

  // ── Format Duration ─────────────────────────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bp5-dark bg-[#10161A] min-h-screen text-white">
    <div className="flex min-h-screen">
      <DeadMansSwitch onLog={addLog} />

      {showHorcruxGen && (
        <HorcruxGenerator
          onComplete={() => {
            setShowHorcruxGen(false);
            setIsOppenheimerLocked(true);
            addLog('WARNING', '💀 OPPENHEIMER PROTOCOL: Master key evacuated from disk. System is operating on fractional logic boundaries.');
          }}
          onCancel={() => setShowHorcruxGen(false)}
        />
      )}

      {isOppenheimerLocked && (
        <LazarusUnlock onUnlocked={() => setIsOppenheimerLocked(false)} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR  (translated from st.sidebar)
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          ${sidebarOpen ? 'w-72' : 'w-16'}
          flex-shrink-0 border-r border-white/5
          bg-[rgba(10,10,26,0.8)] backdrop-blur-xl
          transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Logo / Toggle */}
        <div className="flex items-center gap-3 p-5 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors reveal-btn"
            aria-label="Toggle sidebar"
          >
            <Shield className="w-6 h-6 text-cyan-400" />
          </button>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-gray-100 tracking-tight">
                Deep-Cover
              </h1>
              <p className="text-xs text-gray-500 font-mono">HUB v1.0</p>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="flex-1 p-5 space-y-6 animate-fade-in overflow-y-auto">
            {/* OPSEC Telemetry Widget */}
            <OpsecDashboard
              motionActive={true}
              faradayActive={!isOnline}
              vaultEncrypted={true}
              onToggleFaraday={() => setIsFaradayArmed(!isFaradayArmed)}
              onArmOppenheimer={() => setShowHorcruxGen(true)}
            />

            {/* SONAR Acoustic Modem */}
            <SonarTerminal
              defaultTxPayload={sonarPayload}
              key={`sonar-${sonarPayload}`}
              onIntelReceived={(txt) => {
                setInputText(txt);
                addLog('SUCCESS', 'Air-Gap bypass complete. Decoded Sonar stream intercepted.');
              }}
              onLog={addLog}
            />

            {/* ARGUS Optical Link */}
            <ArgusTerminal
              defaultTxPayload={argusPayload}
              onIntelReceived={(txt) => {
                setInputText(txt);
                addLog('SUCCESS', 'Argus payload extracted perfectly. Strobed matrix restored to plaintext.');
              }}
              onLog={addLog}
            />

            {/* System Status */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                System Status
              </h3>
              <div className="space-y-3">
                {/* Live Network Status Indicator */}
                <NetworkStatusIndicator isOnline={isOnline} collapsed={false} />

                {/* Overall Status */}
                <StatusPill
                  label="System"
                  status={intel.systemStatus}
                  icon={<Activity className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            {/* AI Engine Health */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                AI Engines
              </h3>
              <div className="space-y-2">
                <EngineIndicator
                  name="LLM (SmolLM2)"
                  ready={intel.llm.isReady}
                  active={intel.llm.isGenerating}
                  error={intel.llm.error}
                  icon={<Brain className="w-4 h-4" />}
                />
                <EngineIndicator
                  name="STT (Whisper)"
                  ready={intel.stt.isReady}
                  active={intel.stt.isRecording || intel.stt.isTranscribing}
                  error={intel.stt.error}
                  icon={<Radio className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">
                  Privacy Shield
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                All data processed locally via WebAssembly. Nothing leaves this
                browser.
              </p>
            </div>
          </div>
        )}

        {/* Collaborative Tools */}
        {sidebarOpen && (
          <div className="px-5 pb-4 animate-fade-in border-b border-white/5 space-y-3">
            <button
              onClick={() => setIsSketchpadOpen(true)}
              className="w-full py-2 px-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold hover:bg-cyan-500/20 transition-colors reveal-btn flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              NEW SKETCH
            </button>
            <button
              onClick={() => setIsConspiracyBoardOpen(true)}
              className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 font-mono text-xs font-bold hover:bg-red-500/20 transition-colors reveal-btn flex items-center justify-center gap-2"
            >
              <Network className="w-4 h-4" />
              CONSPIRACY BOARD
            </button>
            <button
              onClick={() => setIsDarkChannelOpen(true)}
              className="w-full py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-colors reveal-btn flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              DARK CHANNEL
            </button>
          </div>
        )}

        {/* Burn Protocol — Stealthy sidebar placement */}
        {sidebarOpen && (
          <div className="px-5 pb-2 animate-fade-in">
            <BurnProtocol />
          </div>
        )}

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-5 border-t border-white/5 animate-fade-in">
            <p className="text-xs text-gray-600 text-center">
              HackXtreme 2026
            </p>
          </div>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        {/* Air-Gap Protocol Banner (triggered on offline) */}
        <AirGapBanner isOnline={isOnline} />

        {/* Header Bar */}
        <header className="sticky top-0 z-20 px-6 py-4 border-b border-white/5 bg-[rgba(10,10,26,0.6)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-gray-100">
                  Intelligence Dashboard
                </h2>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                Local AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleWhisper}
                className={`p-2 rounded-full transition-colors ${isWhisperActive ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                title="Whisper Protocol. Voice triggers active."
              >
                {isWhisperActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <IntelligenceBriefing onLog={addLog} />
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <CircleDot className={`w-3 h-3 ${intel.systemStatus === 'ready' ? 'text-emerald-400' : intel.systemStatus === 'error' ? 'text-red-400' : 'text-amber-400 animate-pulse-glow'}`} />
                {intel.systemStatus.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* ── Shadow Partner: Engage Toggle ──────────────────────────────── */}
          <ShadowPartner onLog={addLog} />

          {/* ── Two-Column Layout (translated from st.columns([1, 1])) ────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ════════════════════════════════════════════════════════════════
                LEFT: ENTITY ANALYZER  (translated from "Mission Input")
                ════════════════════════════════════════════════════════════════ */}
            <section className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Eye className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-100">
                    Entity Analyzer
                  </h3>
                  <p className="text-xs text-gray-500">
                    Powered by local LLM · Zero cloud
                  </p>
                </div>
              </div>

              {/* Quick-Prompt Chips */}
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText((prev) => prev ? `${prev}\n\n[Directive: ${prompt}]` : `[Directive: ${prompt}]\n\n`)}
                    className="
                      px-3 py-1.5 text-xs font-mono text-cyan-300
                      bg-cyan-500/5 border border-cyan-500/15 rounded-full
                      hover:bg-cyan-500/10 hover:border-cyan-500/30
                      transition-all duration-200 cursor-pointer
                    "
                  >
                    {prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt}
                  </button>
                ))}
              </div>

              {/* Load Sample Intel Button */}
              <button
                onClick={() => {
                  setInputText(SAMPLE_LEAKED_DOCUMENT);
                  addLog('INFO', `📁 Loaded sample intel: ${SAMPLE_INTEL_LABEL}`);
                }}
                className="
                  flex items-center gap-2 px-3 py-1.5
                  text-[11px] font-mono text-gray-500
                  bg-white/[0.02] border border-dashed border-white/10 rounded-lg
                  hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5
                  transition-all duration-300 cursor-pointer
                  w-fit
                "
              >
                <FileText className="w-3.5 h-3.5" />
                [ LOAD INTERCEPTED INTEL ]
              </button>

              {/* Deploy Honeytoken Trap */}
              <button
                onClick={async () => {
                  addLog('WARNING', `⚠️ Deploying Honeytoken Trap...`);
                  try {
                    const fakePayload = "CLASSIFIED MEMORANDUM\n\nSUBJECT: UPCOMING BLACK OPS DEFUNDING\n\nDO NOT DISTRIBUTE.";
                    await saveToLocker(fakePayload, 'TEXT', 'CRITICAL', 'Confidential - Budget Cuts (Decoy)', false, true);
                    addLog('SUCCESS', `✅ Honeytoken Trap Armed inside Secure Vault.`);
                    setVaultRefreshKey(k => k + 1);
                  } catch (err: any) {
                    addLog('ERROR', `Honeytoken Deployment Failed: ${err.message}`);
                  }
                }}
                className="
                  flex items-center gap-2 px-3 py-1.5 ml-3
                  text-[11px] font-mono text-purple-400
                  bg-purple-500/10 border border-dashed border-purple-500/30 rounded-lg
                  hover:text-purple-300 hover:border-purple-500/50 hover:bg-purple-500/20
                  transition-all duration-300 cursor-pointer
                  w-fit inline-flex
                "
              >
                <Ghost className="w-3.5 h-3.5" />
                [ CREATE HONEYTOKEN TRAP ]
              </button>

              {/* Secure File Drop */}
              <SecureFileDrop
                onFileContent={(content, filename) => {
                  setInputText((prev) =>
                    prev
                      ? `${prev}\n\n--- IMPORTED: ${filename} ---\n${content}`
                      : `--- IMPORTED: ${filename} ---\n${content}`,
                  );
                }}
                onLog={addLog}
              />

              {/* Text Input Area */}
              <textarea
                className="intel-input min-h-[200px]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste leaked document, memo, or transcript here for entity analysis..."
              />

              {/* Analyze Button */}
              <button
                className="btn-neon w-full flex items-center justify-center gap-3"
                onClick={handleAnalyze}
                disabled={!inputText.trim() || !intel.llm.isReady || isStreaming}
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ANALYZING INTEL…
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    ANALYZE INTEL
                  </>
                )}
              </button>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="space-y-3 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setResultExpanded(!resultExpanded)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {resultExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Analysis Output
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  {resultExpanded && (
                    <div
                      ref={resultRef}
                      className="
                        max-h-[300px] overflow-y-auto p-4
                        bg-black/40 rounded-lg border border-white/5
                        font-mono text-sm text-gray-300 leading-relaxed
                        whitespace-pre-wrap
                      "
                    >
                      {analysisResult}
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse-glow" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ════════════════════════════════════════════════════════════════
                RIGHT: AUDIO LEAK STREAM  (new for Deep-Cover, mapped from col2)
                ════════════════════════════════════════════════════════════════ */}
            <section className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Radio className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-100">
                    Audio Leak Stream
                  </h3>
                  <p className="text-xs text-gray-500">
                    Powered by local Whisper · Air-gapped
                  </p>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-4">
                {/* Status Display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {intel.stt.isRecording ? (
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-rec-blink" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500/30 animate-ping" />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-gray-600" />
                    )}
                    <span className="text-sm font-mono text-gray-400">
                      {intel.stt.isRecording
                        ? 'RECORDING'
                        : intel.stt.isTranscribing
                          ? 'TRANSCRIBING...'
                          : 'STANDBY'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Whistleblower Voice Masker Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isVoiceMasked}
                          onChange={(e) => setIsVoiceMasked(e.target.checked)}
                          disabled={intel.stt.isRecording}
                        />
                        <div className={`block w-9 h-5 rounded-full transition-colors ${isVoiceMasked ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/5 border border-white/10'}`}></div>
                        <div className={`absolute left-1 w-3.5 h-3.5 rounded-full transition-transform ${isVoiceMasked ? 'transform translate-x-3.5 bg-red-400' : 'bg-gray-400'}`}></div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold tracking-wider ${isVoiceMasked ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {isVoiceMasked ? 'MASK: ON' : 'MASK: OFF'}
                      </span>
                      <VolumeX className={`w-3.5 h-3.5 ${isVoiceMasked ? 'text-red-400' : 'text-gray-600'}`} />
                    </label>

                    {intel.stt.isRecording && (
                      <span className="text-sm font-mono text-red-400 animate-pulse-glow">
                        {formatDuration(recordingDuration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Waveform Canvas */}
                <div className="w-full h-12 bg-black/50 rounded-lg border border-white/5 overflow-hidden relative">
                  {!intel.stt.isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-gray-600">
                      AWAITING AUDIO STREAM
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full opacity-80"
                    width={400}
                    height={48}
                  />
                </div>

                {/* Mic Buttons */}
                <div className="flex gap-3">
                  {!intel.stt.isRecording ? (
                    <button
                      className="btn-neon flex-1 flex items-center justify-center gap-3"
                      onClick={toggleRecording}
                      disabled={!intel.stt.isReady || intel.stt.isTranscribing}
                    >
                      <Mic className="w-5 h-5" />
                      START SECURE RECORDING
                    </button>
                  ) : (
                    <button
                      className="btn-danger flex-1 flex items-center justify-center gap-3"
                      onClick={toggleRecording}
                    >
                      <MicOff className="w-5 h-5" />
                      STOP &amp; TRANSCRIBE
                    </button>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Audio is captured directly into browser memory and processed
                    locally by Whisper WASM. No audio data ever leaves this
                    device.
                  </p>
                </div>
              </div>

              {/* Transcript Output */}
              {(transcript || intel.stt.isTranscribing) && (
                <div className="space-y-3 animate-slide-up">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Transcript
                  </h4>
                  <div className="p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-sm text-gray-300 leading-relaxed min-h-[120px] whitespace-pre-wrap">
                    {intel.stt.isTranscribing ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing audio locally...
                      </div>
                    ) : (
                      transcript
                    )}
                  </div>

                  {/* Send to Analyzer button */}
                  {transcript && !intel.stt.isTranscribing && (
                    <button
                      onClick={() => {
                        setInputText((prev) =>
                          prev
                            ? `${prev}\n\n--- AUDIO TRANSCRIPT ---\n${transcript}`
                            : `--- AUDIO TRANSCRIPT ---\n${transcript}`,
                        );
                        addLog('INFO', '📋 Transcript sent to Entity Analyzer');
                      }}
                      className="
                        w-full py-3 text-sm font-semibold text-cyan-400
                        bg-cyan-500/5 border border-cyan-500/20 rounded-xl
                        hover:bg-cyan-500/10 hover:border-cyan-500/30
                        transition-all duration-200 flex items-center justify-center gap-2
                      "
                    >
                      <Brain className="w-4 h-4" />
                      Send to Entity Analyzer
                    </button>
                  )}
                </div>
              )}

              {/* Error Display */}
              {intel.stt.error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 animate-slide-up">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">
                      {intel.stt.error?.code}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {intel.stt.error?.message}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* COVERT OPS LAYER: Steganography & Dead Drop */}
            <GhostProtocol onLog={addLog} />
            <DeadDrop
              ref={deadDropRef}
              onLog={addLog}
              onMessageReceived={(text: string) => {
                setP2pIncoming(prev => [...prev, { text, timestamp: new Date().toISOString() }]);
                addLog('SUCCESS', `📦 P2P payload received [${text.length} chars]`);
              }}
            />
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              FULL-WIDTH: ENCRYPTED TELEMETRY LOG (P2P WebRTC Chat)
              ══════════════════════════════════════════════════════════════════ */}
          <TelemetryLog
            onLog={addLog}
            onSendWebRTC={(text) => deadDropRef.current?.sendMessage(text) ?? false}
            incomingMessages={p2pIncoming}
          />

          {/* ══════════════════════════════════════════════════════════════════
              FULL-WIDTH: THREAT ANALYSIS BOARD (Network Graph + Inspector)
              ══════════════════════════════════════════════════════════════════ */}
          <ThreatAnalysisBoard onLog={addLog} />

          {/* ══════════════════════════════════════════════════════════════════
              FULL-WIDTH: VAULT INTERROGATION (Global Database Search)
              ══════════════════════════════════════════════════════════════════ */}
          <VaultInterrogation
            refreshKey={vaultRefreshKey}
            onLoadToAnalyzer={(content) => {
              setInputText(content);
              addLog('INFO', '📋 Vault evidence loaded into Entity Analyzer');
            }}
            onLog={addLog}
          />

          {/* ══════════════════════════════════════════════════════════════════
              FULL-WIDTH: SECURE VAULT (Cryptographic Evidence Locker)
              ══════════════════════════════════════════════════════════════════ */}
          <SecureVault
            refreshKey={vaultRefreshKey}
            onDecryptToAnalyzer={(content) => {
              setInputText(content);
              addLog('INFO', '📋 Vault evidence loaded into Entity Analyzer');
            }}
            onLog={addLog}
          />

          {/* ══════════════════════════════════════════════════════════════════
              BOTTOM: INTEL STREAM  (translated from "Core Systems Log")
              ══════════════════════════════════════════════════════════════════ */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-100">
                  Intel Stream
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-gray-500 bg-white/5 rounded-full">
                  {logEntries.length} events
                </span>
              </div>
              {logEntries.length > 0 && (
                <button
                  onClick={handleClearLog}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            <div
              className="
                max-h-[220px] overflow-y-auto p-4
                bg-black/40 rounded-lg border border-white/5
                font-mono text-sm
              "
              style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}
            >
              {logEntries.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  System standing by… awaiting intel operations.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {logEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="log-entry flex gap-3 pb-1.5 border-b border-dashed border-white/5 last:border-0"
                    >
                      <span className="text-gray-600 flex-shrink-0">
                        [{entry.time}]
                      </span>
                      <span className={`font-semibold ${LOG_COLORS[entry.type]}`}>
                        {entry.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Native Render Layers */}
      {isSketchpadOpen && (
        <SecureSketchpad onClose={() => setIsSketchpadOpen(false)} onLog={addLog} />
      )}
      {isConspiracyBoardOpen && (
        <ConspiracyBoard onClose={() => setIsConspiracyBoardOpen(false)} />
      )}
      {isDarkChannelOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <button onClick={() => setIsDarkChannelOpen(false)} className="absolute top-4 right-4 z-50 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-bold font-mono uppercase text-[10px] tracking-widest border border-red-500/30">Close Override</button>
            <DarkChannel />
          </div>
        </div>
      )}

      {/* Microscopic Dead Man's Switch Countdown */}
      <div className="fixed bottom-1 right-2 text-[8px] font-mono font-bold text-red-500 opacity-20 pointer-events-none z-[9999] select-none tracking-widest">
        DMS_BURN:{timeUntilBurnStr}
      </div>
    </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusPill({
  label,
  status,
  icon,
}: {
  label: string;
  status: string;
  icon: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    ready: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    partial: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    initializing: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl border ${colorMap[status] || colorMap.initializing}`}
    >
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
        {status}
      </span>
    </div>
  );
}

function EngineIndicator({
  name,
  ready,
  active,
  error,
  icon,
}: {
  name: string;
  ready: boolean;
  active: boolean;
  error: IntelError | null;
  icon: React.ReactNode;
}) {
  let dotColor = 'bg-gray-600';
  let statusText = 'Loading…';

  if (error) {
    dotColor = 'bg-red-500';
    statusText = error.code;
  } else if (ready && active) {
    dotColor = 'bg-cyan-400 animate-pulse-glow';
    statusText = 'Active';
  } else if (ready) {
    dotColor = 'bg-emerald-400';
    statusText = 'Ready';
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300 truncate">{name}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500">{statusText}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      </div>
    </div>
  );
}
