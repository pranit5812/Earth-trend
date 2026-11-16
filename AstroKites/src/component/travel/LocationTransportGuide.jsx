import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Bike, 
  Bus, 
  Train, 
  Plane, 
  MapPin, 
  Navigation, 
  Clock, 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { usePageContext } from '../../context/PageContext';

// Major Indian Origin Hubs with accurate coordinates
export const INDIAN_ORIGIN_HUBS = [
  { name: 'New Delhi (NCR)', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai (Maharashtra)', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru (Karnataka)', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata (West Bengal)', lat: 22.5726, lon: 88.3639 },
  { name: 'Chennai (Tamil Nadu)', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad (Telangana)', lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad (Gujarat)', lat: 23.0225, lon: 72.5714 },
  { name: 'Pune (Maharashtra)', lat: 18.5204, lon: 73.8567 },
  { name: 'Chandigarh (Punjab/Haryana)', lat: 30.7333, lon: 76.7794 },
  { name: 'Jaipur (Rajasthan)', lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow (Uttar Pradesh)', lat: 26.8467, lon: 80.9462 }
];

// Curated transit hub information for major destinations
const DESTINATION_TRANSIT_HUBS = {
  srinagar: {
    nearestAirport: 'Sheikh ul-Alam International Airport (SXR)',
    airportDistKm: 12,
    nearestStation: 'Now connected via Udhampur-Srinagar-Baramulla Rail Link (Srinagar Station) & Jammu Tawi (JAT, 260 km)',
    stationDistKm: 15,
    majorHighways: 'NH-44 (Jammu-Srinagar Highway via Chenani-Nashri & Qazigund Tunnels)',
    terrainType: 'Mountain Valley & Highland Passes',
    bikeSuitability: 'High (Legendary mountain touring, best Jun-Oct; caution in icy winter)',
    busDetails: 'J&K SRTC and private Volvo luxury buses from Delhi (ISBT Kashmere Gate) & Jammu.'
  },
  manali: {
    nearestAirport: 'Bhuntar Airport, Kullu (KUU)',
    airportDistKm: 50,
    nearestStation: 'Chandigarh Railway Station (CDG, 305 km) or Una Himachal (UHL, 240 km)',
    stationDistKm: 305,
    majorHighways: 'NH-21 / Kiratpur-Nerchowk 4-lane expressway and Kullu-Manali highway',
    terrainType: 'Himalayan Ghat Roads & High Altitude Passes',
    bikeSuitability: 'World-Renowned (Hub for Ladakh & Spiti motorcycle expeditions)',
    busDetails: 'Regular overnight luxury AC Volvo buses from Delhi ISBT Kashmere Gate & Chandigarh.'
  },
  shimla: {
    nearestAirport: 'Jubbarhatti Airport (SLV, 22 km) or Chandigarh (IXC, 120 km)',
    airportDistKm: 22,
    nearestStation: 'Shimla Railway Station (UNESCO Kalka-Shimla Toy Train terminal)',
    stationDistKm: 2,
    majorHighways: 'NH-5 (Himalayan Expressway from Panchkula-Kalka-Solan)',
    terrainType: 'Mid-Himalayan Mountain Ridges',
    bikeSuitability: 'Very Good (Scenic tarmac riding from Chandigarh through pine hills)',
    busDetails: 'Frequent HRTC and deluxe Volvo buses every hour from Delhi and Chandigarh.'
  },
  goa: {
    nearestAirport: 'Manohar International Airport Mopa (GOX) & Dabolim Airport (GOI)',
    airportDistKm: 28,
    nearestStation: 'Madgaon Junction (MAO) & Thivim (THVM) on Konkan Railway',
    stationDistKm: 18,
    majorHighways: 'NH-66 (Mumbai-Goa coastal highway) & NH-4A (Belagavi-Goa ghat)',
    terrainType: 'Coastal Plain & Western Ghat foothills',
    bikeSuitability: 'Excellent (Famous for coastal cruising, scooter rentals, and Konkan rides)',
    busDetails: 'Overnight sleeper and luxury multi-axle buses from Mumbai, Pune, Bengaluru, and Hyderabad.'
  },
  leh: {
    nearestAirport: 'Kushok Bakula Rimpochee Airport (IXL)',
    airportDistKm: 5,
    nearestStation: 'Jammu Tawi (JAT, 700 km) or Srinagar (420 km)',
    stationDistKm: 700,
    majorHighways: 'Manali-Leh Highway (NH-3) & Srinagar-Leh Highway (NH-1D)',
    terrainType: 'Ultra-High Altitude Trans-Himalayan Passes (>4,500m)',
    bikeSuitability: 'Bucket-List / Extreme (The ultimate motorcycle adventure; requires 2-day acclimatization)',
    busDetails: 'HRTC and JKSRTC buses operate seasonally (June to October) from Manali and Srinagar.'
  },
  ooty: {
    nearestAirport: 'Coimbatore International Airport (CJB)',
    airportDistKm: 88,
    nearestStation: 'Udhagamandalam Station (Nilgiri Mountain Railway) & Mettupalayam (MTP, 46 km)',
    stationDistKm: 3,
    majorHighways: 'NH-181 (via 36 hairpin bends of Kalhatty Ghat or Kotagiri route)',
    terrainType: 'Nilgiri Mountain Slopes & Forest Ghats',
    bikeSuitability: 'Excellent (Thrilling mountain bends and scenic tea garden sweeps)',
    busDetails: 'TNSTC and KSRTC state and private buses from Bengaluru, Mysuru, and Coimbatore.'
  },
  munnar: {
    nearestAirport: 'Cochin International Airport (COK)',
    airportDistKm: 110,
    nearestStation: 'Aluva Railway Station (AWY, 110 km) or Ernakulam Junction (ERS, 130 km)',
    stationDistKm: 110,
    majorHighways: 'NH-85 (Kochi-Madurai-Dhanushkodi Highway via Neriamangalam & Cheeyappara)',
    terrainType: 'Western Ghats Highland Slopes',
    bikeSuitability: 'Spectacular (Misty curves through tea gardens and waterfalls)',
    busDetails: 'Regular KSRTC fast-passenger and low-floor AC buses from Kochi and Munnar depots.'
  },
  jaisalmer: {
    nearestAirport: 'Jaisalmer Airport (JSA, seasonal) or Jodhpur Airport (JDH, 280 km)',
    airportDistKm: 12,
    nearestStation: 'Jaisalmer Railway Station (JSM - direct trains from Delhi, Jaipur, Jodhpur)',
    stationDistKm: 2,
    majorHighways: 'NH-11 & NH-68 (Smooth straight desert expressways across the Thar)',
    terrainType: 'Arid Thar Desert Plains & Sand Dune Expanses',
    bikeSuitability: 'Superb (Long open desert asphalt highways; carry ample water)',
    busDetails: 'RSRTC and private sleeper coaches connecting Delhi, Jaipur, Jodhpur, and Ahmedabad.'
  },
  rishikesh: {
    nearestAirport: 'Dehradun Jolly Grant Airport (DED)',
    airportDistKm: 21,
    nearestStation: 'Yog Nagari Rishikesh (YNRK) & Haridwar Junction (HW, 25 km)',
    stationDistKm: 4,
    majorHighways: 'Delhi-Dehradun Expressway & NH-7 (Badrinath Highway)',
    terrainType: 'Himalayan Foothills & River Plains',
    bikeSuitability: 'Popular (Short highway weekend escape from Delhi/NCR with gateway to Char Dham)',
    busDetails: 'Direct AC Volvo and state transport buses round-the-clock from Delhi ISBT Kashmere Gate.'
  },
  varanasi: {
    nearestAirport: 'Lal Bahadur Shastri International Airport (VNS)',
    airportDistKm: 24,
    nearestStation: 'Varanasi Junction (BSB) & Pt. Deen Dayal Upadhyaya Junction (DDU, 15 km)',
    stationDistKm: 3,
    majorHighways: 'NH-19 (Golden Quadrilateral Kolkata-Delhi corridor)',
    terrainType: 'Indo-Gangetic Plain',
    bikeSuitability: 'Moderate (Busy city traffic; better suited for train or flight)',
    busDetails: 'UPSRTC buses connecting Lucknow, Prayagraj, Patna, and Gorakhpur.'
  }
};

// Haversine formula to calculate aerial and driving distance
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const aerial = R * c;
  // Road driving distance factor typically 1.25x - 1.35x for Indian road network
  const roadKm = Math.round(aerial * 1.28);
  return { aerial: Math.round(aerial), road: roadKm };
}

export default function LocationTransportGuide({
  destination,
  origin: propOrigin = null,
  onSelectOrigin = null
}) {
  const { userLocation } = usePageContext();

  // Selected Origin (default to user's detected location if in India, else New Delhi)
  const defaultOrigin = useMemo(() => {
    if (userLocation?.latitude && userLocation?.longitude && 
        userLocation.latitude >= 8.0 && userLocation.latitude <= 37.5 &&
        userLocation.longitude >= 68.0 && userLocation.longitude <= 97.5) {
      return {
        name: userLocation.city ? `Current Location (${userLocation.city})` : 'Current GPS Location',
        lat: userLocation.latitude,
        lon: userLocation.longitude,
        isGps: true
      };
    }
    return INDIAN_ORIGIN_HUBS[0]; // New Delhi default
  }, [userLocation]);

  const [internalOrigin, setInternalOrigin] = useState(defaultOrigin);
  const selectedOrigin = propOrigin || internalOrigin;

  const handleOriginChange = (hub) => {
    if (onSelectOrigin) {
      onSelectOrigin(hub);
    } else {
      setInternalOrigin(hub);
    }
  };

  const destLat = destination?.lat ?? destination?.latitude ?? 20.0;
  const destLon = destination?.lon ?? destination?.longitude ?? 78.0;

  // Calculate distance between Origin and Destination
  const distance = useMemo(() => {
    if (!selectedOrigin) return { aerial: 500, road: 640 };
    return calculateDistanceKm(selectedOrigin.lat, selectedOrigin.lon, destLat, destLon);
  }, [selectedOrigin, destLat, destLon]);

  // Compute travel times based on road distance
  const carDrivingHours = Math.round((distance.road / 55) * 10) / 10;
  const bikeRidingHours = Math.round((distance.road / 50) * 10) / 10;
  const busJourneyHours = Math.round((distance.road / 45) * 10) / 10;
  const flightHours = Math.max(1.0, Math.round((distance.aerial / 650) * 10) / 10);

  // Transit hub lookup
  const destKey = (destination?.name || '').toLowerCase().trim();
  const transitInfo = DESTINATION_TRANSIT_HUBS[destKey] || {
    nearestAirport: `Nearest Domestic Airport to ${destination?.name || 'Destination'}`,
    airportDistKm: 45,
    nearestStation: `Local / District Railway Station (${destination?.state || 'India'})`,
    stationDistKm: 12,
    majorHighways: 'National & State Highway network',
    terrainType: destination?.climate_zone || 'Scenic Regional Terrain',
    bikeSuitability: 'Good (Check seasonal road conditions)',
    busDetails: `State transport and private AC buses connect from major cities in ${destination?.state || 'India'}.`
  };

  return (
    <div className="st-card">
      <div className="st-card-title">
        <Navigation size={20} className="text-blue-600" />
        <span>How to Reach & Mode of Transport: {destination?.name || 'Destination'}</span>
      </div>

      {/* Origin Selection & Distance Banner */}
      <div style={{
        padding: '1.1rem 1.35rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: '#ffffff',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, marginBottom: '0.25rem' }}>
            Origin Starting Point:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} className="text-blue-200" />
            <select
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '0.4rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedOrigin.name}
              onChange={(e) => {
                const found = INDIAN_ORIGIN_HUBS.find(h => h.name === e.target.value) || defaultOrigin;
                handleOriginChange(found);
              }}
            >
              {defaultOrigin.isGps && (
                <option value={defaultOrigin.name} style={{ color: '#0f172a' }}>
                  📍 {defaultOrigin.name}
                </option>
              )}
              {INDIAN_ORIGIN_HUBS.map(hub => (
                <option key={hub.name} value={hub.name} style={{ color: '#0f172a' }}>
                  {hub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.25)', paddingRight: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Road Distance</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
              ~{distance.road} km
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Direct Aerial</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
              ~{distance.aerial} km
            </div>
          </div>
        </div>
      </div>

      {/* Modes of Transport Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
        
        {/* 1. By Car / Road Trip */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '0.75rem',
          border: '1px solid #bfdbfe',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1e40af', fontSize: '1rem' }}>
              <Car size={22} className="text-blue-600" />
              <span>By Car / Taxi</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#dbeafe', color: '#1e40af' }}>
              ~{distance.road} km • {carDrivingHours} hrs
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            <strong>Route & Road:</strong> {transitInfo.majorHighways}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.45rem' }}>
            🚗 <em>Recommended for:</em> Flexible family road trips, scenic highway viewpoints, and hill driving enthusiasts.
          </div>
        </div>

        {/* 2. By Bike / Motorcycle Touring */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '0.75rem',
          border: '1px solid #bbf7d0',
          background: '#f0fdf4',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#166534', fontSize: '1rem' }}>
              <Bike size={22} className="text-emerald-600" />
              <span>By Bike (Motorcycle)</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
              ~{distance.road} km • {bikeRidingHours} hrs
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#1e3a8b', lineHeight: 1.45 }}>
            <strong>Riding Experience:</strong> {transitInfo.bikeSuitability}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: 'auto', borderTop: '1px solid #bbf7d0', paddingTop: '0.45rem' }}>
            🏍️ <em>Tips:</em> Ensure helmet & riding armor, check tire tread, and plan fuel stops in mountain/remote sectors.
          </div>
        </div>

        {/* 3. By Bus / Intercity Luxury Coach */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '0.75rem',
          border: '1px solid #fed7aa',
          background: '#fff7ed',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#9a3412', fontSize: '1rem' }}>
              <Bus size={22} className="text-orange-600" />
              <span>By Bus (Volvo / Sleeper)</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#ffedd5', color: '#c2410c' }}>
              ~{busJourneyHours} hrs
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#431407', lineHeight: 1.45 }}>
            <strong>Service Details:</strong> {transitInfo.busDetails}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#9a3412', marginTop: 'auto', borderTop: '1px solid #fed7aa', paddingTop: '0.45rem' }}>
            🚌 <em>Convenience:</em> Cost-effective overnight sleeper buses allow waking up directly at destination.
          </div>
        </div>

        {/* 4. By Train (Indian Railways) */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#334155', fontSize: '1rem' }}>
              <Train size={22} className="text-indigo-600" />
              <span>By Train (Railways)</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3' }}>
              Rail Transit
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            <strong>Nearest Railhead:</strong> {transitInfo.nearestStation} (~{transitInfo.stationDistKm} km to town center).
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.45rem' }}>
            🚆 <em>Vande Bharat / Express:</em> Smooth connectivity with taxis readily available outside arrival stations.
          </div>
        </div>

        {/* 5. By Flight (Air Travel) */}
        <div style={{
          padding: '1.2rem',
          borderRadius: '0.75rem',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
              <Plane size={22} className="text-sky-600" />
              <span>By Flight (Fastest)</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
              ~{flightHours}h flight • ~{distance.aerial} km
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
            <strong>Nearest Airport:</strong> {transitInfo.nearestAirport} (~{transitInfo.airportDistKm} km from town).
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.45rem' }}>
            ✈️ <em>Air Travel:</em> Recommended for long distances (&gt;600 km) to maximize on-ground holiday duration.
          </div>
        </div>

      </div>
    </div>
  );
}
