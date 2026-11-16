import React, { useEffect } from 'react';
import { Sliders, Calendar, Clock, Sparkles } from 'lucide-react';

const DURATION_PRESETS = [3, 5, 7, 10, 15];

export default function TravelPreferencesBar({
  durationDays = 7,
  onChangeDuration,
  startDate = '',
  onChangeStartDate,
  endDate = '',
  onChangeEndDate,
  onFindBestTime,
  loading = false,
  disabled = false
}) {
  // If no start date is set yet, default to tomorrow
  useEffect(() => {
    if (!startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startStr = tomorrow.toISOString().split('T')[0];
      onChangeStartDate(startStr);

      const endD = new Date(tomorrow);
      endD.setDate(endD.getDate() + (durationDays || 7));
      onChangeEndDate(endD.toISOString().split('T')[0]);
    }
  }, [startDate, durationDays, onChangeStartDate, onChangeEndDate]);

  // When user clicks a duration preset, auto-adjust End Date based on Start Date
  const handlePresetDuration = (days) => {
    onChangeDuration(days);
    if (startDate) {
      const startD = new Date(startDate);
      const newEnd = new Date(startD);
      newEnd.setDate(newEnd.getDate() + days);
      onChangeEndDate(newEnd.toISOString().split('T')[0]);
    }
  };

  // When user changes Start Date, keep the duration intact
  const handleStartDateChange = (val) => {
    onChangeStartDate(val);
    if (val && durationDays) {
      const startD = new Date(val);
      const newEnd = new Date(startD);
      newEnd.setDate(newEnd.getDate() + durationDays);
      onChangeEndDate(newEnd.toISOString().split('T')[0]);
    }
  };

  // When user changes End Date, recalculate duration
  const handleEndDateChange = (val) => {
    onChangeEndDate(val);
    if (startDate && val) {
      const startD = new Date(startDate);
      const endD = new Date(val);
      const diffTime = endD - startD;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        onChangeDuration(diffDays);
      }
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Sliders size={20} className="text-blue-600" />
        <span>Fixed Travel Dates & Itinerary</span>
      </div>

      <div className="st-dates-row">
        {/* Column 1: Fixed Start Date */}
        <div className="st-input-group">
          <label className="st-label">
            <Calendar size={14} className="text-blue-600" /> Start Date:
          </label>
          <input
            type="date"
            className="st-date-input"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
        </div>

        {/* Column 2: Fixed End Date */}
        <div className="st-input-group">
          <label className="st-label">
            <Calendar size={14} className="text-blue-600" /> End Date:
          </label>
          <input
            type="date"
            className="st-date-input"
            value={endDate}
            min={startDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
          />
        </div>

        {/* Column 3: Trip Duration with Pills & Custom Input */}
        <div className="st-input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <label className="st-label" style={{ margin: 0 }}>
              <Clock size={14} className="text-blue-600" /> Trip Duration:
            </label>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.82rem' }}>
              {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="st-duration-control">
            <div className="st-duration-pills">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`st-chip ${durationDays === d ? 'active' : ''}`}
                  onClick={() => handlePresetDuration(d)}
                >
                  {d}D
                </button>
              ))}
            </div>

            <div className="st-custom-days">
              <input
                type="number"
                min="1"
                max="60"
                value={durationDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handlePresetDuration(val);
                }}
                className="st-input"
                style={{ width: '48px', padding: '0.25rem 0.3rem', textAlign: 'center', height: '30px', fontSize: '0.82rem' }}
                title="Custom days"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
        <button
          type="button"
          className="st-cta-btn"
          onClick={onFindBestTime}
          disabled={loading || disabled}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Evaluating Climate for Dates...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Evaluate Dates & Best Time
            </>
          )}
        </button>
      </div>
    </div>
  );
}
