import React from 'react';
import Sparkline from './Sparkline';
import { AnimatedNumber, GlowCard } from './reactBitsAdapters';

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
    <GlowCard
      className={`metric-card-shell ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      glowColor={accent ? 'rgba(183, 123, 85, 0.2)' : 'rgba(100, 23, 47, 0.16)'}
    >
      <article
        className={`metric-card ${accent ? 'metric-accent' : ''}`}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
      >
        <div className="metric-top">
          <span>
            {icon}
            {label}
          </span>
        </div>
        <div className="metric-value">
          <AnimatedNumber value={value} /> {suffix && <small>{suffix}</small>}
        </div>
        <div className="metric-bottom">
          <div>
            <strong>{change}</strong>
            <span>{context}</span>
          </div>
          <Sparkline variant={chart} />
        </div>
      </article>
    </GlowCard>
  );
}

