import React, { useState } from 'react';
import { GitCompare, Trophy, AlertCircle, Sparkles, Check } from 'lucide-react';
import { compareTravelDestinations } from '../../api/axios';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SUGGESTED_DESTINATIONS = [
  'Goa', 'Manali', 'Shimla', 'Ooty', 'Munnar', 'Jaipur', 'Udaipur', 'Jaisalmer', 'Rishikesh', 'Darjeeling', 'Srinagar', 'Leh', 'Varanasi'
];

export default function DestinationComparison({
  defaultDestinations = ['Manali', 'Ooty', 'Munnar'],
  travelType = 'general',
  startYear = 2015,
  endYear = 2024
}) {
  const [selectedDests, setSelectedDests] = useState(defaultDestinations.slice(0, 3));
  const [inputVal, setInputVal] = useState('');
  const [travelMonth, setTravelMonth] = useState(10); // October default
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);

  const handleAddDest = (name) => {
    if (selectedDests.includes(name)) return;
    if (selectedDests.length >= 3) {
      setError('You can compare a maximum of 3 Indian destinations at once.');
      return;
    }
    setError(null);
    setSelectedDests([...selectedDests, name]);
  };

  const handleRemoveDest = (name) => {
    if (selectedDests.length <= 2) {
      setError('Please keep at least 2 Indian destinations to compare.');
      return;
    }
    setError(null);
    setSelectedDests(selectedDests.filter(d => d !== name));
  };

  const handleRunComparison = async () => {
    if (selectedDests.length < 2) {
      setError('Please select at least 2 Indian destinations.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await compareTravelDestinations({
      destinations: selectedDests,
      travel_type: travelType,
      travel_month: travelMonth,
      duration_days: durationDays,
      start_year: startYear,
      end_year: endYear
    });

    setLoading(false);
    if (res && res.data && res.data.status === 'success') {
      setComparisonData(res.data);
    } else {
      setError(res?.error?.detail || res?.error || 'Failed to compare destinations.');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#f97316';
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <GitCompare size={20} className="text-blue-600" />
        <span>Multi-Destination Climate Comparison (India Only)</span>
      </div>

      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
        Compare 2 to 3 Indian destinations side-by-side using real NASA POWER climate observations for a chosen month and travel style.
      </p>

      {/* Destination Selection Tags */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="st-label">Selected Destinations (2 or 3):</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.35rem' }}>
          {selectedDests.map((dest) => (
            <span
              key={dest}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {dest}
              <button
                type="button"
                onClick={() => handleRemoveDest(dest)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af', fontWeight: 'bold' }}
              >
                ×
              </button>
            </span>
          ))}

          {selectedDests.length < 3 && (
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <input
                type="text"
                placeholder="Add Indian destination..."
                className="st-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', width: '180px' }}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputVal.trim()) {
                    handleAddDest(inputVal.trim());
                    setInputVal('');
                  }
                }}
              />
              <button
                type="button"
                className="st-chip"
                onClick={() => {
                  if (inputVal.trim()) {
                    handleAddDest(inputVal.trim());
                    setInputVal('');
                  }
                }}
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {/* Suggested Quick Add Chips */}
        <div className="st-chips-wrap" style={{ marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Suggestions:</span>
          {SUGGESTED_DESTINATIONS.filter(d => !selectedDests.includes(d)).slice(0, 7).map((d) => (
            <button
              key={d}
              type="button"
              className="st-chip"
              onClick={() => handleAddDest(d)}
            >
              + {d}
            </button>
          ))}
        </div>
      </div>

      {/* Month & Action Control */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div className="st-input-group" style={{ minWidth: '160px' }}>
          <label className="st-label">Travel Month to Compare:</label>
          <select
            className="st-select"
            value={travelMonth}
            onChange={(e) => setTravelMonth(parseInt(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            className="st-cta-btn"
            onClick={handleRunComparison}
            disabled={loading || selectedDests.length < 2}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Comparing Climate Records...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Compare {selectedDests.length} Destinations
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="st-alert-india" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && comparisonData.destinations && (
        <div>
          {/* Winner Banner */}
          {comparisonData.winner && (
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '0.65rem',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '2px solid #86efac',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)'
            }}>
              <Trophy size={28} className="text-emerald-600 flex-shrink-0" />
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                  Recommended Winner for {MONTH_NAMES[travelMonth - 1]}: {comparisonData.winner.destination}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.2rem' }}>
                  Comfort Score: <strong>{Math.round(comparisonData.winner.score)}/100</strong> ({comparisonData.winner.classification}) • {comparisonData.winner.climatic_edge}
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Metric Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="st-comp-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Climate Metric</th>
                  {comparisonData.destinations.map((d) => (
                    <th key={d.destination} style={{ textAlign: 'center' }}>
                      {d.destination}
                      {comparisonData.winner?.destination === d.destination && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                          👑 Top Pick
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Travel Comfort Score</strong></td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        background: getScoreColor(d.score),
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {Math.round(d.score)} / 100
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Suitability Category</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center', fontWeight: 600 }}>
                      {d.classification}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Average Temperature (°C)</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      <strong>{d.temperature_c?.toFixed(1)}°C</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Min {d.temp_min_c?.toFixed(1)}°C / Max {d.temp_max_c?.toFixed(1)}°C
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Monthly Rainfall (mm)</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      <strong>{d.rainfall_mm?.toFixed(0)} mm</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ~{d.rainy_days_count} rainy days
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Relative Humidity (%)</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      {d.humidity_pct?.toFixed(0)}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Wind Speed (m/s)</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      {d.wind_speed_ms?.toFixed(1)} m/s
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Solar Radiation (kWh/m²/day)</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center' }}>
                      {d.solar_kwh_m2?.toFixed(1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Best 3 Months</td>
                  {comparisonData.destinations.map((d) => (
                    <td key={d.destination} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#1e40af', fontWeight: 600 }}>
                      {(d.best_alternative_months || []).join(', ')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
