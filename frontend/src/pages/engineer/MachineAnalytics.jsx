import React from 'react';
const MachineAnalytics = () => (
  <div className='animate-fade-in-up'>
    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Machine Analytics</h1></div>
    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '12px 0' }}>Metric</th><th style={{ padding: '12px 0' }}>Asset Uptime</th><th style={{ padding: '12px 0' }}>Idle Time</th><th style={{ padding: '12px 0' }}>Performance Index</th></tr></thead>
        <tbody><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Today</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>94%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>6%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>0.92</td></tr><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>This Week</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>91%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>9%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>0.88</td></tr></tbody>
      </table>
    </div>
  </div>
);
export default MachineAnalytics;
