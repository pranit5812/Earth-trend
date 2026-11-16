import React from 'react';
import { Lightbulb, Compass, CloudSun, Wind, AlertCircle, Mountain, Waves, SunMedium } from 'lucide-react';

export default function TravelInsights({ destination, travelType = 'general', insights = null }) {
  return (
    <div className="st-card">
      <div className="st-card-title">
        <Lightbulb size={20} className="text-amber-500" />
        <span>Indian Climate Intelligence & Seasonal Dynamics</span>
      </div>

      <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.25rem' }}>
        India features 6 major climatic sub-types governed by monsoon currents and elevation gradients. AstroKites synthesizes NASA POWER observations with regional meteorological patterns:
      </p>

      {/* 4 Distinct Indian Weather Cycles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* SW Monsoon */}
        <div style={{ padding: '1rem', borderRadius: '0.65rem', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            <Waves size={18} className="text-blue-600" />
            <span>Southwest Monsoon (Jun – Sep)</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            Brings 75%+ of annual rainfall across the country. High risk of landslides in lower Himalayas and inundation in coastal Konkan/Kerala.
            <strong> Rain Shadow Exceptions:</strong> Leh-Ladakh, Spiti Valley, and Tamil Nadu coast remain largely dry.
          </div>
        </div>

        {/* Post-Monsoon / Retreating */}
        <div style={{ padding: '1rem', borderRadius: '0.65rem', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#166534', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            <CloudSun size={18} className="text-emerald-600" />
            <span>Post-Monsoon & Autumn (Oct – Nov)</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            Optimal nationwide travel window! Verdant lush landscapes, crystal clear skies, and mild temperatures across North, West, and Central India.
            <strong> Note:</strong> Tamil Nadu and Coromandel coast receive their primary Northeast monsoon rains during this period.
          </div>
        </div>

        {/* Winter */}
        <div style={{ padding: '1rem', borderRadius: '0.65rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            <Mountain size={18} className="text-slate-600" />
            <span>Pleasant Winter (Dec – Feb)</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            Peak tourism season for Rajasthan, Goa beaches, South Indian hill stations, and cultural monuments.
            Sub-zero temperatures and heavy snowfall in high-altitude Himalayas (Manali, Gulmarg, Ladakh passes).
          </div>
        </div>

        {/* Pre-Monsoon Summer */}
        <div style={{ padding: '1rem', borderRadius: '0.65rem', border: '1px solid #fed7aa', background: '#fff7ed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            <SunMedium size={18} className="text-orange-500" />
            <span>Pre-Monsoon Summer (Mar – May)</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            Intense scorching heatwaves (&gt;38°C to 45°C) across plains of Delhi, Rajasthan, UP, and Deccan plateau.
            Ideal time to escape to high-altitude hill stations (Shimla, Manali, Ooty, Munnar, Darjeeling).
          </div>
        </div>
      </div>

      {/* Destination Specific Advice */}
      {destination && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.65rem',
          background: '#f8fafc',
          border: '1px solid #cbd5e1'
        }}>
          <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
            📍 Specific Guidance for {destination.name} ({destination.state})
          </div>
          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
            {insights?.destination_guidance || `${destination.name} is located at coordinates ${destination.latitude?.toFixed(2)}°N, ${destination.longitude?.toFixed(2)}°E. Check the 12-Month Travel Calendar and Best Time recommendations above to align your visit with optimal historical weather conditions.`}
          </div>
        </div>
      )}
    </div>
  );
}
