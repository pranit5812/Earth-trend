import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, Table } from 'lucide-react';

const formatNum = (val, decimals = 4) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
};

// Clean SVG sparkline for time-series or trend visualization
const MiniSparkline = ({ data = [], color = '#2563eb', height = 48, width = 280 }) => {
  if (!data || !Array.isArray(data) || data.length < 2) return null;

  const validVals = data
    .map((d) => (typeof d === 'number' ? d : d?.value ?? 0))
    .filter((v) => typeof v === 'number' && !isNaN(v));

  if (validVals.length < 2) return null;

  const min = Math.min(...validVals);
  const max = Math.max(...validVals);
  const range = max - min || 1;

  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = validVals
    .map((v, i) => {
      const x = padding + (i / (validVals.length - 1)) * usableWidth;
      const y = height - padding - ((v - min) / range) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chat-sparkline-container">
      <svg width={width} height={height} className="chat-sparkline-svg">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="chat-sparkline-labels">
        <span>Min: {formatNum(min, 2)}</span>
        <span>Max: {formatNum(max, 2)}</span>
      </div>
    </div>
  );
};

const ChatDataVisualization = ({ metrics = null, evidenceData = null, visualizationType = null }) => {
  if (!metrics && !evidenceData) return null;

  try {
    const hasTrendMetrics =
      metrics &&
      typeof metrics === 'object' &&
      (metrics.sens_slope !== undefined || metrics.p_value !== undefined || metrics.rate_of_change !== undefined);

    const hasCorrelationMetrics = metrics && typeof metrics === 'object' && metrics.pearson_r !== undefined;

    const directionStr = typeof metrics?.direction === 'string' ? metrics.direction : '';
    const dirLower = directionStr.toLowerCase();

    // Check if comparison table has valid regions array
    const hasComparisonRegions =
      evidenceData &&
      typeof evidenceData === 'object' &&
      Array.isArray(evidenceData.regions) &&
      evidenceData.regions.length > 0;

    const isComparison = (visualizationType === 'comparison_table' || hasComparisonRegions) && hasComparisonRegions;

    return (
      <div className="chat-dataviz-container">
        {/* Trend Metrics Cards */}
        {hasTrendMetrics && (
          <div className="chat-metrics-grid">
            {directionStr && (
              <div className={`chat-metric-card direction-${dirLower}`}>
                <div className="chat-metric-title">
                  {dirLower.includes('inc') ? (
                    <TrendingUp size={14} className="metric-icon-inc" />
                  ) : dirLower.includes('dec') ? (
                    <TrendingDown size={14} className="metric-icon-dec" />
                  ) : (
                    <Minus size={14} />
                  )}
                  <span>Trend Direction</span>
                </div>
                <div className="chat-metric-value">{directionStr}</div>
              </div>
            )}

            {(metrics.rate_of_change !== undefined || metrics.sens_slope !== undefined) && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <Activity size={14} />
                  <span>Rate of Change (Sen's Slope)</span>
                </div>
                <div className="chat-metric-value">
                  {formatNum(metrics.rate_of_change ?? metrics.sens_slope, 4)}{' '}
                  <span className="chat-metric-unit">{String(metrics.unit || 'units/yr')}</span>
                </div>
              </div>
            )}

            {metrics.p_value !== undefined && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <BarChart2 size={14} />
                  <span>p-value (Significance)</span>
                </div>
                <div className="chat-metric-value">
                  {formatNum(metrics.p_value, 5)}
                  <span className={`chat-significance-tag ${metrics.statistically_significant ? 'sig-yes' : 'sig-no'}`}>
                    {metrics.statistically_significant ? 'Significant (p < 0.05)' : 'Not Significant'}
                  </span>
                </div>
              </div>
            )}

            {metrics.z_score !== undefined && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <span>Mann-Kendall Z-Score</span>
                </div>
                <div className="chat-metric-value">{formatNum(metrics.z_score, 2)}</div>
              </div>
            )}

            {metrics.sample_size !== undefined && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <span>Valid Observations</span>
                </div>
                <div className="chat-metric-value">{String(metrics.sample_size)}</div>
              </div>
            )}
          </div>
        )}

        {/* Correlation Metrics */}
        {hasCorrelationMetrics && (
          <div className="chat-metrics-grid">
            <div className="chat-metric-card">
              <div className="chat-metric-title">
                <Activity size={14} />
                <span>Pearson Correlation (r)</span>
              </div>
              <div className="chat-metric-value">{formatNum(metrics.pearson_r, 3)}</div>
            </div>
            {metrics.r_squared !== undefined && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <span>R-Squared (Variance Explained)</span>
                </div>
                <div className="chat-metric-value">{(Number(metrics.r_squared) * 100).toFixed(1)}%</div>
              </div>
            )}
            {metrics.p_value !== undefined && (
              <div className="chat-metric-card">
                <div className="chat-metric-title">
                  <span>Significance (p-value)</span>
                </div>
                <div className="chat-metric-value">{formatNum(metrics.p_value, 5)}</div>
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        {isComparison && (
          <div className="chat-comparison-table-wrapper">
            <div className="chat-table-header">
              <Table size={14} />
              <span>Regional Comparison Summary</span>
            </div>
            <table className="chat-comparison-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Rate of Change</th>
                  <th>Direction</th>
                  <th>p-value</th>
                  <th>Significance</th>
                </tr>
              </thead>
              <tbody>
                {evidenceData.regions.map((reg, idx) => {
                  const dir = typeof reg?.direction === 'string' ? reg.direction : 'Stable';
                  return (
                    <tr key={idx}>
                      <td><strong>{String(reg?.region_name || reg?.region_id || `Region ${idx + 1}`)}</strong></td>
                      <td>{formatNum(reg?.sens_slope, 4)} {String(reg?.unit || '')}</td>
                      <td>
                        <span className={`dir-badge ${dir.toLowerCase()}`}>
                          {dir}
                        </span>
                      </td>
                      <td>{formatNum(reg?.p_value, 5)}</td>
                      <td>{reg?.statistically_significant ? '✅ Yes' : '❌ No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sparkline for historical data series */}
        {evidenceData && Array.isArray(evidenceData.series) && evidenceData.series.length > 3 && (
          <div className="chat-sparkline-box">
            <div className="chat-sparkline-header">
              <span>Historical Observed Trajectory</span>
            </div>
            <MiniSparkline data={evidenceData.series} color="#2563eb" />
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('Failed to render chat data visualization:', err);
    return null;
  }
};

export default ChatDataVisualization;
