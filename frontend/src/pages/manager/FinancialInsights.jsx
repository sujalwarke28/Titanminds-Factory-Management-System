import React from 'react';
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
            <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `$${value/1000}k`} />
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
