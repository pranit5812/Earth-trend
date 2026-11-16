import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertTriangle, Sparkles, Thermometer, CloudRain, Droplets, ShieldCheck } from 'lucide-react';
import { getBestTravelDates } from '../../api/axios';

export default function BestDateFinder({
  destination,
  travelType = 'general',
  durationDays = 7,
  startDate = '',
  endDate = '',
  startYear = 2015,
  endYear = 2024
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculateDates = async () => {
    if (!destination?.name) return;
    setLoading(true);
    setError(null);

    const payload = {
      destination: destination.name,
      travel_type: travelType,
      duration_days: durationDays,
      date_preference: 'fixed',
      start_date: startDate || null,
      end_date: endDate || null,
      start_year: startYear,
      end_year: endYear
    };

    const res = await getBestTravelDates(payload);
    setLoading(false);
    if (res && res.data && res.data.status === 'success') {
      setResult(res.data);
    } else {
      const errDetail = typeof res?.error === 'object' ? (res.error?.detail || JSON.stringify(res.error)) : res?.error;
      setError(errDetail || 'Failed to calculate travel date suitability.');
    }
  };

  // Run on mount or when destination/dates change
  useEffect(() => {
    if (destination?.name && startDate && endDate) {
      handleCalculateDates();
    }
  }, [destination?.name, startDate, endDate, travelType]);

  const getBadgeClass = (color) => {
    switch (color) {
      case 'green': return 'st-score-badge st-score-excellent';
      case 'light-green': return 'st-score-badge st-score-good';
      case 'yellow': return 'st-score-badge st-score-moderate';
      default: return 'st-score-badge st-score-less';
    }
  };

  const trip = result?.evaluated_trip;

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Calendar size={20} className="text-blue-600" />
        <span>Travel Dates Suitability Evaluation (Fixed Dates)</span>
      </div>

      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
        Evaluates your itinerary from <strong>{startDate || 'Selected Start'}</strong> to <strong>{endDate || 'Selected End'}</strong> ({durationDays} days) in {destination?.name || 'the chosen destination'} against NASA POWER historical observations.
      </p>

      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="st-cta-btn"
          onClick={handleCalculateDates}
          disabled={loading || !destination?.name}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Evaluating Historical Climate for Dates...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Re-Evaluate These Dates
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="st-alert-india" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Fixed Dates Itinerary Analysis */}
      {trip && (
        <div style={{
          padding: '1.35rem',
          borderRadius: '0.75rem',
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                🗓️ Itinerary: {trip.start_date || startDate} to {trip.end_date || endDate}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                Trip Duration: <strong>{trip.duration_days || durationDays} Days</strong> in {result.destination} • Activity: <strong>{travelType.toUpperCase()}</strong>
              </div>
            </div>
            <span className={getBadgeClass(trip.color)}>
              Score: {Math.round(trip.score)} / 100
            </span>
          </div>

          <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.55, marginBottom: '1rem', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            {trip.summary || trip.verdict}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '1rem',
            background: '#ffffff',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.82rem'
          }}>
            <div>
              <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Thermometer size={14} className="text-rose-500" /> Expected Temperature:
              </div>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                {trip.expected_temp_c?.toFixed(1) || trip.climate_expectation?.temp_mean_c?.toFixed(1)}°C
              </strong>
            </div>

            <div>
              <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CloudRain size={14} className="text-blue-500" /> Expected Rainfall:
              </div>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                {trip.expected_rainfall_mm?.toFixed(0) || trip.climate_expectation?.rainfall_total_mm?.toFixed(0)} mm
              </strong>
            </div>

            <div>
              <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Droplets size={14} className="text-teal-500" /> Relative Humidity:
              </div>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                {trip.expected_humidity_pct?.toFixed(0) || trip.climate_expectation?.humidity_avg_pct?.toFixed(0)}%
              </strong>
            </div>

            <div>
              <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} className="text-emerald-500" /> Suitability Verdict:
              </div>
              <strong style={{ fontSize: '0.95rem', color: '#1e40af' }}>
                {trip.suitability_verdict || trip.classification}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
