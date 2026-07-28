import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Zap, Clock, ShieldCheck, 
  BarChart3, Cpu, Info, CheckCircle2, Award, Percent,
  ArrowUpRight, AlertOctagon, Wrench, Layers, Calculator, ChevronDown, CheckCircle
} from 'lucide-react';

import { getSettings } from '../../services/settingsService';
import { getDynamicFinancialModel, normalizeCurrencyCode } from '../../utils/currencyUtils';

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
@keyframes backdropFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

/* ─── Shared UI Panels ─────────────────────────────────────────────────────── */
const HexGrid = () => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
    <defs>
      <pattern id="hex-fin16" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
        <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
        <polygon points="56,26 80,14 80,34 56,46 32,34 32,14" fill="none" stroke={C.cyan} strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex-fin16)" />
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
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1.85rem 0 1rem', userSelect: 'none' }}>
    {Icon && <Icon size={16} color={C.cyan} />}
    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cyan }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}44, transparent)` }} />
  </div>
);

/* ─── Unified Single-Panel On-Click Hero KPI Card Component ─── */
const HeroKpiCard = ({ title, value, subtext, formula, expandedFormula, factors, rationale, color, badgeText }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Background Backdrop Blur Overlay when card is open */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            zIndex: 90,
            animation: 'backdropFade 0.2s ease-out'
          }}
        />
      )}

      {/* KPI Card Container anchored in place */}
      <div 
        style={{ 
          position: 'relative',
          zIndex: isOpen ? 100 : 1,
        }}
      >
        <Panel 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            justify: 'space-between',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            cursor: 'pointer',
            border: `1.5px solid ${isOpen ? color : C.border}`,
            borderRadius: 12,
            boxShadow: isOpen ? `0 25px 60px rgba(0,0,0,0.6), 0 0 35px ${color}33` : 'none',
            minHeight: 190,
          }}
        >
          {/* Upper Content */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {title}
              </div>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: `${color}18`, color: color, border: `1px solid ${color}44` }}>
                {badgeText}
              </span>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: color, fontFamily: 'monospace', lineHeight: 1.1, marginBottom: '0.45rem', textShadow: isOpen ? `0 0 20px ${color}44` : 'none' }}>
              {value}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--panel-text-secondary)', fontWeight: 600, fontFamily: 'monospace' }}>
              {subtext}
            </div>
          </div>

          {/* Footer trigger bar */}
          <div style={{ marginTop: '1.1rem', paddingTop: '0.8rem', borderTop: `1px solid ${isOpen ? `${color}44` : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'monospace', color: isOpen ? color : 'var(--panel-text-muted)', transition: 'all 0.25s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={15} color={isOpen ? color : C.cyan} />
              <span style={{ fontWeight: isOpen ? 800 : 600 }}>{isOpen ? 'Click to close card' : 'Click to view formula breakdown'}</span>
            </div>
            <ChevronDown 
              size={16} 
              color={isOpen ? color : C.cyan} 
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }} 
            />
          </div>

          {/* Inner Expanded Formula Matrix Drawer */}
          <div style={{
            maxHeight: isOpen ? '500px' : '0px',
            opacity: isOpen ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin-top 0.3s ease',
            marginTop: isOpen ? '1.1rem' : '0px',
          }}>
            <div style={{
              padding: '1.15rem 1.25rem',
              background: 'var(--panel-subcard-bg, #f8fafc)',
              border: `1px solid ${color}44`,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {/* Clean Title Header */}
              <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 900, color: color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CALCULATION & FORMULA MATRIX
              </div>

              {/* Exact Formula Box */}
              <div style={{ padding: '0.9rem 1.1rem', background: 'var(--panel-bg, #ffffff)', border: `1px solid ${color}44`, borderRadius: 8, boxShadow: `inset 0 1px 0 ${color}22` }}>
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: color, textTransform: 'uppercase', marginBottom: 5 }}>
                  Exact Numerical Calculation:
                </div>
                <div style={{ fontSize: '1.15rem', fontFamily: 'monospace', fontWeight: 900, color: 'var(--panel-text-primary)', lineHeight: 1.3 }}>
                  {formula}
                </div>
              </div>

              {/* Expanded Formula */}
              {expandedFormula && (
                <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.02)', borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: color, textTransform: 'uppercase', marginBottom: 4 }}>
                    Expanded Enterprise Algorithm:
                  </div>
                  <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-primary)', lineHeight: 1.4 }}>
                    {expandedFormula}
                  </div>
                </div>
              )}

              {/* Variables Considered */}
              {factors && factors.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--panel-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Variables Considered in Model:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {factors.map((f, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--panel-text-secondary)', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.35 }}>
                        <span style={{ color: color, fontWeight: 900, fontSize: '0.9rem' }}>•</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rationale */}
              {rationale && (
                <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--panel-text-secondary)', borderTop: `1px dashed ${color}33`, paddingTop: 8, marginTop: 4, lineHeight: 1.4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span>💡</span>
                  <span>{rationale}</span>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════ */
/*                     PROJECTED ENTERPRISE FINANCIAL DASHBOARD                 */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function FinancialInsights() {
  const [currentCurrency, setCurrentCurrency] = useState(() => {
    const s = getSettings();
    return s.currency || 'INR';
  });

  // Listen for currency updates or tab switches
  useEffect(() => {
    const updateCurrencyFromStore = () => {
      const s = getSettings();
      setCurrentCurrency(s.currency || 'INR');
    };

    window.addEventListener('storage', updateCurrencyFromStore);
    window.addEventListener('titanminds_currency_changed', updateCurrencyFromStore);
    
    return () => {
      window.removeEventListener('storage', updateCurrencyFromStore);
      window.removeEventListener('titanminds_currency_changed', updateCurrencyFromStore);
    };
  }, []);

  // Compute dynamic financial model based on active currency
  const model = getDynamicFinancialModel(currentCurrency);

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
        <Panel style={{ padding: '1.5rem 2.2rem', marginBottom: '1.35rem' }} glow>
          <ScanLine />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5 }}>
                <div style={{ width: 4, height: 32, background: `linear-gradient(180deg, ${C.green}, ${C.cyan})`, borderRadius: 2 }} />
                <h1 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, background: `linear-gradient(135deg, #ffffff 0%, ${C.green} 60%, ${C.cyan} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Projected Enterprise Impact (100-Machine Factory Model)
                </h1>
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', letterSpacing: '0.12em', paddingLeft: 16 }}>
                ENTERPRISE FINANCIAL MODEL · 100-MACHINE INDUSTRIAL BENCHMARK · CURRENCY: {model.code} ({model.symbol})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', border: `1px solid ${C.green}44`, borderRadius: 8, background: 'rgba(4,120,87,0.08)' }}>
                <CheckCircle2 size={16} color={C.green} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: C.green, letterSpacing: '0.08em' }}>
                  100-MACHINE FACTORY MODEL ({model.code})
                </span>
              </div>
            </div>
          </div>
        </Panel>

        {/* ══ VARIABLES CONSIDERED SECTION (UNIFIED 5 + 5 DYNAMIC CURRENCY GRID) ═══════ */}
        <Sect icon={Cpu}>VARIABLES CONSIDERED IN CALCULATION MODEL</Sect>
        <Panel style={{ padding: '1.6rem 1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
            {[
              // Row 1 (5 Cards)
              { label: 'Factory Size', val: '100 Machines', sub: 'Medium Manufacturing Facility', color: C.cyan },
              { label: 'Annual Machine Failures', val: '75 Failures / yr', sub: 'Baseline Breakdown Count', color: C.amber },
              { label: 'Average Downtime per Failure', val: '3 Hours', sub: 'Repair Outage Duration', color: C.cyan },
              { label: 'Average Downtime Cost', val: model.hourlyRateText, sub: 'Production Outage Rate', color: C.red },
              { label: 'Predictive Maintenance Effectiveness', val: '40%', sub: 'AI Prevention Success Rate', color: C.green },
              
              // Row 2 (5 Cards)
              { label: 'Downtime Cost Prevented', val: model.downtimePreventedValue, sub: `${model.downtimePreventedSubtext}`, color: C.green },
              { label: 'Maintenance Cost Reduction', val: model.maintSavingsText, sub: 'Direct Repair Savings', color: C.electric },
              { label: 'Energy Savings', val: model.energySavingsText, sub: 'Power Optimization', color: C.amber },
              { label: 'Total Projected Annual Savings', val: model.totalSavingsValue, sub: `${model.totalSavingsSubtext}`, color: C.green },
              { label: 'Net First-Year Benefit', val: model.netBenefitText, sub: 'Net Financial Gain', color: C.cyan },
            ].map((v, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: '1rem 1.15rem', 
                  background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', 
                  border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.06))', 
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  minHeight: 120
                }}
              >
                <div>
                  <div style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontWeight: 800, lineHeight: 1.35 }}>
                    • {v.label}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: v.color, fontFamily: 'monospace', lineHeight: 1.2 }}>
                    {v.val}
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--panel-text-muted)', fontFamily: 'monospace', marginTop: 6, fontWeight: 600 }}>
                  {v.sub}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ══ PRIMARY HEADLINE FINANCIAL KPIS ═══════════════════════════════════ */}
        <Sect icon={TrendingUp}>PRIMARY ENTERPRISE RETURN & COST SAVINGS KPIS</Sect>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>
          
          {/* Hero Metric 1: Maintenance ROI */}
          <HeroKpiCard 
            title="Maintenance ROI"
            value={model.roiValue}
            subtext={model.roiSubtext}
            formula={model.roiFormula}
            expandedFormula={model.roiExpandedFormula}
            factors={model.roiFactors}
            rationale="Delivers a 1.54X return on investment within the first 12 months of deployment."
            color={C.cyan}
            badgeText="1.54X RETURN"
          />

          {/* Hero Metric 2: Total Projected Annual Savings */}
          <HeroKpiCard 
            title="Total Projected Annual Savings"
            value={model.totalSavingsValue}
            subtext={model.totalSavingsSubtext}
            formula={model.totalSavingsFormula}
            expandedFormula="Total Annual Savings = Prevented Downtime Loss + Maintenance Cost Savings + Energy Optimization"
            factors={model.totalSavingsFactors}
            rationale="Combined annual cost savings achieved across a 100-machine manufacturing plant."
            color={C.green}
            badgeText="NET SAVINGS"
          />

          {/* Hero Metric 3: Downtime Cost Prevented */}
          <HeroKpiCard 
            title="Downtime Cost Prevented"
            value={model.downtimePreventedValue}
            subtext={model.downtimePreventedSubtext}
            formula={model.downtimePreventedFormula}
            expandedFormula="Prevented Downtime Cost = (Annual Failures × AI Prevention Rate) × Downtime Hours × Downtime Rate"
            factors={[
              "75 Annual Machine Failures Baseline",
              "40% Predictive Maintenance Effectiveness = 30 Prevented Failures",
              `3 Hours Downtime per Failure × ${model.hourlyRateText} Loss Rate`
            ]}
            rationale="Eliminates 90 total hours of unplanned manufacturing outages per year."
            color={C.green}
            badgeText="PREVENTED LOSS"
          />

        </div>

        {/* ══ COMBINED 50/50 ROW: CALCULATION BREAKDOWN (LEFT) & RECHARTS GRAPH (RIGHT) ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
          
          {/* Left Half (50% Width): Stacked Formulas Panel */}
          <Panel style={{ padding: '1.5rem 1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', userSelect: 'none' }}>
                <Calculator size={16} color={C.cyan} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.cyan }}>
                  CALCULATION BREAKDOWN & FORMULAS ({model.code})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. Exact Numerical Calculation Formula (Top) */}
                <div style={{ padding: '1rem 1.25rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: `1px solid ${C.cyan}44`, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    EXACT NUMERICAL CALCULATION FORMULA
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--panel-text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
                    {model.roiFormula}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)' }}>
                    Net First-Year Return: {model.netBenefitText} Benefit ÷ Platform Deployment Cost
                  </div>
                </div>

                {/* 2. Expanded Enterprise Formula Algorithm (Bottom) */}
                <div style={{ padding: '1rem 1.25rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.03))', border: `1px solid ${C.green}44`, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    EXPANDED ENTERPRISE FORMULA ALGORITHM
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--panel-text-primary)', lineHeight: 1.45, marginBottom: 4 }}>
                    Maintenance ROI (%) = (Total Projected Savings - Platform Deployment Cost) ÷ Platform Deployment Cost ×100
                  </div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)' }}>
                    Standardized enterprise return calculation formula for IIoT predictive maintenance.
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* Right Half (50% Width): Dynamic Recharts Bar Chart Panel */}
          <Panel style={{ padding: '1.5rem 1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={16} color={C.cyan} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--panel-text-primary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    FINANCIAL SAVINGS BREAKDOWN
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: 'rgba(0,229,255,0.08)', color: C.cyan, border: `1px solid ${C.cyan}33` }}>
                  {model.scaleLabel}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--panel-text-muted)', marginBottom: '0.85rem' }}>
                Prevented Outage Loss + Maint + Energy = Total Savings ({model.totalSavingsValue})
              </div>
            </div>

            <div style={{ width: '100%', height: 220, minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={model.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--panel-text-muted)" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="var(--panel-text-muted)" 
                    fontSize={12} 
                    tickFormatter={(v) => model.code === 'INR' ? `₹${v}L` : `${model.symbol}${v}k`} 
                  />
                  <Tooltip 
                    contentStyle={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: 8, fontSize: '0.78rem', fontFamily: 'monospace' }}
                    formatter={(val, name, props) => [`${props.payload.displayVal}`, 'Financial Value']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={42}>
                    {model.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

        </div>

        {/* ══ ASSUMPTIONS SECTION ══════════════════════════════════════════════ */}
        <Sect icon={Layers}>MODEL ASSUMPTIONS USED FOR PROJECTIONS</Sect>
        <Panel style={{ padding: '1.6rem 1.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.95rem' }}>
            {[
              "A medium-sized factory with 100 machines.",
              "Approximately 75 unexpected failures occur annually.",
              "Each failure results in an average of 3 hours of downtime.",
              `Downtime costs approximately ${model.hourlyRateText}.`,
              "The AI Predictive Maintenance Platform prevents approximately 40% of failures.",
              "Additional savings are realized through reduced maintenance costs and improved energy efficiency."
            ].map((assumption, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.85rem 1.15rem', background: 'var(--panel-subcard-bg, rgba(255,255,255,0.02))', border: '1px solid var(--panel-subcard-border, rgba(255,255,255,0.06))', borderRadius: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, color: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0, marginTop: 1 }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--panel-text-primary)', fontFamily: 'monospace', lineHeight: 1.45, fontWeight: 500 }}>
                  {assumption}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ══ MANDATORY DISCLAIMER ═════════════════════════════════════════════ */}
        <Panel style={{ padding: '1.4rem 1.75rem', borderLeft: `4px solid ${C.cyan}`, background: 'var(--panel-subcard-bg, rgba(0,229,255,0.03))' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Info size={22} color={C.cyan} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', marginBottom: 5 }}>
                ENTERPRISE MODEL DISCLAIMER
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--panel-text-secondary)', lineHeight: 1.55, fontWeight: 500 }}>
                These values represent projected first-year financial outcomes for a 100-machine manufacturing facility using conservative industry assumptions for downtime, maintenance, and operational efficiency improvements. All figures are dynamically calculated in real time for {model.code} ({model.symbol}).
              </div>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}
