"""
AstroKites / AgriNova - Geography Tools
Provides geocoding and location resolution using the official Indian States/Districts
catalog, major city coordinates, and Nominatim OpenStreetMap.
"""

import urllib.request
import urllib.parse
import json
import logging
from typing import Dict, Any, Optional
from services.india_geo_service import get_all_states, get_state_by_name_or_id

logger = logging.getLogger("astroke.ai.tools.geo")

# Key Indian Cities mapping to coordinates and closest State ID
MAJOR_INDIAN_CITIES = {
    "ahmedabad": {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "state_id": "IN-GJ", "state_name": "Gujarat"},
    "mumbai": {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "state_id": "IN-MH", "state_name": "Maharashtra"},
    "delhi": {"name": "Delhi", "lat": 28.6139, "lon": 77.2090, "state_id": "IN-DL", "state_name": "Delhi"},
    "new delhi": {"name": "New Delhi", "lat": 28.6139, "lon": 77.2090, "state_id": "IN-DL", "state_name": "Delhi"},
    "bengaluru": {"name": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "state_id": "IN-KA", "state_name": "Karnataka"},
    "bangalore": {"name": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "state_id": "IN-KA", "state_name": "Karnataka"},
    "kolkata": {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "state_id": "IN-WB", "state_name": "West Bengal"},
    "calcutta": {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "state_id": "IN-WB", "state_name": "West Bengal"},
    "chennai": {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "state_id": "IN-TN", "state_name": "Tamil Nadu"},
    "madras": {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "state_id": "IN-TN", "state_name": "Tamil Nadu"},
    "hyderabad": {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "state_id": "IN-TG", "state_name": "Telangana"},
    "pune": {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "state_id": "IN-MH", "state_name": "Maharashtra"},
    "jaipur": {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873, "state_id": "IN-RJ", "state_name": "Rajasthan"},
    "lucknow": {"name": "Lucknow", "lat": 26.8467, "lon": 80.9462, "state_id": "IN-UP", "state_name": "Uttar Pradesh"},
    "surat": {"name": "Surat", "lat": 21.1702, "lon": 72.8311, "state_id": "IN-GJ", "state_name": "Gujarat"},
    "nagpur": {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882, "state_id": "IN-MH", "state_name": "Maharashtra"},
    "patna": {"name": "Patna", "lat": 25.5941, "lon": 85.1376, "state_id": "IN-BR", "state_name": "Bihar"},
    "indore": {"name": "Indore", "lat": 22.7196, "lon": 75.8577, "state_id": "IN-MP", "state_name": "Madhya Pradesh"},
    "bhopal": {"name": "Bhopal", "lat": 23.2599, "lon": 77.4126, "state_id": "IN-MP", "state_name": "Madhya Pradesh"},
    "chandigarh": {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "state_id": "IN-CH", "state_name": "Chandigarh"},
    "ludhiana": {"name": "Ludhiana", "lat": 30.9010, "lon": 75.8573, "state_id": "IN-PB", "state_name": "Punjab"},
    "visakhapatnam": {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185, "state_id": "IN-AP", "state_name": "Andhra Pradesh"},
    "kochi": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673, "state_id": "IN-KL", "state_name": "Kerala"},
    "thiruvananthapuram": {"name": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366, "state_id": "IN-KL", "state_name": "Kerala"},
    "guwahati": {"name": "Guwahati", "lat": 26.1445, "lon": 91.7362, "state_id": "IN-AS", "state_name": "Assam"},
    "bhubaneswar": {"name": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245, "state_id": "IN-OD", "state_name": "Odisha"},
    "dehradun": {"name": "Dehradun", "lat": 30.3165, "lon": 78.0322, "state_id": "IN-UK", "state_name": "Uttarakhand"},
    "shimla": {"name": "Shimla", "lat": 31.1048, "lon": 77.1734, "state_id": "IN-HP", "state_name": "Himachal Pradesh"},
    "srinagar": {"name": "Srinagar", "lat": 34.0837, "lon": 74.7973, "state_id": "IN-JK", "state_name": "Jammu and Kashmir"},
    "ranchi": {"name": "Ranchi", "lat": 23.3441, "lon": 85.3096, "state_id": "IN-JH", "state_name": "Jharkhand"},
    "raipur": {"name": "Raipur", "lat": 21.2514, "lon": 81.6296, "state_id": "IN-CG", "state_name": "Chhattisgarh"},
    "panaji": {"name": "Panaji", "lat": 15.4909, "lon": 73.8278, "state_id": "IN-GA", "state_name": "Goa"},
}


def geocode_location(location_name: str) -> Dict[str, Any]:
    """
    Geocodes a city or region into geographical coordinates (lat/lon)
    and resolves the associated Indian State ID.
    """
    loc_clean = location_name.strip().lower()

    # 1. Check Indian city catalog
    if loc_clean in MAJOR_INDIAN_CITIES:
        c = MAJOR_INDIAN_CITIES[loc_clean]
        return {
            "status": "success",
            "name": c["name"],
            "latitude": c["lat"],
            "longitude": c["lon"],
            "region_id": c["state_id"],
            "state_name": c["state_name"],
            "country": "India",
            "source": "AstroKites Geography Catalog"
        }

    # 2. Check Indian State / UT catalog
    state = get_state_by_name_or_id(location_name)
    if state:
        return {
            "status": "success",
            "name": state["name"],
            "latitude": state["lat"],
            "longitude": state["lon"],
            "region_id": state["id"],
            "state_name": state.get("state_name", state["name"]),
            "country": "India",
            "source": "AstroKites Indian Administrative Catalog"
        }

    # 3. Check partial match in cities
    for k, v in MAJOR_INDIAN_CITIES.items():
        if k in loc_clean or loc_clean in k:
            return {
                "status": "success",
                "name": v["name"],
                "latitude": v["lat"],
                "longitude": v["lon"],
                "region_id": v["state_id"],
                "state_name": v["state_name"],
                "country": "India",
                "source": "AstroKites Geography Catalog (Match)"
            }

    # 4. Fallback to Nominatim OpenStreetMap API
    try:
        encoded = urllib.parse.quote(location_name)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "AstroKites-Climate-Assistant/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                item = data[0]
                lat = float(item["lat"])
                lon = float(item["lon"])
                disp_name = item.get("display_name", location_name)
                return {
                    "status": "success",
                    "name": disp_name.split(",")[0],
                    "latitude": lat,
                    "longitude": lon,
                    "region_id": "IN-MH" if (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0) else "GLOBAL",
                    "state_name": disp_name,
                    "country": "India" if (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0) else "Global",
                    "source": "OpenStreetMap Nominatim Geocoding"
                }
    except Exception as e:
        logger.warning("Nominatim geocoding failed for '%s': %s", location_name, str(e))

    return {
        "status": "error",
        "message": f"Could not determine geographical coordinates for '{location_name}'. Please specify a recognized city or Indian state."
    }
