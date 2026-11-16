"""
AstroKites Smart Travel Planner - India Destination Database & Boundary Validation
Exclusively supports verified tourist destinations, hill stations, beaches, and cultural hubs within India.
Rejects any foreign or international destination.
"""

from typing import Dict, List, Optional, Any
import math
import re

# Bounding box coordinates defining India's geographical boundaries
INDIA_BOUNDS = {
    "min_lat": 8.0,
    "max_lat": 37.5,
    "min_lon": 68.0,
    "max_lon": 97.5
}

def is_within_india(lat: float, lon: float) -> bool:
    """Verifies that latitude and longitude fall strictly within India's borders."""
    try:
        lat = float(lat)
        lon = float(lon)
        return (INDIA_BOUNDS["min_lat"] <= lat <= INDIA_BOUNDS["max_lat"] and
                INDIA_BOUNDS["min_lon"] <= lon <= INDIA_BOUNDS["max_lon"])
    except (ValueError, TypeError):
        return False


# Curated catalog of major Indian tourist destinations across all climate zones
INDIAN_DESTINATIONS: List[Dict[str, Any]] = [
    # --- Beaches & Coastal ---
    {
        "id": "goa-beach",
        "name": "Goa",
        "state_id": "IN-GA",
        "state_name": "Goa",
        "district": "North Goa",
        "lat": 15.2993,
        "lon": 74.1240,
        "elevation_m": 10,
        "climate_zone": "Western Coastal (Tropical Monsoon)",
        "primary_types": ["beach", "general", "sightseeing"],
        "description": "Golden beaches, colonial Portuguese architecture, and vibrant coastal life.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "andaman-islands",
        "name": "Andaman and Nicobar Islands",
        "state_id": "IN-AN",
        "state_name": "Andaman and Nicobar Islands",
        "district": "South Andaman",
        "lat": 11.6234,
        "lon": 92.7265,
        "elevation_m": 16,
        "climate_zone": "Island (Tropical Maritime)",
        "primary_types": ["beach", "adventure", "nature"],
        "description": "Pristine white sand beaches, coral reefs, turquoise waters, and scuba diving.",
        "monsoon_months": [5, 6, 7, 8, 9, 10, 11]
    },
    {
        "id": "lakshadweep",
        "name": "Lakshadweep",
        "state_id": "IN-LD",
        "state_name": "Lakshadweep",
        "district": "Lakshadweep",
        "lat": 10.5667,
        "lon": 72.6417,
        "elevation_m": 2,
        "climate_zone": "Island (Tropical Oceanic)",
        "primary_types": ["beach", "adventure", "nature"],
        "description": "Serene coral atolls, crystal lagoons, and peaceful water sports.",
        "monsoon_months": [5, 6, 7, 8, 9]
    },
    {
        "id": "gokarna",
        "name": "Gokarna",
        "state_id": "IN-KA",
        "state_name": "Karnataka",
        "district": "Uttara Kannada",
        "lat": 14.5479,
        "lon": 74.3188,
        "elevation_m": 10,
        "climate_zone": "Western Coastal",
        "primary_types": ["beach", "religious", "general"],
        "description": "Secluded beaches, cliffside treks, and ancient Mahabaleshwar temple.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "pondicherry",
        "name": "Pondicherry (Puducherry)",
        "state_id": "IN-PY",
        "state_name": "Puducherry",
        "district": "Puducherry",
        "lat": 11.9416,
        "lon": 79.8083,
        "elevation_m": 3,
        "climate_zone": "Eastern Coastal (Northeast Monsoon Dominant)",
        "primary_types": ["beach", "cultural", "city"],
        "description": "French colonial promenade, heritage villas, Auroville, and seaside cafes.",
        "monsoon_months": [10, 11, 12]  # Northeast monsoon!
    },
    {
        "id": "puri",
        "name": "Puri",
        "state_id": "IN-OD",
        "state_name": "Odisha",
        "district": "Puri",
        "lat": 19.8135,
        "lon": 85.8312,
        "elevation_m": 5,
        "climate_zone": "Eastern Coastal",
        "primary_types": ["religious", "beach", "cultural"],
        "description": "Sacred Jagannath Temple, Golden Beach, and Konark Sun Temple proximity.",
        "monsoon_months": [6, 7, 8, 9, 10]
    },

    # --- Mountain / Hill Stations ---
    {
        "id": "manali",
        "name": "Manali",
        "state_id": "IN-HP",
        "state_name": "Himachal Pradesh",
        "district": "Kullu",
        "lat": 32.2432,
        "lon": 77.1892,
        "elevation_m": 2050,
        "climate_zone": "Western Himalayan (Alpine / Sub-tropical Highland)",
        "primary_types": ["mountain", "adventure", "nature"],
        "description": "Snow-capped Himalayan peaks, Solang Valley, Rohtang Pass, and apple orchards.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "shimla",
        "name": "Shimla",
        "state_id": "IN-HP",
        "state_name": "Himachal Pradesh",
        "district": "Shimla",
        "lat": 31.1048,
        "lon": 77.1734,
        "elevation_m": 2205,
        "climate_zone": "Western Himalayan",
        "primary_types": ["mountain", "city", "general"],
        "description": "Queen of Hills, Mall Road, colonial Christ Church, and pine forests.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "srinagar",
        "name": "Srinagar",
        "state_id": "IN-JK",
        "state_name": "Jammu and Kashmir",
        "district": "Srinagar",
        "lat": 34.0837,
        "lon": 74.7973,
        "elevation_m": 1585,
        "climate_zone": "Kashmir Valley (Temperate Continental)",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Dal Lake shikaras, floating houseboats, Mughal gardens, and Chinar trees.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "gulmarg",
        "name": "Gulmarg",
        "state_id": "IN-JK",
        "state_name": "Jammu and Kashmir",
        "district": "Baramulla",
        "lat": 34.0484,
        "lon": 74.3805,
        "elevation_m": 2650,
        "climate_zone": "Western Himalayan (Alpine)",
        "primary_types": ["mountain", "adventure", "nature"],
        "description": "Premier skiing destination, world highest gondola cable car, and meadows of flowers.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "leh-ladakh",
        "name": "Leh",
        "state_id": "IN-LA",
        "state_name": "Ladakh",
        "district": "Leh",
        "lat": 34.1526,
        "lon": 77.5771,
        "elevation_m": 3524,
        "climate_zone": "Trans-Himalayan (Cold Desert High Altitude)",
        "primary_types": ["mountain", "adventure", "cultural"],
        "description": "High-altitude passes (Khardung La), Pangong Tso, Buddhist monasteries, and barren beauty.",
        "monsoon_months": []  # Rain shadow! Dry summer, freezing winter.
    },
    {
        "id": "ooty",
        "name": "Ooty (Udhagamandalam)",
        "state_id": "IN-TN",
        "state_name": "Tamil Nadu",
        "district": "Nilgiris",
        "lat": 11.4102,
        "lon": 76.6950,
        "elevation_m": 2240,
        "climate_zone": "Nilgiri Highlands (Sub-tropical Mountain)",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Rolling tea estates, Nilgiri Toy Train, botanical gardens, and cool climate.",
        "monsoon_months": [6, 7, 8, 10, 11]
    },
    {
        "id": "kodaikanal",
        "name": "Kodaikanal",
        "state_id": "IN-TN",
        "state_name": "Tamil Nadu",
        "district": "Dindigul",
        "lat": 10.2381,
        "lon": 77.4892,
        "elevation_m": 2133,
        "climate_zone": "Palani Hills (Montane)",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Star-shaped lake, Pillar Rocks, mist-covered valleys, and Kurinji flowers.",
        "monsoon_months": [6, 7, 8, 10, 11]
    },
    {
        "id": "munnar",
        "name": "Munnar",
        "state_id": "IN-KL",
        "state_name": "Kerala",
        "district": "Idukki",
        "lat": 10.0889,
        "lon": 77.0595,
        "elevation_m": 1532,
        "climate_zone": "Western Ghats Highland",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Sprawling emerald tea plantations, Eravikulam National Park, and Anamudi peak.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "coorg",
        "name": "Coorg (Kodagu)",
        "state_id": "IN-KA",
        "state_name": "Karnataka",
        "district": "Kodagu",
        "lat": 12.3375,
        "lon": 75.8069,
        "elevation_m": 1150,
        "climate_zone": "Western Ghats (Sub-tropical Moist)",
        "primary_types": ["nature", "mountain", "general"],
        "description": "Scotland of India, aromatic coffee plantations, Abbey Falls, and Raja's Seat.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "wayanad",
        "name": "Wayanad",
        "state_id": "IN-KL",
        "state_name": "Kerala",
        "district": "Wayanad",
        "lat": 11.6854,
        "lon": 76.1320,
        "elevation_m": 700,
        "climate_zone": "Western Ghats",
        "primary_types": ["nature", "adventure", "wildlife"],
        "description": "Dense rain forests, Chembra Peak heart-shaped lake, caves, and wildlife sanctuaries.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "darjeeling",
        "name": "Darjeeling",
        "state_id": "IN-WB",
        "state_name": "West Bengal",
        "district": "Darjeeling",
        "lat": 27.0410,
        "lon": 88.2663,
        "elevation_m": 2042,
        "climate_zone": "Eastern Himalayan",
        "primary_types": ["mountain", "nature", "cultural"],
        "description": "World-famous Darjeeling tea, Kanchenjunga sunrise from Tiger Hill, and Himalayan Railway.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "gangtok",
        "name": "Gangtok",
        "state_id": "IN-SK",
        "state_name": "Sikkim",
        "district": "East Sikkim",
        "lat": 27.3389,
        "lon": 88.6065,
        "elevation_m": 1650,
        "climate_zone": "Eastern Himalayan",
        "primary_types": ["mountain", "cultural", "adventure"],
        "description": "Buddhist monasteries, Nathula Pass, Tsomgo Lake, and Himalayan vistas.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "shillong",
        "name": "Shillong",
        "state_id": "IN-ML",
        "state_name": "Meghalaya",
        "district": "East Khasi Hills",
        "lat": 25.5788,
        "lon": 91.8933,
        "elevation_m": 1525,
        "climate_zone": "Meghalaya Plateau (Subtropical Highland)",
        "primary_types": ["mountain", "nature", "cultural"],
        "description": "Scotland of the East, Umiam Lake, Elephant Falls, and vibrant music culture.",
        "monsoon_months": [5, 6, 7, 8, 9]
    },
    {
        "id": "cherrapunji",
        "name": "Cherrapunji (Sohra)",
        "state_id": "IN-ML",
        "state_name": "Meghalaya",
        "district": "East Khasi Hills",
        "lat": 25.2702,
        "lon": 91.7323,
        "elevation_m": 1430,
        "climate_zone": "Pluviometric Maximum (High Rainfall Zone)",
        "primary_types": ["nature", "adventure"],
        "description": "Living root bridges, Nohkalikai Falls, limestone caves, and lush valleys.",
        "monsoon_months": [5, 6, 7, 8, 9]
    },
    {
        "id": "rishikesh",
        "name": "Rishikesh",
        "state_id": "IN-UK",
        "state_name": "Uttarakhand",
        "district": "Dehradun",
        "lat": 30.0869,
        "lon": 78.2676,
        "elevation_m": 372,
        "climate_zone": "Sub-Himalayan Foothills",
        "primary_types": ["adventure", "religious", "cultural"],
        "description": "Yoga capital of the world, white-water river rafting on the Ganges, and Ganga Aarti.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "nainital",
        "name": "Nainital",
        "state_id": "IN-UK",
        "state_name": "Uttarakhand",
        "district": "Nainital",
        "lat": 29.3919,
        "lon": 79.4542,
        "elevation_m": 2084,
        "climate_zone": "Kumaon Himalayan",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Eye-shaped Naini Lake surrounded by hills, Snow View point, and boat rides.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "mahabaleshwar",
        "name": "Mahabaleshwar",
        "state_id": "IN-MH",
        "state_name": "Maharashtra",
        "district": "Satara",
        "lat": 17.9237,
        "lon": 73.6586,
        "elevation_m": 1353,
        "climate_zone": "Sahyadri / Western Ghats",
        "primary_types": ["mountain", "nature", "general"],
        "description": "Strawberry capital, Arthur's Seat, Venna Lake, and panoramic plateau viewpoints.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "mount-abu",
        "name": "Mount Abu",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Sirohi",
        "lat": 24.5926,
        "lon": 72.7156,
        "elevation_m": 1220,
        "climate_zone": "Aravalli Range (Hill Oasis)",
        "primary_types": ["mountain", "religious", "general"],
        "description": "Only hill station in Rajasthan, exquisite Dilwara Jain temples, and Nakki Lake.",
        "monsoon_months": [7, 8, 9]
    },

    # --- Desert & Royal Heritage ---
    {
        "id": "jaipur",
        "name": "Jaipur",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Jaipur",
        "lat": 26.9124,
        "lon": 75.7873,
        "elevation_m": 431,
        "climate_zone": "Semi-Arid (Subtropical)",
        "primary_types": ["city", "cultural", "general"],
        "description": "The Pink City, Amer Fort, Hawa Mahal, City Palace, and rich royal heritage.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "udaipur",
        "name": "Udaipur",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Udaipur",
        "lat": 24.5854,
        "lon": 73.7125,
        "elevation_m": 598,
        "climate_zone": "Semi-Arid Lake Basin",
        "primary_types": ["cultural", "city", "general"],
        "description": "City of Lakes, Lake Pichola, Grand City Palace, and Jag Mandir.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "jaisalmer",
        "name": "Jaisalmer",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Jaisalmer",
        "lat": 26.9157,
        "lon": 70.9083,
        "elevation_m": 225,
        "climate_zone": "Thar Desert (Arid)",
        "primary_types": ["desert", "cultural", "adventure"],
        "description": "The Golden City, living Jaisalmer Fort, Sam sand dunes, camel safaris, and stargazing.",
        "monsoon_months": [7, 8]  # Scanty rainfall
    },
    {
        "id": "jodhpur",
        "name": "Jodhpur",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Jodhpur",
        "lat": 26.2389,
        "lon": 73.0243,
        "elevation_m": 231,
        "climate_zone": "Thar Desert Margin",
        "primary_types": ["cultural", "city", "desert"],
        "description": "The Blue City, imposing Mehrangarh Fort, Umaid Bhawan Palace, and Marwar heritage.",
        "monsoon_months": [7, 8]
    },

    # --- Cultural, Religious & City Sightseeing ---
    {
        "id": "varanasi",
        "name": "Varanasi",
        "state_id": "IN-UP",
        "state_name": "Uttar Pradesh",
        "district": "Varanasi",
        "lat": 25.3176,
        "lon": 82.9739,
        "elevation_m": 80,
        "climate_zone": "Indo-Gangetic Plain (Subtropical Humid)",
        "primary_types": ["religious", "cultural", "general"],
        "description": "Oldest continuously inhabited city, sacred Ganga Ghats, evening Aarti, and Sarnath.",
        "monsoon_months": [7, 8, 9]
    },
    {
        "id": "agra",
        "name": "Agra",
        "state_id": "IN-UP",
        "state_name": "Uttar Pradesh",
        "district": "Agra",
        "lat": 27.1767,
        "lon": 78.0081,
        "elevation_m": 171,
        "climate_zone": "Semi-Arid Plains",
        "primary_types": ["cultural", "city", "general"],
        "description": "Home of the Taj Mahal, Agra Fort, Fatehpur Sikri, and Mughal architecture.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "amritsar",
        "name": "Amritsar",
        "state_id": "IN-PB",
        "state_name": "Punjab",
        "district": "Amritsar",
        "lat": 31.6340,
        "lon": 74.8723,
        "elevation_m": 234,
        "climate_zone": "Northwest Plains (Continental)",
        "primary_types": ["religious", "cultural", "general"],
        "description": "Golden Temple (Harmandir Sahib), Jallianwala Bagh, and Wagah Border ceremony.",
        "monsoon_months": [7, 8]
    },
    {
        "id": "hampi",
        "name": "Hampi",
        "state_id": "IN-KA",
        "state_name": "Karnataka",
        "district": "Vijayanagara",
        "lat": 15.3350,
        "lon": 76.4600,
        "elevation_m": 467,
        "climate_zone": "Deccan Plateau (Semi-Arid)",
        "primary_types": ["cultural", "adventure", "general"],
        "description": "UNESCO World Heritage boulder landscape, ruins of the Vijayanagara Empire, and Virupaksha Temple.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "khajuraho",
        "name": "Khajuraho",
        "state_id": "IN-MP",
        "state_name": "Madhya Pradesh",
        "district": "Chhatarpur",
        "lat": 24.8318,
        "lon": 79.9199,
        "elevation_m": 283,
        "climate_zone": "Central India (Subtropical)",
        "primary_types": ["cultural", "religious", "general"],
        "description": "UNESCO medieval temples renowned for nagara architecture and intricate stone carvings.",
        "monsoon_months": [7, 8, 9]
    },
    {
        "id": "mysuru",
        "name": "Mysuru (Mysore)",
        "state_id": "IN-KA",
        "state_name": "Karnataka",
        "district": "Mysuru",
        "lat": 12.2958,
        "lon": 76.6394,
        "elevation_m": 763,
        "climate_zone": "South Deccan Plateau",
        "primary_types": ["cultural", "city", "general"],
        "description": "Magnificent Mysore Palace, Chamundi Hills, Brindavan Gardens, and Dasara celebrations.",
        "monsoon_months": [6, 7, 8, 9, 10]
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru (Bangalore)",
        "state_id": "IN-KA",
        "state_name": "Karnataka",
        "district": "Bengaluru Urban",
        "lat": 12.9716,
        "lon": 77.5946,
        "elevation_m": 920,
        "climate_zone": "Equable Plateau (Moderate year-round)",
        "primary_types": ["city", "general"],
        "description": "Garden City of India, Lalbagh, Cubbon Park, mild pleasant climate, and tech hub.",
        "monsoon_months": [6, 7, 8, 9, 10]
    },

    # --- Wildlife, Backwaters & Nature ---
    {
        "id": "kerala-backwaters",
        "name": "Kerala (Alleppey & Kumarakom)",
        "state_id": "IN-KL",
        "state_name": "Kerala",
        "district": "Alappuzha",
        "lat": 9.4981,
        "lon": 76.3388,
        "elevation_m": 1,
        "climate_zone": "Tropical Coastal Backwaters",
        "primary_types": ["nature", "general", "beach"],
        "description": "Traditional kettuvallam houseboats cruising through palm-fringed canals and lagoons.",
        "monsoon_months": [6, 7, 8, 9]
    },
    {
        "id": "jim-corbett",
        "name": "Jim Corbett National Park",
        "state_id": "IN-UK",
        "state_name": "Uttarakhand",
        "district": "Nainital",
        "lat": 29.5300,
        "lon": 78.7747,
        "elevation_m": 400,
        "climate_zone": "Terai & Shivalik Foothills",
        "primary_types": ["wildlife", "nature", "adventure"],
        "description": "India's oldest national park, Royal Bengal Tigers, wild elephants, and sal forests.",
        "monsoon_months": [7, 8, 9]  # Safari core zones closed in peak monsoon!
    },
    {
        "id": "ranthambore",
        "name": "Ranthambore National Park",
        "state_id": "IN-RJ",
        "state_name": "Rajasthan",
        "district": "Sawai Madhopur",
        "lat": 26.0173,
        "lon": 76.5026,
        "elevation_m": 350,
        "climate_zone": "Semi-Arid Dry Deciduous",
        "primary_types": ["wildlife", "nature", "cultural"],
        "description": "Famous tiger sightings against ancient Ranthambore Fort backdrop.",
        "monsoon_months": [7, 8, 9]  # Core zones closed in monsoon!
    },
    {
        "id": "kaziranga",
        "name": "Kaziranga National Park",
        "state_id": "IN-AS",
        "state_name": "Assam",
        "district": "Golaghat",
        "lat": 26.5775,
        "lon": 93.1711,
        "elevation_m": 80,
        "climate_zone": "Brahmaputra Floodplain (High Monsoon Inundation)",
        "primary_types": ["wildlife", "nature"],
        "description": "UNESCO sanctuary home to two-thirds of the world's great one-horned rhinoceroses.",
        "monsoon_months": [5, 6, 7, 8, 9]  # Park flooded and closed during summer monsoon!
    },
    {
        "id": "sundarbans",
        "name": "Sundarbans National Park",
        "state_id": "IN-WB",
        "state_name": "West Bengal",
        "district": "South 24 Parganas",
        "lat": 21.9497,
        "lon": 89.1833,
        "elevation_m": 3,
        "climate_zone": "Deltaic Mangrove (Bay of Bengal Cyclone Vulnerable)",
        "primary_types": ["wildlife", "nature", "adventure"],
        "description": "World's largest mangrove forest, swimming Royal Bengal Tigers, and estuarine crocodiles.",
        "monsoon_months": [6, 7, 8, 9, 10]
    }
]


def get_all_destinations() -> List[Dict[str, Any]]:
    """Returns all verified Indian tourist destinations."""
    return INDIAN_DESTINATIONS


def get_destination_by_id(dest_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a destination by its unique ID."""
    clean_id = dest_id.strip().lower()
    for d in INDIAN_DESTINATIONS:
        if d["id"] == clean_id:
            return d
    return None


def search_indian_destinations(query: str, travel_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Searches destinations by city name, state, district, or primary travel type.
    Strictly verifies destination is in India.
    """
    q = query.strip().lower()
    results = []
    
    for d in INDIAN_DESTINATIONS:
        # Match query in name, state, district, or description
        matches_text = (
            q in d["name"].lower() or
            q in d["state_name"].lower() or
            q in d["district"].lower() or
            q in d["description"].lower()
        )
        
        # Match travel type if specified
        matches_type = True
        if travel_type and travel_type != "general":
            clean_type = travel_type.lower()
            matches_type = clean_type in [t.lower() for t in d.get("primary_types", [])]
            
        if (not q or matches_text) and matches_type:
            results.append(d)
            
    return results


def resolve_indian_destination(
    name_or_query: str,
    custom_lat: Optional[float] = None,
    custom_lon: Optional[float] = None
) -> Dict[str, Any]:
    """
    Resolves an Indian destination. Validates that the destination or custom coordinates
    are strictly within India's borders. Rejects international destinations.
    """
    clean_query = name_or_query.strip()
    
    # 1. Check exact or partial match in curated catalog
    for d in INDIAN_DESTINATIONS:
        if d["id"] == clean_query.lower() or d["name"].lower() == clean_query.lower():
            return {
                "status": "success",
                "destination": d,
                "is_verified_indian_destination": True
            }
            
    # Partial search in catalog
    matches = search_indian_destinations(clean_query)
    if matches:
        return {
            "status": "success",
            "destination": matches[0],
            "is_verified_indian_destination": True,
            "matched_from_catalog": True
        }
        
    # 2. If custom coordinates were passed, check if they are within India
    if custom_lat is not None and custom_lon is not None:
        if not is_within_india(custom_lat, custom_lon):
            return {
                "status": "error",
                "error_code": "INTERNATIONAL_DESTINATION_REJECTED",
                "message": (
                    f"Location '{clean_query}' (Lat {custom_lat}, Lon {custom_lon}) falls outside India. "
                    "AstroKites Smart Travel Planner exclusively covers destinations within India."
                )
            }
        return {
            "status": "success",
            "destination": {
                "id": f"custom-{re.sub(r'[^a-z0-9]', '-', clean_query.lower())}",
                "name": clean_query,
                "state_id": "IN-CUSTOM",
                "state_name": "India",
                "district": clean_query,
                "lat": float(custom_lat),
                "lon": float(custom_lon),
                "elevation_m": 100,
                "climate_zone": "Indian Subcontinent",
                "primary_types": ["general"],
                "description": f"Verified Indian location: {clean_query}",
                "monsoon_months": [6, 7, 8, 9]
            },
            "is_verified_indian_destination": True
        }

    # 3. Known foreign destinations check - immediately reject with helpful message
    FOREIGN_KEYWORDS = [
        "paris", "london", "dubai", "new york", "singapore", "tokyo", "bangkok", 
        "bali", "phuket", "rome", "maldives", "switzerland", "sydney", "toronto",
        "los angeles", "amsterdam", "barcelona", "nepal", "bhutan", "colombo"
    ]
    if any(fk in clean_query.lower() for fk in FOREIGN_KEYWORDS):
        return {
            "status": "error",
            "error_code": "INTERNATIONAL_DESTINATION_REJECTED",
            "message": (
                f"'{clean_query}' is an international destination. "
                "AstroKites Smart Travel Planner operates exclusively within India. "
                "Please select an Indian tourist destination (e.g., Goa, Manali, Kerala, Jaipur, Ooty, Darjeeling)."
            )
        }

    return {
        "status": "error",
        "error_code": "DESTINATION_NOT_FOUND",
        "message": (
            f"Could not verify '{clean_query}' as a valid destination in India. "
            "Please select a destination from the Indian states or search for a recognized Indian city."
        )
    }
