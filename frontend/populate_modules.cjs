const fs = require('fs');
const path = require('path');

const adminModules = ['FactoryOverview', 'MachineManagement', 'AiAnalytics', 'InfrastructureHealth', 'EnergyAnalytics', 'UserManagement', 'Alerts', 'Reports', 'Settings'];
const managerModules = ['FactoryOverview', 'ProductionAnalytics', 'MachineHealth', 'MaintenanceSchedule', 'FinancialInsights', 'Alerts', 'Reports'];
const engineerModules = ['MachineDiagnostics', 'LiveTelemetry', 'AiPredictions', 'MaintenanceCenter', 'MachineAnalytics', 'Alerts', 'Reports'];

const template = (name, role) => `import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, ShieldAlert } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const mockChartData = [
  { time: '00:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
  { time: '04:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
  { time: '08:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
  { time: '12:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
  { time: '16:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
  { time: '20:00', valueA: Math.floor(Math.random() * 100), valueB: Math.floor(Math.random() * 50) },
];

const mockTableData = [
  { id: '1001', name: 'Alpha-01', status: 'Active', metric: '98%' },
  { id: '1002', name: 'Beta-02', status: 'Warning', metric: '75%' },
  { id: '1003', name: 'Gamma-03', status: 'Critical', metric: '42%' },
  { id: '1004', name: 'Delta-04', status: 'Active', metric: '99%' },
];

const ${name} = () => {
  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--spacing-2)' }}>${name.replace(/([A-Z])/g, ' $1').trim()}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>${role} Portal / ${name.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Generate Report</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard 
          title="System Health" 
          value={Math.floor(Math.random() * 20 + 80) + '%'}
          icon={Activity} 
          trend="up" 
          trendValue="2.4%" 
        />
        <MetricCard 
          title="Active Alerts" 
          value={Math.floor(Math.random() * 10)} 
          icon={ShieldAlert} 
          trend="down" 
          trendValue="12%" 
        />
        <MetricCard 
          title="Efficiency Target" 
          value={Math.floor(Math.random() * 15 + 85) + '%'}
          icon={Zap} 
          trend="up" 
          trendValue="1.2%" 
        />
      </div>

      {/* Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Primary Trend Analysis</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                <Area type="monotone" dataKey="valueA" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Secondary Metrics</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                <Line type="monotone" dataKey="valueB" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-accent)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Recent Activity Log</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 'var(--spacing-3)' }}>ID</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Name</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Status</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Metric</th>
              </tr>
            </thead>
            <tbody>
              {mockTableData.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--text-secondary)' }}>{row.id}</td>
                  <td style={{ padding: 'var(--spacing-4)', fontWeight: '600' }}>{row.name}</td>
                  <td style={{ padding: 'var(--spacing-4)' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.85rem',
                      background: row.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : row.status === 'Warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: row.status === 'Active' ? 'var(--color-success)' : row.status === 'Warning' ? 'var(--color-warning)' : 'var(--color-danger)'
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-4)', color: 'var(--text-secondary)' }}>{row.metric}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ${name};
`;

const generate = (modules, dir, role) => {
  modules.forEach(m => {
    fs.writeFileSync(path.join(__dirname, 'src', 'pages', dir, m + '.jsx'), template(m, role));
  });
};

generate(adminModules, 'admin', 'Admin');
generate(managerModules, 'manager', 'Manager');
generate(engineerModules, 'engineer', 'Engineer');
console.log('Successfully injected UI into all 23 modules.');
