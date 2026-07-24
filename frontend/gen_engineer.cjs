const fs = require('fs');
const path = require('path');

const writeModule = (name, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'engineer', name + '.jsx'), content);
};

// 1. Live Telemetry (6 charts)
writeModule('LiveTelemetry', `import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Zap } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const genData = () => Array.from({length: 20}, (_, i) => ({ time: \`\${i}:00\`, val: Math.random() * 100 }));

const LiveTelemetry = () => {
  const charts = [
    { title: 'Temperature (°C)', color: '#ef4444' },
    { title: 'Vibration (mm/s)', color: '#f59e0b' },
    { title: 'Pressure (PSI)', color: '#3b82f6' },
    { title: 'Voltage (V)', color: '#10b981' },
    { title: 'Flow Rate (L/m)', color: '#8b5cf6' },
    { title: 'Spindle RPM', color: '#ec4899' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Live Telemetry</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Engineer Portal / Real-time Sensor Data</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--spacing-6)' }}>
        {charts.map((c, i) => (
          <div key={i} className="glass-panel" style={{ padding: 'var(--spacing-4)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>{c.title}</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={genData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-muted)" hide />
                  <YAxis stroke="var(--text-muted)" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
                  <Line type="monotone" dataKey="val" stroke={c.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default LiveTelemetry;
`);

// 2. Machine Diagnostics
writeModule('MachineDiagnostics', `import React from 'react';
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
`);

// 3. AI Predictions
writeModule('AiPredictions', `import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Target, AlertTriangle } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const featureData = [
  { name: 'Vibration Hz', weight: 0.45 },
  { name: 'Temp Drift', weight: 0.25 },
  { name: 'RPM Variance', weight: 0.15 },
  { name: 'Power Draw', weight: 0.10 },
  { name: 'Acoustic', weight: 0.05 },
];

const AiPredictions = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>AI Predictions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Engineer Portal / Model Confidence & Weights</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Failure Probability (72hr)" value="8.4%" icon={AlertTriangle} trend="up" trendValue="1.2%" />
        <MetricCard title="AI Confidence Score" value="94.2%" icon={Target} trend="up" trendValue="0.5%" />
        <MetricCard title="Active Models" value="4 Ensembles" icon={BrainCircuit} />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', height: '400px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Feature Contribution Weights</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={featureData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis type="number" stroke="var(--text-muted)" />
            <YAxis dataKey="name" type="category" stroke="var(--text-primary)" width={120} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
            <Bar dataKey="weight" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default AiPredictions;
`);

// Generic tables for remaining 4 engineer tabs
const genericTable = (name, title, cols, rows) => {
  let tableRows = rows.map(r => "<tr style={{ borderBottom: '1px solid var(--border-color)' }}>" + r.map(d => "<td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>" + d + "</td>").join('') + "</tr>").join('');
  let tableCols = cols.map(c => "<th style={{ padding: '12px 0' }}>" + c + "</th>").join('');
  
  writeModule(name, "import React from 'react';\n" +
"const " + name + " = () => (\n" +
"  <div className='animate-fade-in-up'>\n" +
"    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>" + title + "</h1></div>\n" +
"    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>\n" +
"      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>\n" +
"        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>" + tableCols + "</tr></thead>\n" +
"        <tbody>" + tableRows + "</tbody>\n" +
"      </table>\n" +
"    </div>\n" +
"  </div>\n" +
");\n" +
"export default " + name + ";\n"
  );
};

genericTable('MaintenanceCenter', 'Maintenance Center', ['Task ID', 'Machine', 'Estimated Repair Time', 'Checklist Status'], [
  ['TSK-901', 'CNC Lathe 4', '4.5 hrs', 'Pending Parts'],
  ['TSK-902', 'Milling Station B', '2.0 hrs', 'Ready for Execution']
]);

genericTable('MachineAnalytics', 'Machine Analytics', ['Metric', 'Asset Uptime', 'Idle Time', 'Performance Index'], [
  ['Today', '94%', '6%', '0.92'],
  ['This Week', '91%', '9%', '0.88']
]);

genericTable('Alerts', 'Sensor Anomaly Alerts', ['Timestamp', 'Sensor ID', 'Anomaly Type', 'Severity'], [
  ['10:24 AM', 'SENS-TEMP-04', 'Thermal Runaway', 'Critical'],
  ['08:12 AM', 'SENS-VIB-02', 'Harmonic Resonance', 'Warning']
]);

genericTable('Reports', 'Technical Reports & Logs', ['Date', 'Report Type', 'Generated By', 'Action'], [
  ['2026-07-16', 'Prediction Accuracy Log', 'System API', 'Download PDF'],
  ['2026-07-15', 'Maintenance Post-Mortem', 'Eng. Smith', 'View Details']
]);

console.log('Engineer modules generated.');
