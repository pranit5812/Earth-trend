import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./trends.css";
import { usePageContext } from "../context/PageContext";
import {
  getVariables,
  getIndianStates,
  getIndianDistricts,
  analyzeTrends,
  getTrendsMap
} from "../api/axios";

const fmt = (num, digits = 4) => (num !== null && num !== undefined && !isNaN(num) ? Number(num).toFixed(digits) : "N/A");

const TrendsPage = () => {
  const [variables, setVariables] = useState([
    { id: "temperature", label: "Temperature", unit: "°C" },
    { id: "rainfall", label: "Rainfall / Precipitation", unit: "mm/day" },
    { id: "soil_moisture", label: "Soil Moisture", unit: "m³/m³" },
    { id: "vegetation", label: "Vegetation (NDVI)", unit: "NDVI" },
    { id: "wind_speed", label: "Wind Speed", unit: "m/s" },
    { id: "humidity", label: "Relative Humidity", unit: "%" },
  ]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedVariable, setSelectedVariable] = useState("temperature");
  const [selectedState, setSelectedState] = useState("IN-MH");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [prewhiten, setPrewhiten] = useState(true);
  const [alpha, setAlpha] = useState(0.05);

  const [activeTab, setActiveTab] = useState("trend_chart"); // 'trend_chart' or 'india_map'
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  
  const [trendData, setTrendData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const { updatePageContext } = usePageContext();

  // Sync Trend Detective state to global website context for AI Assistant
  useEffect(() => {
    const stateObj = states.find((s) => s.id === selectedState);
    const regionName = stateObj?.name || selectedState;
    const locationLabel = selectedDistrict ? `${selectedDistrict}, ${regionName}` : regionName;

    updatePageContext({
      selected_city: locationLabel,
      selected_variable: selectedVariable,
      current_trend_results: trendData?.trend || null,
      additional_data: {
        region_id: selectedState,
        region_name: regionName,
        district: selectedDistrict || null,
        prewhiten,
        alpha,
        active_tab: activeTab
      }
    });
  }, [selectedState, selectedDistrict, selectedVariable, trendData, states, activeTab, prewhiten, alpha, updatePageContext]);

  // Load initial metadata
  useEffect(() => {
    getVariables().then((res) => {
      if (res.ok && res.data?.variables) setVariables(res.data.variables);
    });
    getIndianStates().then((res) => {
      if (res.ok && res.data?.states) setStates(res.data.states);
    });
  }, []);

  // Update districts when state changes
  useEffect(() => {
    if (selectedState) {
      getIndianDistricts(selectedState).then((res) => {
        if (res.ok && res.data?.districts) {
          setDistricts(res.data.districts);
          setSelectedDistrict("");
        }
      });
    }
  }, [selectedState]);

  // Load trend analysis
  const runAnalysis = async () => {
    setLoading(true);
    const regionId = selectedDistrict ? `${selectedState}-${selectedDistrict.toLowerCase().replace(/ /g, '-')}` : selectedState;
    const res = await analyzeTrends({
      region_id: regionId,
      variable: selectedVariable,
      prewhiten,
      alpha,
    });
    if (res.ok && res.data?.trend) {
      setTrendData(res.data);
    }
    setLoading(false);
  };

  // Load pan-India map trends
  const loadMapTrends = async () => {
    setMapLoading(true);
    const res = await getTrendsMap(selectedVariable);
    if (res.ok && res.data) {
      setMapData(res.data);
    }
    setMapLoading(false);
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedVariable, selectedState, selectedDistrict, prewhiten, alpha]);

  useEffect(() => {
    if (activeTab === "india_map") {
      loadMapTrends();
    }
  }, [activeTab, selectedVariable]);

  const currentUnit = useMemo(() => {
    const v = variables.find((x) => x.id === selectedVariable);
    return v ? v.unit : "";
  }, [selectedVariable, variables]);

  // Chart Rendering Helpers
  const renderTrendSvg = () => {
    if (!trendData || !trendData.time_series || trendData.time_series.values.length === 0) {
      return <div className="chart-empty">No observations available</div>;
    }

    const { dates, values } = trendData.time_series;
    const cleanPoints = dates
      .map((d, i) => ({ date: d, val: values[i] }))
      .filter((p) => p.val !== null && !isNaN(p.val));

    if (cleanPoints.length < 2) {
      return <div className="chart-empty">Insufficient valid points for charting</div>;
    }

    const width = 850;
    const height = 300;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;

    const vals = cleanPoints.map((p) => p.val);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const valRange = maxVal - minVal || 1.0;

    const getX = (idx) => padLeft + (idx / (cleanPoints.length - 1)) * (width - padLeft - padRight);
    const getY = (val) => height - padBottom - ((val - minVal) / valRange) * (height - padTop - padBottom);

    const pathD = cleanPoints.reduce(
      (acc, pt, i) => (i === 0 ? `M ${getX(i)} ${getY(pt.val)}` : `${acc} L ${getX(i)} ${getY(pt.val)}`),
      ""
    );

    // Compute Sen's slope trend line
    const slope = trendData.trend.sens_slope || 0.0;
    const startVal = vals[0];
    const endTrendVal = startVal + slope * (cleanPoints.length / 12.0);
    const trendLineD = `M ${getX(0)} ${getY(startVal)} L ${getX(cleanPoints.length - 1)} ${getY(endTrendVal)}`;

    return (
      <div className="trend-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" width="100%" height={height}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + pct * (height - padTop - padBottom);
            const valLabel = (maxVal - pct * valRange).toFixed(1);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Observations Area & Path */}
          <path
            d={`${pathD} L ${getX(cleanPoints.length - 1)} ${height - padBottom} L ${getX(0)} ${height - padBottom} Z`}
            fill="url(#trendGradient)"
          />
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" />

          {/* Sen's Slope Trend Line */}
          <path d={trendLineD} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="6 4" />

          {/* Interactive data dots */}
          {cleanPoints.map((pt, i) => {
            if (i % Math.ceil(cleanPoints.length / 30) !== 0 && i !== cleanPoints.length - 1) return null;
            return (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(pt.val)}
                r="4"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2"
                className="chart-dot"
                onMouseEnter={() => setHoveredPoint({ x: getX(i), y: getY(pt.val), ...pt })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* X Axis year labels */}
          {cleanPoints.map((pt, i) => {
            if (i % Math.ceil(cleanPoints.length / 7) === 0 || i === cleanPoints.length - 1) {
              return (
                <text key={i} x={getX(i)} y={height - padBottom + 18} textAnchor="middle" fontSize="10" fill="#64748b">
                  {pt.date}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{ left: `${(hoveredPoint.x / width) * 100}%`, top: `${(hoveredPoint.y / height) * 100}%` }}
          >
            <div className="tooltip-date">{hoveredPoint.date}</div>
            <div className="tooltip-val">
              {hoveredPoint.val.toFixed(2)} {currentUnit}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fs-container">
      {/* Header matching AstroKites Theme */}
      <header className="fs-header">
        <div>
          <h1 className="page-title">
            Earth System <span className="highlight">Trend Detective</span>
          </h1>
          <p className="muted">
            Non-parametric Mann-Kendall and Sen's slope environmental trend detection across India
          </p>
        </div>
        <div className="header-badge">
          <span className="badge-tag">NASA Space Apps 2026</span>
          <span className="badge-sub">Be An Earth System Trend Detective!</span>
        </div>
      </header>

      {/* Control Panel */}
      <section className="fs-controls">
        <div className="controls-grid">
          {/* Variable Selector */}
          <div className="selector-group">
            <label className="selector-label">1. Environmental Variable</label>
            <select
              className="control-select"
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value)}
            >
              {variables.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Indian State Selector */}
          <div className="selector-group">
            <label className="selector-label">2. Indian State / UT</label>
            <select
              className="control-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.zone || "State"})
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="selector-group">
            <label className="selector-label">3. District (Optional)</label>
            <select
              className="control-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">State-Wide Aggregate</option>
              {districts.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Statistical Controls */}
          <div className="selector-group">
            <label className="selector-label">4. Statistical Engine</label>
            <div className="toggle-box">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={prewhiten}
                  onChange={(e) => setPrewhiten(e.target.checked)}
                />
                <span>Pre-whiten Autocorrelation (Yue-Pilon)</span>
              </label>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="tabs-bar">
          <button
            className={`tab-btn ${activeTab === "trend_chart" ? "active" : ""}`}
            onClick={() => setActiveTab("trend_chart")}
          >
            📈 Time-Series & Statistical Verdict
          </button>
          <button
            className={`tab-btn ${activeTab === "india_map" ? "active" : ""}`}
            onClick={() => setActiveTab("india_map")}
          >
            🗺 Pan-India Spatial Trend Map
          </button>
        </div>
      </section>

      {/* Main Analysis Display */}
      {activeTab === "trend_chart" && (
        <>
          {/* Key Trend Cards */}
          {trendData && trendData.trend && (
            <div className="insights-grid">
              {/* Verdict Card */}
              <div
                className={`insight-card ${
                  trendData.trend.trend_direction === "Increasing"
                    ? "card-increasing"
                    : trendData.trend.trend_direction === "Decreasing"
                    ? "card-decreasing"
                    : "card-stable"
                }`}
              >
                <div className="insight-title">Trend Direction Verdict</div>
                <div className="insight-value">{trendData.trend.trend_direction}</div>
                <div className="insight-detail">
                  {trendData.trend.is_significant
                    ? "Statistically Significant (p < 0.05)"
                    : "No Significant Trend Detected"}
                </div>
              </div>

              {/* Rate Card */}
              <div className="insight-card">
                <div className="insight-title">Sen's Slope Annual Rate</div>
                <div className="insight-value">
                  {trendData.trend.annual_rate > 0 ? "+" : ""}
                  {fmt(trendData.trend.annual_rate, 4)}
                </div>
                <div className="insight-detail">
                  {trendData.unit}/year ({trendData.variable})
                </div>
              </div>

              {/* Confidence Interval Card */}
              <div className="insight-card">
                <div className="insight-title">95% Confidence Interval</div>
                <div className="insight-value" style={{ fontSize: "16px", marginTop: "4px" }}>
                  [{fmt(trendData.trend.confidence_interval_95?.lower, 4)},{" "}
                  {fmt(trendData.trend.confidence_interval_95?.upper, 4)}]
                </div>
                <div className="insight-detail">Unbiased non-parametric median bounds</div>
              </div>

              {/* Test Statistics Card */}
              <div className="insight-card">
                <div className="insight-title">Mann-Kendall Test Details</div>
                <div className="insight-value" style={{ fontSize: "16px", marginTop: "4px" }}>
                  p = {trendData.trend.p_value != null ? (trendData.trend.p_value < 0.0001 ? "< 0.0001" : fmt(trendData.trend.p_value, 4)) : "N/A"}
                </div>
                <div className="insight-detail">
                  Z = {fmt(trendData.trend.mann_kendall?.z_stat, 2)} | S = {trendData.trend.mann_kendall?.s_stat ?? "N/A"} | n = {trendData.trend.n_observations ?? "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Time Series Chart Card */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">
                  NASA Historical Observations & Theil-Sen Trend Line: {trendData?.region?.name}
                </h3>
                <p className="chart-subtitle">
                  Blue line: Monthly observations | Red dashed line: Sen's slope monotonic trajectory
                </p>
              </div>
              <div className="dataset-source-badge">
                Source: {trendData?.source || "NASA Earth System"}
              </div>
            </div>
            {loading ? <div className="loading-spinner">Calculating statistical trends...</div> : renderTrendSvg()}
          </div>

          {/* NASA Dataset Provenance Banner */}
          {trendData && trendData.dataset_meta && (
            <div className="provenance-banner">
              <div className="prov-title">NASA Scientific Provenance & QA</div>
              <div className="prov-content">
                <div><strong>Mission:</strong> {trendData.dataset_meta.mission}</div>
                <div><strong>Dataset:</strong> {trendData.dataset_meta.name} ({trendData.dataset_meta.parameter})</div>
                <div><strong>Resolution:</strong> {trendData.dataset_meta.spatial_res} | {trendData.dataset_meta.temporal_res}</div>
                <div><strong>Attribution:</strong> {trendData.dataset_meta.attribution}</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pan-India Map View */}
      {activeTab === "india_map" && (
        <div className="map-view-wrapper">
          <div className="map-header">
            <h3>Geographical Trend Distribution across Indian States</h3>
            <p className="muted">
              Green = Statistically Increasing | Red = Statistically Decreasing | Grey = Stable (No Significant Trend)
            </p>
          </div>

          {mapLoading ? (
            <div className="loading-spinner">Evaluating trends across all 36 Indian states/UTs...</div>
          ) : (
            <div className="leaflet-container-wrapper">
              <MapContainer
                key={selectedVariable}
                center={[22.5, 82.5]}
                zoom={5}
                scrollWheelZoom={true}
                style={{ height: "550px", width: "100%", borderRadius: "12px" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapData &&
                  mapData.regions &&
                  mapData.regions.map((reg) => {
                    const isInc = reg.trend_direction === "Increasing";
                    const isDec = reg.trend_direction === "Decreasing";
                    const markerColor = isInc ? "#16a34a" : isDec ? "#dc2626" : "#64748b";

                    return (
                      <CircleMarker
                        key={reg.region_id}
                        center={[reg.lat, reg.lon]}
                        radius={reg.is_significant ? 9 : 6}
                        pathOptions={{
                          color: markerColor,
                          fillColor: markerColor,
                          fillOpacity: 0.75,
                          weight: 2,
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                          <strong>{reg.region_name}</strong>: {reg.trend_direction} ({reg.annual_rate > 0 ? "+" : ""}
                          {fmt(reg.annual_rate, 4)}/yr)
                        </Tooltip>
                        <Popup>
                          <div className="map-popup">
                            <h4>{reg.region_name}</h4>
                            <div className="popup-stat">
                              <strong>Variable:</strong> {selectedVariable}
                            </div>
                            <div className="popup-stat">
                              <strong>Trend:</strong> {reg.trend_direction}
                            </div>
                            <div className="popup-stat">
                              <strong>Annual Rate:</strong> {fmt(reg.annual_rate, 4)}/yr
                            </div>
                            <div className="popup-stat">
                              <strong>Significance:</strong> {reg.is_significant ? `p = ${fmt(reg.p_value, 4)}` : "Not Significant"}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
              </MapContainer>
            </div>
          )}

          {/* Spatial Hotspots Feed */}
          {mapData && (mapData.hotspots?.length > 0 || mapData.coldspots?.length > 0) && (
            <div className="hotspots-grid">
              <div className="hotspot-box hotspot-warming">
                <h4>🔥 Acceleration Hotspots (High Positive Rate)</h4>
                <ul>
                  {mapData.hotspots.slice(0, 4).map((h, i) => (
                    <li key={i}>
                      <strong>{h.region_name}:</strong> {h.annual_rate > 0 ? "+" : ""}
                      {fmt(h.annual_rate, 4)}/yr (Z-score: {fmt(h.z_score, 2)}σ, p={fmt(h.p_value, 4)})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hotspot-box hotspot-cooling">
                <h4>❄ Decline / Coldspots (High Negative Rate)</h4>
                <ul>
                  {mapData.coldspots.slice(0, 4).map((c, i) => (
                    <li key={i}>
                      <strong>{c.region_name}:</strong> {fmt(c.annual_rate, 4)}/yr (Z-score: {fmt(c.z_score, 2)}σ, p={fmt(c.p_value, 4)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendsPage;
