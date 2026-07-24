import React from 'react';
const Settings = () => (
  <div className='animate-fade-in-up'>
    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>System Settings</h1></div>
    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '12px 0' }}>Configuration</th><th style={{ padding: '12px 0' }}>Current Value</th><th style={{ padding: '12px 0' }}>Status</th><th style={{ padding: '12px 0' }}>Action</th></tr></thead>
        <tbody><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Global Notification Email</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>admin@titanminds.com</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Active</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Edit</td></tr><tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>API Rate Limit</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>10,000 req/min</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Active</td><td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>Edit</td></tr></tbody>
      </table>
    </div>
  </div>
);
export default Settings;
