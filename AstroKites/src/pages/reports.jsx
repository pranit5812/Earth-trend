import React, { useState, useEffect } from "react";
import "./reports.css";
import {
  getVariables,
  getIndianStates,
  createPdfReport,
  getReportsList,
  getDataQuality,
  apiBase
} from "../api/axios";

const getDownloadUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "#";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return apiBase ? `${apiBase}${cleanPath}` : cleanPath;
};

const ReportsPage = () => {
  const [variables, setVariables] = useState([
    { id: "temperature", label: "Temperature" },
    { id: "rainfall", label: "Rainfall / Precipitation" },
    { id: "soil_moisture", label: "Soil Moisture" },
    { id: "vegetation", label: "Vegetation (NDVI)" },
    { id: "wind_speed", label: "Wind Speed" },
    { id: "humidity", label: "Relative Humidity" },
  ]);
  const [states, setStates] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("IN-MH");
  const [selectedVariable, setSelectedVariable] = useState("temperature");

  const [reports, setReports] = useState([]);
  const [qualityData, setQualityData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  useEffect(() => {
    getVariables().then((res) => {
      if (res.ok && res.data?.variables) setVariables(res.data.variables);
    });
    getIndianStates().then((res) => {
      if (res.ok && res.data?.states) setStates(res.data.states);
    });
    loadArchive();
    loadQuality();
  }, []);

  const loadArchive = async () => {
    const res = await getReportsList();
    if (res.ok && res.data?.reports) setReports(res.data.reports);
  };

  const loadQuality = async () => {
    const res = await getDataQuality();
    if (res.ok && res.data?.data_quality_report) setQualityData(res.data.data_quality_report);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await createPdfReport({ region_id: selectedRegion, variable: selectedVariable });
    if (res.ok && res.data?.report) {
      setLastGenerated(res.data.report);
      loadArchive();
    }
    setGenerating(false);
  };

  return (
    <div className="fs-container">
      <header className="fs-header">
        <div>
          <h1 className="page-title">
            Scientific Reports & <span className="highlight">NASA Data Quality</span>
          </h1>
          <p className="muted">
            Compile downloadable PDF scientific reports and review official NASA dataset provenance
          </p>
        </div>
        <div className="header-badge">
          <span className="badge-tag">PDF Synthesis Engine</span>
          <span className="badge-sub">ReportLab Publication Ready</span>
        </div>
      </header>

      {/* Generator Card */}
      <section className="fs-controls">
        <h3 className="section-heading">Generate Scientific Synthesis PDF Report</h3>
        <p className="muted" style={{ marginBottom: "16px" }}>
          Generates an A4 PDF containing Mann-Kendall statistics, Sen's slope rate, 95% confidence intervals, and NASA metadata.
        </p>

        <div className="controls-grid">
          <div className="selector-group">
            <label className="selector-label">Target Region</label>
            <select
              className="control-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-group">
            <label className="selector-label">Environmental Variable</label>
            <select
              className="control-select"
              value={selectedVariable}
              onChange={(e) => setSelectedVariable(e.target.value)}
            >
              {variables.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-group" style={{ justifyContent: "flex-end" }}>
            <button className="generate-pdf-btn" onClick={handleGenerate} disabled={generating}>
              {generating ? "Compiling PDF..." : "📄 Compile PDF Report"}
            </button>
          </div>
        </div>

        {lastGenerated && (
          <div className="success-banner">
            ✅ Report <strong>{lastGenerated.report_id}</strong> generated successfully!{" "}
            <a href={getDownloadUrl(lastGenerated.download_url)} target="_blank" rel="noreferrer" className="download-link">
              Download PDF ({lastGenerated.filename})
            </a>
          </div>
        )}
      </section>

      {/* Reports Archive */}
      <div className="archive-card">
        <h3 className="section-heading">Compiled Reports Archive</h3>
        {reports.length > 0 ? (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Region</th>
                  <th>Variable</th>
                  <th>Trend Verdict</th>
                  <th>Compiled At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="bold">{r.id}</td>
                    <td>{r.region_name}</td>
                    <td className="capitalize">{r.variable}</td>
                    <td>{r.metadata?.trend || "Evaluated"}</td>
                    <td>{r.created_at?.slice(0, 16)}</td>
                    <td>
                      <a
                        href={getDownloadUrl(`/api/v1/reports/${r.id}/download`)}
                        target="_blank"
                        rel="noreferrer"
                        className="archive-download-btn"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="muted">No reports generated yet. Click "Compile PDF Report" above to generate one.</div>
        )}
      </div>

      {/* NASA Data Sources & Quality Assurance Table */}
      <div className="quality-card">
        <h3 className="section-heading">NASA Mission Data Sources & Quality Assurance</h3>
        <p className="muted" style={{ marginBottom: "16px" }}>
          Full metadata transparency, sensor instrumentation, and quality control procedures
        </p>

        <div className="quality-grid">
          {qualityData.map((d, i) => (
            <div key={i} className="quality-item-card">
              <div className="quality-badge">{d.variable.toUpperCase()}</div>
              <h4>{d.dataset}</h4>
              <div className="quality-meta"><strong>Mission:</strong> {d.mission}</div>
              <div className="quality-meta"><strong>Resolution:</strong> {d.resolution}</div>
              <div className="quality-meta"><strong>Coverage:</strong> {d.temporal_coverage}</div>
              <div className="quality-meta"><strong>QA Procedure:</strong> {d.qc_procedure}</div>
              <div className="quality-meta muted-sm"><strong>Attribution:</strong> {d.attribution}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
