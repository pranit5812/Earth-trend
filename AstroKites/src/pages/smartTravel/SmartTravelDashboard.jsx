import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Trophy, 
  Calendar, 
  GitCompare, 
  BarChart3, 
  Lightbulb, 
  AlertTriangle, 
  MapPin,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import { usePageContext } from '../../context/PageContext';
import { 
  getBestTimeToTravel, 
  getTravelClimateAnalysis, 
  getTravelRiskAnalysis,
  getTravelInsights,
  getTravelDestinations
} from '../../api/axios';

import IndiaDestinationSelector from '../../component/travel/IndiaDestinationSelector';
import TravelTypeSelector, { resolveDestinationBestActivities } from '../../component/travel/TravelTypeSelector';
import TravelPreferencesBar from '../../component/travel/TravelPreferencesBar';
import TravelComfortScoreCard from '../../component/travel/TravelComfortScoreCard';
import BestTimeRecommendation from '../../component/travel/BestTimeRecommendation';
import BestDateFinder from '../../component/travel/BestDateFinder';
import DestinationComparison from '../../component/travel/DestinationComparison';
import TravelComfortCalendar from '../../component/travel/TravelComfortCalendar';
import LocationTransportGuide from '../../component/travel/LocationTransportGuide';
import TravelRiskCards from '../../component/travel/TravelRiskCards';
import IndiaTravelMap from '../../component/travel/IndiaTravelMap';
import TravelInsights from '../../component/travel/TravelInsights';
import TravelErrorBoundary from '../../component/travel/TravelErrorBoundary';
import '../../component/travel/smartTravel.css';

const TABS = [
  { path: '/smart-travel', label: 'Overview', icon: Compass },
  { path: '/smart-travel/best-time', label: 'Best Time', icon: Trophy },
  { path: '/smart-travel/best-dates', label: 'Best Dates', icon: Calendar },
  { path: '/smart-travel/destination-comparison', label: 'Compare Destinations', icon: GitCompare },
  { path: '/smart-travel/travel-calendar', label: 'Comfort Calendar', icon: Calendar },
  { path: '/smart-travel/climate-analysis', label: 'Climate Analysis', icon: BarChart3 },
  { path: '/smart-travel/insights', label: 'Insights & Risks', icon: Lightbulb },
];

export default function SmartTravelDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { updatePageContext } = usePageContext();

  // Origin departure point (from where user travels)
  const [selectedOrigin, setSelectedOrigin] = useState({
    name: 'New Delhi (NCR)',
    lat: 28.6139,
    lon: 77.2090
  });

  // No active destination forced initially: let the user choose!
  const [selectedDestination, setSelectedDestination] = useState(null);

  // All verified destinations for the map
  const [allDestinations, setAllDestinations] = useState([]);

  // Active Preferences
  const [travelType, setTravelType] = useState('general');
  const [durationDays, setDurationDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2024);

  // Analysis State
  const [loading, setLoading] = useState(false);
  const [bestTimeData, setBestTimeData] = useState(null);
  const [climateData, setClimateData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Fetch all destinations once for the interactive map
  useEffect(() => {
    getTravelDestinations()
      .then((res) => {
        if (res && res.data && res.data.destinations) {
          const norm = res.data.destinations.map(d => ({
            ...d,
            lat: Number(d.lat ?? d.latitude ?? 20.0),
            lon: Number(d.lon ?? d.longitude ?? 78.0),
            state: d.state_name || d.state || 'India'
          }));
          setAllDestinations(norm);
        }
      })
      .catch((err) => console.warn('Could not preload map destinations:', err));
  }, []);

  // Helper to normalize the backend response into consistent frontend structures
  const normalizeBestTimeData = (raw) => {
    if (!raw) return null;
    const scoredList = raw.ranked_months || raw.monthly_calendar || [];
    const recommendations = scoredList.map((m) => {
      let color = 'yellow';
      if (m.color_hex === '#10b981' || m.classification === 'Excellent') color = 'green';
      else if (m.color_hex === '#22c55e' || m.classification === 'Good') color = 'light-green';
      else if (m.color_hex === '#eab308' || m.classification === 'Moderate') color = 'yellow';
      else color = 'orange';

      const metrics = m.climate_metrics || {};
      const sub = m.sub_scores || {};

      return {
        month: m.month,
        month_name: m.month_name,
        score: m.travel_comfort_score,
        classification: m.classification,
        color,
        color_hex: m.color_hex,
        subscores: {
          temperature_score: sub.temperature_suitability || 0,
          rainfall_score: sub.rainfall_suitability || 0,
          humidity_score: sub.humidity_suitability || 0,
          wind_score: sub.wind_suitability || 0,
          solar_score: sub.solar_radiation_suitability || 0,
        },
        justification: (m.highlights && m.highlights.length > 0)
          ? m.highlights.join('. ')
          : (m.limitations && m.limitations.length > 0 ? m.limitations.join('. ') : 'Optimal seasonal meteorological conditions.'),
        temperature_c: metrics.temp_mean_c,
        temp_min_c: metrics.temp_min_c,
        temp_max_c: metrics.temp_max_c,
        rainfall_mm: metrics.rainfall_total_mm,
        rainy_days_count: metrics.rainy_days_count || Math.round((metrics.rainfall_total_mm || 0) / 10),
        humidity_pct: metrics.humidity_avg_pct,
        wind_speed_ms: metrics.wind_speed_avg_ms,
        solar_kwh_m2: metrics.solar_radiation_mj ? (metrics.solar_radiation_mj / 3.6) : 5.0,
      };
    });

    const bestMonthObj = recommendations.find(r => r.month_name === raw.overall_best_month) || recommendations[0];

    return {
      ...raw,
      summary: raw.summary_recommendation || raw.summary,
      recommendations,
      best_month: bestMonthObj,
      peak_season: raw.top_recommended_months || [],
      shoulder_season: ['March', 'October'],
      low_season: ['June', 'July', 'August']
    };
  };

  // Synchronize with Global PageContext so AI Chatbot knows current destination & travel info
  useEffect(() => {
    if (selectedDestination) {
      updatePageContext({
        selected_city: `${selectedDestination.name}, ${selectedDestination.state || 'India'}`,
        selected_latitude: selectedDestination.lat || selectedDestination.latitude,
        selected_longitude: selectedDestination.lon || selectedDestination.longitude,
        additional_data: {
          travel_destination: selectedDestination.name,
          travel_state: selectedDestination.state,
          travel_type: travelType,
          travel_duration_days: durationDays,
          best_time_summary: bestTimeData?.summary || null,
          top_best_month: bestTimeData?.best_month?.month_name || null,
          top_score: bestTimeData?.best_month?.score || null
        }
      });
    }
  }, [selectedDestination, travelType, durationDays, bestTimeData, updatePageContext]);

  // Main Fetcher for Travel Recommendations
  const fetchTravelData = useCallback(async () => {
    if (!selectedDestination?.name) return;
    setLoading(true);
    setError(null);

    const destLat = selectedDestination.lat || selectedDestination.latitude || null;
    const destLon = selectedDestination.lon || selectedDestination.longitude || null;

    try {
      // 1. Fetch Best Time recommendations
      const bestRes = await getBestTimeToTravel({
        destination: selectedDestination.name,
        travel_type: travelType,
        start_year: startYear,
        end_year: endYear,
        latitude: destLat,
        longitude: destLon
      });

      if (bestRes && bestRes.data && bestRes.data.status === 'success') {
        const normalized = normalizeBestTimeData(bestRes.data);
        setBestTimeData(normalized);
        if (normalized?.best_month) {
          setSelectedMonth(normalized.best_month.month);
        }
      } else {
        const errDetail = typeof bestRes?.error === 'object' ? (bestRes.error?.detail || JSON.stringify(bestRes.error)) : bestRes?.error;
        throw new Error(errDetail || 'Failed to fetch best time recommendations');
      }

      // 2. Fetch full historical climate analysis
      const climateRes = await getTravelClimateAnalysis({
        destination: selectedDestination.name,
        start_year: startYear,
        end_year: endYear,
        latitude: destLat,
        longitude: destLon
      });
      if (climateRes && climateRes.data && climateRes.data.status === 'success') {
        const rawMonths = climateRes.data.climate_profile?.months || [];
        setClimateData({
          ...climateRes.data,
          monthly_climate: rawMonths.map(m => ({
            month: m.month,
            month_name: m.month_name,
            temperature_c: m.temp_mean_c,
            temp_min_c: m.temp_min_c,
            temp_max_c: m.temp_max_c,
            rainfall_mm: m.rainfall_total_mm,
            rainy_days_count: m.rainy_days_count,
            humidity_pct: m.humidity_avg_pct,
            wind_speed_ms: m.wind_speed_avg_ms,
            solar_kwh_m2: m.solar_radiation_mj ? (m.solar_radiation_mj / 3.6) : 5.0
          }))
        });
      }

      // 3. Fetch risk analysis
      const riskRes = await getTravelRiskAnalysis({
        destination: selectedDestination.name,
        travel_type: travelType,
        start_year: startYear,
        end_year: endYear
      });
      if (riskRes && riskRes.data && riskRes.data.status === 'success') {
        setRiskData({
          ...riskRes.data,
          risks: (riskRes.data.assessed_risks || []).map(r => ({
            title: r.risk_type,
            severity: r.severity,
            description: `${r.climate_evidence} ${r.travel_impact}`,
            affected_months: r.affected_months,
            precautions: r.precautions ? [r.precautions] : []
          })),
          precautions: (riskRes.data.assessed_risks || []).map(r => r.precautions).filter(Boolean)
        });
      }

      // 4. Fetch travel insights
      const insRes = await getTravelInsights({
        destination: selectedDestination.name,
        travel_type: travelType,
        start_year: startYear,
        end_year: endYear
      });
      if (insRes && insRes.data && insRes.data.status === 'success') {
        setInsightsData(insRes.data);
      }

    } catch (err) {
      console.error('Travel analysis error:', err);
      setError(String(err?.message || err || 'An error occurred while analyzing NASA POWER travel data.'));
    } finally {
      setLoading(false);
    }
  }, [selectedDestination, travelType, startYear, endYear]);

  // Handle destination selection and auto-recommend best activity for that location
  const handleSelectDestination = (dest) => {
    setSelectedDestination(dest);
    if (dest) {
      const guide = resolveDestinationBestActivities(dest);
      if (guide.recommendedTypes && guide.recommendedTypes.length > 0) {
        setTravelType(guide.recommendedTypes[0]);
      }
    }
  };

  // When selectedDestination changes, trigger data fetch
  useEffect(() => {
    if (selectedDestination?.name) {
      fetchTravelData();
    } else {
      setBestTimeData(null);
      setClimateData(null);
      setRiskData(null);
      setInsightsData(null);
      setError(null);
    }
  }, [selectedDestination, fetchTravelData]);

  // Active Tab determination
  const currentTabPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;

  const handleTabClick = (path) => {
    navigate(path);
  };

  // Get active month's score object from bestTimeData
  const activeMonthData = bestTimeData?.recommendations?.find(r => r.month === selectedMonth) || bestTimeData?.best_month;

  return (
    <TravelErrorBoundary>
      <div className="st-container">
        {/* Hero Banner */}
        <div className="st-hero-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="st-hero-title">
                <Compass size={36} className="text-blue-200" />
                <span>Smart Travel Planner India</span>
                <span className="st-india-badge">
                  🇮🇳 Sovereign India Only
                </span>
              </div>
              <p className="st-hero-subtitle">
                Climate-Based Indian Tourist Recommendation Engine. Analyzes multi-year NASA POWER meteorological records
                to discover the perfect travel window, avoid extreme monsoon downpours and sweltering heatwaves, and maximize your travel comfort.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.25)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                {selectedDestination ? 'Selected Destination' : 'Your Destination'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {selectedDestination?.name || 'Choose Below'}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                {selectedDestination?.state || 'Select any Indian spot to begin'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="st-nav-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = (tab.path === '/smart-travel' && (currentTabPath === '/smart-travel' || currentTabPath === '/smart-travel/')) ||
                             (tab.path !== '/smart-travel' && currentTabPath === tab.path);
            return (
              <button
                key={tab.path}
                type="button"
                className={`st-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.path)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Destination Selector: suggestions shown, let user choose */}
        <IndiaDestinationSelector
          selectedDestination={selectedDestination}
          onSelectDestination={handleSelectDestination}
          onClearDestination={() => setSelectedDestination(null)}
        />

        {/* Travel Type & Preferences ONLY displayed when destination is chosen */}
        {selectedDestination && (
          <>
            <TravelTypeSelector
              selectedType={travelType}
              onSelectType={(type) => setTravelType(type)}
              destination={selectedDestination}
              activeClimateMetrics={activeMonthData || {}}
            />

            <TravelPreferencesBar
              durationDays={durationDays}
              onChangeDuration={setDurationDays}
              startDate={startDate}
              onChangeStartDate={setStartDate}
              endDate={endDate}
              onChangeEndDate={setEndDate}
              onFindBestTime={fetchTravelData}
              loading={loading}
              disabled={!selectedDestination}
            />
          </>
        )}

        {error && (
          <div className="st-alert-india" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} />
            <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
          </div>
        )}

        {/* Welcoming state when user has not yet chosen a destination */}
        {!selectedDestination && (
          <div className="st-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#2563eb' }}>
              <MousePointerClick size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem' }}>
              Select an Indian Destination to Start
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Click any of the suggested destinations above (e.g. <strong>Manali</strong>, <strong>Ooty</strong>, <strong>Goa</strong>, <strong>Jaipur</strong>, <strong>Leh</strong>)
              or search your favorite place in India. AstroKites will analyze historical NASA POWER observations and show the Travel Comfort Index, best months, and weather risks.
            </p>

            {/* Always visible map so user can also pick locations directly from the map */}
            <IndiaTravelMap
              destinations={allDestinations.length > 0 ? allDestinations : [
                { name: 'Goa', state: 'Goa', lat: 15.2993, lon: 74.124 },
                { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lon: 77.1892 },
                { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
                { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
                { name: 'Leh', state: 'Ladakh', lat: 34.1526, lon: 77.5771 },
                { name: 'Ooty', state: 'Tamil Nadu', lat: 11.4102, lon: 76.6950 },
                { name: 'Munnar', state: 'Kerala', lat: 10.0889, lon: 77.0595 },
                { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 }
              ]}
              origin={selectedOrigin}
              selectedDestination={null}
              onSelectDestination={(dest) => setSelectedDestination(dest)}
              scoreMap={{}}
            />
          </div>
        )}

        {/* Results Shown Once Destination is Selected */}
        {selectedDestination && (
          <>
            {/* View Switching based on current route */}
            {(currentTabPath === '/smart-travel' || currentTabPath === '/smart-travel/') && (
              <div>
                {/* Overview Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {activeMonthData && (
                    <TravelComfortScoreCard
                      score={activeMonthData.score}
                      classification={activeMonthData.classification}
                      color={activeMonthData.color}
                      subscores={activeMonthData.subscores || {}}
                      activitySummary={activeMonthData.justification}
                      monthName={activeMonthData.month_name}
                      destinationName={selectedDestination?.name}
                    />
                  )}

                  {bestTimeData && (
                    <BestTimeRecommendation
                      recommendations={bestTimeData.recommendations || []}
                      peakSeason={bestTimeData.peak_season || []}
                      shoulderSeason={bestTimeData.shoulder_season || []}
                      lowSeason={bestTimeData.low_season || []}
                      summary={bestTimeData.summary}
                      destinationName={selectedDestination?.name}
                      travelType={travelType}
                      onSelectMonth={(m) => setSelectedMonth(m)}
                    />
                  )}
                </div>

                {/* How to Reach & Mode of Transport (Car, Bike, Bus, Train, Flight) with accurate distance */}
                <LocationTransportGuide
                  destination={selectedDestination}
                  origin={selectedOrigin}
                  onSelectOrigin={setSelectedOrigin}
                />

                {/* Map Section */}
                <IndiaTravelMap
                  destinations={allDestinations.length > 0 ? allDestinations : [selectedDestination]}
                  origin={selectedOrigin}
                  selectedDestination={selectedDestination}
                  onSelectDestination={(dest) => setSelectedDestination(dest)}
                  scoreMap={{ [selectedDestination?.name]: activeMonthData?.score || 80 }}
                />
              </div>
            )}

            {currentTabPath === '/smart-travel/best-time' && (
              <div>
                {bestTimeData && (
                  <BestTimeRecommendation
                    recommendations={bestTimeData.recommendations || []}
                    peakSeason={bestTimeData.peak_season || []}
                    shoulderSeason={bestTimeData.shoulder_season || []}
                    lowSeason={bestTimeData.low_season || []}
                    summary={bestTimeData.summary}
                    destinationName={selectedDestination?.name}
                    travelType={travelType}
                    onSelectMonth={(m) => setSelectedMonth(m)}
                  />
                )}

                {bestTimeData?.recommendations && (
                  <TravelComfortCalendar
                    months={bestTimeData.recommendations}
                    selectedMonth={selectedMonth}
                    onSelectMonth={(m) => setSelectedMonth(m)}
                    destinationName={selectedDestination?.name}
                  />
                )}
              </div>
            )}

            {currentTabPath === '/smart-travel/best-dates' && (
              <BestDateFinder
                destination={selectedDestination}
                travelType={travelType}
                durationDays={durationDays}
                startDate={startDate}
                endDate={endDate}
                startYear={startYear}
                endYear={endYear}
              />
            )}

            {currentTabPath === '/smart-travel/destination-comparison' && (
              <DestinationComparison
                defaultDestinations={[selectedDestination?.name || 'Manali', 'Ooty', 'Munnar']}
                travelType={travelType}
                startYear={startYear}
                endYear={endYear}
              />
            )}

            {currentTabPath === '/smart-travel/travel-calendar' && (
              <div>
                {bestTimeData?.recommendations && (
                  <TravelComfortCalendar
                    months={bestTimeData.recommendations}
                    selectedMonth={selectedMonth}
                    onSelectMonth={(m) => setSelectedMonth(m)}
                    destinationName={selectedDestination?.name}
                  />
                )}
              </div>
            )}

            {currentTabPath === '/smart-travel/climate-analysis' && (
              <div className="st-card">
                <div className="st-card-title">
                  <BarChart3 size={20} className="text-blue-600" />
                  <span>NASA POWER Historical Climate Analysis: {selectedDestination?.name}</span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Averaged multi-sensor meteorological records from {startYear} to {endYear} (10-Year Climatology).
                </p>

                {climateData?.monthly_climate && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="st-comp-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Avg Temp (°C)</th>
                          <th>Min / Max (°C)</th>
                          <th>Rainfall (mm)</th>
                          <th>Rainy Days</th>
                          <th>Humidity (%)</th>
                          <th>Wind (m/s)</th>
                          <th>Solar (kWh/m²)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {climateData.monthly_climate.map((row) => (
                          <tr key={row.month}>
                            <td><strong>{row.month_name}</strong></td>
                            <td>{row.temperature_c?.toFixed(1)}°C</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {row.temp_min_c?.toFixed(1)}° to {row.temp_max_c?.toFixed(1)}°
                            </td>
                            <td><strong>{row.rainfall_mm?.toFixed(0)} mm</strong></td>
                            <td>~{row.rainy_days_count} days</td>
                            <td>{row.humidity_pct?.toFixed(0)}%</td>
                            <td>{row.wind_speed_ms?.toFixed(1)} m/s</td>
                            <td>{row.solar_kwh_m2?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {currentTabPath === '/smart-travel/insights' && (
              <div>
                {riskData && (
                  <TravelRiskCards
                    risks={riskData.risks || []}
                    summary={riskData.summary}
                    precautions={riskData.precautions || []}
                    destinationName={selectedDestination?.name}
                    monthName={bestTimeData?.best_month?.month_name}
                  />
                )}

                <TravelInsights
                  destination={selectedDestination}
                  travelType={travelType}
                  insights={insightsData}
                />
              </div>
            )}
          </>
        )}
      </div>
    </TravelErrorBoundary>
  );
}
