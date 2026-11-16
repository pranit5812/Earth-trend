import React from 'react';
import { Award, Thermometer, CloudRain, Droplets, Wind, Sun, Info } from 'lucide-react';

export default function TravelComfortScoreCard({
  score = 0,
  classification = 'Moderate',
  color = 'yellow',
  subscores = {},
  activitySummary = '',
  monthName = '',
  destinationName = ''
}) {
  const getBadgeClass = (c) => {
    switch (c) {
      case 'green': return 'st-score-badge st-score-excellent';
      case 'light-green': return 'st-score-badge st-score-good';
      case 'yellow': return 'st-score-badge st-score-moderate';
      default: return 'st-score-badge st-score-less';
    }
  };

  const getStrokeColor = (c) => {
    switch (c) {
      case 'green': return '#10b981';
      case 'light-green': return '#22c55e';
      case 'yellow': return '#eab308';
      default: return '#f97316';
    }
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="st-card" style={{ height: '100%' }}>
      <div className="st-card-title">
        <Award size={20} className="text-blue-600" />
        <span>Travel Comfort Index {monthName ? `(${monthName})` : ''}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {/* Radial Progress Gauge */}
        <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke={getStrokeColor(color)}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {Math.round(score)}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>/ 100</div>
          </div>
        </div>

        {/* Classification & Summary */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <div style={{ marginBottom: '0.4rem' }}>
            <span className={getBadgeClass(color)}>
              ● {classification} Suitability
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.45 }}>
            {activitySummary || `Based on NASA POWER multi-year climatological analysis for ${destinationName || 'this destination'}.`}
          </div>
        </div>
      </div>

      {/* Sub-Scores Breakdown */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Meteorological Sub-Score Breakdown:
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Temperature */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                <Thermometer size={13} className="text-rose-500" /> Thermal Comfort:
              </span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(subscores.temperature_score || 0)} / 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, subscores.temperature_score || 0)}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Rainfall */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                <CloudRain size={13} className="text-blue-500" /> Precipitation / Dryness:
              </span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(subscores.rainfall_score || 0)} / 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, subscores.rainfall_score || 0)}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Humidity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                <Droplets size={13} className="text-teal-500" /> Relative Humidity Comfort:
              </span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(subscores.humidity_score || 0)} / 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, subscores.humidity_score || 0)}%`, height: '100%', background: '#14b8a6', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Wind */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                <Wind size={13} className="text-indigo-500" /> Wind Speed Condition:
              </span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(subscores.wind_score || 0)} / 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, subscores.wind_score || 0)}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Sunshine / Solar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569' }}>
                <Sun size={13} className="text-amber-500" /> Sunshine & Clear Skies:
              </span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.round(subscores.solar_score || 0)} / 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, subscores.solar_score || 0)}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
