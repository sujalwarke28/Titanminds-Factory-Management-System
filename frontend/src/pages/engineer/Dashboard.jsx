import React from 'react';
import { Settings, Timer, AlertTriangle, Cpu, Activity, Info, Wrench } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import MetricCard from '../../components/MetricCard';
import { useMachineData } from '../../hooks/useMachineData';

const EngineerDashboard = () => {
  const { machineData, streams, isOnline, machineState } = useMachineData();

  // Real data mappings from machineData & stream hook
  const sensor = machineData?.sensor || {};
  const pred = machineData?.prediction || {};

  const machineId = machineData?.machine_id || 'CNC_01';
  const liveTemp = isOnline && sensor.temperature > 0 ? Number(sensor.temperature) : null;
  const liveSound = isOnline ? Number(sensor.sound ?? sensor.raw_sound ?? 0) : null;
  const healthScore = isOnline && pred.health_score !== undefined ? Number(pred.health_score) : null;
  const failureProbability = isOnline && pred.failure_probability !== undefined ? Math.round(pred.failure_probability * 100) : null;
  const aiConfidence = isOnline && pred.confidence !== undefined ? Math.round(pred.confidence * 100) : null;
  const rulDays = healthScore !== null ? Math.round(healthScore / 10) : null;

  const explanations = isOnline ? (pred.explanation || pred.alerts || []) : [];
  const recommendation = isOnline ? (pred.recommendation || 'Continue monitoring') : 'Sensors Offline';

  // Streams from hook
  const tempStream = (streams[0] || []).slice(-20);
  const soundStream = (streams[2] || []).slice(-20);
  const vibStream = (streams[1] || []).slice(-20);

  // Format anomaly drivers for BarChart
  const anomalyDrivers = explanations
    .filter(e => !e.toLowerCase().includes('vibration'))
    .map((e, i) => ({
      name: e.length > 18 ? e.substring(0, 18) + '…' : e,
      weight: Math.max(20, 85 - i * 20),
    }));

  const getStatusColor = () => {
    if (!isOnline) return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
    if (machineState === 'RUNNING') return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
    return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' }; // IDLE
  };
  const statusColor = getStatusColor();

  return (
    <div className="dashboard-content animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }} className="text-gradient">Engineer Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Machine Diagnostics & Telemetry (100% Live Telemetry Stream)
          </p>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--spacing-2) var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <span style={{ fontWeight: '600' }}>Viewing Asset: <span style={{ color: 'var(--color-primary)' }}>{machineId}</span></span>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700', background: statusColor.bg, color: statusColor.text }}>
            Status: {isOnline ? machineState : 'OFFLINE'}
          </span>
        </div>
      </div>
      
      {/* Diagnostics & Predictive AI */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600', marginTop: 'var(--spacing-2)' }}>Diagnostics & Predictive AI</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-6)' }}>
        <MetricCard title="Failure Risk" value={failureProbability !== null ? failureProbability : '--'} unit="%" icon={AlertTriangle} colorClass={failureProbability > 50 ? "text-danger-500" : "text-success-500"} />
        <MetricCard title="Health Score" value={healthScore !== null ? healthScore : '--'} unit="%" icon={Activity} colorClass={healthScore >= 70 ? "text-success-500" : "text-warning-500"} />
        <MetricCard title="Remaining Useful Life" value={rulDays !== null ? rulDays : '--'} unit="Days" icon={Timer} />
        <MetricCard title="AI Confidence" value={aiConfidence !== null ? aiConfidence : '--'} unit="%" icon={Cpu} colorClass="text-success-500" />
        <MetricCard title="Live Motor Temp" value={liveTemp !== null ? liveTemp.toFixed(1) : '--'} unit="°C" icon={Settings} colorClass={liveTemp > 30 ? "text-danger-500" : "text-success-500"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)', marginTop: 'var(--spacing-2)' }}>
        {/* Real-Time Telemetry Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Live Telemetry Streams (WebSocket)</h2>
          {!isOnline && (
            <div style={{ padding: 'var(--spacing-4)', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', textAlign: 'center' }}>
              Machine offline. Waiting for live telemetry stream...
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', opacity: isOnline ? 1 : 0.5 }}>
            
            {/* Temperature */}
            <div className="card glass-panel" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: 'var(--spacing-2)', color: '#6366f1' }}>Motor Temperature (°C)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempStream} margin={{ left: -25, bottom: -10 }}>
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} tickFormatter={(val) => Number(val).toFixed(1)} />
                  <Tooltip formatter={(val) => [`${Number(val).toFixed(1)} °C`, 'Temp']} />
                  <Line type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sound Level */}
            <div className="card glass-panel" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: 'var(--spacing-2)', color: '#f59e0b' }}>Sound Level (dB)</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={soundStream} margin={{ left: -25, bottom: -10 }}>
                  <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip formatter={(val) => [`${val} dB`, 'Sound']} />
                  <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* Explainable AI & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>AI Explanation & Actions</h2>
          
          <div className="card glass-panel" style={{ flex: 1, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Info size={16} color="var(--color-accent)" /> Anomaly Drivers (Factors)
            </h3>
            {anomalyDrivers.length > 0 ? (
              <div style={{ height: '160px', marginBottom: 'var(--spacing-4)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anomalyDrivers} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }} />
                    <Bar dataKey="weight" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: 'var(--spacing-4)' }}>
                ✓ No critical anomaly drivers detected
              </div>
            )}

            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: 'var(--spacing-3)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)' }}>
              Maintenance Recommendation
            </h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Wrench size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{recommendation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineerDashboard;
