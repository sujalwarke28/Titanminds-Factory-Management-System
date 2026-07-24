// Admin Live Telemetry — identical functionality to Engineer portal
// Re-uses the same shared components and WebSocket hook
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff } from 'lucide-react';
import DigitalTwin3D from '../../components/DigitalTwin3D';
import { useMachineData } from '../../hooks/useMachineData';

const getTempYAxisProps = (streamData) => {
  if (!streamData || streamData.length === 0) {
    return { tickFormatter: (val) => Number(val).toFixed(1) };
  }
  const values = streamData.map(d => Number(d.val)).filter(v => !isNaN(v));
  if (values.length === 0) return { tickFormatter: (val) => Number(val).toFixed(1) };

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const min = Math.floor(minVal * 2) / 2 - 0.5;
  const max = Math.max(min + 1.5, Math.ceil(maxVal * 2) / 2 + 0.5);

  const ticks = [];
  for (let t = min; t <= max + 0.01; t += 0.5) {
    ticks.push(Number(t.toFixed(1)));
  }

  return {
    domain: [min, max],
    ticks: ticks,
    interval: 0,
    tickFormatter: (val) => Number(val).toFixed(1),
  };
};

const AdminLiveTelemetry = () => {
  const { machineData, streams, isOnline, machineState } = useMachineData();

  const charts = [
    { title: 'Vibration (mm/s)', color: '#f59e0b', streamIndex: 1, isTemp: false },
    { title: 'Temperature (°C)', color: '#ef4444', streamIndex: 0, isTemp: true },
    { title: 'Sound (dB)',        color: '#3b82f6', streamIndex: 2, isTemp: false },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Live Telemetry</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Admin Portal / Real-time Sensor Data</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px',
          background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: 'var(--radius-full)',
          color: isOnline ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${isOnline ? 'var(--color-success)' : 'var(--color-danger)'}`,
        }}>
          {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
          <span style={{ fontWeight: '600' }}>{isOnline ? 'Live Connection' : 'Offline'}</span>
        </div>
      </div>

      {/* 3D Digital Twin */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>3D Digital Twin</h2>
        {!isOnline && (
          <div style={{
            padding: 'var(--spacing-4)',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            marginBottom: 'var(--spacing-4)',
          }}>
            Machine is offline. 3D Twin is showing last known state or default orientation.
          </div>
        )}
        <DigitalTwin3D machineData={machineData} isOnline={isOnline} machineState={machineState} />
      </div>

      {/* Sensor Charts */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Live Sensor Streams</h2>

      {!isOnline && (
        <div style={{
          padding: 'var(--spacing-4)',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--spacing-4)',
          textAlign: 'center',
        }}>
          No reading. Machine is offline.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--spacing-6)' }}>
        {charts.map((c, i) => {
          const streamData = streams[c.streamIndex] || [];
          const yAxisProps = c.isTemp
            ? getTempYAxisProps(streamData)
            : { tickFormatter: (v) => Number(v).toFixed(0) };

          return (
            <div key={i} className={`glass-panel ${!isOnline ? 'opacity-50' : ''}`} style={{ padding: 'var(--spacing-4)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>{c.title}</h3>
              <div style={{ height: '200px' }}>
                {streamData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={streamData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-muted)" hide />
                      <YAxis stroke="var(--text-muted)" {...yAxisProps} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                        formatter={(val) => [`${Number(val).toFixed(1)} ${c.isTemp ? '°C' : ''}`, c.title.split(' ')[0]]}
                      />
                      <Line
                        type="monotone"
                        dataKey="val"
                        stroke={c.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Waiting for data...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLiveTelemetry;
