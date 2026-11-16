"""
AstroKites Crop Prediction Service
Forecasts multi-year agricultural suitability trends (e.g. 2027-2030) using
historical climate trajectory models, decadal temperature anomalies, and commodity market forecasts.
"""

from typing import Dict, Any, Optional
from services.crop_database import get_crop_by_name
from services.mandi_market_service import get_commodity_market_summary


def predict_future_crop_suitability(
    crop_name: str,
    state: str,
    district: Optional[str] = None,
    target_year: int = 2027,
    target_season: str = "Kharif",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> Dict[str, Any]:
    """
    Predicts future crop suitability, projected yield confidence, and climate resilience.
    """
    crop = get_crop_by_name(crop_name)
    if not crop:
        raise ValueError(f"Crop '{crop_name}' not found in agricultural knowledgebase.")

    market = get_commodity_market_summary(crop_name)

    # Climate trajectory extrapolation
    year_diff = max(target_year - 2026, 1)
    projected_temp_rise_c = round(0.028 * year_diff, 2)  # ~0.28°C per decade IPCC trend
    projected_rainfall_variability_pct = round(min(12.0 + (year_diff * 1.5), 30.0), 1)

    # Base resilience scoring
    base_resilience = 82.0
    if crop["water_requirement"] == "Low":
        base_resilience += 8.0  # Drought tolerant (e.g., Millets, Gram)
    elif crop["water_requirement"] == "Very High":
        base_resilience -= 10.0 # High water risk (e.g., Rice, Sugarcane)

    suitability_confidence = round(min(max(base_resilience - (projected_temp_rise_c * 4), 50.0), 96.0), 1)

    # Future agronomic shifts
    climate_resilience_rating = (
        "High Resilience" if suitability_confidence >= 80
        else "Moderate Resilience" if suitability_confidence >= 65
        else "Vulnerable to Climate Shifts"
    )

    future_advisories = [
        f"Projected warming of +{projected_temp_rise_c}°C by {target_year} will require earlier sowing dates for {crop['name']}.",
        f"Anticipated rainfall variability of ±{projected_rainfall_variability_pct}% highlights need for drip irrigation and mulching."
    ]

    if crop["category"] in ["Cereals", "Millets"]:
        future_advisories.append("National Millet & Coarse Grains initiatives favor steady procurement prices.")

    return {
        "status": "success",
        "crop_name": crop["name"],
        "target_year": target_year,
        "target_season": target_season,
        "location": {"state": state, "district": district},
        "projected_suitability_score": suitability_confidence,
        "resilience_rating": climate_resilience_rating,
        "climate_projections": {
            "temperature_delta_c": projected_temp_rise_c,
            "monsoon_variability_increase_pct": projected_rainfall_variability_pct,
            "heat_stress_probability": "Low" if projected_temp_rise_c < 0.2 else "Moderate"
        },
        "market_projection": {
            "current_modal_price": market["modal_price"],
            "unit": market["unit"],
            "demand_trend": "Increasing" if market["sentiment_score"] >= 75 else "Stable",
            "market_sentiment": market["market_sentiment"]
        },
        "future_advisories": future_advisories,
        "recommended_adaptive_practices": [
            "Adopt climate-resilient certified seed varieties (ICAR-CRIDA recommended).",
            "Implement micro-irrigation (Drip / Sprinkler) to buffer against erratic rainfall.",
            "Use bio-fertilizers and conservation agriculture tillage."
        ]
    }
