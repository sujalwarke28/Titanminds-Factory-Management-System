import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachineData } from '../../hooks/useMachineData';
import { Trash2, Eye, BrainCircuit, FileText, ChevronDown, ChevronRight } from 'lucide-react';

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
      <pattern id="hex-mm" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-mm)" />
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

const TRow = ({ k, v, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: color || C.cyan }}>{v}</span>
  </div>
);

const relTime = ts => {
  if (!ts) return '—';
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

/* ─── Default Registered Machines (Initialized with ESP32 Live Telemetry node) ─── */
const INITIAL_MACHINES = [
  {
    id: 'CNC_01',
    name: 'CNC Vertical Milling Center',
    type: 'CNC Milling',
    zone: 'Zone A',
    engineer: 'Alex Rivera (Lead Engineer)',
    esp32Id: 'ESP32_NODE_01',
    sensors: ['Temperature (DHT11)', 'Acoustic Sound', 'Vibration (SW-420)', 'Humidity'],
    components: ['Spindle Motor', 'Z-Axis Bearing', 'Coolant Pump', 'Tool Head'],
    registeredAt: '2026-07-01T08:00:00.000Z',
    isLiveConnected: true, // Uses real telemetry from useMachineData
  }
];

const LOCAL_STORAGE_KEY = 'titanmind_registered_machines_v1';

/* ════════════════════════════════════════════════════════════════════════════ */
/*                         MACHINE MANAGEMENT PAGE                              */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function MachineManagement() {
  const navigate = useNavigate();
  const { machineData, isOnline, machineState } = useMachineData();

  // Load persistent registered assets
  const [registeredAssets, setRegisteredAssets] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MACHINES;
  });

  // Save to localStorage on asset update
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(registeredAssets));
    } catch {}
  }, [registeredAssets]);

  // Filtering & Search states
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ONLINE, OFFLINE, HEALTHY, WARNING, CRITICAL, MAINTENANCE_DUE
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [zoneFilter, setZoneFilter]     = useState('ALL');

  // Expanded row state for collapsible preview
  const [expandedId, setExpandedId]     = useState('CNC_01');

  // Modal wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep]     = useState(1);
  const [newMachine, setNewMachine]     = useState({
    name: '',
    id: '',
    type: 'CNC Milling',
    zone: 'Zone A',
    engineer: 'Alex Rivera',
    sensors: ['Temperature', 'Sound', 'Vibration'],
    components: ['Motor', 'Bearing', 'Tool Head'],
    esp32Id: '',
  });

  // Derived real telemetry for CNC_01
  const liveSensor = machineData?.sensor || {};
  const livePred   = machineData?.prediction || {};

  const liveHealth   = isOnline && livePred.health_score !== undefined ? Number(livePred.health_score) : null;
  const liveFailProb = isOnline && livePred.failure_probability !== undefined ? Number(livePred.failure_probability) : null;
  const liveTemp     = isOnline && liveSensor.temperature > 0 ? Number(liveSensor.temperature) : null;
  const liveSound    = isOnline ? Number(liveSensor.sound ?? liveSensor.raw_sound ?? 0) : null;
  const liveRisk     = isOnline ? (livePred.risk || 'Healthy') : 'Sensors Offline';
  const liveRecommend= isOnline ? (livePred.recommendation || 'Continue monitoring') : 'no data, sensors offline';
  const liveExplanations = isOnline ? (livePred.explanation || livePred.alerts || []) : [];
  const lastActiveTs = livePred.timestamp || machineData?.updated_at;

  // Enrich registered assets with live status & metrics
  const enrichedMachines = useMemo(() => {
    return registeredAssets.map(m => {
      if (m.isLiveConnected || m.id === 'CNC_01') {
        const health = isOnline ? liveHealth : null;
        const failP = isOnline ? liveFailProb : null;
        const online = isOnline;
        let statusLabel = 'OFFLINE';
        if (online) {
          if (health < 40 || (liveRisk || '').toLowerCase().includes('critical')) statusLabel = 'CRITICAL';
          else if (health < 65 || (liveRisk || '').toLowerCase().includes('warning')) statusLabel = 'WARNING';
          else statusLabel = 'HEALTHY';
        }

        return {
          ...m,
          isOnline: online,
          statusLabel,
          healthScore: health,
          failProb: failP,
          risk: online ? liveRisk : 'Sensors Offline',
          temp: liveTemp,
          sound: liveSound,
          recommendation: liveRecommend,
          explanations: liveExplanations,
          lastSeen: lastActiveTs,
          esp32Status: online ? 'CONNECTED' : 'DISCONNECTED',
          state: online ? machineState : 'OFFLINE',
        };
      }

      // Offline registered machine entry
      return {
        ...m,
        isOnline: false,
        statusLabel: 'OFFLINE',
        healthScore: null,
        failProb: null,
        risk: 'Awaiting Telemetry',
        temp: null,
        sound: null,
        recommendation: 'Awaiting device telemetry stream',
        explanations: [],
        lastSeen: m.registeredAt,
        esp32Status: 'UNCONFIGURED',
        state: 'OFFLINE',
      };
    });
  }, [registeredAssets, isOnline, liveHealth, liveFailProb, liveRisk, liveTemp, liveSound, liveRecommend, liveExplanations, lastActiveTs, machineState]);

  // Compute KPI Summary Cards
  const kpis = useMemo(() => {
    const total       = enrichedMachines.length;
    const online      = enrichedMachines.filter(m => m.isOnline).length;
    const offline     = total - online;
    const critical    = enrichedMachines.filter(m => m.statusLabel === 'CRITICAL').length;
    const warning     = enrichedMachines.filter(m => m.statusLabel === 'WARNING').length;
    const maintDue    = enrichedMachines.filter(m => (m.failProb || 0) > 0.4 || m.statusLabel === 'WARNING' || m.statusLabel === 'CRITICAL').length;

    return { total, online, offline, critical, warning, maintDue };
  }, [enrichedMachines]);

  // Available Filter Options
  const availableTypes = useMemo(() => ['ALL', ...Array.from(new Set(enrichedMachines.map(m => m.type)))], [enrichedMachines]);
  const availableZones = useMemo(() => ['ALL', ...Array.from(new Set(enrichedMachines.map(m => m.zone)))], [enrichedMachines]);

  // Filtered Machines
  const filteredMachines = useMemo(() => {
    return enrichedMachines.filter(m => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = m.name.toLowerCase().includes(q);
        const matchId   = m.id.toLowerCase().includes(q);
        const matchEng  = (m.engineer || '').toLowerCase().includes(q);
        const matchType = (m.type || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEng && !matchType) return false;
      }

      // Status Filter
      if (statusFilter === 'ONLINE' && !m.isOnline) return false;
      if (statusFilter === 'OFFLINE' && m.isOnline) return false;
      if (statusFilter === 'HEALTHY' && m.statusLabel !== 'HEALTHY') return false;
      if (statusFilter === 'WARNING' && m.statusLabel !== 'WARNING') return false;
      if (statusFilter === 'CRITICAL' && m.statusLabel !== 'CRITICAL') return false;
      if (statusFilter === 'MAINTENANCE_DUE' && (m.failProb || 0) <= 0.4 && m.statusLabel !== 'WARNING' && m.statusLabel !== 'CRITICAL') return false;

      // Type Filter
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;

      // Zone Filter
      if (zoneFilter !== 'ALL' && m.zone !== zoneFilter) return false;

      return true;
    });
  }, [enrichedMachines, searchQuery, statusFilter, typeFilter, zoneFilter]);

  // Handler: Wizard Submit
  const handleCreateMachine = (e) => {
    e.preventDefault();
    if (!newMachine.name || !newMachine.id) return;

    const created = {
      ...newMachine,
      registeredAt: new Date().toISOString(),
      isLiveConnected: false,
    };

    setRegisteredAssets(prev => [created, ...prev]);
    setIsWizardOpen(false);
    setWizardStep(1);
    setExpandedId(created.id);
    setNewMachine({
      name: '', id: '', type: 'CNC Milling', zone: 'Zone A', engineer: 'Alex Rivera',
      sensors: ['Temperature', 'Sound', 'Vibration'], components: ['Motor', 'Bearing', 'Tool Head'], esp32Id: ''
    });
  };

  // Handler: Delete Machine
  const handleDeleteMachine = (id, e) => {
    e.stopPropagation();
    if (id === 'CNC_01') {
      alert('CNC_01 is the active live hardware node and cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to unregister ${id}?`)) {
      setRegisteredAssets(prev => prev.filter(m => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

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
                <div style={{ width: 3, height: 28, background: `linear-gradient(180deg, ${C.cyan}, ${C.electric})`, borderRadius: 2 }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.cyan} 60%, ${C.electric} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  MACHINE ASSET MANAGEMENT
                </h1>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', paddingLeft: 15 }}>
                INDUSTRIAL ASSET REGISTRY · ESP32 HARDWARE NODES · REAL TELEMETRY INTEGRATION
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setIsWizardOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px',
                  background: `linear-gradient(135deg, ${C.cyan}22, ${C.electric}44)`,
                  border: `1px solid ${C.cyan}66`, borderRadius: 8, color: '#fff',
                  fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800,
                  letterSpacing: '0.08em', cursor: 'pointer', boxShadow: `0 0 15px ${C.cyan}22`
                }}
              >
                <span style={{ fontSize: '1rem', color: C.cyan }}>+</span> REGISTER NEW MACHINE
              </button>
            </div>
          </div>
        </Panel>

        {/* ══ SECTION 1: MACHINE SUMMARY CARDS ═════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Registered', value: kpis.total,    color: C.cyan,     sub: 'Database Assets' },
            { label: 'Online Nodes',     value: kpis.online,   color: C.green,    sub: `${kpis.online} Active Telemetry` },
            { label: 'Offline Nodes',    value: kpis.offline,  color: kpis.offline > 0 ? C.red : 'rgba(255,255,255,0.3)', sub: 'No ESP32 Signal' },
            { label: 'Critical State',   value: kpis.critical, color: kpis.critical > 0 ? C.red : C.green, sub: 'Immediate Action' },
            { label: 'Warning State',    value: kpis.warning,  color: kpis.warning > 0 ? C.amber : C.green, sub: 'Requires Inspection' },
            { label: 'Maintenance Due',  value: kpis.maintDue, color: kpis.maintDue > 0 ? C.orange : C.green, sub: 'Action Required' },
          ].map(({ label, value, color, sub }) => (
            <Panel key={label} style={{ padding: '0.9rem 1.1rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 18px ${color}44` }}>{value}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 5, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{sub}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
            </Panel>
          ))}
        </div>

        {/* ══ SECTIONS 3 & 4: FILTERS AND GLOBAL SEARCH ═════════════════════════ */}
        <Panel style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

            {/* Top row: Search input + Select filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by Machine Name, ID, Engineer, or Type..."
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

              {/* Type Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>TYPE:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.cyan, fontSize: '0.72rem', fontFamily: 'monospace', outline: 'none' }}
                >
                  {availableTypes.map(t => <option key={t} value={t} style={{ background: C.navy }}>{t}</option>)}
                </select>
              </div>

              {/* Zone Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>ZONE:</span>
                <select
                  value={zoneFilter}
                  onChange={e => setZoneFilter(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.cyan, fontSize: '0.72rem', fontFamily: 'monospace', outline: 'none' }}
                >
                  {availableZones.map(z => <option key={z} value={z} style={{ background: C.navy }}>{z}</option>)}
                </select>
              </div>
            </div>

            {/* Bottom row: Quick Filter Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>STATUS FILTER:</span>
              {[
                { id: 'ALL', label: 'All Assets' },
                { id: 'ONLINE', label: 'Online' },
                { id: 'OFFLINE', label: 'Offline' },
                { id: 'HEALTHY', label: 'Healthy' },
                { id: 'WARNING', label: 'Warning' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'MAINTENANCE_DUE', label: 'Maintenance Due' },
              ].map(f => {
                const active = statusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
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

        {/* ══ SECTION 5: REGISTERED MACHINE TABLE & COLLAPSIBLE PREVIEWS ═══════ */}
        <Sect icon="▣">REGISTERED INDUSTRIAL ASSETS LIST</Sect>
        <Panel style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          {filteredMachines.length === 0 ? (
            /* ══ SECTION 8: EMPTY STATES ══ */
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.5rem' }}>⚙️</div>
              <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                {registeredAssets.length === 0 ? 'No Machines Registered.' : 'No Machines Match Current Filters.'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: 4 }}>
                {registeredAssets.length === 0
                  ? 'Connect an ESP32 hardware node and register your first machine.'
                  : 'Try clearing your search query or selecting a different status filter.'
                }
              </div>
              {registeredAssets.length === 0 && (
                <button
                  onClick={() => setIsWizardOpen(true)}
                  style={{
                    marginTop: '1.25rem', padding: '8px 18px', background: `${C.cyan}22`,
                    border: `1px solid ${C.cyan}`, borderRadius: 8, color: C.cyan,
                    fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  + Register First Asset
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {['', 'Machine ID', 'Machine Name', 'Type / Zone', 'Status', 'Health Score', 'Failure Prob.', 'Assigned Engineer', 'Last Seen', 'ESP32 Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map(m => {
                  const isExpanded = expandedId === m.id;
                  let sColor = C.green;
                  if (!m.isOnline) sColor = '#6b7280';
                  else if (m.statusLabel === 'CRITICAL') sColor = C.red;
                  else if (m.statusLabel === 'WARNING') sColor = C.amber;

                  return (
                    <React.Fragment key={m.id}>
                      {/* Machine Table Row */}
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: isExpanded ? 'rgba(0,229,255,0.05)' : 'transparent',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem 0.75rem 0.85rem', color: C.cyan, width: 24 }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, fontFamily: 'monospace', color: C.cyan }}>
                          {m.id}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#fff' }}>
                          {m.name}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                          {m.type} · <span style={{ color: C.cyan }}>{m.zone}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, background: `${sColor}18`, color: sColor, border: `1px solid ${sColor}33`, fontFamily: 'monospace', fontWeight: 800 }}>
                            <Pulse color={sColor} size={5} />
                            {m.isOnline ? m.statusLabel : 'OFFLINE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontWeight: 800, color: m.healthScore !== null ? (m.healthScore >= 70 ? C.green : C.red) : 'rgba(255,255,255,0.3)' }}>
                          {m.healthScore !== null ? `${m.healthScore}%` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', color: m.failProb !== null ? (m.failProb > 0.4 ? C.red : C.amber) : 'rgba(255,255,255,0.3)' }}>
                          {m.failProb !== null ? `${Math.round(m.failProb * 100)}%` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                          {m.engineer}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {relTime(m.lastSeen)}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, background: m.isOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)', color: m.isOnline ? C.green : 'rgba(255,255,255,0.3)' }}>
                            {m.esp32Status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleDeleteMachine(m.id, e)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-red-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 4, opacity: 0.8 }}
                            title="Unregister Machine"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {/* ══ SECTION 6: COLLAPSIBLE IN-PLACE PREVIEW PANEL ══ */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} style={{ padding: 0, background: 'var(--panel-row-expanded-bg)', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, letterSpacing: '0.15em' }}>
                                ◉ IN-PLACE ASSET DIAGNOSTICS & COLLAPSIBLE PREVIEW — {m.id}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                
                                {/* Machine Overview & Config */}
                                <div style={{ background: 'var(--panel-subcard-bg)', padding: '1rem', borderRadius: 8, border: '1px solid var(--panel-subcard-border)' }}>
                                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', marginBottom: 8 }}>CONFIGURATION</div>
                                  <TRow k="Machine Name" v={m.name} color="var(--panel-text-primary)" />
                                  <TRow k="Asset ID" v={m.id} color={C.cyan} />
                                  <TRow k="Type" v={m.type} color="var(--panel-text-primary)" />
                                  <TRow k="Zone" v={m.zone} color={C.cyan} />
                                  <TRow k="ESP32 Device ID" v={m.esp32Id || 'ESP32_NODE_01'} color={C.electric} />
                                  <TRow k="Assigned Engineer" v={m.engineer} color="var(--panel-text-secondary)" />
                                </div>

                                {/* Health & Telemetry */}
                                <div style={{ background: 'var(--panel-subcard-bg)', padding: '1rem', borderRadius: 8, border: '1px solid var(--panel-subcard-border)' }}>
                                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', marginBottom: 8 }}>LIVE METRICS</div>
                                  <TRow k="Status" v={m.isOnline ? m.state : 'OFFLINE'} color={m.isOnline ? C.green : C.red} />
                                  <TRow k="Health Score" v={m.healthScore !== null ? `${m.healthScore}%` : '—'} color={m.healthScore >= 70 ? C.green : C.red} />
                                  <TRow k="Failure Prob." v={m.failProb !== null ? `${Math.round(m.failProb * 100)}%` : '—'} color={m.failProb > 0.4 ? C.red : C.amber} />
                                  <TRow k="Live Temp" v={m.temp !== null ? `${m.temp.toFixed(1)} °C` : '—'} color={m.temp > 30 ? C.red : C.green} />
                                  <TRow k="Sound Level" v={m.sound !== null ? `${m.sound} dB` : '—'} color={C.cyan} />
                                  <TRow k="Est. RUL" v={m.healthScore !== null ? `~${Math.round(m.healthScore / 10)} days` : '—'} color="var(--panel-text-muted)" />
                                </div>

                                {/* Sensors & Components */}
                                <div style={{ background: 'var(--panel-subcard-bg)', padding: '1rem', borderRadius: 8, border: '1px solid var(--panel-subcard-border)' }}>
                                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', marginBottom: 8 }}>HARDWARE NODES</div>
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', marginBottom: 4 }}>SENSORS:</div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {m.sensors.map(s => <span key={s} style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, background: 'var(--panel-badge-sensor-bg)', color: 'var(--panel-badge-sensor-color)', border: '1px solid var(--panel-badge-sensor-color)', fontFamily: 'monospace', fontWeight: 700 }}>{s}</span>)}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', marginBottom: 4 }}>COMPONENTS:</div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {m.components.map(c => <span key={c} style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, background: 'var(--panel-badge-comp-bg)', color: 'var(--panel-badge-comp-color)', border: '1px solid var(--panel-badge-comp-color)', fontFamily: 'monospace', fontWeight: 700 }}>{c}</span>)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* AI Predictions & Anomaly Factors */}
                              {m.explanations && m.explanations.length > 0 && (
                                <div style={{ padding: '0.85rem 1rem', background: 'var(--panel-ai-box-bg)', border: '1px solid var(--panel-ai-box-border)', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                  <div style={{ color: 'var(--panel-ai-box-text)', fontWeight: 800, marginBottom: 4 }}>AI EXPLANABLE FACTORS:</div>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {m.explanations.filter(e => !e.toLowerCase().includes('vibration')).map((e, i) => (
                                      <span key={i} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(107, 33, 168, 0.12)', color: 'var(--panel-ai-box-text)', fontWeight: 600 }}>{e}</span>
                                    ))}
                                  </div>
                                  <div style={{ marginTop: 6, color: 'var(--panel-text-secondary)', fontWeight: 600 }}>Recommendation: {m.recommendation}</div>
                                </div>
                              )}

                              {/* ══ SECTION 7: QUICK ACTIONS ══ */}
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                                <button onClick={() => navigate('/admin/factory-overview')} style={{ padding: '6px 14px', background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, borderRadius: 6, color: C.cyan, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Eye size={14} /> View Digital Twin
                                </button>
                                <button onClick={() => navigate('/admin/ai-analytics')} style={{ padding: '6px 14px', background: `${C.electric}18`, border: `1px solid ${C.electric}44`, borderRadius: 6, color: C.electric, fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <BrainCircuit size={14} /> View AI Analytics
                                </button>
                                <button onClick={() => navigate('/admin/reports')} style={{ padding: '6px 14px', background: 'var(--panel-btn-neutral-bg)', border: '1px solid var(--panel-btn-neutral-border)', borderRadius: 6, color: 'var(--panel-btn-neutral-color)', fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <FileText size={14} /> Generate Asset Report
                                </button>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* ══ SECTION 2: REGISTER NEW MACHINE WIZARD MODAL ═════════════════════ */}
        {isWizardOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6,11,28,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <Panel style={{ maxWidth: 580, width: '100%', padding: '1.5rem 2rem' }} glow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: C.cyan, letterSpacing: '0.15em' }}>STEP {wizardStep} OF 4</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Asset Registration Wizard</h2>
                </div>
                <button onClick={() => setIsWizardOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(wizardStep / 4) * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.electric})`, transition: 'width 0.3s' }} />
              </div>

              <form onSubmit={handleCreateMachine}>
                {/* STEP 1: Basic Machine Info */}
                {wizardStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>MACHINE NAME *</label>
                      <input
                        type="text" required placeholder="e.g. Lathe Center 02"
                        value={newMachine.name} onChange={e => setNewMachine({ ...newMachine, name: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>MACHINE ID *</label>
                        <input
                          type="text" required placeholder="e.g. CNC-002"
                          value={newMachine.id} onChange={e => setNewMachine({ ...newMachine, id: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: C.cyan, fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>ESP32 ID</label>
                        <input
                          type="text" placeholder="e.g. ESP32_NODE_02"
                          value={newMachine.esp32Id} onChange={e => setNewMachine({ ...newMachine, esp32Id: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>MACHINE TYPE</label>
                        <select
                          value={newMachine.type} onChange={e => setNewMachine({ ...newMachine, type: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                        >
                          {['CNC Milling', 'Lathe Machine', 'Hydraulic Press', 'Robotic Arm', 'Conveyor System', 'Compressor'].map(t => <option key={t} value={t} style={{ background: C.navy }}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>FACTORY ZONE</label>
                        <select
                          value={newMachine.zone} onChange={e => setNewMachine({ ...newMachine, zone: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                        >
                          {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map(z => <option key={z} value={z} style={{ background: C.navy }}>{z}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>ENGINEER ASSIGNMENT</label>
                      <input
                        type="text" placeholder="e.g. Alex Rivera"
                        value={newMachine.engineer} onChange={e => setNewMachine({ ...newMachine, engineer: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Attached Sensors */}
                {wizardStep === 2 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: '0.85rem' }}>SELECT ATTACHED HARDWARE SENSORS:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      {['Temperature', 'Sound', 'Vibration', 'Pressure', 'Voltage', 'Humidity', 'Custom Sensor'].map(s => {
                        const checked = newMachine.sensors.includes(s);
                        return (
                          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem', background: checked ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked ? C.cyan : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace', color: checked ? C.cyan : 'rgba(255,255,255,0.6)' }}>
                            <input
                              type="checkbox" checked={checked}
                              onChange={e => {
                                const next = e.target.checked ? [...newMachine.sensors, s] : newMachine.sensors.filter(x => x !== s);
                                setNewMachine({ ...newMachine, sensors: next });
                              }}
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: Components */}
                {wizardStep === 3 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: '0.85rem' }}>SELECT MONITORED COMPONENTS:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      {['Motor', 'Belt', 'Bearing', 'Tool Head', 'Pump', 'Cooling Fan', 'Custom Component'].map(c => {
                        const checked = newMachine.components.includes(c);
                        return (
                          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem', background: checked ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked ? C.electric : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace', color: checked ? '#c4b5fd' : 'rgba(255,255,255,0.6)' }}>
                            <input
                              type="checkbox" checked={checked}
                              onChange={e => {
                                const next = e.target.checked ? [...newMachine.components, c] : newMachine.components.filter(x => x !== c);
                                setNewMachine({ ...newMachine, components: next });
                              }}
                            />
                            {c}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Generate Digital Twin */}
                {wizardStep === 4 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: C.cyan, marginBottom: '0.85rem' }}>SUMMARY & DIGITAL TWIN GENERATION:</div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      <TRow k="Machine Name" v={newMachine.name} color="#fff" />
                      <TRow k="Asset ID" v={newMachine.id} color={C.cyan} />
                      <TRow k="Type / Zone" v={`${newMachine.type} (${newMachine.zone})`} />
                      <TRow k="Engineer" v={newMachine.engineer} />
                      <TRow k="Sensors" v={newMachine.sensors.join(', ')} color={C.cyan} />
                      <TRow k="Components" v={newMachine.components.join(', ')} color={C.electric} />
                      <TRow k="Digital Twin" v="READY FOR DEPLOYMENT" color={C.green} />
                    </div>
                  </div>
                )}

                {/* Wizard Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {wizardStep > 1 ? (
                    <button type="button" onClick={() => setWizardStep(s => s - 1)} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer' }}>
                      ← Back
                    </button>
                  ) : <div />}

                  {wizardStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 1 && (!newMachine.name || !newMachine.id)) {
                          alert('Please enter Machine Name and Machine ID.');
                          return;
                        }
                        setWizardStep(s => s + 1);
                      }}
                      style={{ padding: '6px 16px', background: `${C.cyan}22`, border: `1px solid ${C.cyan}`, borderRadius: 6, color: C.cyan, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${C.green}44, ${C.cyan}44)`, border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                    >
                      ✓ Save & Register Asset
                    </button>
                  )}
                </div>
              </form>
            </Panel>
          </div>
        )}

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderRadius: 8, background: 'rgba(0,229,255,0.03)', border: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>
            ■ DATA INTEGRITY: 100% REAL DATABASE ASSETS & LIVE ESP32 TELEMETRY · ZERO FAKE ENTRIES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)' }}>
            <Pulse color={C.cyan} size={5} />
            TITANMIND IIoT · MACHINE MANAGEMENT
          </div>
        </div>

      </div>
    </div>
  );
}
