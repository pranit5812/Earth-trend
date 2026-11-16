import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle, Navigation, X } from 'lucide-react';
import { getTravelDestinations } from '../../api/axios';

const POPULAR_DESTINATIONS = [
  { name: 'Goa', state: 'Goa', lat: 15.2993, lon: 74.124 },
  { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lon: 77.1892 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
  { name: 'Leh', state: 'Ladakh', lat: 34.1526, lon: 77.5771 },
  { name: 'Ooty', state: 'Tamil Nadu', lat: 11.4102, lon: 76.6950 },
  { name: 'Munnar', state: 'Kerala', lat: 10.0889, lon: 77.0595 },
  { name: 'Coorg', state: 'Karnataka', lat: 12.3375, lon: 75.8069 },
  { name: 'Wayanad', state: 'Kerala', lat: 11.6854, lon: 76.1320 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125 },
  { name: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lon: 70.9083 },
  { name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lon: 78.2676 },
  { name: 'Darjeeling', state: 'West Bengal', lat: 27.0410, lon: 88.2663 },
  { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lon: 88.6065 },
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lon: 91.8933 },
  { name: 'Cherrapunji', state: 'Meghalaya', lat: 25.2744, lon: 91.7323 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { name: 'Andaman and Nicobar Islands', state: 'Andaman and Nicobar Islands', lat: 11.6234, lon: 92.7265 },
  { name: 'Lakshadweep', state: 'Lakshadweep', lat: 10.5667, lon: 72.6417 }
];

export default function IndiaDestinationSelector({
  selectedDestination = null,
  onSelectDestination = () => {},
  onClearDestination = () => {}
}) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foreignAlert, setForeignAlert] = useState(null);

  // Fetch verified Indian destinations from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getTravelDestinations()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data && res.data.destinations) {
          const normalized = res.data.destinations.map(d => {
            const lat = Number(d.lat ?? d.latitude ?? 20.0);
            const lon = Number(d.lon ?? d.longitude ?? 78.0);
            return {
              ...d,
              name: d.name,
              state: d.state_name || d.state || 'India',
              state_name: d.state_name || d.state || 'India',
              district: d.district || '',
              lat,
              lon,
              latitude: lat,
              longitude: lon,
              altitude_m: d.elevation_m ?? d.altitude_m ?? 0,
              elevation_m: d.elevation_m ?? d.altitude_m ?? 0
            };
          });
          setDestinations(normalized);
        }
      })
      .catch((err) => {
        console.error('Failed to load destinations:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Filter destinations by search query
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return destinations.filter((d) => {
      const matchName = d.name.toLowerCase().includes(q);
      const matchState = (d.state || '').toLowerCase().includes(q);
      const matchDist = (d.district || '').toLowerCase().includes(q);
      return matchName || matchState || matchDist;
    });
  }, [destinations, searchQuery]);

  const handleSelect = (dest) => {
    setForeignAlert(null);
    const lat = Number(dest.lat ?? dest.latitude);
    const lon = Number(dest.lon ?? dest.longitude);

    // Double check India bounding box
    if (isNaN(lat) || isNaN(lon) || lat < 8.0 || lat > 37.5 || lon < 68.0 || lon > 97.5) {
      setForeignAlert(`Boundary Alert: "${dest.name}" is outside the sovereign boundaries of India (8.0°N–37.5°N, 68.0°E–97.5°E). Smart Travel Planner is strictly India-only.`);
      return;
    }

    const cleanDest = {
      ...dest,
      name: dest.name,
      state: dest.state_name || dest.state || 'India',
      state_name: dest.state_name || dest.state || 'India',
      district: dest.district || '',
      lat,
      lon,
      latitude: lat,
      longitude: lon,
      altitude_m: dest.elevation_m ?? dest.altitude_m ?? 0
    };

    onSelectDestination(cleanDest);
    setSearchQuery('');
  };

  const handleSelectPopularChip = (item) => {
    // Look up in loaded destinations first for complete metadata
    const match = destinations.find(d => d.name.toLowerCase() === item.name.toLowerCase());
    if (match) {
      handleSelect(match);
    } else {
      handleSelect({
        name: item.name,
        state: item.state,
        state_name: item.state,
        district: item.name,
        lat: item.lat,
        lon: item.lon,
        latitude: item.lat,
        longitude: item.lon,
        elevation_m: 0,
        altitude_m: 0
      });
    }
  };

  const handleSearchCheck = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const foreignTest = ['paris', 'dubai', 'london', 'bangkok', 'singapore', 'new york', 'tokyo', 'rome', 'bali', 'phuket', 'maldives'];
    const matchedForeign = foreignTest.find(f => val.toLowerCase().includes(f));
    if (matchedForeign) {
      setForeignAlert(`Boundary Alert: "${val}" is an international destination. AstroKites Smart Travel Planner operates exclusively within India. Please select a destination within India.`);
    } else {
      setForeignAlert(null);
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Navigation size={20} className="text-blue-600" />
        <span>Select Destination in India</span>
        <span className="st-india-badge" style={{ color: '#1e40af', background: '#dbeafe', borderColor: '#bfdbfe' }}>
          🇮🇳 India Only
        </span>
      </div>

      {foreignAlert && (
        <div className="st-alert-india" role="alert">
          <AlertCircle size={20} className="flex-shrink-0 text-orange-600" />
          <div>
            <strong>Exclusive Jurisdiction Notice:</strong> {foreignAlert}
          </div>
        </div>
      )}

      {/* Suggested Popular Destinations (User Chooses, Not Auto-Selected) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="st-label" style={{ marginBottom: '0.4rem', color: '#1e3a8a' }}>
          <MapPin size={14} /> Suggested Indian Destinations (Click to choose):
        </div>
        <div className="st-chips-wrap">
          {POPULAR_DESTINATIONS.map((item) => {
            const isSelected = selectedDestination && selectedDestination.name.toLowerCase() === item.name.toLowerCase();
            return (
              <button
                key={item.name}
                type="button"
                className={`st-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectPopularChip(item)}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div className="st-input-group">
          <label className="st-label">
            <Search size={14} /> Search Destination / City:
          </label>
          <input
            type="text"
            className="st-input"
            placeholder="e.g. Manali, Ooty, Jaipur, Munnar..."
            value={searchQuery}
            onChange={handleSearchCheck}
          />
        </div>
      </div>

      {/* Matching Destinations List (if searching) */}
      {searchQuery && (
        <div style={{ marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem' }}>
          {filteredDestinations.length === 0 ? (
            <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
              No matching Indian destination found. AstroKites only evaluates locations within India.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.35rem' }}>
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => handleSelect(dest)}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.65rem',
                    background: selectedDestination?.name === dest.name ? '#dbeafe' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{dest.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {dest.state} • {dest.lat?.toFixed(2)}°N, {dest.lon?.toFixed(2)}°E
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Selected Destination Pill or Helper Banner */}
      {selectedDestination ? (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} className="text-emerald-600" />
            <div>
              <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem' }}>
                Selected: {selectedDestination.name}
              </span>
              <span style={{ color: '#4b5563', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                ({selectedDestination.state || 'India'}, {selectedDestination.district || ''})
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#374151', background: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
              🛰️ {selectedDestination.lat?.toFixed(2)}°N, {selectedDestination.lon?.toFixed(2)}°E
              {selectedDestination.altitude_m ? ` • ${selectedDestination.altitude_m}m AMSL` : ''}
            </div>
            <button
              type="button"
              onClick={onClearDestination}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: '#dc2626',
                background: '#ffffff',
                border: '1px solid #fca5a5',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Clear selection to choose another destination"
            >
              <X size={13} /> Change
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem 1rem',
          background: '#eff6ff',
          border: '1px dashed #93c5fd',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Navigation size={16} />
          <span>No destination selected yet. <strong>Click any suggested destination above</strong> or search your desired Indian travel spot.</span>
        </div>
      )}
    </div>
  );
}
