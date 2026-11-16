import React, { useMemo } from 'react';
import { 
  Sun, 
  Mountain, 
  Compass, 
  Trees, 
  Building2, 
  Landmark, 
  Flame, 
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Thermometer,
  CloudRain,
  Droplets,
  Wind
} from 'lucide-react';

export const TRAVEL_TYPES = [
  { id: 'beach', name: 'Beach Vacation', icon: Sun },
  { id: 'mountain', name: 'Mountain / Hill Station', icon: Mountain },
  { id: 'adventure', name: 'Adventure / Trekking', icon: Compass },
  { id: 'wildlife', name: 'Wildlife / Nature', icon: Trees },
  { id: 'city', name: 'City Sightseeing', icon: Building2 },
  { id: 'religious', name: 'Religious / Cultural', icon: Landmark },
  { id: 'desert', name: 'Desert Tourism', icon: Flame },
  { id: 'general', name: 'General Travel', icon: Globe }
];

export function resolveDestinationBestActivities(destination) {
  if (!destination?.name) return { recommendedTypes: ['general'] };
  const dName = destination.name.toLowerCase();
  const elev = Number(destination.elevation_m ?? destination.altitude_m ?? 0);
  const zone = (destination.climate_zone || '').toLowerCase();

  if (['goa', 'puri', 'gokarna', 'pondicherry', 'andaman and nicobar islands', 'lakshadweep'].includes(dName) || zone.includes('coast') || zone.includes('island')) {
    return { recommendedTypes: ['beach', 'general', 'city'] };
  }
  if (elev >= 1200 || ['manali', 'shimla', 'srinagar', 'leh', 'ooty', 'munnar', 'darjeeling', 'gangtok'].includes(dName)) {
    return { recommendedTypes: ['mountain', 'adventure', 'wildlife'] };
  }
  if (['jaisalmer', 'jodhpur', 'bikaner', 'kutch'].includes(dName) || zone.includes('desert') || zone.includes('arid')) {
    return { recommendedTypes: ['desert', 'city', 'religious'] };
  }
  if (['varanasi', 'rishikesh', 'haridwar', 'tirupati', 'amritsar', 'madurai'].includes(dName)) {
    return { recommendedTypes: ['religious', 'city', 'adventure'] };
  }
  if (['coorg', 'wayanad', 'jim corbett', 'kaziranga'].includes(dName)) {
    return { recommendedTypes: ['wildlife', 'adventure', 'mountain'] };
  }
  return { recommendedTypes: ['general', 'city'] };
}

// Helper to evaluate "Why they should go or not go" from predicted climate values
export function evaluateActivityDecision(activityId, destination, metrics = {}) {
  const tMean = metrics.temperature_c ?? metrics.temp_mean_c ?? 22.0;
  const tMin = metrics.temp_min_c ?? (tMean - 5);
  const tMax = metrics.temp_max_c ?? (tMean + 5);
  const rain = metrics.rainfall_mm ?? metrics.rainfall_total_mm ?? 30.0;
  const humidity = metrics.humidity_pct ?? metrics.humidity_avg_pct ?? 60.0;
  const wind = metrics.wind_speed_ms ?? metrics.wind_speed_avg_ms ?? 2.5;

  const destName = destination?.name || 'Selected destination';
  const climateZone = (destination?.climate_zone || '').toLowerCase();
  const elevation = Number(destination?.elevation_m ?? destination?.altitude_m ?? 0);
  const isCoast = climateZone.includes('coast') || climateZone.includes('island') || ['goa', 'puri', 'gokarna', 'pondicherry', 'andaman and nicobar islands', 'lakshadweep', 'alibaug', 'daman'].includes(destName.toLowerCase());
  const isHill = elevation >= 750 || climateZone.includes('himalayan') || climateZone.includes('alpine') || climateZone.includes('hill') || ['manali', 'shimla', 'srinagar', 'leh', 'ooty', 'munnar', 'darjeeling', 'gangtok', 'shillong', 'coorg', 'wayanad'].includes(destName.toLowerCase());
  const isDesert = climateZone.includes('desert') || climateZone.includes('arid') || ['jaisalmer', 'jodhpur', 'bikaner', 'barmer', 'kutch'].includes(destName.toLowerCase());

  switch (activityId) {
    case 'beach': {
      if (!isCoast) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: No Coastal Terrain',
          reason: `${destName} is an inland / mountain region (${elevation > 0 ? `${elevation}m elevation` : 'inland plains'}) without a beach or coastline. Predicted temperatures of ${tMean.toFixed(1)}°C cannot support coastal/beach tourism.`,
          suitabilityScore: 15
        };
      }
      if (rain > 160) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Severe Monsoon Rain & Rough Sea',
          reason: `Heavy monsoon precipitation predicted (${rain.toFixed(0)} mm). Beaches are red-flagged, high sea surges prevent swimming, and water sports operations remain shut.`,
          suitabilityScore: 30
        };
      }
      if (tMean < 20) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Chilly Sea Conditions',
          reason: `Predicted temperature averages ${tMean.toFixed(1)}°C with brisk winds (${wind.toFixed(1)} m/s). Sea water is chilly for swimming, though dry beach walking is pleasant.`,
          suitabilityScore: 58
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Prime Beach Weather',
        reason: `Ideal beach holiday conditions! Predicted warm sunny skies with ${tMean.toFixed(1)}°C average temperature, low rainfall (${rain.toFixed(0)} mm), and gentle coastal breeze (${wind.toFixed(1)} m/s).`,
        suitabilityScore: 92
      };
    }

    case 'mountain': {
      if (!isHill) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Lowland / Plains Terrain',
          reason: `${destName} is situated in plains / coastal geography (${elevation}m AMSL) without mountain ridges, hill valleys, or alpine terrain.`,
          suitabilityScore: 20
        };
      }
      if (rain > 180) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Monsoon Landslide & Roadblock Danger',
          reason: `High monsoon precipitation predicted (${rain.toFixed(0)} mm). High vulnerability to mountain landslides, highway roadblocks, and swollen river torrents.`,
          suitabilityScore: 28
        };
      }
      if (tMean < 3.0) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'RECOMMENDED FOR SNOW: Freezing Sub-Zero Chills',
          reason: `Predicted temperatures average ${tMean.toFixed(1)}°C with sub-zero lows of ${tMin.toFixed(1)}°C and snowfall potential. Excellent for winter snow sightseeing, but requires heavy thermal parkas and caution on black-ice roads.`,
          suitabilityScore: 74
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Refreshing Mountain Climate',
        reason: `Pleasant alpine conditions! Predicted ambient temperature of ${tMean.toFixed(1)}°C with minimal rain risk (${rain.toFixed(0)} mm) and clear mountain view horizons.`,
        suitabilityScore: 90
      };
    }

    case 'adventure': {
      if (rain > 80) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Wet, Slippery & Dangerous Trails',
          reason: `Expected rainfall of ${rain.toFixed(0)} mm makes hiking trails slippery, causes mudslides, and impairs outdoor visibility. Trekking routes and rafting may be suspended.`,
          suitabilityScore: 25
        };
      }
      if (wind > 5.5) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: High Wind Gusts',
          reason: `Brisk winds predicted at ${wind.toFixed(1)} m/s. May disrupt paragliding, open-ridge walking, and river sports. Check local sporting clearances.`,
          suitabilityScore: 60
        };
      }
      if (tMin < -2.0) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Severe Sub-Zero Cold',
          reason: `Night temperatures plunge to ${tMin.toFixed(1)}°C. High mountain passes may be snowbound. Viable only for equipped snow trekkers; amateur trails closed.`,
          suitabilityScore: 62
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Optimal Trail & Adventure Weather',
        reason: `Dry, stable ground! Only ${rain.toFixed(0)} mm expected rain, light breeze (${wind.toFixed(1)} m/s), and clear daylight visibility allow uninterrupted trekking, climbing, and outdoor sports.`,
        suitabilityScore: 88
      };
    }

    case 'wildlife': {
      if (rain > 120) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Monsoon Safari Track Closures',
          reason: `Monsoon rainfall (${rain.toFixed(0)} mm) leads to flooded jungle tracks and dense vegetation overgrowth; major national park core zones remain closed.`,
          suitabilityScore: 20
        };
      }
      if (tMax > 38.0) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Extreme Afternoon Heat',
          reason: `Peak daytime temperature predicted at ${tMax.toFixed(1)}°C. Safaris only viable during early dawn (6:00 AM); avoid midday exposure.`,
          suitabilityScore: 55
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: High Wildlife Sighting Probability',
        reason: `Dry season terrain (${rain.toFixed(0)} mm expected rain) thins out forest foliage and concentrates animals around natural watering holes under comfortable ${tMean.toFixed(1)}°C daytime skies.`,
        suitabilityScore: 86
      };
    }

    case 'city': {
      if (tMax > 38.5) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Scorching Heatwave Risk',
          reason: `High daytime temperatures (${tMax.toFixed(1)}°C) make open-air walking tours and monument explorations exhausting and carry heatstroke risks.`,
          suitabilityScore: 35
        };
      }
      if (rain > 150) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Rain Disruptions & Traffic',
          reason: `Frequent downpours (${rain.toFixed(0)} mm) and urban waterlogging may hamper walking tours and local transit.`,
          suitabilityScore: 55
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Comfortable Urban Sightseeing',
        reason: `Pleasant walking conditions! Moderate temperature (${tMean.toFixed(1)}°C) and manageable humidity (${humidity.toFixed(0)}%) make full-day monument visits and local bazaar walks enjoyable.`,
        suitabilityScore: 90
      };
    }

    case 'religious': {
      if (tMax > 39.0) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Hot Temple Courtyards',
          reason: `Intense midday sun (${tMax.toFixed(1)}°C) makes walking barefoot on stone temple courtyards painful. Schedule temple visits for early morning or dusk.`,
          suitabilityScore: 60
        };
      }
      if (rain > 180) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Slippery Ghats & Temple Steps',
          reason: `Monsoon downpours (${rain.toFixed(0)} mm) cause slippery stone steps along holy river ghats and crowded temple walkways.`,
          suitabilityScore: 58
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Peaceful Spiritual & Pilgrimage Atmosphere',
        reason: `Comfortable pilgrimage climate! Mild ${tMean.toFixed(1)}°C weather with low precipitation (${rain.toFixed(0)} mm) allows peaceful ghat visits, temple queues, and evening Aarti ceremonies.`,
        suitabilityScore: 92
      };
    }

    case 'desert': {
      if (!isDesert) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Non-Desert Region',
          reason: `${destName} is not a desert territory (${destination?.state || 'India'}). Desert sand dunes and camel expeditions are not available here.`,
          suitabilityScore: 10
        };
      }
      if (tMax > 38.0) {
        return {
          status: 'not_recommended',
          badge: '🔴 Avoid',
          verdict: 'NOT RECOMMENDED: Severe Desert Heatstroke Hazard',
          reason: `Daytime temperatures exceed ${tMax.toFixed(1)}°C with blazing solar radiation. Desert sand dune camping and camel safaris are unbearable and dangerous.`,
          suitabilityScore: 20
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Golden Season for Desert Dunes',
        reason: `Peak desert weather! Enjoy pleasant daytime warmth (${tMean.toFixed(1)}°C), virtually zero rainfall (${rain.toFixed(0)} mm), and crisp starry nights in the Thar sand dunes.`,
        suitabilityScore: 94
      };
    }

    default: {
      if (rain > 160) {
        return {
          status: 'caution',
          badge: '🟡 Caution',
          verdict: 'EXERCISE CAUTION: Wet Travel Window',
          reason: `Predicted precipitation is elevated at ${rain.toFixed(0)} mm. Pack water-resistant gear and plan flexible indoor activities.`,
          suitabilityScore: 62
        };
      }
      return {
        status: 'recommended',
        badge: '🟢 Go For It',
        verdict: 'RECOMMENDED: Balanced Travel Climate',
        reason: `Well-balanced meteorological conditions! Average temperature of ${tMean.toFixed(1)}°C and ${rain.toFixed(0)} mm rainfall provide comfortable overall holidaying.`,
        suitabilityScore: 88
      };
    }
  }
}

export default function TravelTypeSelector({
  selectedType = 'general',
  onSelectType = () => {},
  destination = null,
  activeClimateMetrics = {}
}) {
  const current = TRAVEL_TYPES.find(t => t.id === selectedType) || TRAVEL_TYPES[7];

  // Evaluate the decision for the currently selected activity based on real predicted values
  const activeDecision = useMemo(() => {
    return evaluateActivityDecision(selectedType, destination, activeClimateMetrics);
  }, [selectedType, destination, activeClimateMetrics]);

  // Pre-calculate decision badges for all 8 activity pills
  const allDecisions = useMemo(() => {
    const map = {};
    TRAVEL_TYPES.forEach(t => {
      map[t.id] = evaluateActivityDecision(t.id, destination, activeClimateMetrics);
    });
    return map;
  }, [destination, activeClimateMetrics]);

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Compass size={20} className="text-blue-600" />
        <span>Travel Type & Activity Focus</span>
        {destination?.name && (
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
            Location: {destination.name}
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '0.85rem' }}>
        Activity suitability decisions below are computed directly from our <strong>predicted NASA POWER meteorological values</strong> (temperature, rainfall risk, humidity, and wind):
      </p>

      {/* 8 Activity Pills with Data-Backed Decision Badges */}
      <div className="st-type-grid" style={{ marginBottom: '1.25rem' }}>
        {TRAVEL_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = selectedType === type.id;
          const dec = allDecisions[type.id];

          return (
            <button
              key={type.id}
              type="button"
              className={`st-type-pill ${isActive ? 'active' : ''}`}
              style={{
                position: 'relative',
                borderWidth: '1.5px',
                borderColor: isActive 
                  ? '#2563eb' 
                  : (dec.status === 'recommended' ? '#86efac' : (dec.status === 'not_recommended' ? '#fca5a5' : '#fde047')),
                background: isActive ? undefined : (dec.status === 'recommended' ? '#f0fdf4' : (dec.status === 'not_recommended' ? '#fff5f5' : '#fffdf5'))
              }}
              onClick={() => onSelectType(type.id)}
            >
              {/* Decision Badge */}
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '4px',
                background: dec.status === 'recommended' ? '#16a34a' : (dec.status === 'not_recommended' ? '#dc2626' : '#d97706'),
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '0.1rem 0.35rem',
                borderRadius: '9999px',
                letterSpacing: '0.02em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {dec.badge}
              </span>

              <Icon size={20} className={isActive ? 'text-blue-600' : (dec.status === 'recommended' ? 'text-emerald-600' : (dec.status === 'not_recommended' ? 'text-rose-500' : 'text-amber-500'))} />
              <span className="st-type-label">{type.name}</span>
            </button>
          );
        })}
      </div>

      {/* Decision & Reason Why You Should Go or Not Go (Data-Backed) */}
      <div style={{
        padding: '1.2rem',
        borderRadius: '0.75rem',
        border: '1.5px solid',
        borderColor: activeDecision.status === 'recommended' ? '#86efac' : (activeDecision.status === 'not_recommended' ? '#fca5a5' : '#fde047'),
        background: activeDecision.status === 'recommended' ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : (activeDecision.status === 'not_recommended' ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fffdf5 0%, #ffffff 100%)'),
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* Header with Verdict */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeDecision.status === 'recommended' && <CheckCircle2 size={22} className="text-emerald-600" />}
            {activeDecision.status === 'caution' && <AlertTriangle size={22} className="text-amber-600" />}
            {activeDecision.status === 'not_recommended' && <XCircle size={22} className="text-rose-600" />}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {activeDecision.verdict} for {current.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Evaluated for <strong>{destination?.name || 'Selected Destination'}</strong>
              </div>
            </div>
          </div>

          <span style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            color: '#ffffff',
            background: activeDecision.status === 'recommended' ? '#16a34a' : (activeDecision.status === 'not_recommended' ? '#dc2626' : '#d97706')
          }}>
            Suitability: {activeDecision.suitabilityScore}/100
          </span>
        </div>

        {/* Reason Why Go or Not Go */}
        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.55, marginBottom: '0.85rem' }}>
          <strong>Meteorological Reason:</strong> {activeDecision.reason}
        </div>

        {/* Predicted Values Snapshot */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.5rem',
          padding: '0.65rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Thermometer size={14} className="text-rose-500" />
            <span>Temp: <strong>{(activeClimateMetrics.temperature_c ?? activeClimateMetrics.temp_mean_c ?? 22)?.toFixed(1)}°C</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CloudRain size={14} className="text-blue-500" />
            <span>Rain: <strong>{(activeClimateMetrics.rainfall_mm ?? activeClimateMetrics.rainfall_total_mm ?? 30)?.toFixed(0)} mm</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Droplets size={14} className="text-teal-500" />
            <span>Humidity: <strong>{(activeClimateMetrics.humidity_pct ?? activeClimateMetrics.humidity_avg_pct ?? 60)?.toFixed(0)}%</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wind size={14} className="text-indigo-500" />
            <span>Wind: <strong>{(activeClimateMetrics.wind_speed_ms ?? activeClimateMetrics.wind_speed_avg_ms ?? 2.5)?.toFixed(1)} m/s</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
