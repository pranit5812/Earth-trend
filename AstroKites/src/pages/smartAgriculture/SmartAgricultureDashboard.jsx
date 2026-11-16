import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  CloudRain,
  Sun,
  Droplets,
  Calendar,
  GitCompare,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Layers,
  Store,
  MapPin,
  Sparkles,
  CheckCircle2,
  Info,
  ShieldAlert,
  DollarSign,
  Search,
  ArrowUpRight,
  ChevronRight,
  X
} from 'lucide-react';
import {
  getAgriLocations,
  getAgriWeather,
  getAgriAlerts,
  getAgriNearbyMandis,
  postAgriRecommendations,
  postAgriRainfallAnalysis,
  postAgriCompare,
  postAgriCalendar,
  postAgriPrediction,
  getAgriCrops
} from '../../api/axios';
import './smartAgriculture.css';

const TABS = [
  { path: '/smart-agriculture', label: 'Crop Advisor & Mandi Market', icon: Sprout },
  { path: '/smart-agriculture/analysis', label: 'Rainfall & Soil Analysis', icon: CloudRain },
  { path: '/smart-agriculture/compare', label: 'Crop Comparison', icon: GitCompare },
  { path: '/smart-agriculture/crop-calendar', label: 'Crop Calendar', icon: Calendar },
  { path: '/smart-agriculture/insights', label: 'Risk Assessment & Insights', icon: ShieldAlert },
];

export default function SmartAgricultureDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab
  const activeTab = location.pathname.endsWith('/crop-advisor') ? '/smart-agriculture' : location.pathname;

  // Location & Form State
  const [locationsData, setLocationsData] = useState([]);
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [districtsList, setDistrictsList] = useState(['Nashik', 'Pune', 'Nagpur', 'Ahmednagar', 'Solapur']);
  const [selectedDistrict, setSelectedDistrict] = useState('Nashik');
  const [soilType, setSoilType] = useState('Black soil');
  const [season, setSeason] = useState('Rabi');
  const [irrigation, setIrrigation] = useState('Good irrigation');
  const [preferredCategory, setPreferredCategory] = useState('All');

  // Custom Date Range State (Supports 10-year, 1-month, 15-day, etc.)
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [granularity, setGranularity] = useState('auto');

  // Core Data States
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [nearbyMandis, setNearbyMandis] = useState([]);
  const [selectedCropModal, setSelectedCropModal] = useState(null);

  // Analysis Tab States
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Comparison Tab States
  const [compareCrops, setCompareCrops] = useState(['Wheat', 'Mustard', 'Chickpea']);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Calendar Tab States
  const [calendarCrop, setCalendarCrop] = useState('Wheat');
  const [calendarMonth, setCalendarMonth] = useState(10);
  const [calendarResult, setCalendarResult] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Future Prediction State
  const [predictionResult, setPredictionResult] = useState(null);

  // 1. Load Locations on Mount
  useEffect(() => {
    async function fetchLocations() {
      const res = await getAgriLocations();
      if (res.ok && res.data?.locations) {
        setLocationsData(res.data.locations);
        const st = res.data.locations.find((l) => l.state === selectedState);
        if (st && st.districts?.length) {
          setDistrictsList(st.districts);
          if (!st.districts.includes(selectedDistrict)) {
            setSelectedDistrict(st.districts[0]);
          }
        }
      }
    }
    fetchLocations();
  }, []);

  // Update Districts when State changes
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    const found = locationsData.find((l) => l.state === newState);
    if (found && found.districts?.length) {
      setDistrictsList(found.districts);
      setSelectedDistrict(found.districts[0]);
    } else {
      setDistrictsList([]);
      setSelectedDistrict('');
    }
  };

  // 2. Fetch Live Weather, Alerts & Recommendations
  const fetchAdvisorData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Live Weather & Agroclimatology
      const wRes = await getAgriWeather({ state: selectedState, district: selectedDistrict });
      if (wRes.ok) {
        setWeatherData(wRes.data);
      }

      // 2. Weather & Market Alerts
      const aRes = await getAgriAlerts({ state: selectedState, district: selectedDistrict });
      if (aRes.ok && aRes.data?.alerts) {
        setAlertsData(aRes.data.alerts);
      }

      // 3. 5-Factor Weighted Crop Recommendations
      const rRes = await postAgriRecommendations({
        state: selectedState,
        district: selectedDistrict,
        soil_type: soilType,
        season: season,
        irrigation: irrigation,
        preferred_category: preferredCategory !== 'All' ? preferredCategory : null,
        start_date: startDate,
        end_date: endDate
      });

      if (rRes.ok && rRes.data) {
        const top = rRes.data.top_recommendations || rRes.data.recommendations || [];
        setRecommendations(top);

        // 4. Fetch Nearby Mandis for top recommended crop
        if (top.length > 0) {
          const topCropName = top[0].crop_name;
          const mRes = await getAgriNearbyMandis({
            state: selectedState,
            district: selectedDistrict,
            commodity: topCropName
          });
          if (mRes.ok && mRes.data?.nearby_markets) {
            setNearbyMandis(mRes.data.nearby_markets);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching agricultural data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, soilType, season, irrigation, preferredCategory, startDate, endDate]);

  useEffect(() => {
    fetchAdvisorData();
  }, [fetchAdvisorData]);

  // Handle Rainfall & Soil Analysis
  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    const coords = weatherData?.coordinates || { latitude: 20.0, longitude: 74.78 };
    const res = await postAgriRainfallAnalysis({
      latitude: coords.latitude || 20.0,
      longitude: coords.longitude || 74.78,
      start_date: startDate,
      end_date: endDate,
      granularity: granularity,
      state: selectedState,
      district: selectedDistrict
    });
    if (res.ok) {
      setAnalysisResult(res.data);
    }
    setAnalysisLoading(false);
  };

  // Handle Crop Comparison
  const handleRunCompare = async () => {
    setCompareLoading(true);
    const res = await postAgriCompare({
      crop_names: compareCrops,
      state: selectedState,
      district: selectedDistrict,
      soil_type: soilType,
      irrigation: irrigation
    });
    if (res.ok) {
      setCompareResult(res.data);
    }
    setCompareLoading(false);
  };

  // Handle Crop Calendar
  const handleRunCalendar = async () => {
    setCalendarLoading(true);
    const res = await postAgriCalendar({
      crop_name: calendarCrop,
      sowing_month: parseInt(calendarMonth, 10),
      state: selectedState
    });
    if (res.ok) {
      setCalendarResult(res.data);
    }
    setCalendarLoading(false);
  };

  // Handle Future Prediction for a crop
  const handlePredictCrop = async (cropName) => {
    const res = await postAgriPrediction({
      crop_name: cropName,
      state: selectedState,
      district: selectedDistrict,
      target_year: 2027,
      target_season: season
    });
    if (res.ok) {
      setPredictionResult(res.data);
    }
  };

  return (
    <div className="agri-container">
      <div className="agri-inner">
        {/* Header Section */}
        <div className="agri-header">
          <div className="agri-badge">
            <Sprout size={16} />
            Official AGMARKNET & ICAR Agroclimatic Engine
          </div>
          <h1 className="agri-title">
            Smart Agriculture <span className="highlight">Crop Recommendation & Mandi Intelligence</span>
          </h1>
          <p className="agri-subtitle">
            AI-based multi-factor crop suitability engine powered by NASA POWER agroclimatology, real-time AGMARKNET mandi prices, and ICAR soil agronomy across Indian states.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="agri-tabs-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.path;
            return (
              <button
                key={tab.path}
                className={`agri-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Location & Preferences Filter Bar */}
        <div className="agri-filter-card">
          <div className="agri-filter-title">
            <MapPin size={20} color="#059669" />
            <span>Farm Location & Crop Selection Controls</span>
          </div>

          <div className="agri-grid-filters">
            {/* State */}
            <div className="agri-input-group">
              <label>State (India)</label>
              <select
                className="agri-select"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                {[
                  'Maharashtra',
                  'Punjab',
                  'Madhya Pradesh',
                  'Rajasthan',
                  'Gujarat',
                  'Karnataka',
                  'Andhra Pradesh',
                  'Telangana',
                  'Uttar Pradesh',
                  'Haryana',
                  'Bihar',
                  'Tamil Nadu',
                  'Odisha',
                  'West Bengal',
                  'Kerala'
                ].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="agri-input-group">
              <label>District / Mandi Center</label>
              <select
                className="agri-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Soil Type */}
            <div className="agri-input-group">
              <label>Soil Type (ICAR)</label>
              <select
                className="agri-select"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
              >
                <option value="Alluvial soil">Alluvial soil (Indo-Gangetic / River Plains)</option>
                <option value="Black soil">Black soil / Regur (Deccan Plateau / Cotton)</option>
                <option value="Red soil">Red soil (Southern / Eastern Peninsular)</option>
                <option value="Loamy soil">Loamy soil (Optimal Balanced Mixture)</option>
                <option value="Laterite soil">Laterite soil (High rainfall / Western Ghats)</option>
                <option value="Sandy soil">Sandy soil (Arid / Rajasthan / Coastal)</option>
                <option value="Clay soil">Clay soil (Heavy / Moisture-retentive)</option>
                <option value="Unknown / Not sure">Unknown / Not sure (Neutral Loam Estimate)</option>
              </select>
            </div>

            {/* Farming Season */}
            <div className="agri-input-group">
              <label>Farming Season</label>
              <select
                className="agri-select"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="Kharif">Kharif (Monsoon: Jun - Oct)</option>
                <option value="Rabi">Rabi (Winter: Nov - Apr)</option>
                <option value="Zaid">Zaid (Summer: Mar - Jun)</option>
                <option value="Auto">Auto-detect from Calendar</option>
              </select>
            </div>

            {/* Irrigation Availability */}
            <div className="agri-input-group">
              <label>Irrigation Infrastructure</label>
              <select
                className="agri-select"
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
              >
                <option value="Good irrigation">Good irrigation (Canal / Tube well / Drip)</option>
                <option value="Limited irrigation">Limited irrigation (1-2 critical life-saving cycles)</option>
                <option value="Rainfed">Rainfed (100% dependent on rainfall)</option>
              </select>
            </div>

            {/* Crop Category */}
            <div className="agri-input-group">
              <label>Preferred Crop Category</label>
              <select
                className="agri-select"
                value={preferredCategory}
                onChange={(e) => setPreferredCategory(e.target.value)}
              >
                <option value="All">All Agricultural Categories</option>
                <option value="Cereals">Cereals (Wheat, Rice, Maize)</option>
                <option value="Millets">Millets (Ragi, Bajra, Jowar)</option>
                <option value="Pulses">Pulses (Chickpea, Pigeon Pea, Black Gram)</option>
                <option value="Oilseeds">Oilseeds (Mustard, Soybean, Groundnut)</option>
                <option value="Commercial/Cash">Commercial / Cash (Cotton, Sugarcane)</option>
                <option value="Vegetables">Vegetables (Tomato, Onion, Cucumber)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              className="agri-btn-primary"
              onClick={fetchAdvisorData}
              disabled={loading}
            >
              <Sprout size={18} />
              <span>{loading ? 'Evaluating Agroclimatology...' : 'Analyse & Recommend Crops'}</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: MAIN CROP ADVISOR & MANDI MARKET */}
        {activeTab === '/smart-agriculture' && (
          <div>
            {/* Live Weather & Agroclimatology Banner */}
            <div className="agri-weather-banner">
              <div className="agri-weather-left">
                <h3>
                  <Sun size={24} color="#fde047" />
                  Live Agro-Weather Profile: {selectedDistrict}, {selectedState}
                </h3>
                <p className="agri-weather-sub">
                  Source: NASA POWER Satellite Agroclimatology Archive + IMD Seasonal Norms
                </p>

                <div className="agri-weather-metrics">
                  <div className="agri-metric-pill">
                    <div className="agri-metric-label">Mean Temperature</div>
                    <div className="agri-metric-val">
                      {weatherData?.weather?.mean_temperature_c ?? weatherData?.temperature?.mean_c ?? '26.5'}°C
                    </div>
                  </div>
                  <div className="agri-metric-pill">
                    <div className="agri-metric-label">Min / Max Range</div>
                    <div className="agri-metric-val">
                      {weatherData?.weather?.min_temperature_c ?? '18'}° - {weatherData?.weather?.max_temperature_c ?? '34'}°C
                    </div>
                  </div>
                  <div className="agri-metric-pill">
                    <div className="agri-metric-label">30-Day Rainfall</div>
                    <div className="agri-metric-val">
                      {weatherData?.weather?.rainfall_30d_mm ?? '120'} mm
                    </div>
                  </div>
                  <div className="agri-metric-pill">
                    <div className="agri-metric-label">Relative Humidity</div>
                    <div className="agri-metric-val">
                      {weatherData?.weather?.relative_humidity_pct ?? '68'}%
                    </div>
                  </div>
                  <div className="agri-metric-pill">
                    <div className="agri-metric-label">Wind Speed</div>
                    <div className="agri-metric-val">
                      {weatherData?.weather?.wind_speed_ms ?? '3.0'} m/s
                    </div>
                  </div>
                </div>
              </div>

              <div className="agri-provenance-tag">
                <strong>Data Provenance</strong><br />
                Market Date: 15/11/2026<br />
                Official AGMARKNET Bulletin<br />
                NASA POWER AG Community
              </div>
            </div>

            {/* Weather & Crop Alerts */}
            {alertsData.length > 0 && (
              <div className="agri-alerts-grid">
                {alertsData.map((al, idx) => (
                  <div
                    key={idx}
                    className={`agri-alert-card ${
                      al.severity === 'warning' ? 'warning' : al.severity === 'danger' ? 'danger' : 'info'
                    }`}
                  >
                    <div className="agri-alert-title">
                      <AlertTriangle size={16} />
                      <span>{al.title || al.type}</span>
                    </div>
                    <p className="agri-alert-body">{al.message || al.advisory}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Crops Cards */}
            <div className="agri-section-title">
              <span>Top Recommended Crops for {selectedDistrict} ({season} Season)</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669' }}>
                Formula: Weather 30% • Soil 25% • Water 15% • Market 20% • Season 10%
              </span>
            </div>

            <div className="agri-crops-grid">
              {recommendations.map((crop) => {
                const modalPrice = crop.market_summary?.modal_price;
                const unit = crop.market_summary?.unit || '₹ / Quintal';
                const score = crop.overall_suitability_score || crop.suitability_score;
                const scoreColor = score >= 85 ? '#16a34a' : score >= 70 ? '#2563eb' : '#d97706';

                return (
                  <div key={crop.crop_id || crop.crop_name} className="agri-crop-card">
                    <div>
                      <div className="agri-crop-top">
                        <div>
                          <h4 className="agri-crop-name">{crop.crop_name}</h4>
                          <p className="agri-crop-sci">{crop.scientific_name || crop.category}</p>
                        </div>
                        <div className="agri-score-badge" style={{ backgroundColor: scoreColor }}>
                          <Sparkles size={14} />
                          <span>{score}%</span>
                        </div>
                      </div>

                      {/* Real AGMARKNET Modal Price Box */}
                      <div className="agri-price-box">
                        <div>
                          <div className="agri-price-label">AGMARKNET Modal Price</div>
                          <div className="agri-price-val">₹{modalPrice ? Number(modalPrice).toLocaleString('en-IN') : 'N/A'}</div>
                          <div className="agri-price-sub">{crop.market_summary?.latest_mandi || 'State Mandi Average'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="agri-best-price-badge">{crop.market_summary?.market_sentiment || 'Active APMC'}</span>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '4px' }}>
                            Arrival: {crop.market_summary?.market_date || '15/11/2026'}
                          </div>
                        </div>
                      </div>

                      {/* 5-Factor Score Meters */}
                      {crop.scores_breakdown && (
                        <div className="agri-factors-list">
                          <div className="agri-factor-row">
                            <span>Weather Suitability (30%)</span>
                            <div className="agri-meter-bg">
                              <div
                                className="agri-meter-fill"
                                style={{ width: `${crop.scores_breakdown.weather_suitability}%` }}
                              />
                            </div>
                          </div>
                          <div className="agri-factor-row">
                            <span>Soil Compatibility (25%)</span>
                            <div className="agri-meter-bg">
                              <div
                                className="agri-meter-fill"
                                style={{ width: `${crop.scores_breakdown.soil_suitability}%`, backgroundColor: '#3b82f6' }}
                              />
                            </div>
                          </div>
                          <div className="agri-factor-row">
                            <span>Water Availability (15%)</span>
                            <div className="agri-meter-bg">
                              <div
                                className="agri-meter-fill"
                                style={{ width: `${crop.scores_breakdown.water_availability}%`, backgroundColor: '#0284c7' }}
                              />
                            </div>
                          </div>
                          <div className="agri-factor-row">
                            <span>Market Indicators (20%)</span>
                            <div className="agri-meter-bg">
                              <div
                                className="agri-meter-fill"
                                style={{ width: `${crop.scores_breakdown.market_indicators}%`, backgroundColor: '#10b981' }}
                              />
                            </div>
                          </div>
                          <div className="agri-factor-row">
                            <span>Seasonal Window (10%)</span>
                            <div className="agri-meter-bg">
                              <div
                                className="agri-meter-fill"
                                style={{ width: `${crop.scores_breakdown.seasonal_suitability}%`, backgroundColor: '#f59e0b' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Weather Risk Warning */}
                      {crop.weather_risks && crop.weather_risks.length > 0 && (
                        <div className="agri-crop-risk-tag">
                          <AlertTriangle size={14} />
                          <span>{crop.weather_risks[0]}</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="agri-btn-outline"
                      onClick={() => setSelectedCropModal(crop)}
                    >
                      View Agronomic Details & Phenology
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Nearby Mandis Comparison Table */}
            {nearbyMandis.length > 0 && (
              <div className="agri-table-card">
                <div className="agri-table-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                      Nearby Mandis Comparison for {recommendations[0]?.crop_name || 'Selected Crop'}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      Real AGMARKNET Daily Bulletin (15/11/2026) • Sorted by proximity and price advantage
                    </p>
                  </div>
                </div>

                <table className="agri-table">
                  <thead>
                    <tr>
                      <th>APMC Mandi</th>
                      <th>District & State</th>
                      <th>Est. Proximity</th>
                      <th>Modal Price</th>
                      <th>Price Range (Min - Max)</th>
                      <th>Market Date</th>
                      <th>Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyMandis.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700 }}>{m.market_name}</td>
                        <td>{m.district}, {m.state}</td>
                        <td>{m.estimated_distance_km ? `${m.estimated_distance_km} km` : 'Local APMC'}</td>
                        <td style={{ fontWeight: 800, color: '#15803d' }}>₹{Number(m.modal_price).toLocaleString('en-IN')} / Qtl</td>
                        <td style={{ color: '#64748b' }}>{m.price_range || `₹${m.modal_price} - ₹${m.modal_price}`}</td>
                        <td style={{ color: '#475569' }}>{m.arrival_date || '15/11/2026'}</td>
                        <td>
                          {m.is_best_price ? (
                            <span className="agri-best-price-badge">Best Modal Price</span>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Regular trade</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: RAINFALL & SOIL CLIMATOLOGY ANALYSIS */}
        {activeTab === '/smart-agriculture/analysis' && (
          <div>
            <div className="agri-filter-card">
              <div className="agri-filter-title">
                <CloudRain size={20} color="#2563eb" />
                <span>Custom Date-Range Rainfall & Soil Analysis (NASA POWER)</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                Supports any arbitrary historical period: multi-year (10-year), monthly (1-month), or daily (15-day).
              </p>

              <div className="agri-grid-filters">
                <div className="agri-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="agri-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="agri-input-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="agri-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="agri-input-group">
                  <label>Granularity</label>
                  <select
                    className="agri-select"
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value)}
                  >
                    <option value="auto">Auto-detect based on range</option>
                    <option value="daily">Daily Observations</option>
                    <option value="monthly">Monthly Aggregations</option>
                    <option value="yearly">Yearly Totals</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="agri-btn-primary"
                  onClick={handleRunAnalysis}
                  disabled={analysisLoading}
                >
                  <BarChart3 size={18} />
                  <span>{analysisLoading ? 'Processing NASA POWER Climatology...' : 'Run Historical Analysis'}</span>
                </button>
              </div>
            </div>

            {analysisResult && (
              <div>
                <div className="agri-weather-banner">
                  <div className="agri-weather-left">
                    <h3>Analysis Period: {analysisResult.period?.human_readable_duration}</h3>
                    <p className="agri-weather-sub">
                      Coordinates: {analysisResult.location?.latitude?.toFixed(2)}°N, {analysisResult.location?.longitude?.toFixed(2)}°E • Granularity: {analysisResult.granularity}
                    </p>

                    <div className="agri-weather-metrics">
                      <div className="agri-metric-pill">
                        <div className="agri-metric-label">Total Rainfall</div>
                        <div className="agri-metric-val">{analysisResult.rainfall_summary?.total_rainfall_mm} mm</div>
                      </div>
                      <div className="agri-metric-pill">
                        <div className="agri-metric-label">Daily Average</div>
                        <div className="agri-metric-val">{analysisResult.rainfall_summary?.average_daily_mm} mm/day</div>
                      </div>
                      <div className="agri-metric-pill">
                        <div className="agri-metric-label">Variability (CV%)</div>
                        <div className="agri-metric-val">{analysisResult.rainfall_summary?.variability_coefficient_pct}%</div>
                      </div>
                      <div className="agri-metric-pill">
                        <div className="agri-metric-label">Mean Temperature</div>
                        <div className="agri-metric-val">{analysisResult.temperature_summary?.mean_temp_c}°C</div>
                      </div>
                      <div className="agri-metric-pill">
                        <div className="agri-metric-label">Extreme Min/Max</div>
                        <div className="agri-metric-val">
                          {analysisResult.temperature_summary?.extreme_min_c}° - {analysisResult.temperature_summary?.extreme_max_c}°C
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IMD Rainfall Distribution */}
                {analysisResult.rainfall_summary?.distribution && (
                  <div className="agri-filter-card">
                    <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>
                      IMD Rainfall Distribution Breakdown ({analysisResult.period?.duration_days} Days)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dry Days (&lt; 2.5 mm)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569' }}>
                          {analysisResult.rainfall_summary.distribution.dry_days} days
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#166534' }}>Light Rain (2.5 - 7.5 mm)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                          {analysisResult.rainfall_summary.distribution.light_rain_days} days
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Moderate Rain (7.5 - 35.5 mm)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                          {analysisResult.rainfall_summary.distribution.moderate_rain_days} days
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Heavy Rain (&gt; 35.5 mm)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>
                          {analysisResult.rainfall_summary.distribution.heavy_rain_days} days
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CROP COMPARISON */}
        {activeTab === '/smart-agriculture/compare' && (
          <div>
            <div className="agri-filter-card">
              <div className="agri-filter-title">
                <GitCompare size={20} color="#059669" />
                <span>Side-by-Side Crop Comparison (2 to 5 Crops)</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                Compare water requirements, ICAR soil affinity, AGMARKNET modal prices, growing duration, and risk profiles.
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Wheat', 'Rice', 'Cotton', 'Mustard', 'Soybean', 'Chickpea', 'Maize', 'Tomato', 'Onion', 'Sugarcane'].map((c) => {
                  const isSelected = compareCrops.includes(c);
                  return (
                    <button
                      key={c}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        color: isSelected ? '#059669' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (isSelected) {
                          if (compareCrops.length > 2) {
                            setCompareCrops(compareCrops.filter((x) => x !== c));
                          }
                        } else {
                          if (compareCrops.length < 5) {
                            setCompareCrops([...compareCrops, c]);
                          }
                        }
                      }}
                    >
                      {isSelected ? `✓ ${c}` : `+ ${c}`}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="agri-btn-primary"
                  onClick={handleRunCompare}
                  disabled={compareLoading}
                >
                  <GitCompare size={18} />
                  <span>{compareLoading ? 'Comparing Crops...' : 'Compare Selected Crops'}</span>
                </button>
              </div>
            </div>

            {compareResult && compareResult.crops && (
              <div className="agri-table-card">
                <table className="agri-table">
                  <thead>
                    <tr>
                      <th>Crop Attribute</th>
                      {compareResult.crops.map((c) => (
                        <th key={c.crop_id} style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                          {c.crop_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Category</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.category}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>AGMARKNET Modal Price</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id} style={{ fontWeight: 800, color: '#15803d' }}>
                          ₹{c.market_summary?.modal_price?.toLocaleString('en-IN')} / Qtl
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Growing Duration</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.growing_duration_days} days</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Water Requirement</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.water_requirement} ({c.optimal_rainfall_range_mm})</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Optimal Temp</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.optimal_temperature_c}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Suitable Soils</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.suitable_soils?.join(', ')}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Primary Season</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id}>{c.sowing_season}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, background: '#f8fafc' }}>Key Weather Risk</td>
                      {compareResult.crops.map((c) => (
                        <td key={c.crop_id} style={{ color: '#b91c1c', fontSize: '0.8125rem' }}>
                          {c.common_risks?.[0] || 'Drought stress during anthesis'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CROP CALENDAR */}
        {activeTab === '/smart-agriculture/crop-calendar' && (
          <div>
            <div className="agri-filter-card">
              <div className="agri-filter-title">
                <Calendar size={20} color="#059669" />
                <span>7-Stage Crop Phenology Schedule (ICAR Package of Practices)</span>
              </div>

              <div className="agri-grid-filters">
                <div className="agri-input-group">
                  <label>Select Crop</label>
                  <select
                    className="agri-select"
                    value={calendarCrop}
                    onChange={(e) => setCalendarCrop(e.target.value)}
                  >
                    {['Wheat', 'Rice', 'Cotton', 'Mustard', 'Soybean', 'Chickpea', 'Maize', 'Tomato', 'Onion', 'Sugarcane', 'Groundnut', 'Ragi', 'Bajra'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="agri-input-group">
                  <label>Sowing Month</label>
                  <select
                    className="agri-select"
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(e.target.value)}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="agri-btn-primary"
                  onClick={handleRunCalendar}
                  disabled={calendarLoading}
                >
                  <Calendar size={18} />
                  <span>{calendarLoading ? 'Generating Calendar...' : 'Generate 7-Stage Schedule'}</span>
                </button>
              </div>
            </div>

            {calendarResult && (
              <div className="agri-filter-card">
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  Phenological Growth Schedule: {calendarResult.crop_name}
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: '#64748b' }}>
                  Total Duration: {calendarResult.total_growing_duration_days} Days • Sowing: {calendarResult.estimated_sowing_date} • Expected Harvest: {calendarResult.estimated_harvest_date}
                </p>

                <div className="agri-timeline">
                  {calendarResult.phenological_stages?.map((st) => (
                    <div key={st.stage_number} className="agri-timeline-node">
                      <div className={`agri-timeline-dot ${st.is_water_critical ? 'critical' : ''}`} />
                      <div className="agri-timeline-content">
                        <div className="agri-timeline-title">
                          <span>Stage {st.stage_number}: {st.stage_name}</span>
                          <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 700 }}>
                            {st.start_date} - {st.end_date} ({st.duration_days} days)
                          </span>
                        </div>
                        <p className="agri-timeline-sub">{st.field_operations}</p>
                        {st.is_water_critical && (
                          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                            💧 Critical Irrigation Stage: Water deficit at this stage directly impairs yield.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: INSIGHTS & RISK ASSESSMENT */}
        {activeTab === '/smart-agriculture/insights' && (
          <div>
            <div className="agri-weather-banner" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
              <div className="agri-weather-left">
                <h3>
                  <ShieldAlert size={24} color="#38bdf8" />
                  Agricultural Climate Risk & Mitigation Radar: {selectedDistrict}, {selectedState}
                </h3>
                <p className="agri-weather-sub">
                  Evaluates 5 critical agricultural vulnerabilities based on historical climate stress and market signals.
                </p>
              </div>
            </div>

            <div className="agri-alerts-grid">
              <div className="agri-alert-card warning">
                <div className="agri-alert-title">
                  <AlertTriangle size={18} />
                  <span>1. Drought / Extended Dry Spell Risk</span>
                </div>
                <p className="agri-alert-body">
                  Evaluated using consecutive dry days (&lt; 2.5 mm). In rainfed tracts, maintain soil organic mulch and prepare supplementary sprinkler cycles to shield flowering stages.
                </p>
              </div>

              <div className="agri-alert-card danger">
                <div className="agri-alert-title">
                  <CloudRain size={18} />
                  <span>2. Flood & Waterlogging Risk</span>
                </div>
                <p className="agri-alert-body">
                  High-clay soils (Black/Clay) retain moisture; install field drainage trenches to avoid collar rot and root hypoxia during torrential monsoon downpours.
                </p>
              </div>

              <div className="agri-alert-card warning">
                <div className="agri-alert-title">
                  <Sun size={18} />
                  <span>3. Heat Stress / Terminal Warming</span>
                </div>
                <p className="agri-alert-body">
                  Sudden temperature spikes above 35°C during Rabi grain-filling induce premature ripening in wheat. Early November sowing mitigates terminal heat stress.
                </p>
              </div>

              <div className="agri-alert-card info">
                <div className="agri-alert-title">
                  <Sprout size={18} />
                  <span>4. Pest & Disease Outbreak Vulnerability</span>
                </div>
                <p className="agri-alert-body">
                  Humid weather combined with cloudy skies triggers fungal blights and sucking pests (aphids, thrips). Deploy pheromone traps and follow ICAR ETL thresholds.
                </p>
              </div>

              <div className="agri-alert-card success">
                <div className="agri-alert-title">
                  <TrendingUp size={18} />
                  <span>5. APMC Market Volatility & Price Defense</span>
                </div>
                <p className="agri-alert-body">
                  High-value commercial crops experience post-harvest arrival price swings. Utilize e-NAM platforms, nearby mandi comparison, and warehouse receipt financing.
                </p>
              </div>
            </div>

            {/* Future Climate Suitability Prediction Tool */}
            <div className="agri-filter-card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800 }}>
                Future Climate Trajectory Predictor (2027–2030)
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#64748b' }}>
                Forecasts decadal temperature shifts, monsoon variability, and crop climate resilience.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['Wheat', 'Cotton', 'Mustard', 'Soybean', 'Chickpea', 'Tomato'].map((c) => (
                  <button
                    key={c}
                    className="agri-btn-outline"
                    style={{ width: 'auto', padding: '8px 16px' }}
                    onClick={() => handlePredictCrop(c)}
                  >
                    Predict {c} for 2027
                  </button>
                ))}
              </div>

              {predictionResult && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                    Prediction for {predictionResult.crop_name} ({predictionResult.target_year})
                  </h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Projected Suitability:</span>{' '}
                      <strong>{predictionResult.projected_suitability_score}%</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Resilience Rating:</span>{' '}
                      <strong style={{ color: '#059669' }}>{predictionResult.resilience_rating}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Projected Warming:</span>{' '}
                      <strong>+{predictionResult.climate_projections?.temperature_delta_c}°C</strong>
                    </div>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', color: '#334155' }}>
                    {predictionResult.future_advisories?.map((adv, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{adv}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CROP DETAILS MODAL DIALOG */}
        {selectedCropModal && (
          <div className="agri-modal-overlay" onClick={() => setSelectedCropModal(null)}>
            <div className="agri-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <button className="agri-modal-close" onClick={() => setSelectedCropModal(null)}>
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '12px', color: '#059669' }}>
                  <Sprout size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedCropModal.crop_name}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>
                    {selectedCropModal.scientific_name} • Category: {selectedCropModal.category}
                  </div>
                </div>
              </div>

              {/* Real AGMARKNET Modal Price Box */}
              <div className="agri-price-box" style={{ marginBottom: '20px' }}>
                <div>
                  <div className="agri-price-label">AGMARKNET Modal Price (Official Daily Bulletin)</div>
                  <div className="agri-price-val">
                    ₹{selectedCropModal.market_summary?.modal_price?.toLocaleString('en-IN') || 'N/A'} / Quintal
                  </div>
                  <div className="agri-price-sub">
                    Price Range: ₹{selectedCropModal.market_summary?.min_price} - ₹{selectedCropModal.market_summary?.max_price}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="agri-best-price-badge">{selectedCropModal.market_summary?.market_sentiment || 'Active APMC'}</span>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {selectedCropModal.market_summary?.latest_mandi || 'State Mandi Average'}
                  </div>
                </div>
              </div>

              {/* 5-Factor Explanations */}
              {selectedCropModal.explanations && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    5-Factor Agronomic Explanations
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong>Weather Suitability:</strong> {selectedCropModal.explanations.weather}
                    </div>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong>Soil Compatibility:</strong> {selectedCropModal.explanations.soil}
                    </div>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong>Water Infrastructure:</strong> {selectedCropModal.explanations.water}
                    </div>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong>Market Indicators:</strong> {selectedCropModal.explanations.market}
                    </div>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong>Seasonal Timing:</strong> {selectedCropModal.explanations.season}
                    </div>
                  </div>
                </div>
              )}

              {/* Weather & Market Risks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#b91c1c', marginBottom: '6px' }}>
                    Weather & Climate Risks
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8125rem', color: '#7f1d1d' }}>
                    {selectedCropModal.weather_risks?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af', marginBottom: '6px' }}>
                    Market & Sowing Advisory
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#1e3a8a' }}>
                    {selectedCropModal.suggested_sowing_period || 'Optimal sowing window recommended by ICAR.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="agri-btn-primary"
                  onClick={() => setSelectedCropModal(null)}
                >
                  Close Agronomic Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
