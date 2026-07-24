import React from 'react';

const MetricCard = ({ title, value, unit, trend, icon: Icon, colorClass = 'text-blue-500' }) => {
  const isPositive = trend > 0;
  return (
    <div className="card glass-panel flex flex-col justify-between" style={{ height: '100%' }}>
      <div className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-1)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
            {unit && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div style={{ padding: 'var(--spacing-2)', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <Icon className={colorClass} style={{ width: '24px', height: '24px', color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'var(--spacing-4)', fontSize: '0.875rem' }}>
          <span style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: '600', marginRight: 'var(--spacing-2)' }}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
