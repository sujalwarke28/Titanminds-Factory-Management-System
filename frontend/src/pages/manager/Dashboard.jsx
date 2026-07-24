import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Server, AlertTriangle, IndianRupee, Clock, Wrench, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../../components/MetricCard';
import { useMachineData } from '../../hooks/useMachineData';

const BACKEND_URL = 'https://titanminds-backend.onrender.com';
const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Healthy, Warning, Critical

const ManagerDashboard = () => {
  const { machineData, isOnline, machineState, streams } = useMachineData();
  const [alerts, setAlerts] = useState([]);

  // Fetch real alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exp32/alerts?limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : (data.alerts || []));
    } catch {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 30000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // Sensor and prediction fields
  const sensor = machineData?.sensor || {};
  const prediction = machineData?.prediction || {};

  const liveTemp = isOnline && sensor.temperature > 0 ? Number(sensor.temperature) : null;
  const liveSound = isOnline ? Number(sensor.sound ?? sensor.raw_sound ?? 0) : null;
  const healthScore = isOnline && prediction.health_score !== undefined ? Number(prediction.health_score) : null;
  const failureProb = isOnline && prediction.failure_probability !== undefined ? Number(prediction.failure_probability) : null;
  const recommendation = isOnline ? (prediction.recommendation || 'Continue monitoring') : 'Sensors Offline';

  // Alerts filtering (non-vibration)
  const nonVibAlerts = alerts.filter(a => !a.code?.includes('vibration'));
  const activeAnomaliesCount = nonVibAlerts.length;

  // Fleet health calculation
  const healthyCount = !isOnline ? 0 : healthScore >= 80 ? 1 : 0;
  const warningCount = !isOnline ? 0 : (healthScore >= 50 && healthScore < 80) ? 1 : 0;
  const criticalCount = !isOnline ? 1 : healthScore < 50 ? 1 : 0;

  const pieData = [
    { name: 'Healthy', value: healthyCount },
    { name: 'Warning', value: warningCount },
    { name: 'Critical', value: criticalCount }
  ];

  // Est. Financials from failure probability
  const downtimePrevented = failureProb !== null ? (failureProb * 10).toFixed(1) : 0;
  const costSavings = failureProb !== null ? Math.round(parseFloat(downtimePrevented) * 12000) : 0;

  // Historical trend stream for charts
  const tempStream = (streams[0] || []).slice(-15);

  return (
    <div className="dashboard-content animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }} className="text-gradient">Manager Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Real-Time Operations & Financial Analytics (100% Live Telemetry)
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block' }} />
          <span>Status: <strong>{isOnline ? `ONLINE (${machineState})` : 'OFFLINE'}</strong></span>
        </div>
      </div>
      
      {/* Factory KPIs & Live Telemetry */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginTop: 'var(--spacing-2)' }}>Factory KPIs & Live Telemetry</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-6)' }}>
        <MetricCard title="CNC_01 Live Temp" value={liveTemp !== null ? `${liveTemp.toFixed(1)} °C` : '--'} icon={Activity} colorClass={liveTemp > 30 ? "text-danger-500" : "text-success-500"} />
        <MetricCard title="CNC_01 Live Sound" value={liveSound !== null ? `${liveSound} dB` : '--'} icon={Activity} colorClass="text-success-500" />
        <MetricCard title="Active Machines" value={isOnline ? "1 / 1" : "0 / 1"} icon={Server} colorClass={isOnline ? "text-success-500" : "text-danger-500"} />
        <MetricCard title="Active Alerts" value={activeAnomaliesCount} icon={AlertTriangle} colorClass={activeAnomaliesCount > 0 ? "text-danger-500 font-bold" : "text-success-500"} />
        <MetricCard title="Health Score" value={healthScore !== null ? `${healthScore}%` : '--'} icon={ShieldAlert} colorClass={healthScore >= 80 ? "text-success-500" : "text-warning-500"} />
      </div>

      {/* Financial & Maintenance Overview */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginTop: 'var(--spacing-2)' }}>Financial Impact & AI Estimates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-6)' }}>
        <MetricCard title="Est. Cost Savings" value={`₹${costSavings.toLocaleString('en-IN')}`} icon={IndianRupee} colorClass="text-success-500" />
        <MetricCard title="Est. Downtime Prevented" value={downtimePrevented} unit="Hrs" icon={Clock} />
        <MetricCard title="Failure Risk" value={failureProb !== null ? `${Math.round(failureProb * 100)}%` : '--'} icon={Wrench} colorClass={failureProb > 0.6 ? "text-danger-500" : "text-success-500"} />
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI Recommendation</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', marginTop: '4px', color: 'var(--text-primary)' }}>{recommendation}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-6)', marginTop: 'var(--spacing-2)' }}>
        {/* Fleet Overview (Pie) */}
        <div className="card glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Live Fleet Status</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--spacing-2)' }}>
            {pieData.map((entry, i) => (
              <div key={entry.name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS[i] }}>{entry.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Trends */}
        <div className="card glass-panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>CNC_01 Live Telemetry Stream</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempStream.map(p => ({ time: p.time, temp: p.val }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTempMgr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} tickFormatter={v => `${v}°C`} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }} formatter={v => [`${v}°C`, 'Temperature']} />
                <Area type="monotone" dataKey="temp" stroke="#6366f1" fillOpacity={1} fill="url(#colorTempMgr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Machines Table */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginTop: 'var(--spacing-2)' }}>Machine Status Summary</h2>
      <div className="card glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: 'var(--spacing-3)' }}>Machine ID</th>
              <th style={{ padding: 'var(--spacing-3)' }}>Health Score</th>
              <th style={{ padding: 'var(--spacing-3)' }}>Failure Prob.</th>
              <th style={{ padding: 'var(--spacing-3)' }}>Live Temp</th>
              <th style={{ padding: 'var(--spacing-3)' }}>Status</th>
              <th style={{ padding: 'var(--spacing-3)' }}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: 'var(--spacing-3)', fontWeight: '600' }}>CNC_01</td>
              <td style={{ padding: 'var(--spacing-3)', fontWeight: '700', color: healthScore >= 80 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                {healthScore !== null ? `${healthScore}%` : '--'}
              </td>
              <td style={{ padding: 'var(--spacing-3)', color: failureProb > 0.6 ? '#ef4444' : '#f59e0b' }}>
                {failureProb !== null ? `${Math.round(failureProb * 100)}%` : '--'}
              </td>
              <td style={{ padding: 'var(--spacing-3)' }}>{liveTemp !== null ? `${liveTemp.toFixed(1)}°C` : '--'}</td>
              <td style={{ padding: 'var(--spacing-3)' }}>
                <span style={{ padding: '4px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', background: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isOnline ? '#10b981' : '#ef4444' }}>
                  {isOnline ? machineState : 'OFFLINE'}
                </span>
              </td>
              <td style={{ padding: 'var(--spacing-3)' }}>{recommendation}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;
