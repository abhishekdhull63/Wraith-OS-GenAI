/**
 * LogAnalyzer.tsx
 * ===============
 * Air-Gapped Local Log Ingestion & Analysis
 *
 * Accepts .json or .txt log file uploads, performs real local regex-based
 * parsing (failed logins, IP extraction, brute-force pattern detection),
 * then passes the raw content through the existing local LLM pipeline
 * (useSecureIntelligence → streamAnalysis) for AI-powered classification.
 *
 * Both outputs are displayed honestly — no fake network scans.
 */

import { useState, useCallback, useRef } from 'react';
import {
  FileUp,
  Shield,
  AlertTriangle,
  Loader2,
  Brain,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
} from 'lucide-react';
import { useSecureIntelligence } from '../hooks/useSecureIntelligence';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface LogAnalyzerProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

interface LocalParseResult {
  totalLines: number;
  failedLogins: number;
  uniqueSourceIPs: string[];
  suspiciousIPs: { ip: string; count: number }[];
  eventTypes: Record<string, number>;
  timeRange: { earliest: string | null; latest: string | null };
  bruteForceDetected: boolean;
  portScanDetected: boolean;
  privilegeEscalation: boolean;
}

// ─── Local Log Parser ───────────────────────────────────────────────────────────

function parseLogsLocally(rawText: string): LocalParseResult {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);

  // IP extraction
  const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
  const ipCounts: Record<string, number> = {};

  // Event type extraction
  const eventTypes: Record<string, number> = {};

  // Failed login detection
  let failedLogins = 0;

  // Timestamp extraction
  const timestamps: string[] = [];
  const tsRegex = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g;

  // Privilege escalation keywords
  let privilegeEscalation = false;

  // Port scan indicators
  let portScanDetected = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Extract IPs
    const ips = line.match(ipRegex) || [];
    for (const ip of ips) {
      // Skip common internal/loopback
      if (ip === '127.0.0.1' || ip === '0.0.0.0') continue;
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }

    // Detect failed logins
    if (
      lower.includes('failed') ||
      lower.includes('authentication failure') ||
      lower.includes('invalid password') ||
      lower.includes('access denied') ||
      lower.includes('login failed') ||
      lower.includes('unauthorized')
    ) {
      failedLogins++;
    }

    // Detect event types
    if (lower.includes('ssh') || lower.includes('sshd')) {
      eventTypes['SSH'] = (eventTypes['SSH'] || 0) + 1;
    }
    if (lower.includes('http') || lower.includes('web') || lower.includes('nginx') || lower.includes('apache')) {
      eventTypes['HTTP'] = (eventTypes['HTTP'] || 0) + 1;
    }
    if (lower.includes('firewall') || lower.includes('iptables') || lower.includes('drop') || lower.includes('block')) {
      eventTypes['FIREWALL'] = (eventTypes['FIREWALL'] || 0) + 1;
    }
    if (lower.includes('dns') || lower.includes('resolve') || lower.includes('lookup')) {
      eventTypes['DNS'] = (eventTypes['DNS'] || 0) + 1;
    }
    if (lower.includes('sudo') || lower.includes('root') || lower.includes('privilege') || lower.includes('escalat')) {
      privilegeEscalation = true;
      eventTypes['PRIVILEGE'] = (eventTypes['PRIVILEGE'] || 0) + 1;
    }
    if (lower.includes('scan') || lower.includes('nmap') || lower.includes('port')) {
      portScanDetected = true;
      eventTypes['PORT_SCAN'] = (eventTypes['PORT_SCAN'] || 0) + 1;
    }

    // Extract timestamps
    const ts = line.match(tsRegex);
    if (ts) timestamps.push(...ts);
  }

  // Identify suspicious IPs (those with high frequency)
  const suspiciousIPs = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Brute force: an IP appearing in 5+ failed events
  const bruteForceDetected = suspiciousIPs.some((s) => s.count >= 5) && failedLogins >= 5;

  // Sort timestamps for range
  timestamps.sort();

  return {
    totalLines: lines.length,
    failedLogins,
    uniqueSourceIPs: Object.keys(ipCounts),
    suspiciousIPs,
    eventTypes,
    timeRange: {
      earliest: timestamps[0] || null,
      latest: timestamps[timestamps.length - 1] || null,
    },
    bruteForceDetected,
    portScanDetected,
    privilegeEscalation,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function LogAnalyzer({ onLog }: LogAnalyzerProps) {
  const intel = useSecureIntelligence();

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [rawContent, setRawContent] = useState('');
  const [localResult, setLocalResult] = useState<LocalParseResult | null>(null);
  const [llmOutput, setLlmOutput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRawPreview, setShowRawPreview] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handle File Upload ──────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'json' && ext !== 'txt') {
        onLog?.('ERROR', `❌ Unsupported file type: .${ext}. Only .json and .txt accepted.`);
        return;
      }

      onLog?.('INFO', `📁 Ingesting log file: ${file.name} [${(file.size / 1024).toFixed(1)} KB]`);

      const text = await file.text();
      setFileName(file.name);
      setFileSize(file.size);
      setRawContent(text);
      setLlmOutput('');
      setShowRawPreview(false);

      // ── Phase 1: Local Regex Parse ────────────────────────────────────────
      const parsed = parseLogsLocally(text);
      setLocalResult(parsed);

      onLog?.(
        'SUCCESS',
        `✅ Local parse complete: ${parsed.totalLines} lines, ${parsed.failedLogins} failed events, ${parsed.uniqueSourceIPs.length} unique IPs`,
      );

      if (parsed.bruteForceDetected) {
        onLog?.('WARNING', '🚨 BRUTE FORCE PATTERN DETECTED in uploaded log');
      }

      // ── Phase 2: LLM Classification via existing pipeline ─────────────────
      setIsAnalyzing(true);
      setLlmOutput('');

      const prompt = `You are an expert cybersecurity Intrusion Detection System. Analyze the provided network log data. If you detect anomalies (like repeated failed logins or suspicious ports), output a short, urgent security alert. Do NOT extract entities or names. Format your response exactly like this:\n🚨 ALERT: [1-sentence description of the threat and the source IP]\n✅ ACTION REQUIRED: [1-sentence recommendation on how to mitigate it]\n\n--- RAW LOG DATA ---\n${text.slice(0, 3000)}\n--- END LOG DATA ---`;

      try {
        let accumulated = '';
        await intel.streamAnalysis(
          prompt,
          (chunk) => {
            accumulated += chunk;
            setLlmOutput(accumulated);
          },
          { temperature: 0.2, max_tokens: 512 },
        );

        onLog?.('SUCCESS', '🧠 LLM classification complete');
      } catch (err: any) {
        onLog?.('ERROR', `❌ LLM analysis failed: ${err.message}`);
        setLlmOutput('[LLM unavailable — local parse results shown above]');
      } finally {
        setIsAnalyzing(false);
      }

      // Reset the input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [intel, onLog],
  );

  // ── Clear ───────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setFileName(null);
    setFileSize(0);
    setRawContent('');
    setLocalResult(null);
    setLlmOutput('');
    setIsAnalyzing(false);
    setShowRawPreview(false);
  }, []);

  // ── Threat Level from local parse ───────────────────────────────────────────
  const getThreatLevel = (r: LocalParseResult): { label: string; color: string; glow: string } => {
    if (r.bruteForceDetected || r.privilegeEscalation) {
      return { label: 'CRITICAL', color: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]' };
    }
    if (r.failedLogins >= 10 || r.portScanDetected) {
      return { label: 'HIGH', color: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]' };
    }
    if (r.failedLogins >= 3) {
      return { label: 'MODERATE', color: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' };
    }
    return { label: 'LOW', color: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="glass-card p-6 space-y-5" id="log-analyzer">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">Local Log Ingestion</h3>
            <p className="text-xs text-gray-500">Air-gapped analysis · 100% local AI · No network scans</p>
          </div>
        </div>
        {fileName && (
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
            title="Clear analysis"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      {!fileName && (
        <label
          className="
            flex flex-col items-center justify-center gap-3
            p-8 rounded-xl cursor-pointer
            border-2 border-dashed border-violet-500/20
            bg-violet-500/[0.02] hover:bg-violet-500/[0.05]
            hover:border-violet-500/40
            transition-all duration-300 group
          "
        >
          <div className="p-3 rounded-full bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
            <FileUp className="w-6 h-6 text-violet-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-300 group-hover:text-gray-100 transition-colors">
              Upload Log File
            </p>
            <p className="text-xs text-gray-600 mt-1 font-mono">.json or .txt · Processed 100% locally</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      )}

      {/* File Info Bar */}
      {fileName && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15 animate-fade-in">
          <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-gray-300 truncate">{fileName}</p>
            <p className="text-[10px] text-gray-600 font-mono">
              {(fileSize / 1024).toFixed(1)} KB · {localResult?.totalLines ?? 0} lines
            </p>
          </div>
          {localResult && (() => {
            const threat = getThreatLevel(localResult);
            return (
              <span
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full border ${threat.color} ${threat.glow}`}
                style={{
                  borderColor: 'currentColor',
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                {threat.label}
              </span>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          LOCAL PARSE RESULTS
         ═══════════════════════════════════════════════════════════════════════ */}
      {localResult && (
        <div className="space-y-3 animate-slide-up">
          <button
            onClick={() => setLocalExpanded(!localExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 transition-colors"
          >
            {localExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Activity className="w-4 h-4 text-violet-400" />
            Local Parse Results
          </button>

          {localExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
              {/* Stat Cards */}
              <StatCard label="Total Events" value={String(localResult.totalLines)} color="text-gray-300" />
              <StatCard
                label="Failed Logins"
                value={String(localResult.failedLogins)}
                color={localResult.failedLogins >= 5 ? 'text-red-400' : 'text-gray-300'}
                alert={localResult.failedLogins >= 5}
              />
              <StatCard label="Unique IPs" value={String(localResult.uniqueSourceIPs.length)} color="text-cyan-400" />
              <StatCard
                label="Brute Force"
                value={localResult.bruteForceDetected ? 'DETECTED' : 'None'}
                color={localResult.bruteForceDetected ? 'text-red-400' : 'text-emerald-400'}
                alert={localResult.bruteForceDetected}
              />
            </div>
          )}

          {/* Suspicious IPs Table */}
          {localExpanded && localResult.suspiciousIPs.length > 0 && (
            <div className="rounded-lg bg-black/30 border border-white/5 overflow-hidden animate-fade-in">
              <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                  Top Source IPs by Frequency
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {localResult.suspiciousIPs.map((s) => (
                  <div key={s.ip} className="flex items-center justify-between px-3 py-2 font-mono text-xs">
                    <span className="text-gray-300">{s.ip}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-red-500"
                        style={{
                          width: `${Math.min(120, (s.count / Math.max(...localResult.suspiciousIPs.map((x) => x.count))) * 120)}px`,
                        }}
                      />
                      <span className={`w-8 text-right ${s.count >= 5 ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        {s.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Types */}
          {localExpanded && Object.keys(localResult.eventTypes).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(localResult.eventTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-full bg-white/[0.03] border border-white/10 text-gray-400"
                  >
                    {type}:{' '}
                    <span className="text-gray-200">{count}</span>
                  </span>
                ))}
            </div>
          )}

          {/* Time Range */}
          {localExpanded && localResult.timeRange.earliest && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600">
              <Clock className="w-3 h-3" />
              <span>
                {localResult.timeRange.earliest} → {localResult.timeRange.latest}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          LLM CLASSIFICATION OUTPUT
         ═══════════════════════════════════════════════════════════════════════ */}
      {(isAnalyzing || llmOutput) && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Brain className="w-4 h-4 text-cyan-400" />
            AI Classification
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/70">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI Analyzing…
              </span>
            )}
          </div>

          <div
            className="
              p-4 rounded-lg bg-black/40 border border-white/5
              font-mono text-sm text-gray-300 leading-relaxed
              whitespace-pre-wrap min-h-[60px]
            "
            style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
          >
            {llmOutput || (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing log through local AI engine…
              </div>
            )}
            {isAnalyzing && llmOutput && (
              <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />
            )}
          </div>
        </div>
      )}

      {/* Raw Content Preview Toggle */}
      {rawContent && (
        <div>
          <button
            onClick={() => setShowRawPreview(!showRawPreview)}
            className="flex items-center gap-2 text-[11px] font-mono text-gray-600 hover:text-gray-400 transition-colors"
          >
            {showRawPreview ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {showRawPreview ? 'Hide' : 'Show'} raw log preview
          </button>
          {showRawPreview && (
            <pre
              className="
                mt-2 p-3 rounded-lg bg-black/50 border border-white/5
                text-[10px] font-mono text-gray-500 leading-relaxed
                max-h-[200px] overflow-y-auto whitespace-pre-wrap
              "
            >
              {rawContent.slice(0, 5000)}
              {rawContent.length > 5000 && '\n\n[… truncated]'}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  alert = false,
}: {
  label: string;
  value: string;
  color: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`
        p-3 rounded-lg bg-black/30 border transition-colors
        ${alert ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/5'}
      `}
    >
      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
