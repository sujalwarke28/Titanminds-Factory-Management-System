import React from 'react';
const MaintenanceCenter = () => (
  <div className='animate-fade-in-up'>
    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Maintenance Center</h1></div>
    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '12px 0' }}>Task ID</th><th style={{ padding: '12px 0' }}>Machine</th><th style={{ padding: '12px 0' }}>Estimated Repair Time</th><th style={{ padding: '12px 0' }}>Checklist Status</th></tr></thead>
        <tbody><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>TSK-901</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>CNC Lathe 4</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>4.5 hrs</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Pending Parts</td></tr><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>TSK-902</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Milling Station B</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>2.0 hrs</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Ready for Execution</td></tr></tbody>
      </table>
    </div>
  </div>
);
export default MaintenanceCenter;
