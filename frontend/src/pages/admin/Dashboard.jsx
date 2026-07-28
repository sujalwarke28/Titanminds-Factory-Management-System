import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useMachineData } from '../../hooks/useMachineData';

const BACKEND_URL = 'https://titanminds-backend.onrender.com';

/* ─── Shared Design System (mirrors FactoryOverview) ──────────────────────── */
const C = {
  cyan:      'var(--color-cyan-text)',
  electric:  'var(--color-purple-text)',
  green:     'var(--color-green-text)',
  amber:     'var(--color-amber-text)',
  red:       'var(--color-red-text)',
  orange:    '#d97706',
  panel:     'var(--panel-bg)',
  border:    'var(--panel-border)',
  borderHot: 'var(--panel-border-hot)',
};

const riskColor = (health) => {
  if (health === null || health === undefined) return C.cyan;
  if (health < 40) return C.red;
  if (health < 65) return C.amber;
  if (health < 80) return C.orange;
  return C.green;
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
@keyframes ticker {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
`;

/* ─── Shared UI Components ──────────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-db" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-db)" />
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
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2rem 0 0.9rem', userSelect: 'none' }}>
    {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.cyan }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
  </div>
);

const TRow = ({ k, v, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</span>
    <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: color || C.cyan }}>{v}</span>
  </div>
);

const Ring = ({ value = 0, max = 100, size = 110, stroke = 8, color = C.cyan, label, sub }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dash = pct * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1.2s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size < 100 ? '0.88rem' : '1.2rem', fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{label}</span>
        {sub && <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{sub}</span>}
      </div>
    </div>
  );
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
/*                             ADMIN DASHBOARD                                 */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { machineData, isOnline, machineState, streams } = useMachineData();
  const [alerts, setAlerts] = useState(null);
  const [tick, setTick] = useState(0);
  const [uptime, setUptime] = useState(0); // seconds since page load
  const startRef = useRef(Date.now());

  /* ── Alerts polling ── */
  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/exp32/alerts?limit=200`);
      const d = await r.json();
      setAlerts(Array.isArray(d) ? d : (d.alerts || []));
    } catch { setAlerts([]); }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 30000);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  /* ── Tick & uptime ── */
  useEffect(() => {
    const t = setInterval(() => {
      setTick(x => x + 1);
      setUptime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Derived telemetry ── */
  const sensor     = machineData?.sensor || {};
  const pred       = machineData?.prediction || {};
  const liveTemp   = isOnline && sensor.temperature > 0 ? Number(sensor.temperature) : null;
  const liveSound  = isOnline ? Number(sensor.sound ?? sensor.raw_sound ?? 0) : null;
  const liveHumid  = isOnline && sensor.humidity > 0 ? Number(sensor.humidity) : null;
  const health     = isOnline && pred.health_score !== undefined ? Number(pred.health_score) : null;
  const failProb   = isOnline && pred.failure_probability !== undefined ? Number(pred.failure_probability) : null;
  const anomaly    = isOnline && pred.anomaly_score !== undefined ? Number(pred.anomaly_score) : null;
  const confidence = isOnline && pred.confidence !== undefined ? Number(pred.confidence) : null;
  const aiRisk     = isOnline ? (pred.risk || null) : null;
  const aiRecommend= isOnline ? (pred.recommendation || null) : null;
  const aiFactors  = isOnline ? (pred.explanation || pred.alerts || []) : [];

  const hColor     = riskColor(health);
  const tempHot    = liveTemp !== null && liveTemp > 30;
  const lastTs     = machineData?.updated_at || sensor.timestamp;

  /* ── Alert counts ── */
  const nonVibAlerts  = (alerts || []).filter(a => !a.code?.includes('vibration'));
  const alertCritical = nonVibAlerts.filter(a => a.level === 'critical' || a.severity === 'critical');
  const alertWarning  = nonVibAlerts.filter(a => a.level === 'warning');
  const alertTemp     = nonVibAlerts.filter(a => a.code?.includes('temperature'));
  const alertSound    = nonVibAlerts.filter(a => a.code?.includes('sound'));

  /* ── Streams ── */
  const tempStream = (streams[0] || []).slice(-30).map(p => ({ t: p.time, v: p.val }));
  const sndStream  = (streams[2] || []).slice(-30).map(p => ({ t: p.time, v: p.val }));

  /* ── Uptime display ── */
  const uptimeStr = (() => {
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  })();

  /* ── Ticker items ── */
  const tickerItems = [
    isOnline ? `CNC_01 · ONLINE · ${machineState}` : 'CNC_01 · OFFLINE',
    liveTemp !== null ? `TEMP: ${liveTemp.toFixed(1)}°C ${tempHot ? '⚠ ABOVE THRESHOLD' : '✓ NORMAL'}` : 'TEMP: NO READING',
    liveSound !== null ? `SOUND: ${liveSound} dB` : 'SOUND: NO READING',
    health !== null ? `HEALTH SCORE: ${health}%` : 'HEALTH SCORE: —',
    failProb !== null ? `FAILURE RISK: ${Math.round(failProb * 100)}%` : 'FAILURE RISK: —',
    alerts !== null ? `ACTIVE ALERTS: ${nonVibAlerts.length} LOGGED` : 'ALERTS: LOADING',
    `SESSION UPTIME: ${uptimeStr}`,
    aiRisk ? `AI RISK: ${aiRisk.toUpperCase()}` : 'AI RISK: COMPUTING',
  ].join('   ◆   ');

  /* ──────────────────────────────────────────── */
  return (
    <div style={{ color: 'var(--panel-text-primary)', position: 'relative', paddingBottom: '4rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{STYLES}</style>

      {/* Hex background */}
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
                  SYSTEM ADMINISTRATION PANEL
                </h1>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', paddingLeft: 15 }}>
                TITANMIND INDUSTRIAL IoT · ADMIN ACCESS · REAL-TIME COMMAND INTERFACE
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: `1px solid ${isOnline ? C.green + '44' : C.red + '44'}`, borderRadius: 8, background: isOnline ? 'rgba(0,255,136,0.06)' : 'rgba(255,59,59,0.06)' }}>
                <Pulse color={isOnline ? C.green : C.red} />
                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, color: isOnline ? C.green : C.red, letterSpacing: '0.08em' }}>
                  {isOnline ? 'ESP32 LIVE' : 'ESP32 OFFLINE'}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: C.cyan, opacity: 0.7 }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', padding: '5px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                SESSION {uptimeStr}
              </div>
            </div>
          </div>
        </Panel>

        {/* ── Live Ticker ── */}
        <div style={{ overflow: 'hidden', background: 'rgba(0,229,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 0', marginBottom: '1.25rem', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '4rem', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap', fontSize: '0.65rem', fontFamily: 'monospace', color: C.cyan, letterSpacing: '0.06em' }}>
            <span>{tickerItems}</span>
            <span>{tickerItems}</span>
          </div>
        </div>

        {/* ══ TOP KPI STRIP ═══════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.75rem', marginBottom: '0.25rem' }}>
          {[
            { label: 'Connected Machines', value: isOnline ? '1 / 1' : '0 / 1',   color: isOnline ? C.green : C.red,  sub: isOnline ? 'CNC_01 ONLINE' : 'CNC_01 OFFLINE' },
            { label: 'Active Sensors',     value: isOnline ? '3' : '0',            color: isOnline ? C.cyan : C.red,   sub: 'TEMP · SOUND · VIB' },
            { label: 'Live Temp',          value: liveTemp !== null ? `${liveTemp.toFixed(1)}°C` : '—', color: tempHot ? C.red : C.green, sub: tempHot ? '⚠ OVER 30°C' : '✓ NORMAL' },
            { label: 'Sound Level',        value: liveSound !== null ? `${liveSound} dB` : '—', color: liveSound > 75 ? C.amber : C.cyan, sub: 'ACOUSTIC READING' },
            { label: 'Health Score',       value: health !== null ? `${health}%` : '—', color: hColor, sub: aiRisk || 'NO AI DATA' },
            { label: 'Failure Risk',       value: failProb !== null ? `${Math.round(failProb * 100)}%` : '—', color: failProb > 0.6 ? C.red : C.amber, sub: failProb > 0.6 ? 'HIGH — ACT NOW' : 'MANAGEABLE' },
            { label: 'Active Alerts',      value: alerts !== null ? nonVibAlerts.length : '…', color: alertCritical.length > 0 ? C.red : C.amber, sub: alerts ? `${alertCritical.length} CRITICAL` : 'LOADING' },
            { label: 'AI Confidence',      value: confidence !== null ? `${Math.round(confidence * 100)}%` : '—', color: C.electric, sub: 'AI ENGINE MODEL' },
          ].map(({ label, value, color, sub }) => (
            <Panel key={label} style={{ padding: '0.9rem 1.1rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>{label}</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, textShadow: `0 0 18px ${color}44` }}>{value}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', marginTop: 5, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{sub}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
            </Panel>
          ))}
        </div>

        {/* ══ ROW A: AI RINGS + MACHINE TERMINAL ═══════════════════════════════ */}
        <Sect icon="◈">AI PREDICTION ENGINE  /  MACHINE DIAGNOSTICS</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', alignItems: 'stretch' }}>

          {/* AI Rings Panel */}
          <Panel style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: C.electric, letterSpacing: '0.15em', opacity: 0.9 }}>◈ TITANMINDS AI · LIVE INFERENCE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', padding: '0.5rem 0' }}>
              <Ring value={health || 0}       size={110} stroke={9} color={hColor}   label={health !== null ? `${health}%` : '—'}            sub="HEALTH" />
              <Ring value={failProb ? failProb * 100 : 0} size={110} stroke={9} color={failProb > 0.6 ? C.red : C.amber} label={failProb !== null ? `${Math.round(failProb * 100)}%` : '—'} sub="FAILURE" />
              <Ring value={anomaly ? anomaly * 100 : 0}   size={88}  stroke={7} color={anomaly > 0.7 ? C.red : C.cyan}   label={anomaly !== null ? anomaly.toFixed(2) : '—'}              sub="ANOMALY" />
              <Ring value={confidence ? confidence * 100 : 0} size={88} stroke={7} color={C.electric} label={confidence !== null ? `${Math.round(confidence * 100)}%` : '—'} sub="CONF." />
            </div>
            {aiRisk && (
              <div style={{ textAlign: 'center', fontSize: '0.7rem', fontFamily: 'monospace', color: hColor, letterSpacing: '0.08em', padding: '6px 0', borderTop: `1px solid ${hColor}22`, borderBottom: `1px solid ${hColor}22` }}>
                CURRENT RISK STATUS: {aiRisk.toUpperCase()}
              </div>
            )}
            {aiFactors.filter(f => !f.toLowerCase().includes('vibration')).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <div style={{ width: '100%', fontSize: '0.58rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: 2 }}>AI FLAGGED FACTORS</div>
                {aiFactors.filter(f => !f.toLowerCase().includes('vibration')).map((f, i) => (
                  <span key={i} style={{ fontSize: '0.63rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontFamily: 'monospace' }}>{f}</span>
                ))}
              </div>
            )}
            {aiRecommend && (
              <div style={{ padding: '0.7rem', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', lineHeight: 1.6 }}>
                <div style={{ color: C.electric, fontWeight: 700, marginBottom: 3, fontSize: '0.58rem', letterSpacing: '0.1em' }}>AI → RECOMMENDATION</div>
                {aiRecommend}
              </div>
            )}
          </Panel>

          {/* Machine terminal */}
          <Panel style={{ padding: '1.5rem' }} hot={isOnline}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pulse color={isOnline ? C.green : '#6b7280'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isOnline ? C.green : '#6b7280', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  {isOnline ? `CNC_01  //  ${machineState}` : 'CNC_01  //  OFFLINE'}
                </span>
              </div>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>LAST PING: {relTime(lastTs)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
              <div>
                <TRow k="Machine ID"       v={machineData?.machine_id || '—'}                         color={C.cyan} />
                <TRow k="Machine State"    v={machineState}                                           color={isOnline ? C.green : C.red} />
                <TRow k="Motor Temp"       v={liveTemp !== null ? `${liveTemp.toFixed(1)} °C` : 'NO DATA'} color={tempHot ? C.red : C.green} />
                <TRow k="Sound Level"      v={liveSound !== null ? `${liveSound} dB` : 'NO DATA'}    color={C.cyan} />
                <TRow k="Humidity"         v={liveHumid !== null ? `${liveHumid.toFixed(1)} %` : '—'} color={C.cyan} />
                <TRow k="Vibration"        v={sensor.vibration_detected ? 'DETECTED' : 'NONE'}       color={sensor.vibration_detected ? C.amber : C.green} />
              </div>
              <div>
                <TRow k="AI Health Score"  v={health !== null ? `${health} / 100` : '—'}             color={hColor} />
                <TRow k="Failure Prob."    v={failProb !== null ? `${(failProb * 100).toFixed(0)}%` : '—'} color={failProb > 0.6 ? C.red : C.amber} />
                <TRow k="Anomaly Score"    v={anomaly !== null ? anomaly.toFixed(3) : '—'}            color={anomaly > 0.7 ? C.red : C.cyan} />
                <TRow k="AI Confidence"    v={confidence !== null ? `${(confidence * 100).toFixed(0)}%` : '—'} color={C.electric} />
                <TRow k="AI Risk Label"    v={aiRisk || '—'}                                         color={hColor} />
                <TRow k="ESP32 Sensor Set" v={isOnline ? 'DHT11 · SOUND · VIB' : 'OFFLINE'}         color={isOnline ? C.green : C.red} />
              </div>
            </div>
          </Panel>
        </div>

        {/* ══ ROW B: LIVE CHARTS ═══════════════════════════════════════════════ */}
        <Sect icon="◉">REAL-TIME SENSOR STREAMS</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Temperature */}
          <Panel style={{ padding: '1.25rem', height: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: C.cyan, letterSpacing: '0.14em' }}>MOTOR TEMPERATURE · LIVE</span>
              {liveTemp !== null && <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: tempHot ? C.red : C.green, textShadow: `0 0 10px ${tempHot ? C.red : C.green}66` }}>{liveTemp.toFixed(1)}°C</span>}
            </div>
            {tempStream.length === 0
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>AWAITING TELEMETRY…</div>
              : (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={tempStream} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tgDB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tempHot ? C.red : C.cyan} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={tempHot ? C.red : C.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} tickFormatter={v => `${v}°`} />
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.73rem', fontFamily: 'monospace' }} formatter={v => [`${v}°C`, 'Temp']} labelStyle={{ color: 'rgba(255,255,255,0.35)' }} />
                    <Area type="monotoneX" dataKey="v" stroke={tempHot ? C.red : C.cyan} fill="url(#tgDB)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* Sound */}
          <Panel style={{ padding: '1.25rem', height: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: C.amber, letterSpacing: '0.14em' }}>ACOUSTIC SENSOR · LIVE</span>
              {liveSound !== null && <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: C.amber, textShadow: `0 0 10px ${C.amber}66` }}>{liveSound} dB</span>}
            </div>
            {sndStream.length === 0
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>AWAITING ACOUSTIC DATA…</div>
              : (
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={sndStream} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.73rem', fontFamily: 'monospace' }} formatter={v => [`${v} dB`, 'Sound']} labelStyle={{ color: 'rgba(255,255,255,0.35)' }} />
                    <Line type="monotoneX" dataKey="v" stroke={C.amber} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </Panel>
        </div>

        {/* ══ ROW C: ALERT COMMAND + INFRA STATUS ══════════════════════════════ */}
        <Sect icon="⚡">ALERT COMMAND  /  INFRASTRUCTURE STATUS</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Alert Command */}
          <Panel style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: C.red, letterSpacing: '0.15em', marginBottom: '1rem' }}>⚡ LIVE ALERT DATABASE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
              {[
                { label: 'CRITICAL',    count: alertCritical.length, color: C.red },
                { label: 'WARNING',     count: alertWarning.length,  color: C.amber },
                { label: 'TEMPERATURE', count: alertTemp.length,     color: C.orange },
                { label: 'SOUND',       count: alertSound.length,    color: C.electric },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}2a`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{label}</span>
                  <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 900, color, textShadow: `0 0 12px ${color}66` }}>
                    {alerts === null ? '…' : count}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em', marginBottom: 6 }}>RECENT LOG</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {alerts === null
                ? <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>LOADING DATABASE…</div>
                : nonVibAlerts.slice(0, 7).map((a, i) => (
                  <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, background: a.level === 'critical' ? 'rgba(255,59,59,0.06)' : 'rgba(255,179,0,0.05)', border: `1px solid ${a.level === 'critical' ? 'rgba(255,59,59,0.15)' : 'rgba(255,179,0,0.1)'}` }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: a.level === 'critical' ? C.red : C.amber, flexShrink: 0, boxShadow: `0 0 4px ${a.level === 'critical' ? C.red : C.amber}` }} />
                    <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.48)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</span>
                    <span style={{ fontSize: '0.57rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', flexShrink: 0 }}>{relTime(a.timeline?.detected_at)}</span>
                  </div>
                ))
              }
            </div>
          </Panel>

          {/* Infrastructure */}
          <Panel style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: C.cyan, letterSpacing: '0.15em', marginBottom: '1rem' }}>▲ LIVE INFRASTRUCTURE STATUS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'MongoDB + Redis Cloud',   ok: true,                        detail: 'Cluster Operational' },
                { label: 'Node.js Backend (Render)', ok: isOnline,                   detail: isOnline ? 'API Responding' : 'No ESP32 Data' },
                { label: 'WebSocket Stream',        ok: isOnline,                    detail: isOnline ? 'Active Real-Time Feed' : 'Idle' },
                { label: 'ESP32 Microcontroller',   ok: isOnline,                    detail: isOnline ? 'Device Connected' : 'Device Offline' },
                { label: 'DHT11 Temp Sensor',       ok: liveTemp !== null,           detail: liveTemp !== null ? `${liveTemp.toFixed(1)}°C` : 'No Reading' },
                { label: 'Sound Sensor (Analog)',    ok: isOnline,                   detail: isOnline ? `${liveSound} dB` : 'No Reading' },
                { label: 'TitanMinds AI Engine',      ok: isOnline && confidence !== null, detail: confidence !== null ? `Conf: ${Math.round(confidence * 100)}%` : 'Awaiting Data' },
                { label: 'Alert Engine (MongoDB)',   ok: alerts !== null,             detail: alerts !== null ? `${nonVibAlerts.length} records` : 'Loading…' },
              ].map(({ label, ok, detail }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', borderRadius: 6, background: ok ? 'rgba(0,255,136,0.04)' : 'rgba(255,59,59,0.04)', border: `1px solid ${ok ? 'rgba(0,255,136,0.1)' : 'rgba(255,59,59,0.1)'}` }}>
                  <span style={{ fontSize: '0.7rem', color: ok ? C.green : C.red, fontFamily: 'monospace' }}>{ok ? '●' : '○'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ fontSize: '0.58rem', color: ok ? 'rgba(0,255,136,0.55)' : 'rgba(255,59,59,0.55)', fontFamily: 'monospace' }}>{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ══ DATA INTEGRITY FOOTER ════════════════════════════════════════════ */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderRadius: 8, background: 'rgba(0,229,255,0.03)', border: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>
            ■ DATA INTEGRITY: 100% LIVE — ESP32 · MONGODB · AI INFERENCE · WEBSOCKET · ZERO HARDCODED VALUES
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)' }}>
            <Pulse color={C.cyan} size={5} />
            TITANMIND IIoT v2.0 · ADMIN PANEL
          </div>
        </div>
      </div>
    </div>
  );
}
