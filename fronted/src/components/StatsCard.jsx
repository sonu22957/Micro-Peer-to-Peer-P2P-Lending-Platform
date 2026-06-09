// fronted/src/components/StatsCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorMap = {
  primary:   { accent: 'var(--accent-primary)',   glow: 'var(--accent-primary-glow)',   bg: 'rgba(79,142,247,0.08)' },
  secondary: { accent: 'var(--accent-secondary)', glow: 'var(--accent-secondary-glow)', bg: 'rgba(155,110,243,0.08)' },
  success:   { accent: 'var(--success)',           glow: 'rgba(16,217,138,0.15)',        bg: 'var(--success-bg)' },
  warning:   { accent: 'var(--warning)',           glow: 'rgba(245,166,35,0.15)',        bg: 'var(--warning-bg)' },
  danger:    { accent: 'var(--danger)',            glow: 'rgba(247,85,85,0.15)',         bg: 'var(--danger-bg)' },
  info:      { accent: 'var(--info)',              glow: 'var(--accent-tertiary-glow)', bg: 'var(--info-bg)' },
};

export const StatsCard = ({ title, value, icon, change, changeType = 'neutral', color = 'primary', subtitle }) => {
  const c = colorMap[color] || colorMap.primary;

  const ChangeIcon = changeType === 'positive' ? TrendingUp
    : changeType === 'negative' ? TrendingDown : Minus;
  const changeColor = changeType === 'positive' ? 'var(--success)'
    : changeType === 'negative' ? 'var(--danger)' : 'var(--text-muted)';

  return (
    <div className="glass-card hoverable fade-in" style={{
      display: 'flex', flexDirection: 'column', gap: '1.1rem',
      minHeight: '130px', '--card-glow': c.glow,
      borderTop: `2px solid ${c.accent}`,
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Label */}
        <p style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {title}
        </p>
        {/* Icon */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          backgroundColor: c.bg, color: c.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px -4px ${c.glow}`,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        <h3 style={{
          fontSize: '2rem', fontWeight: 800, lineHeight: 1,
          fontFamily: 'var(--font-heading)', color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
        }}>
          {value}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Change Indicator */}
      {change && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.75rem', marginTop: 'auto',
          padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
          background: changeType === 'positive' ? 'var(--success-bg)'
            : changeType === 'negative' ? 'var(--danger-bg)'
            : 'rgba(255,255,255,0.03)',
          width: 'fit-content',
        }}>
          <ChangeIcon size={12} style={{ color: changeColor }} />
          <span style={{ fontWeight: 600, color: changeColor }}>{change}</span>
          <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
