"""
AstroKites Agricultural Risk Service
Evaluates 5 critical agricultural risk factors:
1. Drought / Dry Spell Risk
2. Flood / Waterlogging Risk
3. Heat Stress Risk
4. Pest & Disease Outbreak Risk
5. Price & Market Volatility Risk
"""

from typing import Dict, Any, Optional, List
from services.crop_database import get_crop_by_name
from services.mandi_market_service import get_commodity_market_summary


def assess_agricultural_risks(
    crop_name: str,
    rainfall_summary: Optional[Dict[str, Any]] = None,
    soil_type: str = "Loamy soil",
    irrigation: str = "Good irrigation",
    state: Optional[str] = None,
    district: Optional[str] = None,
    weather_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates risk factors and generates agronomic mitigation advisories.
    """
    crop = get_crop_by_name(crop_name)
    crop_display = crop["name"] if crop else crop_name
    market = get_commodity_market_summary(crop_name)

    # Rainfall parameters
    r_summary = rainfall_summary or weather_summary or {}
    total_rain = r_summary.get("total_rainfall_mm", 550.0)
    dry_days = r_summary.get("distribution", {}).get("dry_days", 15)

    # 1. Drought / Dry Spell Risk
    drought_score = 25  # Low base
    if "rainfed" in irrigation.lower():
        if total_rain < 400.0 or dry_days > 20:
            drought_score = 75
            drought_level = "High Risk"
            drought_advisory = "Extended dry spell warning. Schedule life-saving irrigation and apply straw mulch."
        else:
            drought_score = 45
            drought_level = "Moderate"
            drought_advisory = "Monitor soil moisture; prepare supplementary sprinkler irrigation."
    else:
        drought_level = "Low Risk"
        drought_advisory = "Protected by available irrigation infrastructure."

    # 2. Waterlogging / Excess Rain Risk
    if total_rain > 1100.0 or "clay" in soil_type.lower():
        flood_score = 65
        flood_level = "Moderate to High"
        flood_advisory = "Clear drainage channels to prevent root asphyxiation and collar rot."
    else:
        flood_score = 20
        flood_level = "Low Risk"
        flood_advisory = "Drainage conditions are within safe agronomic parameters."

    # 3. Heat Stress Risk
    mean_temp = r_summary.get("mean_temp_c", 27.0)
    extreme_max = r_summary.get("extreme_max_c", 36.0)
    if extreme_max > 38.0 or mean_temp > 32.0:
        heat_score = 70
        heat_level = "High"
        heat_advisory = f"High temperature stress risk ({extreme_max}°C). Irrigate during evening/early morning hours."
    else:
        heat_score = 25
        heat_level = "Low"
        heat_advisory = "Temperature conditions are favorable for vegetative growth."

    # 4. Pest & Disease Outbreak Risk
    pest_risks = crop.get("common_risks", []) if crop else ["Stem borer", "Fungal blight"]
    pest_advisory = f"Monitor crop fields for {pest_risks[0] if pest_risks else 'common pests'}. Follow ICAR integrated pest management."

    # 5. Market / Price Volatility Risk
    volatility_score = 30
    if market.get("modal_price", 0) > 6000:
        volatility_score = 40  # High value commodities experience price swings
    market_advisory = f"Current modal price is {market.get('modal_price')} {market.get('unit')}. Check local APMC arrivals to avoid post-harvest gluts."

    composite_risk_score = round((drought_score * 0.25) + (flood_score * 0.20) + (heat_score * 0.20) + (35 * 0.15) + (volatility_score * 0.20), 1)

    overall_status = (
        "High Overall Risk" if composite_risk_score >= 60
        else "Moderate Risk" if composite_risk_score >= 40
        else "Low / Manageable Risk"
    )

    return {
        "status": "success",
        "crop_name": crop_display,
        "location": {"state": state, "district": district},
        "composite_risk_score": composite_risk_score,
        "overall_status": overall_status,
        "risk_breakdown": {
            "drought_risk": {
                "score": drought_score,
                "level": drought_level,
                "advisory": drought_advisory
            },
            "flood_risk": {
                "score": flood_score,
                "level": flood_level,
                "advisory": flood_advisory
            },
            "heat_stress_risk": {
                "score": heat_score,
                "level": heat_level,
                "advisory": heat_advisory
            },
            "pest_disease_risk": {
                "score": 35,
                "level": "Moderate",
                "known_vulnerabilities": pest_risks,
                "advisory": pest_advisory
            },
            "market_volatility_risk": {
                "score": volatility_score,
                "level": "Moderate",
                "advisory": market_advisory
            }
        },
        "mitigation_strategies": [
            "Use certified drought/pest tolerant seed varieties.",
            "Install farm pond or rainwater harvesting micro-structures.",
            "Maintain soil organic mulch cover to reduce evapotranspiration.",
            "Register on e-NAM / local APMC for transparent price discovery."
        ]
    }
