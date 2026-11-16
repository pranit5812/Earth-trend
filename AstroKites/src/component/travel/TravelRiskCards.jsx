import React from 'react';
import { AlertTriangle, ShieldCheck, Thermometer, CloudRain, Droplets, Wind, Sparkles } from 'lucide-react';

export default function TravelRiskCards({
  risks = [],
  summary = '',
  precautions = [],
  destinationName = '',
  monthName = ''
}) {
  const getRiskClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'st-risk-card risk-high';
      case 'moderate': return 'st-risk-card risk-moderate';
      default: return 'st-risk-card risk-low';
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'moderate': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <AlertTriangle size={20} className="text-amber-500" />
        <span>Travel Weather Risks & Safeguards {monthName ? `(${monthName})` : ''}</span>
      </div>

      {summary && (
        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          {summary}
        </p>
      )}

      {/* Risk Grid */}
      <div className="st-risk-grid">
        {risks.map((risk, idx) => (
          <div key={idx} className={getRiskClass(risk.severity)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                {risk.title || risk.risk_type}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: getRiskColor(risk.severity),
                color: '#ffffff'
              }}>
                {risk.severity} Risk
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
              {risk.description}
            </div>

            {risk.affected_months && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Peak Occurrence: <strong>{risk.affected_months.join(', ')}</strong>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Precautions & Packing Tips */}
      {precautions && precautions.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={18} className="text-emerald-600" />
            Recommended Traveler Precautions & Packing:
          </div>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            {precautions.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
