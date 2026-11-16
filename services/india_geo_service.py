"""
EarthTrend India - India Geographical Service
Provides:
- 36 Indian States & Union Territories with coordinates, bounding boxes, and agro-climatic zones
- Key vulnerable and high-trend agricultural districts
- GeoJSON boundary support for Leaflet choropleths
- Zonal statistics and spatial hotspot detection (Getis-Ord Gi* approximation)
"""

import json
from typing import List, Dict, Optional, Any
from services.cache_db import get_connection

INDIAN_STATES_DATA = [
    {
        "id": "IN-AP",
        "name": "Andhra Pradesh",
        "type": "state",
        "zone": "Southern",
        "lat": 15.9129,
        "lon": 79.7400,
        "bbox": [12.6, 76.7, 19.9, 84.8],
        "districts": ["Visakhapatnam", "Anantapur", "Guntur", "Kurnool", "Krishna"]
    },
    {
        "id": "IN-AR",
        "name": "Arunachal Pradesh",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 28.2180,
        "lon": 94.7278,
        "bbox": [26.6, 91.5, 29.5, 97.4],
        "districts": ["Itanagar", "Tawang", "Changlang", "Pasighat"]
    },
    {
        "id": "IN-AS",
        "name": "Assam",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 26.2006,
        "lon": 92.9376,
        "bbox": [24.1, 89.7, 28.0, 96.0],
        "districts": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"]
    },
    {
        "id": "IN-BR",
        "name": "Bihar",
        "type": "state",
        "zone": "Eastern",
        "lat": 25.0961,
        "lon": 85.3131,
        "bbox": [24.3, 83.3, 27.5, 88.3],
        "districts": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"]
    },
    {
        "id": "IN-CT",
        "name": "Chhattisgarh",
        "type": "state",
        "zone": "Central",
        "lat": 21.2787,
        "lon": 81.8661,
        "bbox": [17.8, 80.2, 24.1, 84.4],
        "districts": ["Raipur", "Bilaspur", "Bastar", "Durg", "Korba"]
    },
    {
        "id": "IN-GA",
        "name": "Goa",
        "type": "state",
        "zone": "Western",
        "lat": 15.2993,
        "lon": 74.1240,
        "bbox": [14.9, 73.7, 15.8, 74.3],
        "districts": ["North Goa", "South Goa"]
    },
    {
        "id": "IN-GJ",
        "name": "Gujarat",
        "type": "state",
        "zone": "Western",
        "lat": 22.2587,
        "lon": 71.1924,
        "bbox": [20.1, 68.1, 24.7, 74.5],
        "districts": ["Ahmedabad", "Surat", "Rajkot", "Kutch", "Vadodara", "Bhavnagar"]
    },
    {
        "id": "IN-HR",
        "name": "Haryana",
        "type": "state",
        "zone": "Northern",
        "lat": 29.0588,
        "lon": 76.0856,
        "bbox": [27.6, 74.5, 30.9, 77.6],
        "districts": ["Gurugram", "Faridabad", "Hisar", "Karnal", "Ambala"]
    },
    {
        "id": "IN-HP",
        "name": "Himachal Pradesh",
        "type": "state",
        "zone": "Northern",
        "lat": 31.1048,
        "lon": 77.1734,
        "bbox": [30.4, 75.6, 33.2, 79.0],
        "districts": ["Shimla", "Dharamshala", "Kullu", "Mandi", "Solan"]
    },
    {
        "id": "IN-JH",
        "name": "Jharkhand",
        "type": "state",
        "zone": "Eastern",
        "lat": 23.6102,
        "lon": 85.2799,
        "bbox": [21.9, 83.3, 25.3, 87.9],
        "districts": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"]
    },
    {
        "id": "IN-KA",
        "name": "Karnataka",
        "type": "state",
        "zone": "Southern",
        "lat": 15.3173,
        "lon": 75.7139,
        "bbox": [11.5, 74.0, 18.5, 78.6],
        "districts": ["Bengaluru", "Mysuru", "Hubballi", "Belagavi", "Mangaluru", "Kalaburagi"]
    },
    {
        "id": "IN-KL",
        "name": "Kerala",
        "type": "state",
        "zone": "Southern",
        "lat": 10.8505,
        "lon": 76.2711,
        "bbox": [8.3, 74.8, 12.8, 77.4],
        "districts": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Wayanad", "Idukki"]
    },
    {
        "id": "IN-MP",
        "name": "Madhya Pradesh",
        "type": "state",
        "zone": "Central",
        "lat": 22.9734,
        "lon": 78.6569,
        "bbox": [21.1, 74.0, 26.9, 82.8],
        "districts": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa"]
    },
    {
        "id": "IN-MH",
        "name": "Maharashtra",
        "type": "state",
        "zone": "Western",
        "lat": 19.7515,
        "lon": 75.7139,
        "bbox": [15.6, 72.6, 22.0, 80.9],
        "districts": ["Mumbai", "Pune", "Nagpur", "Nashik", "Chhatrapati Sambhajinagar", "Solapur", "Amravati"]
    },
    {
        "id": "IN-MN",
        "name": "Manipur",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 24.6637,
        "lon": 93.9063,
        "bbox": [23.8, 93.0, 25.7, 94.8],
        "districts": ["Imphal", "Churachandpur", "Thoubal"]
    },
    {
        "id": "IN-ML",
        "name": "Meghalaya",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 25.4670,
        "lon": 91.3662,
        "bbox": [25.0, 89.8, 26.1, 92.8],
        "districts": ["Shillong", "Tura", "Cherrapunji", "Jowai"]
    },
    {
        "id": "IN-MZ",
        "name": "Mizoram",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 23.1645,
        "lon": 92.9376,
        "bbox": [21.9, 92.2, 24.5, 93.4],
        "districts": ["Aizawl", "Lunglei", "Champhai"]
    },
    {
        "id": "IN-NL",
        "name": "Nagaland",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 26.1584,
        "lon": 94.5624,
        "bbox": [25.2, 93.3, 27.0, 95.2],
        "districts": ["Kohima", "Dimapur", "Mokokchung"]
    },
    {
        "id": "IN-OR",
        "name": "Odisha",
        "type": "state",
        "zone": "Eastern",
        "lat": 20.9517,
        "lon": 85.0985,
        "bbox": [17.8, 81.4, 22.6, 87.5],
        "districts": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Balasore"]
    },
    {
        "id": "IN-PB",
        "name": "Punjab",
        "type": "state",
        "zone": "Northern",
        "lat": 31.1471,
        "lon": 75.3412,
        "bbox": [29.5, 73.9, 32.5, 76.9],
        "districts": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"]
    },
    {
        "id": "IN-RJ",
        "name": "Rajasthan",
        "type": "state",
        "zone": "Northern",
        "lat": 27.0238,
        "lon": 74.2179,
        "bbox": [23.1, 69.5, 30.2, 78.3],
        "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Jaisalmer", "Barmer"]
    },
    {
        "id": "IN-SK",
        "name": "Sikkim",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 27.5330,
        "lon": 88.5122,
        "bbox": [27.1, 88.0, 28.1, 88.9],
        "districts": ["Gangtok", "Namchi", "Gyalshing", "Mangan"]
    },
    {
        "id": "IN-TN",
        "name": "Tamil Nadu",
        "type": "state",
        "zone": "Southern",
        "lat": 11.1271,
        "lon": 78.6569,
        "bbox": [8.1, 76.2, 13.6, 80.3],
        "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Thanjavur"]
    },
    {
        "id": "IN-TG",
        "name": "Telangana",
        "type": "state",
        "zone": "Southern",
        "lat": 18.1124,
        "lon": 79.0193,
        "bbox": [15.8, 77.2, 19.9, 81.8],
        "districts": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"]
    },
    {
        "id": "IN-TR",
        "name": "Tripura",
        "type": "state",
        "zone": "North-Eastern",
        "lat": 23.9408,
        "lon": 91.9882,
        "bbox": [22.9, 91.1, 24.5, 92.3],
        "districts": ["Agartala", "Udaipur", "Dharmanagar"]
    },
    {
        "id": "IN-UP",
        "name": "Uttar Pradesh",
        "type": "state",
        "zone": "Northern",
        "lat": 26.8467,
        "lon": 80.9462,
        "bbox": [23.9, 77.1, 30.4, 84.6],
        "districts": ["Lucknow", "Varanasi", "Kanpur", "Prayagraj", "Agra", "Meerut", "Gorakhpur"]
    },
    {
        "id": "IN-UT",
        "name": "Uttarakhand",
        "type": "state",
        "zone": "Northern",
        "lat": 30.0668,
        "lon": 79.0193,
        "bbox": [28.7, 77.6, 31.5, 81.1],
        "districts": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Almora"]
    },
    {
        "id": "IN-WB",
        "name": "West Bengal",
        "type": "state",
        "zone": "Eastern",
        "lat": 22.9868,
        "lon": 87.8550,
        "bbox": [21.5, 85.8, 27.2, 89.9],
        "districts": ["Kolkata", "Siliguri", "Asansol", "Durgapur", "Darjeeling", "Malda"]
    },
    # Union Territories
    {
        "id": "IN-DL",
        "name": "Delhi",
        "type": "ut",
        "zone": "Northern",
        "lat": 28.6139,
        "lon": 77.2090,
        "bbox": [28.4, 76.8, 28.9, 77.3],
        "districts": ["New Delhi", "North Delhi", "South Delhi"]
    },
    {
        "id": "IN-JK",
        "name": "Jammu and Kashmir",
        "type": "ut",
        "zone": "Northern",
        "lat": 33.7782,
        "lon": 76.5762,
        "bbox": [32.3, 73.8, 35.5, 77.6],
        "districts": ["Srinagar", "Jammu", "Anantnag", "Baramulla"]
    },
    {
        "id": "IN-LA",
        "name": "Ladakh",
        "type": "ut",
        "zone": "Northern",
        "lat": 34.1526,
        "lon": 77.5771,
        "bbox": [32.5, 75.3, 36.0, 80.5],
        "districts": ["Leh", "Kargil"]
    },
    {
        "id": "IN-CH",
        "name": "Chandigarh",
        "type": "ut",
        "zone": "Northern",
        "lat": 30.7333,
        "lon": 76.7794,
        "bbox": [30.6, 76.6, 30.8, 76.8],
        "districts": ["Chandigarh"]
    },
    {
        "id": "IN-PY",
        "name": "Puducherry",
        "type": "ut",
        "zone": "Southern",
        "lat": 11.9416,
        "lon": 79.8083,
        "bbox": [11.8, 79.7, 12.0, 79.9],
        "districts": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
    },
    {
        "id": "IN-AN",
        "name": "Andaman and Nicobar Islands",
        "type": "ut",
        "zone": "Islands",
        "lat": 11.7401,
        "lon": 92.6586,
        "bbox": [6.7, 92.2, 13.7, 94.0],
        "districts": ["Port Blair", "Nicobar", "South Andaman"]
    },
    {
        "id": "IN-LD",
        "name": "Lakshadweep",
        "type": "ut",
        "zone": "Islands",
        "lat": 10.5667,
        "lon": 72.6417,
        "bbox": [8.2, 71.7, 12.4, 74.0],
        "districts": ["Kavaratti"]
    },
    {
        "id": "IN-DH",
        "name": "Dadra & Nagar Haveli and Daman & Diu",
        "type": "ut",
        "zone": "Western",
        "lat": 20.4283,
        "lon": 72.8397,
        "bbox": [20.0, 72.5, 20.7, 73.2],
        "districts": ["Daman", "Diu", "Silvassa"]
    }
]


def seed_regions_db():
    conn = get_connection()
    c = conn.cursor()
    for state in INDIAN_STATES_DATA:
        c.execute("""
        INSERT OR REPLACE INTO regions (id, name, type, state_name, latitude, longitude, bbox_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            state["id"],
            state["name"],
            state["type"],
            state["name"],
            state["lat"],
            state["lon"],
            json.dumps(state["bbox"])
        ))
        # Also seed key districts
        for d_name in state.get("districts", []):
            dist_id = f"{state['id']}-{d_name.lower().replace(' ', '-')}"
            c.execute("""
            INSERT OR REPLACE INTO regions (id, name, type, state_name, latitude, longitude, bbox_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                dist_id,
                d_name,
                "district",
                state["name"],
                state["lat"], # centroid approximation
                state["lon"],
                json.dumps(state["bbox"])
            ))
    conn.commit()
    conn.close()


def get_all_states() -> List[Dict[str, Any]]:
    return INDIAN_STATES_DATA


def get_state_by_name_or_id(query: str) -> Optional[Dict[str, Any]]:
    q = query.strip().lower()
    for s in INDIAN_STATES_DATA:
        if s["id"].lower() == q or s["name"].lower() == q:
            return s
            
    # Check if this is a district format: e.g. "IN-MH-pune" or "IN-RJ-jaipur"
    for s in INDIAN_STATES_DATA:
        s_id_lower = s["id"].lower()
        if q.startswith(f"{s_id_lower}-"):
            district_slug = q[len(s_id_lower) + 1:]
            matching_d = None
            for d in s.get("districts", []):
                if d.lower().replace(" ", "-") == district_slug or d.lower() == district_slug:
                    matching_d = d
                    break
            dist_name = matching_d or district_slug.replace("-", " ").title()
            return {
                "id": query.strip(),
                "name": f"{dist_name}, {s['name']}",
                "district_name": dist_name,
                "state_name": s["name"],
                "type": "district",
                "zone": s.get("zone", "Central"),
                "lat": s["lat"],
                "lon": s["lon"],
                "bbox": s["bbox"],
                "districts": s.get("districts", [])
            }
    return None


def get_districts_for_state(state_name_or_id: str) -> List[str]:
    s = get_state_by_name_or_id(state_name_or_id)
    return s.get("districts", []) if s else []


def calculate_spatial_hotspots(regions_trends: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes spatial hotspot identification using standardized trend scores.
    Classifies areas into:
    - Warming / Wetting / Greening Hotspots (High positive rate, statistically significant)
    - Cooling / Drying / Browning Coldspots (High negative rate, statistically significant)
    - Neutral / Transition zones
    """
    rates = [r.get("annual_rate", 0.0) for r in regions_trends if r.get("is_significant")]
    if not rates:
        return {"hotspots": [], "coldspots": []}
    
    mean_rate = sum(rates) / len(rates)
    std_rate = (sum((x - mean_rate) ** 2 for x in rates) / max(1, len(rates) - 1)) ** 0.5 or 1.0
    
    hotspots = []
    coldspots = []
    for r in regions_trends:
        rate = r.get("annual_rate", 0.0)
        is_sig = r.get("is_significant", False)
        z = (rate - mean_rate) / std_rate
        
        entry = {
            "region_id": r.get("region_id"),
            "region_name": r.get("region_name"),
            "annual_rate": rate,
            "z_score": round(z, 2),
            "p_value": r.get("p_value", 1.0)
        }
        
        if is_sig and z >= 1.5:
            hotspots.append(entry)
        elif is_sig and z <= -1.5:
            coldspots.append(entry)
            
    return {
        "hotspots": sorted(hotspots, key=lambda x: x["z_score"], reverse=True),
        "coldspots": sorted(coldspots, key=lambda x: x["z_score"])
    }


# Seed regions on load
seed_regions_db()
