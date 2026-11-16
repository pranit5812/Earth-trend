import React from 'react';
import { Trophy, Calendar, Thermometer, CloudRain, ShieldCheck, Sun } from 'lucide-react';

export default function BestTimeRecommendation({
  recommendations = [],
  peakSeason = [],
  shoulderSeason = [],
  lowSeason = [],
  summary = '',
  destinationName = '',
  travelType = 'general',
  onSelectMonth
}) {
  const getBadgeClass = (color) => {
    switch (color) {
      case 'green': return 'st-score-badge st-score-excellent';
      case 'light-green': return 'st-score-badge st-score-good';
      case 'yellow': return 'st-score-badge st-score-moderate';
      default: return 'st-score-badge st-score-less';
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Trophy size={20} className="text-amber-500" />
        <span>Best Time to Travel: {destinationName}</span>
      </div>

      {summary && (
        <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          {summary}
        </p>
      )}

      {/* Top Ranked Months */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {recommendations.slice(0, 4).map((rec, index) => (
          <div
            key={rec.month}
            style={{
              padding: '1.15rem',
              borderRadius: '0.75rem',
              border: index === 0 ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: index === 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' : '#ffffff',
              boxShadow: index === 0 ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
              cursor: onSelectMonth ? 'pointer' : 'default',
              position: 'relative'
            }}
            onClick={() => onSelectMonth && onSelectMonth(rec.month)}
          >
            {index === 0 && (
              <span style={{
                position: 'absolute',
                top: '-10px',
                right: '12px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
              }}>
                👑 TOP CHOICE
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                #{index + 1} {rec.month_name}
              </span>
              <span className={getBadgeClass(rec.color)}>
                {Math.round(rec.score)} / 100
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem', minHeight: '38px', lineHeight: 1.35 }}>
              {rec.justification}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.35rem',
              fontSize: '0.75rem',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                <Thermometer size={12} className="text-rose-500" />
                <span>Avg: <strong>{rec.temperature_c?.toFixed(1)}°C</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                <CloudRain size={12} className="text-blue-500" />
                <span>Rain: <strong>{rec.rainfall_mm?.toFixed(0)} mm</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                <Sun size={12} className="text-amber-500" />
                <span>Sun: <strong>{rec.solar_kwh_m2?.toFixed(1)} kWh</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>{rec.classification}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seasonal Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '1rem'
      }}>
        <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
            🌟 Peak Season (Prime Climate):
          </div>
          <div style={{ fontSize: '0.85rem', color: '#14532d' }}>
            {peakSeason.length > 0 ? peakSeason.join(', ') : 'Nov, Dec, Jan, Feb'}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.25rem' }}>
            ⛅ Shoulder Season (Lesser Crowds):
          </div>
          <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
            {shoulderSeason.length > 0 ? shoulderSeason.join(', ') : 'Mar, Oct'}
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.25rem' }}>
            ⚠️ Monsoon / Off Season:
          </div>
          <div style={{ fontSize: '0.85rem', color: '#7c2d12' }}>
            {lowSeason.length > 0 ? lowSeason.join(', ') : 'Jun, Jul, Aug, Sep'}
          </div>
        </div>
      </div>
    </div>
  );
}
