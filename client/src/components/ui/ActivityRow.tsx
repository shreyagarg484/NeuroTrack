import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ActivityRowProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
  score: string;
  tone?: 'burgundy' | 'green' | 'sand' | string;
  onClick?: () => void;
}

export default function ActivityRow({
  icon,
  title,
  detail,
  score,
  tone = 'burgundy',
  onClick,
}: ActivityRowProps) {
  return (
    <div
      className={`activity-row ${onClick ? 'cursor-pointer hover:bg-cream/70' : ''}`}
      onClick={onClick}
    >
      <div className={`activity-icon ${tone}`}>{icon}</div>
      <div className="activity-info">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <b className={`activity-score ${tone}`}>{score}</b>
      <ArrowRight size={14} className="activity-arrow" />
    </div>
  );
}

