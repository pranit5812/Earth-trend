import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  RotateCw,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Calendar,
  ShieldAlert,
  Info
} from 'lucide-react';
import { getClimateAlerts } from '../../api/axios';
import './climateAlerts.css';

export default function ClimateAlertsTopBar({ onSelectAlert, activeAlertId }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, red: 0, orange: 0, yellow: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDrawerAlert, setSelectedDrawerAlert] = useState(null);
  const [showAllDrawer, setShowAllDrawer] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const fetchAlerts = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClimateAlerts({ refresh: forceRefresh });
      if (res.ok && res.data) {
        const alertList = res.data.alerts || [];
        setAlerts(alertList);
        setSummary(res.data.summary || { total: 0, red: 0, orange: 0, yellow: 0 });
        setLastSynced(res.data.data_freshness?.last_synced || new Date().toLocaleTimeString());
        setIsStale(res.data.data_freshness?.is_stale || false);
      } else {
        setError('Weather alerts service currently unavailable');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch IMD alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Sync currentIndex when activeAlertId changes from external trigger (e.g. map click)
  useEffect(() => {
    if (activeAlertId && alerts.length > 0) {
      const idx = alerts.findIndex((a) => a.id === activeAlertId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [activeAlertId, alerts]);

  // Auto-advance ticker every 7s if not paused
  useEffect(() => {
    if (alerts.length <= 1 || isPaused || isCollapsed) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [alerts.length, isPaused, isCollapsed]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : alerts.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < alerts.length - 1 ? prev + 1 : 0));
  };

  const handleAlertClick = (alert) => {
    if (onSelectAlert) {
      onSelectAlert(alert);
    }
  };

  const currentAlert = alerts[currentIndex] || null;

  // Format short sync time (e.g. "11:17 AM")
  const formatShortTime = (raw) => {
    if (!raw) return '';
    if (raw.includes(':')) {
      const parts = raw.split(' ');
      if (parts.length >= 2) {
        return parts[1].substring(0, 5) + ' IST';
      }
    }
    return raw;
  };

  return (
    <div className="alerts-topbar-container">
      <div className="alerts-topbar-inner">
        {/* 1. Left Section: Brand & Severity Counts */}
        <div className="alerts-left-section">
          <div className="alerts-brand">
            <div className="alerts-pulse-dot" />
            <span className="alerts-title">
              <AlertTriangle size={15} color="#ef4444" />
              <span>IMD Forecast & Climate Alerts</span>
            </span>
            <span className="alerts-source-badge">Official IMD</span>
          </div>

          {!isCollapsed && summary.total > 0 && (
            <div className="alerts-counts">
              {summary.red > 0 && (
                <span className="alert-count-pill red" title="Red Warning: Take Action">
                  🔴 {summary.red} Red
                </span>
              )}
              {summary.orange > 0 && (
                <span className="alert-count-pill orange" title="Orange Warning: Be Prepared">
                  🟠 {summary.orange} Orange
                </span>
              )}
              {summary.yellow > 0 && (
                <span className="alert-count-pill yellow" title="Yellow Warning: Be Updated">
                  🟡 {summary.yellow} Yellow
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. Middle Section: Focused Highlight Alert Card & Stepper */}
        {!isCollapsed && (
          <div
            className="alerts-center-section"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {loading && alerts.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ⏳ Connecting to India Meteorological Department advisory stream...
              </span>
            ) : error && alerts.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                ⚠️ {error}
              </span>
            ) : alerts.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                ✓ No active severe weather warnings across monitored regions.
              </span>
            ) : currentAlert ? (
              <>
                <div
                  className={`alert-focus-chip ${activeAlertId === currentAlert.id ? 'active' : ''}`}
                  onClick={() => handleAlertClick(currentAlert)}
                  title={`Click to focus map on ${currentAlert.district}, ${currentAlert.state}`}
                >
                  <span className={`alert-chip-severity-badge ${currentAlert.severity}`}>
                    {currentAlert.severity}
                  </span>
                  <span className="alert-chip-location">
                    {currentAlert.district}, {currentAlert.state}:
                  </span>
                  <span className="alert-chip-title">
                    {currentAlert.title}
                  </span>
                  <span className="alert-chip-metric">
                    ({currentAlert.forecast_metric})
                  </span>

                  <div className="alert-chip-actions">
                    <button
                      className="alert-chip-zoom-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlertClick(currentAlert);
                      }}
                      title="Zoom map to affected region"
                    >
                      <MapPin size={11} />
                      <span>Zoom</span>
                    </button>
                    <button
                      className="alert-chip-detail-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerAlert(currentAlert);
                      }}
                      title="View full IMD bulletin"
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Stepper Navigation */}
                {alerts.length > 1 && (
                  <div className="alert-stepper">
                    <button
                      className="stepper-btn"
                      onClick={handlePrev}
                      title="Previous alert"
                      aria-label="Previous alert"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="stepper-count">
                      {currentIndex + 1}/{alerts.length}
                    </span>
                    <button
                      className="stepper-btn"
                      onClick={handleNext}
                      title="Next alert"
                      aria-label="Next alert"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {/* View All Drawer Trigger */}
                <button
                  className="view-all-alerts-btn"
                  onClick={() => setShowAllDrawer(true)}
                  title="View all active official weather alerts"
                >
                  <Layers size={12} />
                  <span>All ({alerts.length})</span>
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* 3. Right Section: Synced Time, Refresh & Collapse */}
        <div className="alerts-right-section">
          {isStale && (
            <span className="stale-warning-tag" title="Data cached > 15m">
              Stale cache
            </span>
          )}
          {lastSynced && !isCollapsed && (
            <span className="alerts-sync-text" title={`Last synced from IMD: ${lastSynced}`}>
              {formatShortTime(lastSynced)}
            </span>
          )}
          <button
            className="alerts-refresh-btn"
            onClick={() => fetchAlerts(true)}
            disabled={loading}
            title="Refresh official warnings"
          >
            <RotateCw size={11} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            className="alerts-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Alerts Bar' : 'Collapse Alerts Bar'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Full Alert Bulletin Drawer (Single Alert) */}
      {selectedDrawerAlert && (
        <div className="alert-drawer-backdrop" onClick={() => setSelectedDrawerAlert(null)}>
          <div className="alert-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="alert-drawer-close"
              onClick={() => setSelectedDrawerAlert(null)}
              title="Close Bulletin"
            >
              <X size={18} />
            </button>

            <div>
              <span
                className="alert-drawer-badge"
                style={{
                  background:
                    selectedDrawerAlert.severity === 'Red'
                      ? '#ef4444'
                      : selectedDrawerAlert.severity === 'Orange'
                      ? '#f97316'
                      : '#eab308',
                  color: selectedDrawerAlert.severity === 'Yellow' ? '#713f12' : '#ffffff'
                }}
              >
                {selectedDrawerAlert.severity_label}
              </span>

              <h2 className="alert-drawer-title">{selectedDrawerAlert.title}</h2>
              <div className="alert-drawer-loc">
                <MapPin size={16} color="#0284c7" />
                <span>
                  <strong>{selectedDrawerAlert.district}</strong>, {selectedDrawerAlert.state}
                </span>
              </div>
            </div>

            {/* Key Observation / Forecast Metric Box */}
            <div className="alert-drawer-box">
              <div className="alert-drawer-box-label">Forecast Condition / Anomaly</div>
              <div className="alert-drawer-box-val">{selectedDrawerAlert.forecast_metric}</div>
            </div>

            {/* Validity Period */}
            <div className="alert-drawer-box">
              <div className="alert-drawer-box-label">Warning Validity Horizon</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                📅 {selectedDrawerAlert.forecast_date}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Valid Until: {selectedDrawerAlert.valid_until}
              </div>
            </div>

            {/* Meteorological Description */}
            <div className="alert-drawer-box">
              <div className="alert-drawer-box-label">IMD Meteorological Synopsis</div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
                {selectedDrawerAlert.description}
              </p>
            </div>

            {/* Safety & Action Advisory */}
            <div
              className="alert-drawer-action-card"
              style={{
                borderColor:
                  selectedDrawerAlert.severity === 'Red'
                    ? '#ef4444'
                    : selectedDrawerAlert.severity === 'Orange'
                    ? '#f97316'
                    : '#eab308'
              }}
            >
              <div className="alert-drawer-action-title">
                ⚠️ Public Safety & Agronomic Precautions
              </div>
              <p className="alert-drawer-action-desc">
                {selectedDrawerAlert.safety_action}
              </p>
            </div>

            {/* Official Source Provenance */}
            <div style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.4, marginBottom: '20px' }}>
              <strong>Official Provenance:</strong> {selectedDrawerAlert.source}<br />
              <strong>Bulletin ID:</strong> {selectedDrawerAlert.bulletin_number}<br />
              <strong>Last Synced:</strong> {selectedDrawerAlert.last_updated}
            </div>

            {/* Zoom Action Button */}
            <button
              className="alert-drawer-zoom-action"
              onClick={() => {
                handleAlertClick(selectedDrawerAlert);
                setSelectedDrawerAlert(null);
              }}
            >
              <MapPin size={18} />
              <span>Zoom & Center Map on {selectedDrawerAlert.district}</span>
            </button>
          </div>
        </div>
      )}

      {/* All Active Warnings Drawer / List */}
      {showAllDrawer && (
        <div className="alert-drawer-backdrop" onClick={() => setShowAllDrawer(false)}>
          <div className="alert-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="alert-drawer-close"
              onClick={() => setShowAllDrawer(false)}
              title="Close List"
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h2 className="alert-drawer-title" style={{ margin: 0 }}>
                  Active IMD Warnings ({alerts.length})
                </h2>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.8125rem', color: '#64748b' }}>
                Official meteorological advisories prioritized by severity level (Red &gt; Orange &gt; Yellow).
              </p>
            </div>

            <div className="drawer-alerts-list">
              {alerts.map((al, idx) => (
                <div
                  key={al.id}
                  className={`drawer-alert-item ${activeAlertId === al.id ? 'active' : ''}`}
                  onClick={() => {
                    handleAlertClick(al);
                    setCurrentIndex(idx);
                    setShowAllDrawer(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`alert-chip-severity-badge ${al.severity}`}>
                      {al.severity} Alert
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                      {al.forecast_date}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '4px' }}>
                    {al.district}, {al.state}: {al.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginBottom: '6px' }}>
                    {al.forecast_metric}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button
                      className="alert-chip-zoom-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlertClick(al);
                        setCurrentIndex(idx);
                        setShowAllDrawer(false);
                      }}
                    >
                      <MapPin size={11} />
                      <span>Focus on Map</span>
                    </button>
                    <button
                      className="alert-chip-detail-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawerAlert(al);
                        setShowAllDrawer(false);
                      }}
                    >
                      <span>Read Bulletin</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
