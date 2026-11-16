import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudRain,
  Map,
  Sprout,
  Compass,
  GitCompare,
  Bot,
  FileText,
  ArrowRight,
  ShieldCheck,
  Database,
  Activity,
  Layers,
  Sparkles,
  Cpu,
  Globe2
} from "lucide-react";
import "./home.css";

const Home = () => {
  const navigate = useNavigate();

  const handleExploreForecast = () => {
    navigate('/forecast');
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="overlay">
          <div className="hero-content hero-large">
            <div className="topbar">
              <h1 className="hero-title">
                Precise <span className="highlight">weather</span>, precisely for you.
              </h1>
              <p className="hero-subtitle">
                Harness the power of probability-based forecasting for smarter decisions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="cta-button start" onClick={handleExploreForecast}>
                Explore Forecast
              </button>
              <button className="cta-button-secondary" onClick={() => navigate('/maps')}>
                Interactive Maps & Alerts
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="about-container">
          <div className="section-badge">
            <Sparkles size={14} />
            <span>Earth Systems & Climate Intelligence</span>
          </div>
          <h2>Pioneering Environmental Intelligence for India</h2>
          <p className="about-lead">
            Astrokites bridges the gap between raw planetary observations and everyday socioeconomic decision-making. 
            By uniting <strong>NASA Earth Observation telemetry</strong> with <strong>India Meteorological Department (IMD)</strong> bulletins 
            and <strong>AGMARKNET agricultural markets</strong>, we transform multi-decadal satellite data into high-confidence, actionable forecasts.
          </p>

          <div className="about-pillars">
            <div className="about-pillar-card">
              <div className="pillar-icon-box cyan">
                <Globe2 size={26} color="#00dfd8" />
              </div>
              <h3>Satellite Remote Sensing</h3>
              <p>
                Powered by NASA POWER, GPM, and SMAP datasets providing 30+ years of high-resolution climate history, solar radiation, and precipitation metrics.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon-box emerald">
                <Sprout size={26} color="#10b981" />
              </div>
              <h3>Sovereign Agronomy</h3>
              <p>
                Actionable crop suitability scores driven by ICAR parameters, soil moisture matrices, and real-time mandi modal prices across Indian APMCs.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="pillar-icon-box blue">
                <ShieldCheck size={26} color="#38bdf8" />
              </div>
              <h3>Official Early Warnings</h3>
              <p>
                Standardized IMD alert streaming with priority ranking (Red, Orange, Yellow) and instant dispatch via automated SMS and SMTP email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-badge">
            <Layers size={14} />
            <span>Comprehensive Toolset</span>
          </div>
          <h2>Explore Core Intelligence Modules</h2>
          <p className="section-subtitle">
            Specialized platforms engineered for farmers, travelers, researchers, and policymakers
          </p>

          <div className="feature-cards">
            {/* Interactive Module 1: Smart Agriculture */}
            <div 
              className="feature interactive agri"
              onClick={() => navigate('/smart-agriculture')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge agri-badge">
                  <Sprout size={22} />
                </div>
                <span className="feature-tag agri-tag">Agri-Decision Support</span>
              </div>
              <h3>Smart Agriculture & Mandi Market</h3>
              <p>
                AI crop suitability scoring combining NASA agroclimatology, ICAR soil requirements, and official AGMARKNET mandi prices with nearby market comparisons.
              </p>
              <div className="feature-cta-link">
                <span>Launch Agronomic Dashboard</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Interactive Module 2: Geospatial Maps */}
            <div 
              className="feature interactive maps"
              onClick={() => navigate('/maps')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge maps-badge">
                  <Map size={22} />
                </div>
                <span className="feature-tag maps-tag">Official IMD Warnings</span>
              </div>
              <h3>Geospatial Maps & Live Alerts</h3>
              <p>
                Interactive GIS mapping with synchronized IMD severe weather warnings (heavy rain, heatwaves, frost) and auto-focus region flyovers.
              </p>
              <div className="feature-cta-link">
                <span>Open Interactive Map</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Interactive Module 3: Climate Comparison */}
            <div 
              className="feature interactive compare"
              onClick={() => navigate('/compare')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge compare-badge">
                  <GitCompare size={22} />
                </div>
                <span className="feature-tag compare-tag">Decadal Climate Shifts</span>
              </div>
              <h3>Climate Comparison Center</h3>
              <p>
                Analyze multi-year divergence deltas across 12 calendar months. Compare target year 2026 against verified historical baselines (2020, 2015, 2000).
              </p>
              <div className="feature-cta-link">
                <span>Compare Historical Years</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Interactive Module 4: Smart Travel */}
            <div 
              className="feature interactive travel"
              onClick={() => navigate('/smart-travel')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge travel-badge">
                  <Compass size={22} />
                </div>
                <span className="feature-tag travel-tag">Bioclimatic Comfort</span>
              </div>
              <h3>Smart Travel Planner</h3>
              <p>
                Personalized destination comfort scoring across verified Indian hill stations, desert landscapes, and coastal destinations.
              </p>
              <div className="feature-cta-link">
                <span>Plan Ideal Window</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Interactive Module 5: AI Scientific Assistant */}
            <div 
              className="feature interactive assistant"
              onClick={() => navigate('/assistant')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge assistant-badge">
                  <Bot size={22} />
                </div>
                <span className="feature-tag assistant-tag">Zero Hallucinations</span>
              </div>
              <h3>AI Scientific Assistant</h3>
              <p>
                Engage in natural conversations grounded in verified NASA satellite observations with strict scientific citation and provenance tracking.
              </p>
              <div className="feature-cta-link">
                <span>Consult AI Assistant</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Interactive Module 6: PDF Synthesis Reports */}
            <div 
              className="feature interactive reports"
              onClick={() => navigate('/reports')}
            >
              <div className="feature-top">
                <div className="feature-icon-badge reports-badge">
                  <FileText size={22} />
                </div>
                <span className="feature-tag reports-tag">Publication Ready</span>
              </div>
              <h3>Scientific PDF Synthesis Reports</h3>
              <p>
                Export formal environmental synthesis dossiers with statistical verdicts, anomaly scores, and official data citations.
              </p>
              <div className="feature-cta-link">
                <span>Generate PDF Report</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Platform Feature 7 */}
            <div className="feature standard">
              <div className="feature-top">
                <div className="feature-icon-badge std-badge">
                  <CloudRain size={22} />
                </div>
                <span className="feature-tag std-tag">Predictive Model</span>
              </div>
              <h3>Hyper-Local Forecast Engine</h3>
              <p>
                Multi-day forward predictions with confidence intervals, temperature curves, precipitation likelihood, and atmospheric pressure trends.
              </p>
            </div>

            {/* Platform Feature 8 */}
            <div className="feature standard">
              <div className="feature-top">
                <div className="feature-icon-badge std-badge">
                  <Activity size={22} />
                </div>
                <span className="feature-tag std-tag">Automated Dispatch</span>
              </div>
              <h3>SMS & Email Early Warnings</h3>
              <p>
                Integrated dispatch gateway sending official weather advisories to state administrations and farming communities via Twilio SMS and SMTP email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <div className="why-container">
          <div className="section-badge">
            <Cpu size={14} />
            <span>Proven Scientific Foundation</span>
          </div>
          <h2>Engineered for High-Reliability Decisions</h2>
          <p className="section-subtitle">
            Combining rigorous statistical science with real-world public infrastructure
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <Globe2 size={30} color="#00dfd8" />
              </div>
              <div className="stat-number">200K+</div>
              <div className="stat-label">Global & Indian Points</div>
              <div className="stat-description">
                Hyper-local weather coordinates with street-level resolution across India
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <Database size={30} color="#38bdf8" />
              </div>
              <div className="stat-number">30+ Years</div>
              <div className="stat-label">Continuous Climate Archive</div>
              <div className="stat-description">
                Harmonized NASA satellite observations from 1990 to present day
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <Sprout size={30} color="#10b981" />
              </div>
              <div className="stat-number">36 States & UTs</div>
              <div className="stat-label">Pan-India Agricultural Zones</div>
              <div className="stat-description">
                ICAR agro-climatic classifications and official APMC mandi coverage
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <ShieldCheck size={30} color="#f59e0b" />
              </div>
              <div className="stat-number">100%</div>
              <div className="stat-label">Verified Data Provenance</div>
              <div className="stat-description">
                Strict zero-hallucination policy with government and satellite sourcing
              </div>
            </div>
          </div>

          <div className="data-sources">
            <h3>Verified Government & Satellite Data Sources</h3>
            <div className="sources-list">
              <div className="source-item">
                <span className="source-dot"></span>
                <span>🛰️ NASA POWER Agroclimatology</span>
              </div>
              <div className="source-item">
                <span className="source-dot"></span>
                <span>🌧️ NASA GPM IMERG Precipitation</span>
              </div>
              <div className="source-item">
                <span className="source-dot"></span>
                <span>⚠️ IMD National Weather Forecasting Centre</span>
              </div>
              <div className="source-item">
                <span className="source-dot"></span>
                <span>🌾 AGMARKNET & data.gov.in Mandis</span>
              </div>
              <div className="source-item">
                <span className="source-dot"></span>
                <span>🔬 ICAR Agronomic Knowledgebase</span>
              </div>
              <div className="source-item">
                <span className="source-dot"></span>
                <span>🌱 NASA SMAP Soil Moisture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Professional Footer */}
      <footer className="footer-modern">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-spark">✦</span>
                <span className="logo-text">AstroKites</span>
              </div>
              <p className="footer-desc">
                High-precision Earth observation, climate intelligence, and agricultural decision support platform for India.
              </p>
              <div className="footer-status">
                <span className="status-indicator"></span>
                <span>All Meteorological Systems Operational</span>
              </div>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4>Core Modules</h4>
                <ul>
                  <li><button onClick={() => navigate('/forecast')}>Weather Forecast</button></li>
                  <li><button onClick={() => navigate('/maps')}>Interactive Maps & Alerts</button></li>
                  <li><button onClick={() => navigate('/smart-agriculture')}>Smart Agriculture & Mandis</button></li>
                  <li><button onClick={() => navigate('/compare')}>Climate Comparison</button></li>
                  <li><button onClick={() => navigate('/smart-travel')}>Smart Travel Planner</button></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Intelligence & Tools</h4>
                <ul>
                  <li><button onClick={() => navigate('/assistant')}>AI Scientific Assistant</button></li>
                  <li><button onClick={() => navigate('/reports')}>PDF Synthesis Reports</button></li>
                  <li><a href="https://power.larc.nasa.gov" target="_blank" rel="noreferrer">NASA POWER API ↗</a></li>
                  <li><a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer">IMD Mausam ↗</a></li>
                  <li><a href="https://agmarknet.gov.in" target="_blank" rel="noreferrer">AGMARKNET Portal ↗</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Data Governance</h4>
                <p className="footer-subtext">
                  Data ingested from NASA Earthdata, India Meteorological Department, Ministry of Agriculture & Farmers Welfare, and ICAR under open scientific licenses.
                </p>
                <div className="gov-badges">
                  <span className="gov-badge">NASA OpenData</span>
                  <span className="gov-badge">IMD Official</span>
                  <span className="gov-badge">data.gov.in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} AstroKites. Built for NASA Space Apps Challenge & Sovereign Climate Resilience.</p>
            <div className="footer-meta">
              <span>FastAPI + React 19 Architecture</span>
              <span className="divider">•</span>
              <span>ISO 8601 & UTC+05:30 IST Synced</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
