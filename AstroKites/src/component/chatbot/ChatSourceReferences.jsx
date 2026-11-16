import React from 'react';
import { Database, CheckCircle2, ExternalLink } from 'lucide-react';

const SOURCE_METADATA = {
  'NASA POWER API': {
    name: 'NASA POWER API',
    desc: 'Solar & Meteorological Surface Observations',
    url: 'https://power.larc.nasa.gov/'
  },
  'NASA_POWER_MERRA2_ASSIMILATED': {
    name: 'NASA POWER (MERRA-2)',
    desc: 'Assimilated Meteorological Reanalysis & Satellite Observations',
    url: 'https://power.larc.nasa.gov/'
  },
  'NASA GPM IMERG': {
    name: 'NASA GPM IMERG',
    desc: 'Global Precipitation Measurement Satellite Data',
    url: 'https://gpm.nasa.gov/'
  },
  'Open-Meteo Weather API': {
    name: 'Open-Meteo API',
    desc: 'High-Resolution Numerical Weather Prediction',
    url: 'https://open-meteo.com/'
  },
  'OpenWeatherMap API': {
    name: 'OpenWeatherMap',
    desc: 'Global Weather Forecast Data',
    url: 'https://openweathermap.org/'
  },
  "Theil-Sen Robust Linear Trend Engine": {
    name: "Sen's Slope Engine",
    desc: 'Non-parametric median slope estimator',
  },
  "Mann-Kendall Rank Correlation Test": {
    name: "Mann-Kendall Test",
    desc: 'Non-parametric monotonic trend significance (alpha=0.05)',
  },
  "NASA SMAP / MODIS Observations": {
    name: "NASA SMAP / MODIS",
    desc: 'Soil Moisture & Normalized Difference Vegetation Index (NDVI)',
    url: 'https://smap.jpl.nasa.gov/'
  }
};

const extractSourceInfo = (src) => {
  if (typeof src === 'string') {
    const known = SOURCE_METADATA[src];
    return {
      name: known ? known.name : src,
      desc: known ? known.desc : 'Verified backend climate intelligence service',
      url: known ? known.url : null
    };
  }
  if (src && typeof src === 'object') {
    const rawName = src.name || src.dataset_source || src.provider || 'Earth Science Dataset';
    const known = SOURCE_METADATA[rawName];
    return {
      name: known ? known.name : String(rawName),
      desc: src.validation || src.desc || (known ? known.desc : 'Assimilated observations'),
      url: src.url || (known ? known.url : null)
    };
  }
  return {
    name: 'Climate Observation Source',
    desc: 'Verified backend service',
    url: null
  };
};

const ChatSourceReferences = ({ sources = [] }) => {
  if (!sources || !Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className="chat-sources-wrapper">
      <div className="chat-sources-header">
        <Database size={13} className="chat-sources-icon" />
        <span>Verified Data Sources & Provenance</span>
      </div>
      <div className="chat-sources-list">
        {sources.map((src, idx) => {
          const meta = extractSourceInfo(src);
          return (
            <div key={idx} className="chat-source-badge" title={String(meta.desc || '')}>
              <CheckCircle2 size={12} className="chat-source-check" />
              <span className="chat-source-name">{String(meta.name)}</span>
              {meta.url && (
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-source-link"
                  title={`Visit ${meta.name} documentation`}
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSourceReferences;
