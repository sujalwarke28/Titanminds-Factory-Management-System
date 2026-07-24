import React from 'react';
const MaintenanceSchedule = () => (
  <div className='animate-fade-in-up'>
    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Maintenance Schedule</h1></div>
    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '12px 0' }}>Task</th><th style={{ padding: '12px 0' }}>Asset</th><th style={{ padding: '12px 0' }}>Scheduled Date</th><th style={{ padding: '12px 0' }}>Status</th></tr></thead>
        <tbody><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Lubrication</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Conveyor Belt A</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>2026-07-18</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Upcoming</td></tr><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Bearing Replacement</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Spindle B</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>2026-07-19</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Parts Ordered</td></tr></tbody>
      </table>
    </div>
  </div>
);
export default MaintenanceSchedule;
