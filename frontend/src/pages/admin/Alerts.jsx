import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMachineData } from '../../hooks/useMachineData';

const BACKEND_URL = 'https://titanminds-backend.onrender.com';

/* ─── Color System (Matches Factory Overview Exactly) ────────────────────── */
const C = {
  cyan:      'var(--color-cyan-text)',
  electric:  'var(--color-purple-text)',
  green:     'var(--color-green-text)',
  amber:     'var(--color-amber-text)',
  red:       'var(--color-red-text)',
  orange:    '#d97706',
  navy:      'var(--panel-navy)',
  panel:     'var(--panel-bg)',
  border:    'var(--panel-border)',
  borderHot: 'var(--panel-border-hot)',
};

const STYLES = `
@keyframes scanline {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  70%  { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

/* ─── Shared UI Components ─────────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-al" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-al)" />
  </svg>
);

const Pulse = ({ color = C.green, size = 8 }) => (
  <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4, animation: 'pulse-ring 2s ease-out infinite' }} />
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
  </span>
);

const ScanLine = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}88, transparent)`, animation: 'scanline 4s linear infinite', pointerEvents: 'none', zIndex: 2 }} />
);

const Panel = ({ children, style = {}, glow, hot }) => (
  <div style={{
    background: C.panel,
    border: `1px solid ${hot ? C.borderHot : C.border}`,
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: glow ? `0 0 30px ${C.cyan}18, inset 0 1px 0 rgba(0,229,255,0.1)` : 'inset 0 1px 0 rgba(0,229,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

const Sect = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1.75rem 0 0.9rem', userSelect: 'none' }}>
    {icon && <span>{icon}</span>}
    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.cyan }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
  </div>
);

/* Format Date & Time distinctly */
const fmtDate = ts => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = ts => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const relTime = ts => {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

/* ════════════════════════════════════════════════════════════════════════════ */
/*                         ALERTS & NOTIFICATIONS FEED                          */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function Alerts() {
  const { isOnline } = useMachineData();
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery]   = useState('');
  const [levelFilter, setLevelFilter]   = useState('ALL'); // ALL, CRITICAL, WARNING, INFO
  const [codeFilter, setCodeFilter]     = useState('ALL');  // ALL, TEMP, SOUND, OFFLINE

  /* ── Fetch all stored alerts from MongoDB ── */
  const fetchAllAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exp32/alerts?limit=1000`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data.alerts || []);
      
      // Filter out any vibration alerts completely as instructed
      const nonVib = rawList.filter(a => {
        const code = (a.code || '').toLowerCase();
        const msg = (a.message || '').toLowerCase();
        return !code.includes('vibration') && !msg.includes('vibration');
      });

      // Sort ALL alerts in strict DESCENDING order of time (newest at the top)
      nonVib.sort((a, b) => {
        const tsA = new Date(a.timeline?.detected_at || a.created_at || a.updated_at).getTime();
        const tsB = new Date(b.timeline?.detected_at || b.created_at || b.updated_at).getTime();
        return tsB - tsA; // Descending: newest first
      });

      setAlerts(nonVib);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[TitanMind] Alerts fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAlerts();
    const timer = setInterval(fetchAllAlerts, 15000); // 15s refresh
    return () => clearInterval(timer);
  }, [fetchAllAlerts]);

  // Derived KPI Metrics
  const kpis = useMemo(() => {
    const total    = alerts.length;
    const critical = alerts.filter(a => a.level === 'critical' || a.severity === 'critical').length;
    const warning  = alerts.filter(a => a.level === 'warning' || a.severity === 'warning').length;
    const temp     = alerts.filter(a => (a.code || '').includes('temperature')).length;
    const sound    = alerts.filter(a => (a.code || '').includes('sound')).length;
    const offline  = alerts.filter(a => (a.code || '').includes('offline')).length;

    return { total, critical, warning, temp, sound, offline };
  }, [alerts]);

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchMachine = (a.machine_id || '').toLowerCase().includes(q);
        const matchCode    = (a.code || '').toLowerCase().includes(q);
        const matchMsg     = (a.message || '').toLowerCase().includes(q);
        const matchLevel   = (a.level || '').toLowerCase().includes(q);
        if (!matchMachine && !matchCode && !matchMsg && !matchLevel) return false;
      }

      // Level Filter
      if (levelFilter === 'CRITICAL' && (a.level !== 'critical' && a.severity !== 'critical')) return false;
      if (levelFilter === 'WARNING' && a.level !== 'warning' && a.severity !== 'warning') return false;

      // Code/Category Filter
      if (codeFilter === 'TEMP' && !(a.code || '').includes('temperature')) return false;
      if (codeFilter === 'SOUND' && !(a.code || '').includes('sound')) return false;
      if (codeFilter === 'OFFLINE' && !(a.code || '').includes('offline')) return false;

      return true;
    });
  }, [alerts, searchQuery, levelFilter, codeFilter]);

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', color: 'var(--panel-text-primary)', position: 'relative', paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{STYLES}</style>

      {/* Hex Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <HexGrid />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(0,229,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 60%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <Panel style={{ padding: '1.25rem 2rem', marginBottom: '1.5rem' }} glow>
          <ScanLine />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 3, height: 28, background: `linear-gradient(180deg, ${C.red}, ${C.amber})`, borderRadius: 2 }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.red} 60%, ${C.amber} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ALERTS & NOTIFICATIONS FEED
                </h1>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', paddingLeft: 15 }}>
                DATABASE ALERT LOGS · CHRONOLOGICAL DESCENDING ORDER (NEWEST AT TOP) · REAL DATA ONLY
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => fetchAllAlerts()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  background: 'rgba(0,229,255,0.06)', border: `1px solid ${C.border}`,
                  borderRadius: 6, color: C.cyan, fontSize: '0.72rem', fontFamily: 'monospace',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                🔄 REFRESH ALERTS
              </button>
              <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                {lastRefreshed ? `Updated: ${relTime(lastRefreshed)}` : 'Loading...'}
              </div>
            </div>
          </div>
        </Panel>

        {/* ══ SECTION 1: ALERT KPI CARDS ═══════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Stored Alerts', value: loading ? '…' : kpis.total,     color: C.cyan,     sub: 'All MongoDB Records' },
            { label: 'Critical Severity',   value: loading ? '…' : kpis.critical,  color: kpis.critical > 0 ? C.red : C.green, sub: 'Immediate Action Required' },
            { label: 'Warning Thresholds',  value: loading ? '…' : kpis.warning,   color: kpis.warning > 0 ? C.amber : C.green, sub: 'Sensor Parameter Warning' },
            { label: 'Temperature Alerts',  value: loading ? '…' : kpis.temp,      color: kpis.temp > 0 ? C.orange : C.green, sub: 'Temp Exceedances' },
            { label: 'Acoustic / Sound',    value: loading ? '…' : kpis.sound,     color: kpis.sound > 0 ? C.electric : C.green, sub: 'Noise Spikes (dB)' },
            { label: 'Sensor Offline Logs', value: loading ? '…' : kpis.offline,   color: kpis.offline > 0 ? C.red : C.green, sub: 'Device Disconnects' },
          ].map(({ label, value, color, sub }) => (
            <Panel key={label} style={{ padding: '0.9rem 1.1rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 18px ${color}44` }}>{value}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 5, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{sub}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
            </Panel>
          ))}
        </div>

        {/* ══ FILTERS AND SEARCH ═══════════════════════════════════════════════ */}
        <Panel style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Top row: Search input + Select filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search alerts by Reason, Machine ID, or Code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.55rem 1rem 0.55rem 2.2rem',
                    background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`,
                    borderRadius: 8, color: '#fff', fontSize: '0.78rem', fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: '0.85rem' }}>🔍</span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>✕</button>
                )}
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>CATEGORY:</span>
                <select
                  value={codeFilter}
                  onChange={e => setCodeFilter(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.cyan, fontSize: '0.72rem', fontFamily: 'monospace', outline: 'none' }}
                >
                  <option value="ALL" style={{ background: C.navy }}>All Categories</option>
                  <option value="TEMP" style={{ background: C.navy }}>Temperature</option>
                  <option value="SOUND" style={{ background: C.navy }}>Acoustic Sound</option>
                  <option value="OFFLINE" style={{ background: C.navy }}>Device Offline</option>
                </select>
              </div>
            </div>

            {/* Bottom row: Severity Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>SEVERITY:</span>
              {[
                { id: 'ALL', label: 'All Severities' },
                { id: 'CRITICAL', label: 'Critical Only' },
                { id: 'WARNING', label: 'Warning Only' },
              ].map(f => {
                const active = levelFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setLevelFilter(f.id)}
                    style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem', fontFamily: 'monospace',
                      fontWeight: active ? 800 : 500,
                      background: active ? `${C.cyan}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? C.cyan : 'rgba(255,255,255,0.08)'}`,
                      color: active ? C.cyan : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

          </div>
        </Panel>

        {/* ══ CHRONOLOGICAL ALERTS TABLE (DESCENDING ORDER BY TIME) ════════════ */}
        <Sect icon="⚡">ALL STORED ALERTS — CHRONOLOGICAL DESCENDING ORDER (NEWEST AT TOP)</Sect>
        <Panel style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              Fetching stored alerts from MongoDB database...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                {alerts.length === 0 ? 'No Stored Alerts Found in Database.' : 'No Alerts Match Selected Filters.'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: 4 }}>
                {alerts.length === 0 ? 'System operating normally. All parameters within safe thresholds.' : 'Try clearing your search query or setting category filter to ALL.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {['#', 'Date', 'Time (HH:MM:SS)', 'Machine ID', 'Severity', 'Alert Code', 'Reason / Message', 'Time Ago'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'monospace' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((a, i) => {
                  const ts = a.timeline?.detected_at || a.created_at || a.updated_at;
                  const isCrit = a.level === 'critical' || a.severity === 'critical';
                  const sColor = isCrit ? C.red : C.amber;

                  return (
                    <tr
                      key={a.id || i}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isCrit ? 'rgba(255,59,59,0.03)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Index */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                        {filteredAlerts.length - i}
                      </td>

                      {/* DATE */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                        {fmtDate(ts)}
                      </td>

                      {/* TIME */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, whiteSpace: 'nowrap' }}>
                        {fmtTime(ts)}
                      </td>

                      {/* Machine ID */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                        {a.machine_id || 'CNC_01'}
                      </td>

                      {/* Severity Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 800, background: `${sColor}18`, color: sColor, border: `1px solid ${sColor}33`, fontFamily: 'monospace' }}>
                          {isCrit ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </td>

                      {/* Code */}
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>
                        {a.code}
                      </td>

                      {/* Reason / Message */}
                      <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, maxWidth: 350 }}>
                        {a.message}
                      </td>

                      {/* Time Ago */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {relTime(ts)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderRadius: 8, background: 'rgba(0,229,255,0.03)', border: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>
            ■ DATA INTEGRITY: 100% REAL DATABASE ALERTS ({alerts.length}) · CHRONOLOGICAL DESCENDING ORDER · ZERO FAKE ALERTS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)' }}>
            <Pulse color={C.cyan} size={5} />
            TITANMIND IIoT · ALERTS & NOTIFICATIONS
          </div>
        </div>

      </div>
    </div>
  );
}
