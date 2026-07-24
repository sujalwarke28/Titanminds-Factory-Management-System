import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Target, AlertTriangle } from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import { useMachineData } from '../../hooks/useMachineData';

const AiPredictions = () => {
  const { machineData, isOnline } = useMachineData();

  const pred = machineData?.prediction || {};
  const healthScore = isOnline && pred.health_score !== undefined ? Number(pred.health_score) : null;
  const failureProb = isOnline && pred.failure_probability !== undefined ? Math.round(pred.failure_probability * 100) : null;
  const confidence = isOnline && pred.confidence !== undefined ? Math.round(pred.confidence * 100) : null;
  const explanations = isOnline ? (pred.explanation || pred.alerts || []) : [];

  const featureData = explanations
    .filter(e => !e.toLowerCase().includes('vibration'))
    .map((e, i) => ({
      name: e.length > 20 ? e.substring(0, 20) + '…' : e,
      weight: Number((0.45 - i * 0.12).toFixed(2)),
    }));

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>AI Model Predictions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Engineer Portal / Real-Time Machine Prediction Engine (Groq LLM)</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
        <MetricCard title="Failure Risk (CNC_01)" value={failureProb !== null ? `${failureProb}%` : 'No Data'} icon={AlertTriangle} colorClass={failureProb > 50 ? "text-danger-500" : "text-success-500"} />
        <MetricCard title="AI Model Confidence" value={confidence !== null ? `${confidence}%` : 'No Data'} icon={Target} colorClass="text-success-500" />
        <MetricCard title="Machine Health Score" value={healthScore !== null ? `${healthScore}%` : 'No Data'} icon={BrainCircuit} colorClass={healthScore >= 70 ? "text-success-500" : "text-warning-500"} />
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', height: '360px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: 'var(--spacing-4)' }}>Live Anomaly Factor Weights (Non-Vibration)</h3>
        {featureData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={featureData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" domain={[0, 1]} />
              <YAxis dataKey="name" type="category" stroke="var(--text-primary)" width={140} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
              <Bar dataKey="weight" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {isOnline ? '✓ No active anomaly drivers detected for CNC_01' : 'Machine offline. Awaiting telemetry...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiPredictions;
