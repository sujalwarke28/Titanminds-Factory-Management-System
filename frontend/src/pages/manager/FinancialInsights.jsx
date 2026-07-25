import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Zap, Clock, ShieldCheck, 
  BarChart3, Cpu, Info, CheckCircle2, Award, Percent,
  ArrowUpRight, AlertOctagon, Wrench, Layers, Calculator, ChevronDown
} from 'lucide-react';

/* ─── Color System (Matches Factory Overview & Theme Standard) ───────────── */
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
`;

/* ─── Shared UI Panels ─────────────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-fin4" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-fin4)" />
  </svg>
);

const ScanLine = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}88, transparent)`, animation: 'scanline 4s linear infinite', pointerEvents: 'none', zIndex: 2 }} />
);

const Panel = ({ children, style = {}, glow, hot, ...rest }) => (
  <div 
    style={{
      background: C.panel,
      border: `1px solid ${hot ? C.borderHot : C.border}`,
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      boxShadow: glow ? `0 0 30px ${C.cyan}18, inset 0 1px 0 rgba(0,229,255,0.1)` : 'inset 0 1px 0 rgba(0,229,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

const Sect = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1.75rem 0 0.9rem', userSelect: 'none' }}>
    {Icon && <Icon size={14} color={C.cyan} />}
    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.cyan }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
  </div>
);

/* ─── Roll-Out Hero KPI Card Component ─── */
const HeroKpiCard = ({ title, value, subtext, formula, factors, rationale, color, Icon, badgeText }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Panel 
      style={{ 
        padding: '1.4rem 1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justify: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: `1.5px solid ${isHovered ? color : C.border}`,
        boxShadow: isHovered ? `0 10px 30px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Upper Content */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {title}
          </div>
          <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${color}18`, color: color, border: `1px solid ${color}44` }}>
            {badgeText}
          </span>
        </div>

        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: color, fontFamily: 'monospace', lineHeight: 1.1, marginBottom: '0.4rem', textShadow: isHovered ? `0 0 20px ${color}33` : 'none' }}>
          {value}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--panel-text-secondary)', fontWeight: 600, fontFamily: 'monospace' }}>
          {subtext}
        </div>
      </div>

      {/* Footer trigger bar */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${isHovered ? `${color}44` : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: 'monospace', color: isHovered ? color : 'var(--panel-text-muted)', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calculator size={13} color={isHovered ? color : C.cyan} />
          <span style={{ fontWeight: isHovered ? 800 : 600 }}>{isHovered ? 'Calculation Breakdown' : 'Hover to roll out formula'}</span>
        </div>
        <ChevronDown 
          size={14} 
          color={isHovered ? color : C.cyan} 
          style={{ transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} 
        />
      </div>

      {/* Smooth Roll-Out Drawer */}
      <div style={{
        maxHeight: isHovered ? '320px' : '0px',
        opacity: isHovered ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out, margin-top 0.3s ease',
        marginTop: isHovered ? '0.85rem' : '0px',
      }}>
        <div style={{
          padding: '0.9rem 1.1rem',
          background: 'var(--panel-subcard-bg, #f8fafc)',
          border: `1px solid ${color}44`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {/* Formula Box */}
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-primary)', lineHeight: 1.35 }}>
            <span style={{ color: color, fontWeight: 900 }}>Formula: </span>{formula}
          </div>

          {/* Factors List */}
          {factors && factors.length > 0 && (
            <div style={{ marginTop: 2 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
                Variables Considered:
              </div>
              {factors.map((f, idx) => (
                <div key={idx} style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--panel-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.3 }}>
                  <span style={{ color: color, fontWeight: 800 }}>•</span> {f}
                </div>
              ))}
            </div>
          )}

          {/* Rationale */}
          {rationale && (
            <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', borderTop: `1px dashed ${color}33`, paddingTop: 4, marginTop: 2, lineHeight: 1.3 }}>
              💡 {rationale}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

/* ─── Roll-Out Compact Secondary Metric Card Component ─── */
const CompactMetricCard = ({ title, value, subtext, formula, factors, rationale, color, Icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        position: 'relative',
        padding: '1rem 1.15rem', 
        background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', 
        border: `1.5px solid ${isHovered ? color : 'var(--panel-subcard-border, rgba(255,255,255,0.06))'}`, 
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered ? `0 6px 20px ${color}20` : 'none',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--panel-text-muted)', textTransform: 'uppercase' }}>
            {title}
          </div>
          <Icon size={14} color={color} />
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: color, fontFamily: 'monospace', lineHeight: 1.1, marginBottom: 4 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--panel-text-muted)', fontFamily: 'monospace' }}>
          {subtext}
        </div>
      </div>

      <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: `1px solid ${isHovered ? `${color}33` : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'monospace', color: isHovered ? color : 'var(--panel-text-muted)', transition: 'color 0.2s' }}>
        <span style={{ fontWeight: isHovered ? 800 : 600 }}>{isHovered ? 'Calculation Detail' : 'Hover to roll out'}</span>
        <ChevronDown 
          size={12} 
          color={isHovered ? color : C.cyan} 
          style={{ transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} 
        />
      </div>

      {/* Smooth Roll-Out Drawer */}
      <div style={{
        maxHeight: isHovered ? '250px' : '0px',
        opacity: isHovered ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out, margin-top 0.3s ease',
        marginTop: isHovered ? '0.65rem' : '0px',
      }}>
        <div style={{
          padding: '0.75rem 0.85rem',
          background: 'var(--panel-bg, #ffffff)',
          border: `1px solid ${color}44`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-primary)', lineHeight: 1.3 }}>
            <span style={{ color: color, fontWeight: 900 }}>Formula: </span>{formula}
          </div>
          {factors && factors.length > 0 && (
            <div style={{ marginTop: 2 }}>
              {factors.map((f, idx) => (
                <div key={idx} style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--panel-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: color, fontWeight: 800 }}>•</span> {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Chart Data Arrays ─── */
const financialChartData = [
  { name: 'Baseline Loss', value: 3.0, color: C.red, displayVal: '₹3.0 Cr' },
  { name: 'Downtime Saved', value: 1.8, color: C.green, displayVal: '₹1.8 Cr' },
  { name: 'Maint. Saved', value: 0.1, color: C.electric, displayVal: '₹10 Lk' },
  { name: 'Net Savings', value: 1.9, color: C.cyan, displayVal: '₹1.9 Cr' },
];

const efficiencyTrajectoryData = [
  { metric: 'AI Prevention Rate', baseline: 0, postPlatform: 60, unit: '%' },
  { metric: 'OEE Score', baseline: 84, postPlatform: 91, unit: '%' },
  { metric: 'Availability', baseline: 95, postPlatform: 98, unit: '%' },
];

/* ════════════════════════════════════════════════════════════════════════════ */
/*                     PROJECTED ENTERPRISE FINANCIAL DASHBOARD                 */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function FinancialInsights() {
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
        <Panel style={{ padding: '1.4rem 2rem', marginBottom: '1.25rem' }} glow>
          <ScanLine />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 4, height: 30, background: `linear-gradient(180deg, ${C.green}, ${C.cyan})`, borderRadius: 2 }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.green} 60%, ${C.cyan} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Projected Enterprise Impact (100-Machine Factory Model)
                </h1>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', letterSpacing: '0.12em', paddingLeft: 16 }}>
                ENTERPRISE FINANCIAL MODEL · 100-MACHINE INDUSTRIAL BENCHMARK · PREDICTIVE MAINTENANCE PLATFORM
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: `1px solid ${C.green}44`, borderRadius: 8, background: 'rgba(4,120,87,0.08)' }}>
                <CheckCircle2 size={15} color={C.green} />
                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: C.green, letterSpacing: '0.08em' }}>
                  100-MACHINE FACTORY MODEL
                </span>
              </div>
            </div>
          </div>
        </Panel>

        {/* ══ COMPACT MODEL ASSUMPTIONS STRIP ═══════════════════════════════════ */}
        <Panel style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '0.68rem', fontFamily: 'monospace' }}>
            <span style={{ fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Cpu size={14} /> MODEL ASSUMPTIONS:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                Size: <b>100 Machines</b>
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                Failures: <b>200/yr</b> (3h avg)
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                Downtime Rate: <b>₹50k/hr</b>
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                AI Prevention: <b>60%</b>
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                Reactive Cost: <b>₹50 Lk/yr</b>
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.08))', color: 'var(--panel-text-primary)' }}>
                Deployment Cost: <b>₹12 Lk</b>
              </span>
            </div>
          </div>
        </Panel>

        {/* ══ TOP TIER: 3 PRIMARY HEADLINE FINANCIAL KPIS ═══════════════════════ */}
        <Sect icon={TrendingUp}>HEADLINE FINANCIAL SAVINGS & RETURN (HOVER ANY CARD TO ROLL OUT FORMULA)</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>
          
          {/* Hero Metric 1 */}
          <HeroKpiCard 
            title="Total Projected Annual Savings"
            value="₹1.9 Cr / yr"
            subtext="Combined Net Enterprise Cost Avoidance"
            formula="₹1,80,00,000 (Prevented Downtime) + ₹10,00,000 (Maintenance Savings) = ₹1,90,00,000 / yr"
            factors={[
              "Downtime Loss Prevented: ₹1.8 Cr / yr (120 Failures × 3h × ₹50k/hr)",
              "Reactive Maintenance Saved: ₹10 Lk / yr (20% of ₹50 Lk Budget)"
            ]}
            rationale="Represents the net annual financial savings achieved across a 100-machine factory floor."
            color={C.green}
            Icon={TrendingUp}
            badgeText="NET SAVINGS"
          />

          {/* Hero Metric 2 */}
          <HeroKpiCard 
            title="Maintenance ROI"
            value="1450%"
            subtext="Return on Investment in Year 1"
            formula="(₹1,90,00,000 Net Savings - ₹12,00,000 Deployment) ÷ ₹12,00,000 × 100 = 1450%"
            factors={[
              "Total Projected Savings: ₹1,90,00,000 / yr",
              "Platform Deployment Cost: ₹12,00,000 (One-Time)",
              "Net First-Year Benefit: ₹1,78,00,000"
            ]}
            rationale="Delivers 14.5x return on investment within the first 12 months of deployment."
            color={C.cyan}
            Icon={Award}
            badgeText="14.5X RETURN"
          />

          {/* Hero Metric 3 */}
          <HeroKpiCard 
            title="Downtime Cost Prevented"
            value="₹1.8 Cr / yr"
            subtext="Avoided Unplanned Production Loss"
            formula="120 Prevented Failures × 3 Hours × ₹50,000/hr = ₹1,80,00,000 / yr"
            factors={[
              "200 Baseline Annual Machine Breakdowns",
              "60% AI Prevention Rate = 120 Prevented Failures",
              "3 Hours Repair Time × ₹50,000/hr Production Loss Rate"
            ]}
            rationale="Eliminates 360 total hours of lost production capacity annually."
            color={C.green}
            Icon={ShieldCheck}
            badgeText="PREVENTED LOSS"
          />

        </div>

        {/* ══ VISUAL CHARTS ROW: RECHARTS GRAPH ══════════════════════════════════ */}
        <Sect icon={BarChart3}>VISUAL FINANCIAL ANALYTICS</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          
          {/* Chart 1: Financial Impact Breakdown */}
          <Panel style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--panel-text-primary)' }}>
                  Financial Impact Breakdown (in ₹ Crores)
                </h3>
                <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 2 }}>
                  Baseline Risk vs Prevented Downtime vs Net Savings
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,229,255,0.08)', color: C.cyan, border: `1px solid ${C.cyan}33` }}>
                ₹ CR SCALE
              </span>
            </div>

            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--panel-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--panel-text-muted)" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} domain={[0, 3.5]} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace' }}
                    formatter={(val, name, props) => [`${props.payload.displayVal}`, 'Value']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {financialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Chart 2: Equipment Efficiency Trajectory */}
          <Panel style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--panel-text-primary)' }}>
                  Equipment Efficiency Trajectory (%)
                </h3>
                <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginTop: 2 }}>
                  Baseline Model vs Post-Platform Performance
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(4,120,87,0.08)', color: C.green, border: `1px solid ${C.green}33` }}>
                OEE & AVAILABILITY
              </span>
            </div>

            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyTrajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="metric" stroke="var(--panel-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--panel-text-muted)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="baseline" name="Baseline Model" fill="var(--panel-border)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="postPlatform" name="Post-Platform" fill={C.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

        </div>

        {/* ══ SECONDARY TIER: OPERATIONAL & EFFICIENCY METRICS (2x3 GRID) ═════ */}
        <Sect icon={Layers}>SECONDARY COST & OPERATIONAL METRICS (HOVER ANY CARD TO ROLL OUT FORMULA)</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
          
          {/* Secondary 1 */}
          <CompactMetricCard 
            title="Annual Downtime Cost"
            value="₹3.0 Cr / yr"
            subtext="Baseline Unmitigated Loss"
            formula="200 Failures × 3 Hours × ₹50,000/hr = ₹3,00,00,000 / yr"
            factors={[
              "200 Unmitigated Annual Machine Failures",
              "3 Hours Downtime per Incident",
              "₹50,000/hr Lost Production Rate"
            ]}
            rationale="Unmitigated annual downtime loss without Predictive Maintenance Platform."
            color={C.red}
            Icon={AlertOctagon}
          />

          {/* Secondary 2 */}
          <CompactMetricCard 
            title="Maintenance Cost Reduction"
            value="₹10 Lk / yr"
            subtext="20% Direct Repair Reduction"
            formula="₹50,00,000 (Annual Reactive Budget) × 20% = ₹10,00,000 / yr"
            factors={[
              "₹50 Lk Annual Unplanned Repair Spend",
              "20% Direct Cost Saved via Early AI Warnings"
            ]}
            rationale="Eliminates secondary machine damage and reduces emergency spare parts rush orders."
            color={C.electric}
            Icon={Wrench}
          />

          {/* Secondary 3 */}
          <CompactMetricCard 
            title="Downtime Hours Prevented"
            value="360 Hours / yr"
            subtext="Reclaimed Production Time"
            formula="120 Prevented Failures × 3 Hours = 360 Hours / yr"
            factors={[
              "120 AI-Prevented Machine Failures",
              "3 Hours Saved per Prevented Breakdown"
            ]}
            rationale="Reclaims 360 hours of manufacturing throughput across the 100-machine plant."
            color={C.cyan}
            Icon={Clock}
          />

          {/* Secondary 4 */}
          <CompactMetricCard 
            title="Prevented Machine Failures"
            value="120 / year"
            subtext="60% AI Prevention Rate"
            formula="200 Annual Failures × 60% Prevention Rate = 120 / yr"
            factors={[
              "200 Baseline Annual Incidents",
              "60% Groq LLM & ML Detection Accuracy"
            ]}
            rationale="Prevents 120 unplanned line stoppages per year."
            color={C.amber}
            Icon={ShieldCheck}
          />

          {/* Secondary 5 */}
          <CompactMetricCard 
            title="OEE & Availability Gain"
            value="84% → 91% (+7%)"
            subtext="95% → 98% Availability (+3%)"
            formula="OEE 84% → 91% (+7%) | Asset Availability 95% → 98% (+3%)"
            factors={[
              "OEE Score: 84% Baseline → 91% Post-Platform (+7%)",
              "Machine Availability: 95% Baseline → 98% (+3%)"
            ]}
            rationale="Drives overall plant performance to world-class manufacturing standards."
            color={C.green}
            Icon={Percent}
          />

          {/* Secondary 6 */}
          <CompactMetricCard 
            title="Engineer Productivity & Energy"
            value="2400 Hrs & ₹3 Lk"
            subtext="Labor Saved & Energy Optimized"
            formula="2400 Labor Hrs Saved/yr | ₹30 Lk Power × 10% = ₹3 Lk/yr"
            factors={[
              "2400 Engineering Hours Saved via ESP32 Automated Monitoring",
              "10% Energy Savings on ₹30 Lk Annual Power Spend = ₹3 Lk/yr"
            ]}
            rationale="Reallocates maintenance staff from manual checks to strategic optimizations."
            color={C.amber}
            Icon={Zap}
          />

        </div>

        {/* ══ MANDATORY ENTERPRISE DISCLAIMER ═════════════════════════════════ */}
        <Panel style={{ padding: '1.25rem 1.5rem', borderLeft: `4px solid ${C.cyan}`, background: 'var(--panel-subcard-bg, rgba(0,229,255,0.03))' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info size={20} color={C.cyan} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', marginBottom: 4 }}>
                ENTERPRISE MODEL DISCLAIMER
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--panel-text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                These values represent projected enterprise savings for a medium-sized factory (100 machines) using industry-standard downtime and maintenance assumptions. They are intended to demonstrate the potential business impact of deploying the Predictive Maintenance Platform at scale.
              </div>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}
