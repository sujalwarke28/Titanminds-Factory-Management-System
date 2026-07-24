const fs = require('fs');
const path = require('path');

const writeModule = (name, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'admin', name + '.jsx'), content);
};

// 1. Infrastructure Health
writeModule('InfrastructureHealth', `import React from 'react';
import { Database, Wifi, Server, Cloud, Cpu, Activity } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const InfrastructureHealth = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Infrastructure Health</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Admin Portal / System Services Status</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="API Latency" value="45ms" icon={Activity} trend="down" trendValue="12ms" />
        <MetricCard title="Database Uptime" value="99.99%" icon={Database} trend="up" trendValue="0.01%" />
        <MetricCard title="Active Sensors" value="1,204" icon={Cpu} />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Service Status Grid</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th>Service</th><th>Status</th><th>Latency/Ping</th><th>Last Outage</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} /> Primary Postgres DB</td><td style={{ color: 'var(--color-success)' }}>Operational</td><td>12ms</td><td>94 days ago</td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Server size={18} /> Redis Cache</td><td style={{ color: 'var(--color-success)' }}>Operational</td><td>2ms</td><td>120 days ago</td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Wifi size={18} /> Factory Wi-Fi Mesh</td><td style={{ color: 'var(--color-warning)' }}>Degraded</td><td>140ms</td><td>Today (2 hrs ago)</td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Cloud size={18} /> AWS IoT Core API</td><td style={{ color: 'var(--color-success)' }}>Operational</td><td>45ms</td><td>12 days ago</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default InfrastructureHealth;
`);

// 2. Energy Analytics
writeModule('EnergyAnalytics', `import React from 'react';
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
`);

// 3. User Management
writeModule('UserManagement', `import React from 'react';
import { Users, Shield, UserCheck } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const UserManagement = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Admin Portal / Directory & Roles</p>
        </div>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>+ Add User</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Total Admins" value="4" icon={Shield} />
        <MetricCard title="Total Managers" value="12" icon={UserCheck} />
        <MetricCard title="Total Engineers" value="45" icon={Users} />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', fontWeight: '600' }}>Admin User</td><td>admin@mail.com</td><td><span style={{ color: 'var(--color-danger)' }}>Admin</span></td><td><button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px' }}>Edit</button></td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', fontWeight: '600' }}>Manager User</td><td>manager@mail.com</td><td><span style={{ color: 'var(--color-primary)' }}>Manager</span></td><td><button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px' }}>Edit</button></td></tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '16px 0', fontWeight: '600' }}>Engineer User</td><td>engg@mail.com</td><td><span style={{ color: 'var(--color-success)' }}>Engineer</span></td><td><button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px' }}>Edit</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserManagement;
`);

const genericTable = (name, title, cols, rows) => {
  let tableRows = rows.map(r => "<tr style={{ borderBottom: '1px solid var(--border-color)' }}>" + r.map(d => "<td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>" + d + "</td>").join('') + "</tr>").join('');
  let tableCols = cols.map(c => "<th style={{ padding: '12px 0' }}>" + c + "</th>").join('');
  writeModule(name, "import React from 'react';\nconst " + name + " = () => (\n  <div className='animate-fade-in-up'>\n    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>" + title + "</h1></div>\n    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>\n      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>\n        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>" + tableCols + "</tr></thead>\n        <tbody>" + tableRows + "</tbody>\n      </table>\n    </div>\n  </div>\n);\nexport default " + name + ";\n");
};

genericTable('FactoryOverview', 'Factory Overview', ['Metric', 'Current Status', 'Distribution', 'Notes'], [
  ['Overall Equipment Effectiveness', '92%', 'Top Quartile', 'Consistent'],
  ['Machine Fleet Health', '85% Healthy', '10% Warning, 5% Critical', 'Requires attention']
]);

genericTable('MachineManagement', 'Machine Management', ['Machine ID', 'Connectivity', 'Sensor Sync', 'ESP32 Ping'], [
  ['MAC-001', 'Connected', '100% (6/6)', '12ms'],
  ['MAC-002', 'Offline', '0% (0/6)', 'Timeout']
]);

genericTable('AiAnalytics', 'AI Analytics', ['Model Version', 'Prediction Accuracy', 'False Positives', 'False Negatives'], [
  ['v2.4.1 (Vibration)', '94.2%', '12', '2'],
  ['v1.9.0 (Thermal)', '88.5%', '45', '8']
]);

genericTable('Alerts', 'Admin System Alerts', ['Time', 'Alert', 'Subsystem', 'Severity'], [
  ['14:02 PM', 'API Gateway Latency Spike', 'Infrastructure', 'Warning'],
  ['09:12 AM', 'Database Sync Failure', 'Data Lake', 'Critical']
]);

genericTable('Reports', 'Global Reports Center', ['Report Name', 'Scope', 'Generated', 'Action'], [
  ['Factory Health Annual Review', 'All Facilities', 'Jan 1, 2026', 'Download PDF'],
  ['Infrastructure Uptime Log', 'Server Farm', 'Jul 1, 2026', 'View CSV']
]);

genericTable('Settings', 'System Settings', ['Configuration', 'Current Value', 'Status', 'Action'], [
  ['Global Notification Email', 'admin@titanminds.com', 'Active', 'Edit'],
  ['API Rate Limit', '10,000 req/min', 'Active', 'Edit']
]);

console.log('Admin modules generated.');
