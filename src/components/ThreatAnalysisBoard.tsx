/**
 * ThreatAnalysisBoard.tsx
 * =======================
 * Tactical network-graph analysis panel — Palantir Gotham aesthetic.
 *
 * Left pane  : CSS/SVG mock graph viewport (70%) with grid-pattern overlay.
 * Right pane : Entity Inspector (30%) with metadata, AI confidence, and isolation action.
 *
 * Uses BlueprintJS Card, Divider, ProgressBar, Button + Tailwind layout.
 * Blueprint CSS loaded globally in main.tsx.
 */

import { useState, useCallback } from 'react';
import { Card, Elevation, Divider, ProgressBar, Button, Intent } from '@blueprintjs/core';

// ─── Palette ────────────────────────────────────────────────────────────────────
const BG_BASE = '#10161A';
const PANEL_BG = '#182026';
const BORDER = '#394B59';
const TEXT_PRI = '#F5F8FA';
const TEXT_MUT = '#A7B6C2';
const ACCENT = '#2B95D6';
const DANGER = '#DB3737';
const NODE_GREY = '#5C7080';
const SUCCESS = '#0F9960';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface EntityNode {
  id: string;
  label: string;
  hash: string;
  type: string;
  cx: number;
  cy: number;
  variant: 'critical' | 'standard' | 'selected';
  confidence: number;
  telemetry: Record<string, string>;
  isolated?: boolean;
}

// ─── Mock Graph Data ────────────────────────────────────────────────────────────

const MOCK_NODES: EntityNode[] = [
  {
    id: 'node-alpha',
    label: 'ALPHA',
    hash: '0x8F2A…D39C',
    type: 'COMMUNICATION_DEVICE',
    cx: 50,
    cy: 45,
    variant: 'critical',
    confidence: 0.94,
    telemetry: {
      LAST_SEEN: '14:02:45',
      GEO_FENCE: 'SECTOR_7',
      SIGNAL_DBM: '-42',
      PROTOCOL: 'ENCRYPTED_BURST',
      FREQ_MHZ: '2437.5',
      INTERCEPT_ID: 'INT-9971',
    },
  },
  {
    id: 'node-bravo',
    label: 'BRAVO',
    hash: '0x3C71…A8E2',
    type: 'RELAY_SERVER',
    cx: 25,
    cy: 25,
    variant: 'standard',
    confidence: 0.72,
    telemetry: {
      LAST_SEEN: '13:58:11',
      GEO_FENCE: 'SECTOR_3',
      UPTIME_HRS: '1,288',
      THROUGHPUT: '4.2 GB/s',
    },
  },
  {
    id: 'node-charlie',
    label: 'CHARLIE',
    hash: '0xF105…6B44',
    type: 'END_USER_TERMINAL',
    cx: 75,
    cy: 25,
    variant: 'selected',
    confidence: 0.88,
    telemetry: {
      LAST_SEEN: '14:05:33',
      GEO_FENCE: 'SECTOR_7',
      OS_FINGERPRINT: 'LINUX_6.x',
      MAC_PREFIX: 'AA:BB:CC',
      SESSION_TOKEN: 'TKN-48A2F',
    },
  },
  {
    id: 'node-delta',
    label: 'DELTA',
    hash: '0x21D9…E7F0',
    type: 'UNKNOWN_ASSET',
    cx: 50,
    cy: 75,
    variant: 'standard',
    confidence: 0.41,
    telemetry: {
      LAST_SEEN: '13:44:02',
      GEO_FENCE: 'UNRESOLVED',
      STATUS: 'DORMANT',
    },
  },
];

// Edges: [fromIndex, toIndex]
const MOCK_EDGES: [number, number][] = [
  [0, 1], // ALPHA ↔ BRAVO
  [0, 2], // ALPHA ↔ CHARLIE
  [0, 3], // ALPHA ↔ DELTA
  [1, 2], // BRAVO ↔ CHARLIE
];

// ─── SVG Sub-Components ─────────────────────────────────────────────────────────

function GraphEdge({ x1, y1, x2, y2, active }: { x1: number; y1: number; x2: number; y2: number; active: boolean }) {
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={active ? ACCENT : BORDER}
      strokeWidth={active ? 1.5 : 0.8}
      strokeDasharray={active ? 'none' : '4 3'}
      opacity={active ? 0.9 : 0.4}
    />
  );
}

function GraphNode({ node, isSelected, onClick }: { node: EntityNode; isSelected: boolean; onClick: () => void }) {
  const r = node.variant === 'critical' ? 22 : 18;

  let strokeColor = NODE_GREY;
  let fillColor = 'rgba(0,0,0,0.6)';
  let glowFilter = '';
  let dashArray = 'none';

  // ── Isolated node overrides ──
  if (node.isolated) {
    strokeColor = DANGER;
    fillColor = 'rgba(219,55,55,0.06)';
    glowFilter = 'url(#glow-red)';
    dashArray = '6 4';
  } else if (node.variant === 'critical') {
    strokeColor = DANGER;
    glowFilter = 'url(#glow-red)';
  } else if (node.variant === 'selected' || isSelected) {
    strokeColor = ACCENT;
    fillColor = 'rgba(43,149,214,0.08)';
    glowFilter = 'url(#glow-blue)';
  }

  if (isSelected && !node.isolated) {
    strokeColor = ACCENT;
    fillColor = 'rgba(43,149,214,0.12)';
    glowFilter = 'url(#glow-blue)';
  }

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      opacity={node.isolated ? 0.5 : 1}
    >
      {/* Glow background circle */}
      {glowFilter && (
        <circle
          cx={`${node.cx}%`}
          cy={`${node.cy}%`}
          r={r + 6}
          fill="none"
          stroke={strokeColor}
          strokeWidth={0.5}
          opacity={0.3}
          filter={glowFilter}
        />
      )}

      {/* Pulse ring for critical (suppressed when isolated) */}
      {node.variant === 'critical' && !node.isolated && (
        <circle
          cx={`${node.cx}%`}
          cy={`${node.cy}%`}
          r={r + 4}
          fill="none"
          stroke={DANGER}
          strokeWidth={1}
          opacity={0.5}
        >
          <animate attributeName="r" from={r + 2} to={r + 14} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={`${node.cx}%`}
        cy={`${node.cy}%`}
        r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={dashArray}
      />

      {/* Inner dot */}
      <circle cx={`${node.cx}%`} cy={`${node.cy}%`} r={3} fill={node.isolated ? DANGER : strokeColor} />

      {/* QUARANTINED label for isolated nodes */}
      {node.isolated && (
        <text
          x={`${node.cx}%`}
          y={`${node.cy - (node.variant === 'critical' ? 7 : 6)}%`}
          textAnchor="middle"
          fill={DANGER}
          fontSize="7"
          fontFamily="monospace"
          letterSpacing="3"
          fontWeight="bold"
        >
          QUARANTINED
        </text>
      )}

      {/* Label */}
      <text
        x={`${node.cx}%`}
        y={`${node.cy + (node.variant === 'critical' ? 7 : 6)}%`}
        textAnchor="middle"
        fill={node.isolated ? DANGER : TEXT_MUT}
        fontSize="9"
        fontFamily="monospace"
        letterSpacing="2"
      >
        {node.label}
      </text>
    </g>
  );
}

// ─── Inspector Sub-Component ────────────────────────────────────────────────────

function KVRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-baseline py-0.5">
      <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: TEXT_MUT }}>
        {label}
      </span>
      <span className="text-[11px] font-mono font-bold" style={{ color: valueColor || TEXT_PRI }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface ThreatAnalysisBoardProps {
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

export default function ThreatAnalysisBoard({ onLog }: ThreatAnalysisBoardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-charlie');
  const [nodes, setNodes] = useState<EntityNode[]>(MOCK_NODES);
  const [edges, setEdges] = useState<[number, number][]>(MOCK_EDGES);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleSelectNode = useCallback(
    (node: EntityNode) => {
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      onLog?.('INFO', `Entity selected: ${node.label} [${node.hash}]`);
    },
    [onLog],
  );

  const handleIsolate = useCallback(() => {
    if (!selectedNode) return;

    // 1. Sever all edges connected to this node
    const nodeIndex = nodes.findIndex((n) => n.id === selectedNode.id);
    setEdges((prev) => prev.filter(([from, to]) => from !== nodeIndex && to !== nodeIndex));

    // 2. Mark the node as visually isolated (red dashed quarantine)
    setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, isolated: true } : n)));

    onLog?.(
      'WARNING',
      `⚠ ISOLATION COMPLETE: ${selectedNode.label} [${selectedNode.hash}] — all ${edges.filter(([a, b]) => a === nodeIndex || b === nodeIndex).length} edges severed`,
    );
    setSelectedNodeId(null);
  }, [selectedNode, nodes, edges, onLog]);

  const handleRestore = useCallback(() => {
    setNodes(MOCK_NODES);
    setEdges(MOCK_EDGES);
    setSelectedNodeId(null);
    onLog?.('SUCCESS', 'Graph restored to baseline — all quarantines lifted');
  }, [onLog]);

  const handleClear = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <Card
      elevation={Elevation.TWO}
      className="!rounded-none !p-0 overflow-hidden flex"
      style={{
        backgroundColor: PANEL_BG,
        border: `1px solid ${BORDER}`,
        height: '600px',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT PANE — Graph Viewport (70%)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative flex-[7] overflow-hidden select-none"
        style={{ backgroundColor: BG_BASE }}
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, ${BORDER} 1px, transparent 1px), linear-gradient(to bottom, ${BORDER} 1px, transparent 1px)`,
            backgroundSize: '2rem 2rem',
          }}
        />

        {/* Top-left status overlay */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1.5" style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: SUCCESS }}>
            CANVAS: ACTIVE // RENDER: WebGL
          </span>
        </div>

        {/* Top-right legend */}
        <div
          className="absolute top-3 right-3 z-10 px-2.5 py-1.5 flex items-center gap-4"
          style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2" style={{ backgroundColor: DANGER, borderRadius: '50%' }} />
            <span className="text-[9px] font-mono tracking-widest" style={{ color: TEXT_MUT }}>
              CRITICAL
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2" style={{ backgroundColor: ACCENT, borderRadius: '50%' }} />
            <span className="text-[9px] font-mono tracking-widest" style={{ color: TEXT_MUT }}>
              SELECTED
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2" style={{ backgroundColor: NODE_GREY, borderRadius: '50%' }} />
            <span className="text-[9px] font-mono tracking-widest" style={{ color: TEXT_MUT }}>
              STANDARD
            </span>
          </span>
        </div>

        {/* Bottom-left stats overlay */}
        <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1.5" style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}>
          <span className="text-[9px] font-mono tracking-widest" style={{ color: TEXT_MUT }}>
            NODES: {nodes.length} &nbsp;|&nbsp; EDGES: {edges.length} &nbsp;|&nbsp; ISOLATED:{' '}
            {nodes.filter((n) => n.isolated).length}
          </span>
        </div>

        {/* SVG Graph */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* SVG Filters for glow effects */}
          <defs>
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={DANGER} floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={ACCENT} floodOpacity="0.35" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map(([from, to], i) => {
            const nf = nodes[from];
            const nt = nodes[to];
            if (!nf || !nt) return null;
            const active = selectedNodeId === nf.id || selectedNodeId === nt.id;
            return <GraphEdge key={`edge-${i}`} x1={nf.cx} y1={nf.cy} x2={nt.cx} y2={nt.cy} active={active} />;
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <GraphNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={() => handleSelectNode(node)}
            />
          ))}
        </svg>

        {/* Scanline animation overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT PANE — Entity Inspector (30%)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="flex-[3] flex flex-col overflow-hidden"
        style={{
          backgroundColor: PANEL_BG,
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        {/* Inspector Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: TEXT_MUT }}>
            ENTITY METADATA
          </span>
          <Button icon="cross" minimal small className="!rounded-none" onClick={handleClear} disabled={!selectedNode} />
        </div>

        {/* Inspector Body */}
        {selectedNode ? (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Section 1: Identity */}
            <div>
              <span
                className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase block mb-2"
                style={{ color: ACCENT }}
              >
                IDENTIFICATION
              </span>
              <KVRow label="NODE_HASH" value={selectedNode.hash} />
              <KVRow label="CALLSIGN" value={selectedNode.label} />
              <KVRow label="TYPE" value={selectedNode.type} />
              <KVRow
                label="STATUS"
                value={
                  selectedNode.isolated
                    ? 'QUARANTINED'
                    : selectedNode.variant === 'critical'
                      ? 'CRITICAL'
                      : selectedNode.variant === 'selected'
                        ? 'ACTIVE'
                        : 'PASSIVE'
                }
                valueColor={
                  selectedNode.isolated
                    ? DANGER
                    : selectedNode.variant === 'critical'
                      ? DANGER
                      : selectedNode.variant === 'selected'
                        ? ACCENT
                        : NODE_GREY
                }
              />
            </div>

            <Divider className="!border-[#394B59] !my-3" />

            {/* Section 2: AI Confidence */}
            <div>
              <span
                className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase block mb-2"
                style={{ color: ACCENT }}
              >
                AI CONFIDENCE
              </span>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: TEXT_MUT }}>
                  RESOLVED CONFIDENCE
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: TEXT_PRI }}>
                  {Math.round(selectedNode.confidence * 100)}%
                </span>
              </div>
              <ProgressBar
                intent={
                  selectedNode.confidence >= 0.8
                    ? Intent.PRIMARY
                    : selectedNode.confidence >= 0.6
                      ? Intent.WARNING
                      : Intent.DANGER
                }
                value={selectedNode.confidence}
                animate={false}
                stripes={false}
                className="!rounded-none [&_.bp5-progress-meter]:!rounded-none !h-1.5"
              />
              <span className="text-[9px] font-mono tracking-wider block mt-1" style={{ color: TEXT_MUT }}>
                MODEL: SmolLM2-360M // LOCAL_INFERENCE
              </span>
            </div>

            <Divider className="!border-[#394B59] !my-3" />

            {/* Section 3: Extracted Telemetry */}
            <div>
              <span
                className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase block mb-2"
                style={{ color: ACCENT }}
              >
                EXTRACTED TELEMETRY
              </span>
              <div className="space-y-0.5">
                {Object.entries(selectedNode.telemetry).map(([key, val]) => (
                  <KVRow key={key} label={key} value={val} />
                ))}
              </div>
            </div>

            <Divider className="!border-[#394B59] !my-3" />

            {/* Section 4: Connection Graph Stats */}
            <div>
              <span
                className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase block mb-2"
                style={{ color: ACCENT }}
              >
                GRAPH ADJACENCY
              </span>
              <KVRow
                label="CONNECTIONS"
                value={String(
                  edges.filter(([a, b]) => nodes[a]?.id === selectedNode.id || nodes[b]?.id === selectedNode.id).length,
                )}
              />
              <KVRow label="CLUSTER_ID" value="CL-0x0A" />
              <KVRow
                label="CENTRALITY"
                value={
                  selectedNode.isolated ? '0.00 (SEVERED)' : selectedNode.variant === 'critical' ? '0.97 (HUB)' : '0.34'
                }
              />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-10 h-10 mb-4 flex items-center justify-center" style={{ border: `1px dashed ${BORDER}` }}>
              <span className="text-lg" style={{ color: NODE_GREY }}>
                ⬡
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase block mb-1" style={{ color: TEXT_MUT }}>
              NO ENTITY SELECTED
            </span>
            <span className="text-[9px] font-mono tracking-wider" style={{ color: NODE_GREY }}>
              Click a node in the graph viewport to inspect its metadata and telemetry.
            </span>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex-shrink-0 p-3 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <Button
            intent={Intent.DANGER}
            fill
            text={selectedNode?.isolated ? 'ENTITY QUARANTINED' : 'ISOLATE ENTITY'}
            icon="disable"
            className="!rounded-none !font-mono !text-[11px] !tracking-[0.15em] !font-bold"
            disabled={!selectedNode || selectedNode.isolated}
            onClick={handleIsolate}
          />
          {nodes.some((n) => n.isolated) && (
            <Button
              intent={Intent.SUCCESS}
              fill
              text="RESTORE ALL CONNECTIONS"
              icon="reset"
              className="!rounded-none !font-mono !text-[11px] !tracking-[0.15em] !font-bold"
              onClick={handleRestore}
            />
          )}
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-mono tracking-wider" style={{ color: NODE_GREY }}>
              ACTION: SEVER ALL GRAPH EDGES
            </span>
            <span
              className="text-[8px] font-mono tracking-wider"
              style={{ color: nodes.some((n) => n.isolated) ? DANGER : NODE_GREY }}
            >
              {nodes.some((n) => n.isolated) ? `${nodes.filter((n) => n.isolated).length} QUARANTINED` : 'READY'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
