import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Map as MapIcon, Navigation, Flag, Target } from 'lucide-react';
import TravelErrorBoundary from './TravelErrorBoundary';

// Departure / Origin Pin Icon
const createOriginIcon = (name = 'Origin') => {
  return L.divIcon({
    className: 'custom-travel-origin-pin',
    html: `
      <div style="
        background: #16a34a;
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.45);
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
      ">
        <span style="font-size: 13px;">🚩</span>
        <span>From: ${name.split('(')[0].trim()}</span>
      </div>
    `,
    iconSize: [110, 30],
    iconAnchor: [55, 15],
    popupAnchor: [0, -15]
  });
};

// Arrival / Destination Pin Icon
const createDestinationIcon = (name = 'Destination', score = null) => {
  const scoreBadge = score != null ? `<span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 4px; font-size: 10px;">${Math.round(score)}/100</span>` : '';
  return L.divIcon({
    className: 'custom-travel-dest-pin',
    html: `
      <div style="
        background: #2563eb;
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
      ">
        <span style="font-size: 13px;">🎯</span>
        <span>To: ${name}</span>
        ${scoreBadge}
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [60, 15],
    popupAnchor: [0, -15]
  });
};

// Generic Destination Marker Pin
const createMarkerPin = (color = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-travel-spot-pin',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
      ">
        📍
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

// Smooth bounds fitter that frames both Origin and Destination pins
function FitRouteBounds({ originCoords, destCoords }) {
  const map = useMap();

  useEffect(() => {
    if (originCoords && destCoords) {
      const minLat = Math.min(originCoords[0], destCoords[0]);
      const maxLat = Math.max(originCoords[0], destCoords[0]);
      const minLon = Math.min(originCoords[1], destCoords[1]);
      const maxLon = Math.max(originCoords[1], destCoords[1]);

      const padLat = Math.max(0.4, (maxLat - minLat) * 0.15);
      const padLon = Math.max(0.4, (maxLon - minLon) * 0.15);

      const bounds = [
        [minLat - padLat, minLon - padLon],
        [maxLat + padLat, maxLon + padLon]
      ];

      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (destCoords) {
      map.setView(destCoords, 6, { animate: true });
    }
  }, [originCoords, destCoords, map]);

  return null;
}

function IndiaTravelMapInner({
  destinations = [],
  selectedDestination = null,
  origin = null,
  onSelectDestination = () => {},
  scoreMap = {}
}) {
  const defaultCenter = [22.5, 82.0]; // Center of India
  const indiaBounds = [
    [6.5, 68.0],
    [37.5, 97.5]
  ];

  // Coordinates of Origin (From where user travels)
  const originCoords = useMemo(() => {
    if (!origin) return null;
    const lat = Number(origin.lat ?? origin.latitude);
    const lon = Number(origin.lon ?? origin.longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat >= 8.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5) {
      return [lat, lon];
    }
    return null;
  }, [origin]);

  // Coordinates of Destination (Which location user wants to travel to)
  const destCoords = useMemo(() => {
    if (!selectedDestination) return null;
    const lat = Number(selectedDestination.lat ?? selectedDestination.latitude);
    const lon = Number(selectedDestination.lon ?? selectedDestination.longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat >= 8.0 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5) {
      return [lat, lon];
    }
    return null;
  }, [selectedDestination]);

  // Valid spots for exploration
  const validSpots = useMemo(() => {
    return destinations
      .map(d => {
        const lat = Number(d.lat ?? d.latitude);
        const lon = Number(d.lon ?? d.longitude);
        if (isNaN(lat) || isNaN(lon)) return null;
        if (lat < 8.0 || lat > 37.5 || lon < 68.0 || lon > 97.5) return null;
        // Skip rendering regular pin if it is currently selected destination
        if (selectedDestination?.name && d.name.toLowerCase() === selectedDestination.name.toLowerCase()) return null;
        return {
          ...d,
          lat,
          lon,
          state: d.state_name || d.state || 'India'
        };
      })
      .filter(Boolean);
  }, [destinations, selectedDestination]);

  const hasRoute = Boolean(originCoords && destCoords);

  return (
    <div className="st-card">
      <div className="st-card-title">
        <MapIcon size={20} className="text-blue-600" />
        <span>Travel Route & Journey Map (India)</span>
      </div>

      {/* Route Journey Strip Banner */}
      {hasRoute ? (
        <div style={{
          padding: '0.65rem 1rem',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '0.5rem',
          marginBottom: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.86rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <span style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Flag size={15} className="text-emerald-600" /> From: {origin.name.split('(')[0].trim()}
            </span>
            <span style={{ color: '#2563eb' }}>➔</span>
            <span style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Target size={15} className="text-blue-600" /> To: {selectedDestination.name}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', background: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
            🛰️ Pinned Route on Map
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
          Interactive map of India showing your departure location and target travel destination connected by travel trajectory.
        </p>
      )}

      <div className="st-map-container" style={{ height: '460px' }}>
        <MapContainer
          center={destCoords || originCoords || defaultCenter}
          zoom={destCoords ? 6 : 5}
          maxBounds={indiaBounds}
          minZoom={4}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <FitRouteBounds originCoords={originCoords} destCoords={destCoords} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Polyline Route Trajectory connecting Origin & Destination */}
          {hasRoute && (
            <Polyline
              positions={[originCoords, destCoords]}
              pathOptions={{
                color: '#2563eb',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.85
              }}
            />
          )}

          {/* 1. Origin / Departure Pin (From Where User Travels) */}
          {originCoords && (
            <Marker
              position={originCoords}
              icon={createOriginIcon(origin.name)}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '160px' }}>
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    🚩 Departure Point
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {origin.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Coordinates: {originCoords[0].toFixed(2)}°N, {originCoords[1].toFixed(2)}°E
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 2. Destination Pin (Which Location User Travels To) */}
          {destCoords && (
            <Marker
              position={destCoords}
              icon={createDestinationIcon(selectedDestination.name, scoreMap[selectedDestination.name])}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '170px' }}>
                  <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    🎯 Target Destination
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedDestination.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {selectedDestination.state || 'India'} • {destCoords[0].toFixed(2)}°N, {destCoords[1].toFixed(2)}°E
                  </div>
                  {scoreMap[selectedDestination.name] && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                      Comfort Index: {Math.round(scoreMap[selectedDestination.name])}/100
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 3. Other Indian Destination Pins (Clickable) */}
          {validSpots.map((dest) => {
            const destScore = scoreMap[dest.name] || 75;
            let markerColor = '#10b981';
            if (destScore < 40) markerColor = '#f97316';
            else if (destScore < 60) markerColor = '#eab308';
            else if (destScore < 80) markerColor = '#22c55e';

            return (
              <Marker
                key={dest.name}
                position={[dest.lat, dest.lon]}
                icon={createMarkerPin(markerColor)}
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '140px' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.9rem' }}>
                      {dest.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      {dest.state}
                    </div>
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectDestination(dest)}
                    >
                      Select Destination
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default function IndiaTravelMap(props) {
  return (
    <TravelErrorBoundary>
      <IndiaTravelMapInner {...props} />
    </TravelErrorBoundary>
  );
}
