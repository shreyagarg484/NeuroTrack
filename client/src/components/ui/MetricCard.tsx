import React from 'react';
import Sparkline from './Sparkline';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  change: string;
  context: string;
  icon: React.ReactNode;
  chart: 'up' | 'steady';
  accent?: boolean;
  onClick?: () => void;
}

export default function MetricCard({
  label,
  value,
  suffix,
  change,
  context,
  icon,
  chart,
  accent,
  onClick,
}: MetricCardProps) {
  return (
    <article
      className={`metric-card ${accent ? 'metric-accent' : ''} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="metric-top">
        <span>
          {icon}
          {label}
        </span>
      </div>
      <div className="metric-value">
        {value} {suffix && <small>{suffix}</small>}
      </div>
      <div className="metric-bottom">
        <div>
          <strong>{change}</strong>
          <span>{context}</span>
        </div>
        <Sparkline variant={chart} />
      </div>
    </article>
  );
}

