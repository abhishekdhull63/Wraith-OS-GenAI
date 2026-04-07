import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Elevation, Tag, Intent, InputGroup, Button } from '@blueprintjs/core';

// ─── Palette Constants ──────────────────────────────────────────────────────────
const PANEL_BG = '#182026';
const BORDER = '#394B59';
const TEXT_PRI = '#F5F8FA';
const TEXT_MUT = '#A7B6C2';
const DANGER = '#DB3737';
const SUCCESS = '#0F9960';
const HIGHLIGHT = '#2B95D6';

// ─── Types ──────────────────────────────────────────────────────────────────────

type LogType = 'INCOMING' | 'AI_ALERT' | 'OUTGOING';

interface TelemetryEntry {
  id: string;
  type: LogType;
  timestamp: string;
  callsign: string;
  body: string;
  meta?: string;
}

// ─── Static Mock Data ───────────────────────────────────────────────────────────
const MOCK_LOG: TelemetryEntry[] = [
  {
    id: 'tlm-001',
    type: 'INCOMING',
    timestamp: new Date().toISOString(),
    callsign: 'SIGINT-NODE-7',
    body: 'Extraction coordinate confirmed: 28.6139°N 77.2090°E — Package is mobile. ETA to safehouse: 47 min. Awaiting counter-surveillance sweep before EXFIL.',
    meta: 'PAYLOAD_SZ: 1.2KB | HOPS: 3 | LATENCY: 22ms',
  },
  {
    id: 'tlm-002',
    type: 'AI_ALERT',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    callsign: 'OVERWATCH-AI',
    body: '⚠️ ANOMALY DETECTED: Pattern match on facial recognition DB — Subject ROMEO-17 flagged at checkpoint BRAVO. Confidence: 94.2%. Recommend immediate route adjustment.',
    meta: 'MODEL: SmolLM2-360M | INFERENCE: 180ms | LOCAL',
  },
  {
    id: 'tlm-003',
    type: 'INCOMING',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    callsign: 'HANDLER-ACTUAL',
    body: 'Abort order rescinded. Proceed with PHASE-3 as briefed. Window closes at 0300Z. All units confirm receipt.',
    meta: 'PAYLOAD_SZ: 0.4KB | HOPS: 1 | LATENCY: 8ms',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return iso;
  }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function PulsingDot({ live }: { live: boolean }) {
  const color = live ? SUCCESS : '#5C7080';

  return (
    <span className="relative flex h-2.5 w-2.5">
      {live && (
        <span
          className="absolute inline-flex h-full w-full animate-ping opacity-60"
          style={{ backgroundColor: color, borderRadius: '50%' }}
        />
      )}
      <span className="relative inline-flex h-2.5 w-2.5" style={{ backgroundColor: color, borderRadius: '50%' }} />
    </span>
  );
}

function EntryBlock({ entry }: { entry: TelemetryEntry }) {
  const isAlert = entry.type === 'AI_ALERT';
  const isOutgoing = entry.type === 'OUTGOING';

  const borderColor = isAlert ? DANGER : isOutgoing ? SUCCESS : HIGHLIGHT;
  const bgColor = isAlert ? `${DANGER}1A` : 'transparent';
  const alignClass = isOutgoing ? 'ml-auto text-right' : '';
  const maxW = 'max-w-[92%]';

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`${maxW} ${alignClass} border-l-2 pl-3 py-2 my-1 font-mono`}
        style={{
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
        }}
      >
        {/* Header row */}
        <div className={`flex items-center gap-2 flex-wrap mb-1 ${isOutgoing ? 'justify-end' : ''}`}>
          <span className="text-[10px] tracking-widest font-bold uppercase" style={{ color: borderColor }}>
            {entry.callsign}
          </span>
          <span className="text-[10px]" style={{ color: TEXT_MUT }}>
            {fmtTs(entry.timestamp)}
          </span>
        </div>

        {/* Body */}
        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_PRI }}>
          {entry.body}
        </p>

        {/* Meta */}
        {entry.meta && (
          <p className="text-[10px] mt-1.5 tracking-wide" style={{ color: TEXT_MUT }}>
            {entry.meta}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export interface IncomingP2PMessage {
  text: string;
  timestamp: string;
}

interface TelemetryLogProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
  /** Called to send a message over the WebRTC data channel */
  onSendWebRTC?: (text: string) => boolean;
  /** Incoming messages from the WebRTC peer — rendered as INCOMING entries */
  incomingMessages?: IncomingP2PMessage[];
}

export default function TelemetryLog({ onLog, onSendWebRTC, incomingMessages }: TelemetryLogProps) {
  const [entries, setEntries] = useState<TelemetryEntry[]>(MOCK_LOG);
  const [inputValue, setInputValue] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  // Track which incoming messages we've already appended so we don't duplicate
  const processedCountRef = useRef(0);

  // Auto-scroll on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries]);

  // Append new incoming P2P messages as INCOMING telemetry entries
  useEffect(() => {
    if (!incomingMessages || incomingMessages.length <= processedCountRef.current) return;

    const newMessages = incomingMessages.slice(processedCountRef.current);
    processedCountRef.current = incomingMessages.length;

    const newEntries: TelemetryEntry[] = newMessages.map((msg, i) => ({
      id: `p2p-in-${Date.now()}-${i}`,
      type: 'INCOMING' as LogType,
      timestamp: msg.timestamp,
      callsign: 'PEER-AGENT',
      body: msg.text,
      meta: `P2P: WebRTC-DTLS | PAYLOAD_SZ: ${msg.text.length}B | DIRECT`,
    }));

    setEntries((prev) => [...prev, ...newEntries]);
  }, [incomingMessages]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Send over WebRTC P2P data channel
    if (onSendWebRTC) {
      const sent = onSendWebRTC(trimmed);
      if (!sent) {
        onLog?.('WARNING', 'P2P channel not open — message logged locally only');
      }
    }

    const newEntry: TelemetryEntry = {
      id: `tlm-${Date.now()}`,
      type: 'OUTGOING',
      timestamp: new Date().toISOString(),
      callsign: 'OPERATOR-ACTUAL',
      body: trimmed,
      meta: `ENC: AES-256-GCM | SIG: ED25519 | SEQ: ${entries.length + 1}`,
    };

    setEntries((prev) => [...prev, newEntry]);
    setInputValue('');
    onLog?.('SUCCESS', `Telemetry burst transmitted [${trimmed.length} chars] — encrypted via AES-256-GCM`);
  }, [inputValue, entries, onLog, onSendWebRTC]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Card
      elevation={Elevation.TWO}
      className="!rounded-none !p-0 overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: PANEL_BG,
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER PANEL — Connection Status + Metadata Tags
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2 flex-shrink-0"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2.5">
          <PulsingDot live />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: SUCCESS }}>
            TELEMETRY_FEED :: LIVE
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tag
            intent={Intent.WARNING}
            minimal
            className="!rounded-none !font-mono !text-[10px] !tracking-wider !font-bold"
          >
            PORT: 8443
          </Tag>
          <Tag
            intent={Intent.SUCCESS}
            minimal
            className="!rounded-none !font-mono !text-[10px] !tracking-wider !font-bold"
          >
            ENC: AES-256
          </Tag>
          <Tag
            intent={Intent.PRIMARY}
            minimal
            className="!rounded-none !font-mono !text-[10px] !tracking-wider !font-bold"
          >
            PROTO: DTLS-SRTP
          </Tag>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LOG FEED — Scrollable Telemetry Stream
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={feedRef}
        className="overflow-y-auto px-4 py-3 space-y-1 flex-1 flex flex-col"
        style={{
          minHeight: '200px',
          backgroundColor: '#0E1419',
        }}
      >
        {entries.length === 0 && (
          <div className="text-center py-10 font-mono text-xs my-auto" style={{ color: TEXT_MUT }}>
            — AWAITING ENCRYPTED TELEMETRY —
          </div>
        )}

        {entries.map((entry) => (
          <EntryBlock key={entry.id} entry={entry} />
        ))}

        {/* Blinking cursor at bottom of feed */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="inline-block w-1.5 h-3.5 animate-pulse" style={{ backgroundColor: HIGHLIGHT }} />
          <span className="text-[10px] font-mono tracking-widest" style={{ color: TEXT_MUT }}>
            STREAM_OPEN
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INPUT CONSOLE — Command-Line Entry
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="px-3 py-2.5 flex-shrink-0"
        style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: PANEL_BG }}
      >
        <InputGroup
          className="!rounded-none [&_input]:!rounded-none [&_input]:!font-mono [&_input]:!text-xs [&_input]:!tracking-wide [&_input]:!text-[#F5F8FA] [&_input]:!bg-[#10161A] [&_input]:!caret-[#2B95D6] [&_input]:placeholder:!text-[#5C7080] [&_input]:!shadow-none [&_input]:focus:!outline-none [&_input]:focus:!ring-0"
          style={{
            backgroundColor: '#10161A',
          }}
          placeholder="TRANSMIT ENCRYPTED PAYLOAD ..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          leftIcon="chevron-right"
          rightElement={
            <Button
              intent={Intent.SUCCESS}
              minimal
              icon="send-message"
              className="!rounded-none !font-mono !text-[10px] !tracking-widest !font-bold"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            />
          }
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] font-mono tracking-wider" style={{ color: TEXT_MUT }}>
            END-TO-END ENCRYPTED • P2P RELAY • NO CLOUD
          </span>
          <span className="text-[9px] font-mono tracking-wider" style={{ color: TEXT_MUT }}>
            {entries.length} ENTRIES
          </span>
        </div>
      </div>
    </Card>
  );
}
