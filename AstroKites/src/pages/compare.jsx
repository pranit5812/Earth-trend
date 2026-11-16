import React, { useState, useEffect } from "react";
import "./compare.css";
import { 
  getVariables, 
  getIndianStates, 
  compareRegionYears 
} from "../api/axios";
import { usePageContext } from "../context/PageContext";

const fmt = (num, digits = 2) => (num !== null && num !== undefined && !isNaN(num) ? Number(num).toFixed(digits) : "N/A");

const POPULAR_DESTINATIONS = [
  { id: "Goa", name: "Goa", icon: "🌴" },
  { id: "Manali", name: "Manali", icon: "⛰️" },
  { id: "Shimla", name: "Shimla", icon: "🌸" },
  { id: "Jaipur", name: "Jaipur", icon: "🏰" },
  { id: "Srinagar", name: "Srinagar", icon: "🏔️" },
  { id: "Ooty", name: "Ooty", icon: "🌲" },
  { id: "Munnar", name: "Munnar", icon: "🌿" },
  { id: "Coorg", name: "Coorg", icon: "☕" },
  { id: "Udaipur", name: "Udaipur", icon: "🏛️" },
  { id: "Andaman and Nicobar Islands", name: "Andaman", icon: "🌊" }
];

const VARIABLES = [
  { id: "temperature", label: "Temperature", unit: "°C", icon: "🌡️" },
  { id: "rainfall", label: "Rainfall", unit: "mm", icon: "🌧️" },
  { id: "humidity", label: "Relative Humidity", unit: "%", icon: "💧" },
  { id: "wind_speed", label: "Wind Speed", unit: "m/s", icon: "💨" },
  { id: "solar_radiation", label: "Solar Radiation", unit: "MJ/m²", icon: "☀️" },
];

const AVAILABLE_YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
  2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2005,
  2000, 1995, 1990
];

// Dual-Year Interactive Line Curve Component
const DualYearLineChart = ({ data, year1, year2, unit }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!data || data.length === 0) return null;

  const width = 880;
  const height = 290;
  const paddingL = 68;
  const paddingR = 30;
  const paddingT = 30;
  const paddingB = 45;

  const y1Vals = data.map((d) => d.year1_val);
  const y2Vals = data.map((d) => d.year2_val);
  const allVals = [...y1Vals, ...y2Vals];

  const minVal = Math.floor(Math.min(...allVals) - (Math.max(...allVals) - Math.min(...allVals) || 5) * 0.1);
  const maxVal = Math.ceil(Math.max(...allVals) + (Math.max(...allVals) - Math.min(...allVals) || 5) * 0.1);
  const range = maxVal - minVal || 1;

  const chartInnerW = width - paddingL - paddingR;
  const slotW = chartInnerW / 12;
  const getX = (idx) => paddingL + (idx + 0.5) * slotW;
  const getY = (val) => height - paddingB - ((val - minVal) / range) * (height - paddingT - paddingB);

  const pts1 = data.map((d, i) => ({ x: getX(i), y: getY(d.year1_val), val: d.year1_val, name: d.month_abbr, full: d }));
  const pts2 = data.map((d, i) => ({ x: getX(i), y: getY(d.year2_val), val: d.year2_val, name: d.month_abbr, full: d }));

  const path1 = pts1.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
  const path2 = pts2.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");

  // Area between the two curves
  const forward1 = pts1.map((p) => `${p.x},${p.y}`).join(" L ");
  const backward2 = [...pts2].reverse().map((p) => `${p.x},${p.y}`).join(" L ");
  const areaD = `M ${forward1} L ${backward2} Z`;

  // Gridlines
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minVal + (i / gridSteps) * range;
    const y = getY(val);
    return { val: Math.round(val * 10) / 10, y };
  });

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines & Labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={paddingL} y1={g.y} x2={width - paddingR} y2={g.y} stroke="#e2e8f0" strokeDasharray="3 3" />
            <text x={paddingL - 10} y={g.y + 4} fontSize="11" textAnchor="end" fill="#64748b" fontWeight="600">
              {g.val} {unit}
            </text>
          </g>
        ))}

        {/* Shaded Area between curves */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Lines */}
        <path d={path2} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" />
        <path d={path1} fill="none" stroke="#2563eb" strokeWidth="3" />

        {/* Points & Hover Target */}
        {data.map((d, i) => {
          const p1 = pts1[i];
          const p2 = pts2[i];
          const isHov = hoveredIdx === i;

          return (
            <g 
              key={i} 
              onMouseEnter={() => setHoveredIdx(i)} 
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Vertical crosshair on hover */}
              {isHov && (
                <line x1={p1.x} y1={paddingT} x2={p1.x} y2={height - paddingB} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1.5" />
              )}

              {/* Year 2 Circle */}
              <circle cx={p2.x} cy={p2.y} r={isHov ? 6 : 4} fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />

              {/* Year 1 Circle */}
              <circle cx={p1.x} cy={p1.y} r={isHov ? 7 : 4.5} fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

              {/* Month Label */}
              <text 
                x={p1.x} 
                y={height - 12} 
                fontSize="12" 
                textAnchor="middle" 
                fill={isHov ? "#1e40af" : "#64748b"} 
                fontWeight={isHov ? "800" : "600"}
              >
                {d.month_abbr}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoveredIdx !== null && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: `${Math.min(Math.max((pts1[hoveredIdx].x / width) * 100, 16), 84)}%`,
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.92)",
          color: "#ffffff",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          zIndex: 10,
          whiteSpace: "nowrap"
        }}>
          <div style={{ fontWeight: "700", marginBottom: "4px", color: "#93c5fd" }}>
            📅 {data[hoveredIdx].month_name}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span><strong style={{ color: "#60a5fa" }}>{year1}:</strong> {data[hoveredIdx].year1_val} {unit}</span>
            <span><strong style={{ color: "#fbbf24" }}>{year2}:</strong> {data[hoveredIdx].year2_val} {unit}</span>
            <span><strong style={{ color: data[hoveredIdx].diff >= 0 ? "#f87171" : "#4ade80" }}>Δ:</strong> {data[hoveredIdx].diff > 0 ? "+" : ""}{data[hoveredIdx].diff} {unit} ({data[hoveredIdx].pct_change > 0 ? "+" : ""}{data[hoveredIdx].pct_change}%)</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Upgraded Animated Monthly Divergence & Comparison Bar Chart
const MonthlyDeltaBarChart = ({ data, year1, year2, unit }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [chartView, setChartView] = useState("delta"); // 'delta' | 'grouped' | 'percent'
  if (!data || data.length === 0) return null;

  const width = 880;
  const height = 300;
  const paddingL = 68;
  const paddingR = 30;
  const paddingT = 30;
  const paddingB = 45;

  const chartInnerW = width - paddingL - paddingR;
  const slotW = chartInnerW / 12;
  const getSlotCenterX = (i) => paddingL + (i + 0.5) * slotW;

  const diffs = data.map((d) => d.diff);
  const maxAbsDiff = Math.max(...diffs.map((d) => Math.abs(d)), 0.05);

  const y1Vals = data.map((d) => d.year1_val);
  const y2Vals = data.map((d) => d.year2_val);
  const maxGroupVal = Math.max(...y1Vals, ...y2Vals, 5);
  const minGroupVal = Math.min(...y1Vals, ...y2Vals, 0);

  const zeroY = paddingT + (height - paddingT - paddingB) / 2;
  const barWidth = Math.min(30, slotW * 0.52);

  // Scaled height for delta mode: ensures small deltas (like +0.04) are prominently visible (min 18px)
  const getDeltaBarH = (val) => {
    if (Math.abs(val) < 0.001) return 4;
    const ratio = Math.abs(val) / maxAbsDiff;
    const scaled = Math.pow(ratio, 0.65);
    return Math.max(18, scaled * 92);
  };

  // Nice rounded Y-axis grid for grouped mode
  const yMaxRounded = Math.ceil(maxGroupVal / 5) * 5 + (maxGroupVal % 5 === 0 ? 5 : 0);
  const yMinRounded = 0;
  const yRange = yMaxRounded - yMinRounded || 1;
  const groupedGridSteps = [0, 0.25, 0.5, 0.75, 1];

  const getHeaderMeta = () => {
    if (chartView === "delta") {
      return {
        title: `📊 Monthly Divergence Delta (Δ = ${year1} minus ${year2})`,
        legend: `🟥 Sunset Orange/Red = ${year1} higher  |  🟦 Cyan/Blue = ${year1} lower`
      };
    }
    if (chartView === "grouped") {
      return {
        title: `📈 Side-by-Side Monthly Magnitude: ${year1} vs ${year2}`,
        legend: `🔵 ${year1} (Base Year)  |  🟠 ${year2} (Comparison Year)`
      };
    }
    return {
      title: `📉 Relative Percentage Shift (%) across Months`,
      legend: `🟥 Positive % Shift in ${year1}  |  🟦 Negative % Shift in ${year1}`
    };
  };

  const headerMeta = getHeaderMeta();

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Dynamic Header with Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div>
          <h3 className="my-chart-title" style={{ margin: 0 }}>
            <span>{headerMeta.title}</span>
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
            {headerMeta.legend}
          </span>
        </div>
        <div className="chart-mode-pill">
          <button
            className={`chart-mode-btn ${chartView === "delta" ? "active" : ""}`}
            onClick={() => setChartView("delta")}
          >
            📊 Divergence Delta (Δ)
          </button>
          <button
            className={`chart-mode-btn ${chartView === "grouped" ? "active" : ""}`}
            onClick={() => setChartView("grouped")}
          >
            📈 Side-by-Side Dual Bars
          </button>
          <button
            className={`chart-mode-btn ${chartView === "percent" ? "active" : ""}`}
            onClick={() => setChartView("percent")}
          >
            % Percentage Shift
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="warmBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          <linearGradient id="coolBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="y1GroupGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          <linearGradient id="y2GroupGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* VIEW 1: DIVERGENCE DELTA (Δ)                            */}
        {/* ======================================================== */}
        {chartView === "delta" && (
          <>
            {/* Background dashed helper lines */}
            <line x1={paddingL} y1={zeroY - 48} x2={width - paddingR} y2={zeroY - 48} stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1={paddingL} y1={zeroY + 48} x2={width - paddingR} y2={zeroY + 48} stroke="#f1f5f9" strokeDasharray="4 4" />

            {/* Zero Baseline */}
            <line x1={paddingL} y1={zeroY} x2={width - paddingR} y2={zeroY} stroke="#94a3b8" strokeWidth="2" />
            <rect x={paddingL - 54} y={zeroY - 11} width="46" height="22" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            <text x={paddingL - 31} y={zeroY + 4} fontSize="11" textAnchor="middle" fill="#334155" fontWeight="800">
              0.0 {unit}
            </text>

            {data.map((d, i) => {
              const x = getSlotCenterX(i);
              const barH = getDeltaBarH(d.diff);
              const isPos = d.diff >= 0;
              const y = isPos ? zeroY - barH : zeroY;
              const isHov = hoveredIdx === i;
              const badgeY = isPos ? y - 14 : y + barH + 14;

              return (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Subtle column guide on hover */}
                  {isHov && (
                    <rect
                      x={x - slotW / 2 + 2}
                      y={paddingT}
                      width={slotW - 4}
                      height={height - paddingT - paddingB}
                      fill="#f8fafc"
                      rx="8"
                      opacity="0.9"
                    />
                  )}

                  {/* Animated Bar with Capsule Corners */}
                  <rect
                    x={x - (isHov ? barWidth / 2 + 2 : barWidth / 2)}
                    y={y}
                    width={isHov ? barWidth + 4 : barWidth}
                    height={Math.max(barH, 4)}
                    fill={isPos ? "url(#warmBarGrad)" : "url(#coolBarGrad)"}
                    rx="6"
                    filter={isHov ? "url(#glowShadow)" : undefined}
                    className={isPos ? "anim-bar-up" : "anim-bar-down"}
                    style={{
                      transformOrigin: `${x}px ${zeroY}px`,
                      animationDelay: `${i * 45}ms`,
                      opacity: isHov ? 1 : 0.88,
                      transition: "width 0.2s, x 0.2s, opacity 0.2s"
                    }}
                  />

                  {/* Value Pill Badge */}
                  <rect
                    x={x - 25}
                    y={badgeY - 10}
                    width="50"
                    height="20"
                    rx="6"
                    fill={isHov ? (isPos ? "#ef4444" : "#0284c7") : "#ffffff"}
                    stroke={isPos ? "#fecaca" : "#bae6fd"}
                    strokeWidth="1.2"
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.06))"
                  />
                  <text
                    x={x}
                    y={badgeY + 4}
                    fontSize="10"
                    textAnchor="middle"
                    fill={isHov ? "#ffffff" : (isPos ? "#b91c1c" : "#0369a1")}
                    fontWeight="800"
                  >
                    {d.diff > 0 ? "+" : ""}{d.diff}
                  </text>

                  {/* Month Label */}
                  <text
                    x={x}
                    y={height - 12}
                    fontSize="12"
                    textAnchor="middle"
                    fill={isHov ? "#1e40af" : "#64748b"}
                    fontWeight={isHov ? "800" : "600"}
                  >
                    {d.month_abbr}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: SIDE-BY-SIDE DUAL-YEAR BARS                     */}
        {/* ======================================================== */}
        {chartView === "grouped" && (
          <>
            {/* Horizontal Gridlines with Clear Spacing */}
            {groupedGridSteps.map((pct, idx) => {
              const yVal = Math.round((yMinRounded + pct * yRange) * 10) / 10;
              const yPos = height - paddingB - pct * (height - paddingT - paddingB);
              return (
                <g key={idx}>
                  <line x1={paddingL} y1={yPos} x2={width - paddingR} y2={yPos} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={paddingL - 10} y={yPos + 4} fontSize="11" textAnchor="end" fill="#64748b" fontWeight="600">
                    {yVal} {unit}
                  </text>
                </g>
              );
            })}

            {data.map((d, i) => {
              const x = getSlotCenterX(i);
              const singleW = (barWidth * 1.1) / 2;
              const usableH = height - paddingT - paddingB;

              const h1 = Math.max(6, ((d.year1_val - yMinRounded) / yRange) * usableH);
              const h2 = Math.max(6, ((d.year2_val - yMinRounded) / yRange) * usableH);

              const y1Pos = height - paddingB - h1;
              const y2Pos = height - paddingB - h2;
              const isHov = hoveredIdx === i;

              return (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Hover background column */}
                  {isHov && (
                    <rect
                      x={x - slotW / 2 + 2}
                      y={paddingT}
                      width={slotW - 4}
                      height={height - paddingT - paddingB}
                      fill="#f8fafc"
                      rx="8"
                      opacity="0.9"
                    />
                  )}

                  {/* Year 1 Bar (Left) */}
                  <rect
                    x={x - singleW - 2}
                    y={y1Pos}
                    width={singleW}
                    height={h1}
                    fill="url(#y1GroupGrad)"
                    rx="5"
                    filter={isHov ? "url(#glowShadow)" : undefined}
                    className="anim-bar-up"
                    style={{
                      transformOrigin: `${x - singleW / 2}px ${height - paddingB}px`,
                      animationDelay: `${i * 35}ms`
                    }}
                  />

                  {/* Year 2 Bar (Right) */}
                  <rect
                    x={x + 2}
                    y={y2Pos}
                    width={singleW}
                    height={h2}
                    fill="url(#y2GroupGrad)"
                    rx="5"
                    filter={isHov ? "url(#glowShadow)" : undefined}
                    className="anim-bar-up"
                    style={{
                      transformOrigin: `${x + singleW / 2}px ${height - paddingB}px`,
                      animationDelay: `${i * 35 + 15}ms`
                    }}
                  />

                  {/* Month Label */}
                  <text
                    x={x}
                    y={height - 12}
                    fontSize="12"
                    textAnchor="middle"
                    fill={isHov ? "#1e40af" : "#64748b"}
                    fontWeight={isHov ? "800" : "600"}
                  >
                    {d.month_abbr}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: PERCENTAGE SHIFT (%)                            */}
        {/* ======================================================== */}
        {chartView === "percent" && (
          <>
            {/* Zero line */}
            <line x1={paddingL} y1={zeroY} x2={width - paddingR} y2={zeroY} stroke="#94a3b8" strokeWidth="2" />
            <rect x={paddingL - 50} y={zeroY - 11} width="42" height="22" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            <text x={paddingL - 29} y={zeroY + 4} fontSize="11" textAnchor="middle" fill="#334155" fontWeight="800">
              0%
            </text>

            {data.map((d, i) => {
              const x = getSlotCenterX(i);
              const maxPct = Math.max(...data.map((item) => Math.abs(item.pct_change)), 5);
              const barH = Math.max(16, (Math.abs(d.pct_change) / maxPct) * 90);
              const isPos = d.pct_change >= 0;
              const y = isPos ? zeroY - barH : zeroY;
              const isHov = hoveredIdx === i;

              return (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barH}
                    fill={isPos ? "url(#warmBarGrad)" : "url(#coolBarGrad)"}
                    rx="6"
                    className={isPos ? "anim-bar-up" : "anim-bar-down"}
                    style={{
                      transformOrigin: `${x}px ${zeroY}px`,
                      animationDelay: `${i * 40}ms`
                    }}
                  />

                  {/* Value */}
                  <text
                    x={x}
                    y={isPos ? y - 6 : y + barH + 13}
                    fontSize="10"
                    textAnchor="middle"
                    fill={isPos ? "#b91c1c" : "#0369a1"}
                    fontWeight="800"
                  >
                    {d.pct_change > 0 ? "+" : ""}{d.pct_change}%
                  </text>

                  {/* Month */}
                  <text
                    x={x}
                    y={height - 12}
                    fontSize="12"
                    textAnchor="middle"
                    fill={isHov ? "#1e40af" : "#64748b"}
                    fontWeight={isHov ? "800" : "600"}
                  >
                    {d.month_abbr}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>

      {/* Interactive Tooltip on Hover */}
      {hoveredIdx !== null && (
        <div 
          className="chart-tooltip-container"
          style={{
            top: "55px",
            left: `${Math.min(Math.max((getSlotCenterX(hoveredIdx) / width) * 100, 18), 82)}%`,
            transform: "translateX(-50%)"
          }}
        >
          <div style={{ fontWeight: "800", color: "#93c5fd", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📅 {data[hoveredIdx].month_name} Comparison</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "6px 14px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5e1" }}>{year1} (Base Year):</span>
            <span style={{ fontWeight: "700", color: "#60a5fa" }}>{data[hoveredIdx].year1_val} {unit}</span>

            <span style={{ color: "#cbd5e1" }}>{year2} (Compare Year):</span>
            <span style={{ fontWeight: "700", color: "#fbbf24" }}>{data[hoveredIdx].year2_val} {unit}</span>

            <span style={{ color: "#cbd5e1" }}>Divergence Delta:</span>
            <span style={{ fontWeight: "800", color: data[hoveredIdx].diff >= 0 ? "#f87171" : "#38bdf8" }}>
              {data[hoveredIdx].diff > 0 ? "+" : ""}{data[hoveredIdx].diff} {unit} ({data[hoveredIdx].pct_change > 0 ? "+" : ""}{data[hoveredIdx].pct_change}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const ComparePage = () => {
  // Single Region Multi-Year State
  const [selectedRegion, setSelectedRegion] = useState("Goa");
  const [selectedVariable, setSelectedVariable] = useState("temperature");
  const [year1, setYear1] = useState(2026);
  const [year2, setYear2] = useState(2020);
  const [yearData, setYearData] = useState(null);
  const [loadingYears, setLoadingYears] = useState(false);
  const [states, setStates] = useState([]);

  const { updatePageContext } = usePageContext();

  // Load States list on mount
  useEffect(() => {
    getIndianStates().then((res) => {
      if (res.ok && res.data?.states) setStates(res.data.states);
    });
  }, []);

  // Fetch Multi-Year Comparison Data
  useEffect(() => {
    let isSubscribed = true;
    const fetchYearCompare = async () => {
      setLoadingYears(true);
      const res = await compareRegionYears({
        region: selectedRegion,
        variable: selectedVariable,
        year1,
        year2
      });
      if (isSubscribed && res.ok && res.data) {
        setYearData(res.data);
      }
      if (isSubscribed) setLoadingYears(false);
    };

    fetchYearCompare();
    return () => { isSubscribed = false; };
  }, [selectedRegion, selectedVariable, year1, year2]);

  // Sync to global context for AI assistant
  useEffect(() => {
    if (yearData) {
      updatePageContext({
        selected_city: selectedRegion,
        selected_variable: selectedVariable,
        current_comparison: {
          mode: "multi_year",
          region: selectedRegion,
          variable: selectedVariable,
          year1,
          year2,
          annual_diff: yearData.summary?.annual_diff,
          verdict: yearData.summary?.verdict
        }
      });
    }
  }, [selectedRegion, selectedVariable, year1, year2, yearData, updatePageContext]);

  const activeUnit = VARIABLES.find((v) => v.id === selectedVariable)?.unit || "°C";

  return (
    <div className="fs-container">
      {/* Header */}
      <header className="fs-header">
        <div>
          <h1 className="page-title">
            Climate <span className="highlight">Comparison Center</span>
          </h1>
          <p className="muted">
            Analyze and compare climate indicators for Indian regions across different years
          </p>
        </div>
      </header>

      <div>
        {/* Quick Destination Chips */}
          <div className="comp-chips-row">
            <span className="comp-chips-label">Quick Destinations:</span>
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest.id}
                className={`comp-chip ${selectedRegion === dest.name ? "active" : ""}`}
                onClick={() => setSelectedRegion(dest.name)}
              >
                {dest.icon} {dest.name}
              </button>
            ))}
          </div>

          {/* Controls Card */}
          <section className="my-controls-card">
            <div className="my-controls-grid">
              {/* Region Selector */}
              <div className="my-control-group">
                <label className="my-control-label">📍 Region / Destination</label>
                <select
                  className="my-control-select"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <optgroup label="Popular Tourist Destinations">
                    {POPULAR_DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Indian States & UTs">
                    {states.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Variable Selector */}
              <div className="my-control-group">
                <label className="my-control-label">📊 Climate Variable</label>
                <select
                  className="my-control-select"
                  value={selectedVariable}
                  onChange={(e) => setSelectedVariable(e.target.value)}
                >
                  {VARIABLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.icon} {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year 1 (Base Year) */}
              <div className="my-control-group">
                <label className="my-control-label">📅 Base Year (Year 1)</label>
                <select
                  className="my-control-select"
                  value={year1}
                  onChange={(e) => setYear1(Number(e.target.value))}
                >
                  {AVAILABLE_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y} {y === 2026 ? "★ (Target / Current Year)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year 2 (Compare Year) */}
              <div className="my-control-group">
                <label className="my-control-label">🔄 Compare With (Year 2)</label>
                <select
                  className="my-control-select"
                  value={year2}
                  onChange={(e) => setYear2(Number(e.target.value))}
                >
                  {AVAILABLE_YEARS.map((y) => (
                    <option key={y} value={y} disabled={y === year1}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Year Presets */}
            <div className="my-presets-row">
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Quick Presets:</span>
              <button
                className={`my-preset-btn ${year1 === 2026 && year2 === 2024 ? "active" : ""}`}
                onClick={() => { setYear1(2026); setYear2(2024); }}
              >
                2026 vs 2024 (Recent Baseline)
              </button>
              <button
                className={`my-preset-btn ${year1 === 2026 && year2 === 2020 ? "active" : ""}`}
                onClick={() => { setYear1(2026); setYear2(2020); }}
              >
                2026 vs 2020 (5-Year Shift)
              </button>
              <button
                className={`my-preset-btn ${year1 === 2026 && year2 === 2015 ? "active" : ""}`}
                onClick={() => { setYear1(2026); setYear2(2015); }}
              >
                2026 vs 2015 (10-Year Decadal)
              </button>
              <button
                className={`my-preset-btn ${year1 === 2026 && year2 === 2000 ? "active" : ""}`}
                onClick={() => { setYear1(2026); setYear2(2000); }}
              >
                2026 vs 2000 (Millennium Shift)
              </button>
            </div>
          </section>

          {/* Loading Indicator */}
          {loadingYears && (
            <div style={{ textAlign: "center", padding: "40px", color: "#2563eb", fontWeight: "700" }}>
              ⏳ Loading NASA climate observations for {selectedRegion} ({year1} vs {year2})...
            </div>
          )}

          {/* Data Presentation */}
          {!loadingYears && yearData && yearData.summary && (
            <div>
              {/* KPI Summary Cards */}
              <div className="my-kpi-grid">
                {/* 1. Annual Average */}
                <div className={`my-kpi-card ${yearData.summary.annual_diff > 0 ? "warmer" : "cooler"}`}>
                  <div className="my-kpi-title">Annual Average</div>
                  <div className="my-kpi-vals">
                    <span className="my-kpi-val1">{yearData.summary.year1_mean} {activeUnit}</span>
                    <span className="my-kpi-vs">vs</span>
                    <span className="my-kpi-val2">{yearData.summary.year2_mean} {activeUnit}</span>
                  </div>
                  <div className={`my-kpi-delta ${yearData.summary.annual_diff >= 0 ? "delta-pos" : "delta-neg"}`}>
                    Δ {yearData.summary.annual_diff > 0 ? "+" : ""}{yearData.summary.annual_diff} {activeUnit} ({yearData.summary.annual_pct_change > 0 ? "+" : ""}{yearData.summary.annual_pct_change}%)
                  </div>
                  <div className="my-kpi-sub">
                    {year1} {yearData.summary.annual_diff >= 0 ? "higher" : "lower"} than {year2}
                  </div>
                </div>

                {/* 2. Peak Month */}
                <div className="my-kpi-card">
                  <div className="my-kpi-title">Peak Month Value</div>
                  <div className="my-kpi-vals">
                    <span className="my-kpi-val1">{yearData.summary.year1_max?.value} {activeUnit}</span>
                    <span className="my-kpi-vs">vs</span>
                    <span className="my-kpi-val2">{yearData.summary.year2_max?.value} {activeUnit}</span>
                  </div>
                  <div className="my-kpi-delta delta-neutral">
                    {year1}: {yearData.summary.year1_max?.month} • {year2}: {yearData.summary.year2_max?.month}
                  </div>
                  <div className="my-kpi-sub">Annual maximum recorded month</div>
                </div>

                {/* 3. Minimum Month */}
                <div className="my-kpi-card">
                  <div className="my-kpi-title">Minimum Month Value</div>
                  <div className="my-kpi-vals">
                    <span className="my-kpi-val1">{yearData.summary.year1_min?.value} {activeUnit}</span>
                    <span className="my-kpi-vs">vs</span>
                    <span className="my-kpi-val2">{yearData.summary.year2_min?.value} {activeUnit}</span>
                  </div>
                  <div className="my-kpi-delta delta-neutral">
                    {year1}: {yearData.summary.year1_min?.month} • {year2}: {yearData.summary.year2_min?.month}
                  </div>
                  <div className="my-kpi-sub">Annual minimum recorded month</div>
                </div>

                {/* 4. Seasonal Shift Anomaly */}
                <div className="my-kpi-card">
                  <div className="my-kpi-title">Monthly Anomaly Breakdown</div>
                  <div className="my-kpi-vals">
                    <span className="my-kpi-val1">{yearData.summary.months_higher} / 12</span>
                    <span className="my-kpi-vs">Months Higher</span>
                  </div>
                  <div className="my-kpi-delta delta-pos">
                    Max Spike: {yearData.summary.largest_positive_delta?.month} (+{yearData.summary.largest_positive_delta?.diff} {activeUnit})
                  </div>
                  <div className="my-kpi-sub">
                    {yearData.summary.months_lower} months were lower in {year1}
                  </div>
                </div>
              </div>

              {/* Chart 1: Dual-Year Comparative Curve */}
              <div className="my-chart-box">
                <div className="my-chart-header">
                  <h3 className="my-chart-title">
                    <span>📈 Monthly Profile & Shift Curve: {selectedRegion}</span>
                  </h3>
                  <div className="my-chart-legend">
                    <div className="legend-item">
                      <span className="legend-dot y1"></span>
                      <span>{year1} {year1 === 2026 ? "(Target / Projected)" : "(Observed)"}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot y2"></span>
                      <span>{year2} (NASA Baseline)</span>
                    </div>
                  </div>
                </div>
                <DualYearLineChart
                  data={yearData.monthly_records}
                  year1={year1}
                  year2={year2}
                  unit={activeUnit}
                />
              </div>

              {/* Chart 2: Monthly Divergence & Comparative Bars */}
              <div className="my-chart-box">
                <MonthlyDeltaBarChart
                  data={yearData.monthly_records}
                  year1={year1}
                  year2={year2}
                  unit={activeUnit}
                />
              </div>

              {/* Month-by-Month Detailed Breakdown Table */}
              <div className="my-chart-box">
                <div className="my-chart-header">
                  <h3 className="my-chart-title">
                    <span>📅 12-Month Detailed Comparison Table</span>
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Hover over rows to inspect granular values
                  </span>
                </div>
                <div className="my-table-wrapper">
                  <table className="my-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>{year1} Value</th>
                        <th>{year2} Value</th>
                        <th>Absolute Difference (Δ)</th>
                        <th>% Change</th>
                        <th>Status Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearData.monthly_records.map((r) => (
                        <tr key={r.month_num}>
                          <td style={{ fontWeight: "700" }}>{r.month_name}</td>
                          <td style={{ fontWeight: "700", color: "#2563eb" }}>
                            {r.year1_val} {r.unit}
                          </td>
                          <td style={{ fontWeight: "600", color: "#d97706" }}>
                            {r.year2_val} {r.unit}
                          </td>
                          <td style={{ fontWeight: "700", color: r.diff >= 0 ? "#dc2626" : "#2563eb" }}>
                            {r.diff > 0 ? "+" : ""}{r.diff} {r.unit}
                          </td>
                          <td style={{ fontWeight: "600" }}>
                            {r.pct_change > 0 ? "+" : ""}{r.pct_change}%
                          </td>
                          <td>
                            <span className={`table-tag ${r.diff >= 0 ? "pos" : "neg"}`}>
                              {r.status_tag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ComparePage;
