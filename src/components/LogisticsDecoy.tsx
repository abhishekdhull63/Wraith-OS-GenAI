/**
 * LogisticsDecoy.tsx
 * ==================
 * Active Camouflage — A painfully boring corporate supply-chain dashboard.
 *
 * Purpose: Conceals the real application behind a mundane logistics UI.
 * Trigger: Ctrl+Shift+X (or Cmd+Shift+X on Mac) fires onUnlock().
 * Styling: Explicit light mode override — pure white bg, dark text,
 *          BlueprintJS HTML table classes for authentic enterprise boredom.
 *
 * NO visual hints, buttons, or clues about the hidden trigger exist in the UI.
 */

import { useEffect } from 'react';

// ─── Fake Data ──────────────────────────────────────────────────────────────────

interface ShipmentRow {
  id: string;
  origin: string;
  destination: string;
  pallets: number;
  status: 'Pending' | 'In Transit' | 'Cleared';
  eta: string;
  carrier: string;
}

const SHIPMENTS: ShipmentRow[] = [
  {
    id: 'SHP-20260301-0041',
    origin: 'WH-Mumbai-Central',
    destination: 'DC-Pune-East',
    pallets: 24,
    status: 'Cleared',
    eta: '2026-03-28',
    carrier: 'BlueDart Logistics',
  },
  {
    id: 'SHP-20260301-0042',
    origin: 'WH-Delhi-NCR-02',
    destination: 'DC-Jaipur-Main',
    pallets: 18,
    status: 'In Transit',
    eta: '2026-03-31',
    carrier: 'Delhivery Express',
  },
  {
    id: 'SHP-20260302-0043',
    origin: 'WH-Chennai-Port',
    destination: 'DC-Bangalore-Whitefield',
    pallets: 36,
    status: 'Pending',
    eta: '2026-04-02',
    carrier: 'DTDC Freight',
  },
  {
    id: 'SHP-20260302-0044',
    origin: 'WH-Mumbai-Central',
    destination: 'DC-Ahmedabad-GIDC',
    pallets: 12,
    status: 'Cleared',
    eta: '2026-03-29',
    carrier: 'Gati Ltd.',
  },
  {
    id: 'SHP-20260303-0045',
    origin: 'WH-Kolkata-Howrah',
    destination: 'DC-Patna-West',
    pallets: 8,
    status: 'In Transit',
    eta: '2026-04-01',
    carrier: 'Rivigo Freight',
  },
  {
    id: 'SHP-20260303-0046',
    origin: 'WH-Hyderabad-HiTec',
    destination: 'DC-Vizag-Industrial',
    pallets: 42,
    status: 'Pending',
    eta: '2026-04-03',
    carrier: 'Safexpress',
  },
  {
    id: 'SHP-20260304-0047',
    origin: 'WH-Delhi-NCR-02',
    destination: 'DC-Lucknow-Gomti',
    pallets: 15,
    status: 'Cleared',
    eta: '2026-03-30',
    carrier: 'TCI Express',
  },
  {
    id: 'SHP-20260304-0048',
    origin: 'WH-Chennai-Port',
    destination: 'DC-Coimbatore-South',
    pallets: 28,
    status: 'In Transit',
    eta: '2026-04-01',
    carrier: 'BlueDart Logistics',
  },
  {
    id: 'SHP-20260305-0049',
    origin: 'WH-Mumbai-Central',
    destination: 'DC-Nagpur-MIDC',
    pallets: 9,
    status: 'Pending',
    eta: '2026-04-04',
    carrier: 'Delhivery Express',
  },
  {
    id: 'SHP-20260305-0050',
    origin: 'WH-Kolkata-Howrah',
    destination: 'DC-Guwahati-Main',
    pallets: 31,
    status: 'In Transit',
    eta: '2026-04-02',
    carrier: 'Rivigo Freight',
  },
  {
    id: 'SHP-20260306-0051',
    origin: 'WH-Hyderabad-HiTec',
    destination: 'DC-Chennai-Ambattur',
    pallets: 22,
    status: 'Cleared',
    eta: '2026-03-31',
    carrier: 'DTDC Freight',
  },
  {
    id: 'SHP-20260306-0052',
    origin: 'WH-Delhi-NCR-02',
    destination: 'DC-Chandigarh-Ind',
    pallets: 6,
    status: 'Pending',
    eta: '2026-04-05',
    carrier: 'Gati Ltd.',
  },
  {
    id: 'SHP-20260307-0053',
    origin: 'WH-Chennai-Port',
    destination: 'DC-Madurai-Central',
    pallets: 14,
    status: 'In Transit',
    eta: '2026-04-03',
    carrier: 'TCI Express',
  },
  {
    id: 'SHP-20260307-0054',
    origin: 'WH-Mumbai-Central',
    destination: 'DC-Surat-Ring-Road',
    pallets: 38,
    status: 'Cleared',
    eta: '2026-03-29',
    carrier: 'Safexpress',
  },
  {
    id: 'SHP-20260308-0055',
    origin: 'WH-Kolkata-Howrah',
    destination: 'DC-Bhubaneswar-Main',
    pallets: 19,
    status: 'Pending',
    eta: '2026-04-06',
    carrier: 'BlueDart Logistics',
  },
  {
    id: 'SHP-20260308-0056',
    origin: 'WH-Hyderabad-HiTec',
    destination: 'DC-Pune-East',
    pallets: 27,
    status: 'In Transit',
    eta: '2026-04-04',
    carrier: 'Delhivery Express',
  },
  {
    id: 'SHP-20260309-0057',
    origin: 'WH-Delhi-NCR-02',
    destination: 'DC-Dehradun-IT-Park',
    pallets: 11,
    status: 'Cleared',
    eta: '2026-03-30',
    carrier: 'Rivigo Freight',
  },
  {
    id: 'SHP-20260309-0058',
    origin: 'WH-Chennai-Port',
    destination: 'DC-Trivandrum-Tech',
    pallets: 33,
    status: 'Pending',
    eta: '2026-04-07',
    carrier: 'DTDC Freight',
  },
];

const NAV_MENUS = ['File', 'Edit', 'View', 'Logistics', 'Inventory', 'Q3 Projections', 'Reports', 'Help'];

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ShipmentRow['status'] }) {
  const styles: Record<ShipmentRow['status'], string> = {
    Pending: 'background-color: #FFF3CD; color: #856404; border: 1px solid #FFEEBA;',
    'In Transit': 'background-color: #CCE5FF; color: #004085; border: 1px solid #B8DAFF;',
    Cleared: 'background-color: #D4EDDA; color: #155724; border: 1px solid #C3E6CB;',
  };

  return (
    <span
      style={{
        ...Object.fromEntries(
          styles[status]
            .split(';')
            .filter(Boolean)
            .map((s) => {
              const [k, v] = s.split(':').map((x) => x.trim());
              // Convert CSS props to camelCase
              const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
              return [camel, v];
            }),
        ),
        padding: '2px 8px',
        borderRadius: '3px',
        fontSize: '11px',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface LogisticsDecoyProps {
  onUnlock: () => void;
}

export default function LogisticsDecoy({ onUnlock }: LogisticsDecoyProps) {
  // Secret trigger: Ctrl+Shift+X / Cmd+Shift+X
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        onUnlock();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUnlock]);

  // Compute summary stats for the header bar
  const totalPallets = SHIPMENTS.reduce((s, r) => s + r.pallets, 0);
  const cleared = SHIPMENTS.filter((r) => r.status === 'Cleared').length;
  const inTransit = SHIPMENTS.filter((r) => r.status === 'In Transit').length;
  const pending = SHIPMENTS.filter((r) => r.status === 'Pending').length;

  return (
    <div
      className="bp5-light"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: '#FFFFFF',
        color: '#1C2127',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: 'auto',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          CORPORATE NAV BAR
          ══════════════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '32px',
          backgroundColor: '#F6F7F9',
          borderBottom: '1px solid #D3D8DE',
          padding: '0 12px',
          gap: '0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Fake logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '20px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#2D72D2',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
            }}
          >
            SL
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#5F6B7C', letterSpacing: '0.5px' }}>
            SupplyLink Pro
          </span>
        </div>

        {/* Menu items */}
        {NAV_MENUS.map((item) => (
          <button
            key={item}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#5F6B7C',
              cursor: 'default',
              fontFamily: 'inherit',
            }}
          >
            {item}
          </button>
        ))}

        {/* Right side — user info */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#8F99A8' }}>
            Last sync: {new Date().toLocaleTimeString('en-IN', { hour12: false })}
          </span>
          <span style={{ fontSize: '11px', color: '#5F6B7C', fontWeight: 500 }}>A. Dhull (Ops Manager)</span>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#D3D8DE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color: '#5F6B7C',
            }}
          >
            AD
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          TOOLBAR / BREADCRUMB
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #EDEFF2',
          backgroundColor: '#FBFBFC',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#8F99A8', marginBottom: '2px' }}>
            Logistics &gt; Outbound Shipments &gt; Q1 2026
          </div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1C2127' }}>Outbound Shipment Tracker</h1>
        </div>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C2127' }}>{SHIPMENTS.length}</div>
            <div style={{ fontSize: '10px', color: '#8F99A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shipments
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: '#D3D8DE' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C2127' }}>{totalPallets}</div>
            <div style={{ fontSize: '10px', color: '#8F99A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pallets
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: '#D3D8DE' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#155724' }}>{cleared}</div>
            <div style={{ fontSize: '10px', color: '#8F99A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cleared
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#004085' }}>{inTransit}</div>
            <div style={{ fontSize: '10px', color: '#8F99A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              In Transit
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#856404' }}>{pending}</div>
            <div style={{ fontSize: '10px', color: '#8F99A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DATA TABLE
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 16px' }}>
        <table
          className="bp5-html-table bp5-html-table-bordered bp5-html-table-condensed bp5-html-table-striped bp5-small"
          style={{ width: '100%', fontSize: '12px' }}
        >
          <thead>
            <tr>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Shipment ID
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Origin Warehouse
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Destination
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'right',
                }}
              >
                Pallets
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Status
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Est. Arrival
              </th>
              <th
                style={{
                  color: '#5F6B7C',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Carrier
              </th>
            </tr>
          </thead>
          <tbody>
            {SHIPMENTS.map((row) => (
              <tr key={row.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1C2127' }}>{row.id}</td>
                <td style={{ color: '#1C2127' }}>{row.origin}</td>
                <td style={{ color: '#1C2127' }}>{row.destination}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#1C2127' }}>{row.pallets}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5F6B7C' }}>{row.eta}</td>
                <td style={{ color: '#1C2127' }}>{row.carrier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #EDEFF2',
          backgroundColor: '#FBFBFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <span style={{ fontSize: '10px', color: '#8F99A8' }}>
          SupplyLink Pro v4.2.1 — © 2026 Meridian Logistics Corp. All rights reserved.
        </span>
        <span style={{ fontSize: '10px', color: '#8F99A8' }}>
          Region: APAC-South &nbsp;|&nbsp; DB: Connected &nbsp;|&nbsp; TLS 1.3
        </span>
      </div>
    </div>
  );
}
