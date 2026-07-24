import React from 'react';
import { Activity, Wrench, Clock, Battery } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const MachineDiagnostics = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Machine Diagnostics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Engineer Portal / Detailed Health Metrics</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Health Score" value="84/100" icon={Activity} trend="down" trendValue="2%" />
        <MetricCard title="RUL (Remaining Useful Life)" value="342 hrs" icon={Battery} trend="down" trendValue="12 hrs" />
        <MetricCard title="Tool Wear" value="14.2%" icon={Wrench} trend="up" trendValue="1.1%" />
        <MetricCard title="Total Runtime" value="12,450 hrs" icon={Clock} />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Sub-Component Analysis</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th>Component</th><th>Status</th><th>Wear Level</th><th>Last Inspected</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0' }}>Spindle Bearing</td><td style={{ color: 'var(--color-warning)' }}>Warning</td><td>68%</td><td>2 days ago</td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0' }}>Coolant Pump</td><td style={{ color: 'var(--color-success)' }}>Healthy</td><td>12%</td><td>5 days ago</td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0' }}>Drive Belt</td><td style={{ color: 'var(--color-success)' }}>Healthy</td><td>34%</td><td>1 week ago</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MachineDiagnostics;
