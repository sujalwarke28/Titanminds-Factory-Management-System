import React from 'react';
const MachineHealth = () => (
  <div className='animate-fade-in-up'>
    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Machine Health Matrix</h1></div>
    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '12px 0' }}>Asset ID</th><th style={{ padding: '12px 0' }}>Health Score</th><th style={{ padding: '12px 0' }}>Failure Prob (72h)</th><th style={{ padding: '12px 0' }}>RUL</th></tr></thead>
        <tbody><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>ASSET-991</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>84/100</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>12%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>450 hrs</td></tr><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>ASSET-992</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>45/100</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>88%</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>12 hrs</td></tr></tbody>
      </table>
    </div>
  </div>
);
export default MachineHealth;
