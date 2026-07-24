const fs = require('fs');
const path = require('path');

const writeModule = (name, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'manager', name + '.jsx'), content);
};

// 1. Financial Insights
writeModule('FinancialInsights', `import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const roiData = [
  { month: 'Jan', savings: 12000, cost: 45000 },
  { month: 'Feb', savings: 15000, cost: 42000 },
  { month: 'Mar', savings: 24000, cost: 38000 },
  { month: 'Apr', savings: 38000, cost: 25000 },
  { month: 'May', savings: 45000, cost: 18000 },
  { month: 'Jun', savings: 52000, cost: 12000 },
];

const FinancialInsights = () => {
  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Financial Insights</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manager Portal / ROI & Cost Prevention</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Estimated Cost Savings" value="$245,000" icon={IndianRupee} trend="up" trendValue="18%" />
        <MetricCard title="Downtime Cost Prevented" value="$1.2M" icon={TrendingDown} trend="down" trendValue="42%" />
        <MetricCard title="Maintenance ROI" value="250%" icon={TrendingUp} trend="up" trendValue="15%" />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', height: '400px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-6)' }}>Cost vs Savings Trend (YTD)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={roiData}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" tickFormatter={(value) => \`$\${value/1000}k\`} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
            <Area type="monotone" dataKey="savings" stroke="var(--color-success)" fill="url(#colorSavings)" />
            <Area type="monotone" dataKey="cost" stroke="var(--color-danger)" fill="url(#colorCost)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default FinancialInsights;
`);

// 2. Production Analytics
writeModule('ProductionAnalytics', `import React from 'react';
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
`);

const genericTable = (name, title, cols, rows) => {
  let tableRows = rows.map(r => "<tr style={{ borderBottom: '1px solid var(--border-color)' }}>" + r.map(d => "<td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>" + d + "</td>").join('') + "</tr>").join('');
  let tableCols = cols.map(c => "<th style={{ padding: '12px 0' }}>" + c + "</th>").join('');
  writeModule(name, "import React from 'react';\nconst " + name + " = () => (\n  <div className='animate-fade-in-up'>\n    <div style={{ marginBottom: 'var(--spacing-8)' }}><h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>" + title + "</h1></div>\n    <div className='glass-panel' style={{ padding: 'var(--spacing-6)' }}>\n      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>\n        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>" + tableCols + "</tr></thead>\n        <tbody>" + tableRows + "</tbody>\n      </table>\n    </div>\n  </div>\n);\nexport default " + name + ";\n");
};

genericTable('FactoryOverview', 'Factory Overview', ['Machine', 'Health', 'Fleet Status', 'Last Failure'], [
  ['Lathe 01', 'Healthy', 'Active', '2026-06-12'],
  ['Milling 02', 'Warning', 'Active', '2026-07-10'],
  ['Press 03', 'Critical', 'Offline', 'Today']
]);

genericTable('MachineHealth', 'Machine Health Matrix', ['Asset ID', 'Health Score', 'Failure Prob (72h)', 'RUL'], [
  ['ASSET-991', '84/100', '12%', '450 hrs'],
  ['ASSET-992', '45/100', '88%', '12 hrs']
]);

genericTable('MaintenanceSchedule', 'Maintenance Schedule', ['Task', 'Asset', 'Scheduled Date', 'Status'], [
  ['Lubrication', 'Conveyor Belt A', '2026-07-18', 'Upcoming'],
  ['Bearing Replacement', 'Spindle B', '2026-07-19', 'Parts Ordered']
]);

genericTable('Alerts', 'Manager Alerts Feed', ['Time', 'Alert', 'Impact Level', 'Action'], [
  ['09:00 AM', 'Production target missed by 5%', 'Medium', 'Review'],
  ['11:30 AM', 'Critical Failure Prediction on Lathe 4', 'High', 'Escalate']
]);

genericTable('Reports', 'Business & Operations Reports', ['Report Name', 'Period', 'Generated', 'Download'], [
  ['Monthly Financial Summary', 'June 2026', 'Jul 1', 'PDF'],
  ['Q2 OEE Analysis', 'Q2 2026', 'Jul 15', 'CSV']
]);

console.log('Manager modules generated.');
