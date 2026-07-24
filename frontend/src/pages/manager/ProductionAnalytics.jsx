import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Target, Clock } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const prodData = [
  { shift: 'Morning', target: 5000, actual: 5200 },
  { shift: 'Afternoon', target: 5000, actual: 4800 },
  { shift: 'Night', target: 4500, actual: 4600 },
];

const ProductionAnalytics = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Production Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manager Portal / Volume & Target Achievement</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Total Volume (24h)" value="14,600 units" icon={Box} trend="up" trendValue="4%" />
        <MetricCard title="Target Achievement" value="101.4%" icon={Target} trend="up" trendValue="1.2%" />
        <MetricCard title="Machine Utilization" value="88%" icon={Clock} trend="down" trendValue="2%" />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', height: '400px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Volume vs Target by Shift</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={prodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="shift" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
            <Bar dataKey="actual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="var(--border-color)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default ProductionAnalytics;
