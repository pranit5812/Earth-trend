import React, { useState } from 'react';
import { Calendar, Sun, CloudRain, Thermometer, Droplets, Wind, Sparkles } from 'lucide-react';

export default function TravelComfortCalendar({
  months = [],
  selectedMonth = null,
  onSelectMonth,
  destinationName = ''
}) {
  const [activeMonthNum, setActiveMonthNum] = useState(selectedMonth || (months[0]?.month || 1));

  const current = months.find(m => m.month === activeMonthNum) || months[0];

  const getBorderColor = (color) => {
    switch (color) {
      case 'green': return '#10b981';
      case 'light-green': return '#22c55e';
      case 'yellow': return '#eab308';
      default: return '#f97316';
    }
  };

  const getBgColor = (color) => {
    switch (color) {
      case 'green': return '#f0fdf4';
      case 'light-green': return '#f0fdf4';
      case 'yellow': return '#fefce8';
      default: return '#fff7ed';
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Calendar size={20} className="text-blue-600" />
        <span>12-Month Travel Comfort Calendar {destinationName ? `(${destinationName})` : ''}</span>
      </div>

      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
        Color-coded by historical NASA POWER multi-variable suitability. Click on any month card to inspect detailed climate statistics and travel guidance.
      </p>

      {/* 12-Month Grid */}
      <div className="st-cal-grid">
        {months.map((m) => {
          const isSelected = m.month === activeMonthNum;
          return (
            <div
              key={m.month}
              className={`st-cal-month-card ${isSelected ? 'selected' : ''}`}
              style={{
                borderColor: isSelected ? '#2563eb' : getBorderColor(m.color),
                background: getBgColor(m.color)
              }}
              onClick={() => {
                setActiveMonthNum(m.month);
                if (onSelectMonth) onSelectMonth(m.month);
              }}
            >
              <div className="st-cal-month-header">
                <span className="st-cal-month-name">{m.month_name}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: getBorderColor(m.color),
                    color: '#ffffff'
                  }}
                >
                  {Math.round(m.score)}
                </span>
              </div>

              <div className="st-cal-metrics">
                <div>🌡️ Avg: <strong>{m.temperature_c?.toFixed(1)}°C</strong></div>
                <div>🌧️ Rain: <strong>{m.rainfall_mm?.toFixed(0)} mm</strong></div>
                <div>💧 RH: <strong>{m.humidity_pct?.toFixed(0)}%</strong></div>
              </div>

              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}>
                ● {m.classification}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Month Inspector Details */}
      {current && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {current.month_name} Climate Deep-Dive
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.75rem' }}>
                Score: <strong>{Math.round(current.score)} / 100</strong> ({current.classification})
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1e40af', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
              Based on NASA POWER observations
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, marginBottom: '1rem' }}>
            {current.justification || `Historical observations indicate ${current.month_name} experiences ${current.temperature_c?.toFixed(1)}°C average temperature with ${current.rainfall_mm?.toFixed(0)} mm expected rainfall.`}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.82rem'
          }}>
            <div>
              <div style={{ color: '#64748b' }}>Mean / Min / Max Temp:</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {current.temperature_c?.toFixed(1)}°C
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Low: {current.temp_min_c?.toFixed(1)}°C • High: {current.temp_max_c?.toFixed(1)}°C
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b' }}>Total Rainfall & Rainy Days:</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {current.rainfall_mm?.toFixed(0)} mm
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                ~{current.rainy_days_count || Math.round((current.rainfall_mm || 0) / 12)} rainy days
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b' }}>Relative Humidity & Mugginess:</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {current.humidity_pct?.toFixed(0)}%
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {(current.humidity_pct || 0) > 75 ? 'Muggy / Humid' : 'Comfortable'}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b' }}>Wind Speed & Solar:</div>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {current.wind_speed_ms?.toFixed(1)} m/s
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Solar: {current.solar_kwh_m2?.toFixed(1)} kWh/m²/day
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
