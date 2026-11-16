"""
AstroKites Soil Service
Provides agronomic classification, physical and chemical profiles, and suitability
analysis based on Indian Council of Agricultural Research (ICAR) benchmarks.
"""

from typing import Dict, Any, Optional, List

SOIL_PROPERTIES: Dict[str, Dict[str, Any]] = {
    "Alluvial soil": {
        "description": "Formed by deposition of silt by Indo-Gangetic river systems. Highly fertile, rich in potash and lime.",
        "typical_ph_range": [6.5, 7.8],
        "organic_carbon_range": [0.4, 0.8],
        "water_retention": "High",
        "drainage": "Well-drained",
        "aeration": "Good",
        "primary_states": ["Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal", "Assam"],
        "recommended_crops": ["Rice", "Wheat", "Sugarcane", "Maize", "Cotton", "Jute", "Oilseeds", "Vegetables"],
        "management_tips": "Maintain organic matter through crop residue retention and green manuring. Balanced NPK application prevents nutrient depletion."
    },
    "Black soil": {
        "description": "Regur / Black cotton soil derived from Deccan basalt trap rocks. High clay content with high moisture retention and self-ploughing cracks.",
        "typical_ph_range": [7.2, 8.5],
        "organic_carbon_range": [0.3, 0.6],
        "water_retention": "Very High",
        "drainage": "Moderate to Poor",
        "aeration": "Moderate",
        "primary_states": ["Maharashtra", "Madhya Pradesh", "Gujarat", "Andhra Pradesh", "Karnataka", "Telangana"],
        "recommended_crops": ["Cotton", "Soybean", "Wheat", "Jowar", "Pigeon Pea", "Chickpea", "Sunflower", "Groundnut"],
        "management_tips": "Provide surface drainage channels to prevent waterlogging during monsoon. Apply zinc and phosphorus as black soils can fix phosphorus."
    },
    "Red soil": {
        "description": "Formed by weathering of ancient crystalline metamorphic rocks. Rich in iron oxides giving a reddish tint, generally porous and friable.",
        "typical_ph_range": [5.5, 7.0],
        "organic_carbon_range": [0.2, 0.5],
        "water_retention": "Low to Moderate",
        "drainage": "Fast / Excellent",
        "aeration": "High",
        "primary_states": ["Tamil Nadu", "Karnataka", "Andhra Pradesh", "Odisha", "Jharkhand", "Telangana"],
        "recommended_crops": ["Groundnut", "Ragi", "Maize", "Pulses", "Tobacco", "Millets", "Vegetables"],
        "management_tips": "Incorporate farmyard manure or vermicompost to improve water-holding capacity. Split nitrogen applications to minimize leaching losses."
    },
    "Laterite soil": {
        "description": "Developed under intense tropical monsoon weathering with alternate wet and dry spells. Leached of silica, leaving iron and aluminum oxides.",
        "typical_ph_range": [4.8, 6.2],
        "organic_carbon_range": [0.2, 0.4],
        "water_retention": "Low",
        "drainage": "Excessive",
        "aeration": "High",
        "primary_states": ["Kerala", "Karnataka (coastal)", "Goa", "Maharashtra (Konkan)", "Odisha", "Assam hills"],
        "recommended_crops": ["Cashew", "Coconut", "Coffee", "Tea", "Rubber", "Ragi", "Rice (terraced)"],
        "management_tips": "Apply agricultural lime (calcium carbonate) or dolomite to correct soil acidity. Frequent micro-irrigation and mulch are essential."
    },
    "Loamy soil": {
        "description": "Equilibrium mixture of sand (40%), silt (40%), and clay (20%). The ideal universal agricultural soil structure.",
        "typical_ph_range": [6.2, 7.4],
        "organic_carbon_range": [0.5, 1.0],
        "water_retention": "Balanced / Optimal",
        "drainage": "Optimal",
        "aeration": "Optimal",
        "primary_states": ["Across alluvial and river valley regions throughout India"],
        "recommended_crops": ["Wheat", "Rice", "Sugarcane", "Cotton", "Maize", "Pulses", "All Vegetables", "Fruits"],
        "management_tips": "Maintain crumb structure by minimizing aggressive deep tillage and rotating legume crops."
    },
    "Sandy soil": {
        "description": "Coarse textured soil with large particles, low cation exchange capacity, and high percolation rate.",
        "typical_ph_range": [6.8, 8.2],
        "organic_carbon_range": [0.1, 0.3],
        "water_retention": "Very Low",
        "drainage": "Very Fast",
        "aeration": "Very High",
        "primary_states": ["Rajasthan", "Gujarat (coastal/arid)", "Southern Punjab", "Haryana (arid)"],
        "recommended_crops": ["Bajra", "Guar", "Groundnut", "Sesame", "Watermelon", "Cucumber", "Gram"],
        "management_tips": "Adopt drip irrigation and plastic mulching. Regularly apply bulky organic manures and biochar to build moisture retention."
    },
    "Clay soil": {
        "description": "Fine-textured soil composed of tiny mineral particles. High nutrient retention but compacts easily when wet and bakes hard when dry.",
        "typical_ph_range": [6.8, 8.0],
        "organic_carbon_range": [0.4, 0.7],
        "water_retention": "Very High",
        "drainage": "Slow / Poor",
        "aeration": "Low",
        "primary_states": ["River deltas, lake basins, and lowland rice tracts across India"],
        "recommended_crops": ["Rice", "Paddy", "Wheat", "Sugarcane", "Gram"],
        "management_tips": "Avoid cultivating when excessively wet to prevent heavy compaction. Incorporate sand and compost to lighten the texture."
    },
    "Unknown / Not sure": {
        "description": "Standard neutral baseline evaluation representing general agricultural loam conditions.",
        "typical_ph_range": [6.5, 7.5],
        "organic_carbon_range": [0.4, 0.7],
        "water_retention": "Moderate",
        "drainage": "Moderate",
        "aeration": "Moderate",
        "primary_states": ["All India average"],
        "recommended_crops": ["Broadly adaptable crops: Wheat, Rice, Maize, Mustard, Pulses"],
        "management_tips": "We recommend a local Krishi Vigyan Kendra (KVK) or Soil Health Card laboratory test to confirm exact NPK and organic carbon values."
    }
}


def analyze_soil(
    soil_type: str,
    ph: Optional[float] = None,
    organic_carbon_pct: Optional[float] = None,
    npk_status: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs comprehensive agronomic analysis of the soil against ICAR benchmarks.
    """
    canonical_key = "Unknown / Not sure"
    clean_type = (soil_type or "").strip().lower()

    for k in SOIL_PROPERTIES.keys():
        if k.lower() in clean_type or clean_type in k.lower():
            canonical_key = k
            break

    profile = SOIL_PROPERTIES[canonical_key]

    # Evaluate pH
    evaluated_ph = ph if ph is not None else sum(profile["typical_ph_range"]) / 2.0
    ph_status = "Neutral"
    if evaluated_ph < 6.0:
        ph_status = "Moderately Acidic"
    elif evaluated_ph < 5.0:
        ph_status = "Strongly Acidic"
    elif evaluated_ph > 8.0:
        ph_status = "Alkaline / Saline tendency"
    elif evaluated_ph > 7.5:
        ph_status = "Slightly Alkaline"

    # Evaluate Organic Carbon
    evaluated_oc = organic_carbon_pct if organic_carbon_pct is not None else sum(profile["organic_carbon_range"]) / 2.0
    oc_status = "Medium"
    if evaluated_oc < 0.3:
        oc_status = "Low (Depleted)"
    elif evaluated_oc > 0.75:
        oc_status = "High (Fertile)"

    return {
        "soil_type": canonical_key,
        "description": profile["description"],
        "ph_rating": {
            "value": round(evaluated_ph, 2),
            "status": ph_status,
            "benchmark_range": profile["typical_ph_range"],
            "is_lab_verified": ph is not None
        },
        "organic_carbon": {
            "value_percent": round(evaluated_oc, 2),
            "status": oc_status,
            "benchmark_range": profile["organic_carbon_range"],
            "is_lab_verified": organic_carbon_pct is not None
        },
        "physical_properties": {
            "water_retention": profile["water_retention"],
            "drainage": profile["drainage"],
            "aeration": profile["aeration"]
        },
        "primary_growing_regions": profile["primary_states"],
        "recommended_crops": profile["recommended_crops"],
        "management_advisory": profile["management_tips"],
        "npk_advisory": npk_status or "Standard 4:2:1 N:P:K ratio adjusted according to local crop guidelines."
    }
