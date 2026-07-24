import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Sun, BatteryCharging } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const energyData = [
  { time: '06:00', grid: 400, solar: 50 },
  { time: '10:00', grid: 300, solar: 250 },
  { time: '14:00', grid: 200, solar: 350 },
  { time: '18:00', grid: 450, solar: 100 },
  { time: '22:00', grid: 500, solar: 0 },
];

const EnergyAnalytics = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Energy Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Admin Portal / Power Consumption Profiles</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Total Consumption" value="2.4 MWh" icon={Zap} trend="up" trendValue="4%" />
        <MetricCard title="Solar Offset" value="34%" icon={Sun} trend="up" trendValue="12%" />
        <MetricCard title="Grid Load" value="66%" icon={BatteryCharging} trend="down" trendValue="5%" />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', height: '400px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Grid vs Solar Power Generation (kW)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="time" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
            <Area type="monotone" dataKey="solar" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            <Area type="monotone" dataKey="grid" stackId="1" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default EnergyAnalytics;
