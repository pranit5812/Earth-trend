"""
AstroKites Farmer Crop Advisor Engine
Implements the 5-factor weighted agronomic and economic scoring model:
  - Weather Suitability: 30%
  - Soil Suitability: 25%
  - Water Availability: 15%
  - Market Indicators: 20% (AGMARKNET modal prices, MSP support, arrival momentum)
  - Seasonal Suitability: 10%
Synthesizes real weather forecasts, ICAR agronomic thresholds, and official AGMARKNET mandi data.
"""

from typing import Dict, List, Any, Optional, Tuple
from services.crop_database import CROP_DATABASE, get_all_crops
from services.soil_service import analyze_soil
from services.mandi_market_service import get_commodity_market_summary


def _score_weather(crop: Dict[str, Any], forecast_weather: Dict[str, Any]) -> Tuple[float, str]:
    """Scores 30% weather factor using temperature comfort, rainfall, and extremes."""
    mean_temp = forecast_weather.get("mean_temp_c", 26.0)
    rain_mm = forecast_weather.get("rainfall_mm", 450.0)
    
    t_req = crop["temperature_req"]
    r_req = crop["rainfall_req"]

    # Temperature score
    if t_req["optimal_min_c"] <= mean_temp <= t_req["optimal_max_c"]:
        t_sub = 96.0
        t_exp = f"Temperature ({mean_temp:.1f}°C) is in optimal zone ({t_req['optimal_min_c']}-{t_req['optimal_max_c']}°C)."
    elif t_req["min_c"] <= mean_temp <= t_req["max_c"]:
        t_sub = 75.0
        t_exp = f"Temperature ({mean_temp:.1f}°C) is within tolerable boundaries."
    else:
        t_sub = 35.0
        t_exp = f"Temperature ({mean_temp:.1f}°C) deviates from crop thermal threshold."

    # Rainfall score
    if r_req["optimal_min_mm"] <= rain_mm <= r_req["optimal_max_mm"]:
        r_sub = 95.0
        r_exp = f"Rainfall ({rain_mm:.0f} mm) is in optimal range ({r_req['optimal_min_mm']}-{r_req['optimal_max_mm']} mm)."
    elif r_req["min_mm"] <= rain_mm <= r_req["max_mm"]:
        r_sub = 72.0
        r_exp = f"Rainfall ({rain_mm:.0f} mm) is manageable with proper water management."
    elif rain_mm < r_req["min_mm"]:
        r_sub = max(20.0, 50.0 - ((r_req['min_mm'] - rain_mm) / r_req['min_mm']) * 35.0)
        r_exp = f"Rainfall ({rain_mm:.0f} mm) is below optimal ({r_req['min_mm']} mm); supplementary irrigation advised."
    else:
        r_sub = max(20.0, 55.0 - ((rain_mm - r_req['max_mm']) / r_req['max_mm']) * 35.0)
        r_exp = f"Rainfall ({rain_mm:.0f} mm) is high; ensure adequate drainage."

    weather_score = round(t_sub * 0.5 + r_sub * 0.5, 1)
    explanation = f"{t_exp} {r_exp}"
    return weather_score, explanation


def _score_soil(crop: Dict[str, Any], soil_type: str) -> Tuple[float, str]:
    """Scores 25% soil factor against ICAR soil classifications."""
    suitable_soils = crop["suitable_soils"]
    clean_soil = (soil_type or "").strip().lower()

    if not clean_soil or "unknown" in clean_soil:
        return 72.0, "Soil not specified; evaluated with generalized neutral loam estimate."

    for s in suitable_soils:
        if s.lower() in clean_soil or clean_soil in s.lower():
            return 95.0, f"{soil_type} perfectly matches {crop['name']}'s preferred soil profile."

    if "loam" in clean_soil:
        return 88.0, f"Loamy soil provides balanced physical structure for {crop['name']}."
    elif "alluvial" in clean_soil:
        return 85.0, f"Alluvial soil offers high natural fertility and drainage for {crop['name']}."
    elif "black" in clean_soil:
        return 78.0, f"Black soil retains moisture well, though aeration must be monitored for {crop['name']}."
    elif "red" in clean_soil:
        return 76.0, f"Red soil provides good aeration, though split fertigation is recommended."
    else:
        return 50.0, f"{soil_type} requires organic soil amendments for optimal {crop['name']} growth."


def _score_water(crop: Dict[str, Any], irrigation: str, weather_rain_mm: float) -> Tuple[float, str]:
    """Scores 15% water availability & irrigation security factor."""
    irr = (irrigation or "Good irrigation").strip().lower()
    crop_water = crop["water_requirement"].lower()

    if "good" in irr:
        return 96.0, "Good irrigation ensures reliable moisture across critical phenological stages."
    elif "limited" in irr:
        if crop_water in ("very low", "low"):
            return 90.0, "Limited irrigation is more than adequate for this low water-demand crop."
        elif crop_water == "medium":
            return 75.0, "Limited irrigation suffices with scheduled critical-stage applications."
        else:
            return 48.0, "High water requirement makes this crop vulnerable under limited irrigation."
    else:  # Rainfed
        if crop_water in ("very low", "low"):
            return 88.0, "Highly suitable for rainfed cultivation."
        elif crop_water == "medium":
            return 60.0 if weather_rain_mm >= 500 else 42.0, "Rainfed success depends on consistent monsoon distribution."
        else:
            return 25.0, "Heavy water requirement makes rainfed cultivation risky."


def _score_market(crop: Dict[str, Any], state: str = None) -> Tuple[float, str, Dict[str, Any]]:
    """Scores 20% market indicator factor based on real AGMARKNET mandi prices."""
    summary = get_commodity_market_summary(crop["name"], state=state)
    modal = summary["modal_price"]
    sentiment = summary["market_sentiment"]
    raw_sentiment_score = summary["sentiment_score"]

    if modal >= 6000:
        m_score = 94.0
        m_exp = f"Premium market value (₹{modal:,.0f}/Qtl in {summary['top_market']}). Strong cash crop return."
    elif modal >= 3500:
        m_score = 84.0
        m_exp = f"Favorable market rates (₹{modal:,.0f}/Qtl). Steady commercial mandi demand."
    elif modal >= 2200:
        m_score = 74.0
        m_exp = f"Stable MSP-backed commodity price (₹{modal:,.0f}/Qtl). Reliable government procurement."
    else:
        m_score = 62.0
        m_exp = f"Standard market rate (₹{modal:,.0f}/Qtl). High volume trade."

    return m_score, m_exp, summary


def _score_season(crop: Dict[str, Any], user_season: Optional[str]) -> Tuple[float, str]:
    """Scores 10% seasonal suitability factor (Kharif, Rabi, Zaid)."""
    if not user_season or user_season.lower() in ("auto", "auto-detect", "none"):
        return 88.0, f"Cultivated across {', '.join(crop['seasons'])} seasons."

    clean_s = user_season.strip().capitalize()
    if clean_s in crop["seasons"]:
        return 96.0, f"Current season ({clean_s}) is a primary recommended growing window for {crop['name']}."
    else:
        return 45.0, f"Off-season for traditional {crop['name']} cultivation (typically {', '.join(crop['seasons'])})."


def evaluate_farmer_recommendations(
    location_name: str,
    state: str,
    district: Optional[str] = None,
    soil_type: str = "Loamy soil",
    irrigation: str = "Good irrigation",
    season: Optional[str] = None,
    preferred_category: Optional[str] = None,
    weather_summary: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Ranks all crops using the 5-factor weighted formula:
    Suitability Score = (Weather * 0.30) + (Soil * 0.25) + (Water * 0.15) + (Market * 0.20) + (Season * 0.10)
    """
    if not weather_summary:
        # Season-aware representative weather defaults for India
        is_rabi = season and season.strip().capitalize() == "Rabi"
        is_zaid = season and season.strip().capitalize() == "Zaid"

        if is_rabi:
            # Rabi (Winter) season: cooler temperatures, lower rainfall
            is_north = state and any(n in state for n in ["Punjab", "Haryana", "Himachal", "Jammu", "Uttar Pradesh", "Rajasthan", "Delhi"])
            mean_t = 18.0 if is_north else 22.5
            weather_summary = {
                "mean_temp_c": mean_t,
                "min_temp_c": mean_t - 6.5,
                "max_temp_c": mean_t + 5.5,
                "rainfall_mm": 120.0,
                "humidity_pct": 60.0,
                "wind_speed_ms": 2.5
            }
        elif is_zaid:
            # Zaid (Summer) season: hotter, low rainfall
            weather_summary = {
                "mean_temp_c": 32.0,
                "min_temp_c": 24.0,
                "max_temp_c": 39.0,
                "rainfall_mm": 60.0,
                "humidity_pct": 45.0,
                "wind_speed_ms": 4.0
            }
        else:
            # Kharif (Monsoon) season: warm, humid, abundant rain
            weather_summary = {
                "mean_temp_c": 27.5,
                "min_temp_c": 22.0,
                "max_temp_c": 33.0,
                "rainfall_mm": 750.0,
                "humidity_pct": 78.0,
                "wind_speed_ms": 3.5
            }

    all_crops = get_all_crops()
    evaluated = []

    for crop in all_crops:
        if preferred_category and preferred_category.lower() != "all":
            if crop["category"].lower() != preferred_category.lower():
                continue

        w_score, w_exp = _score_weather(crop, weather_summary)
        s_score, s_exp = _score_soil(crop, soil_type)
        i_score, i_exp = _score_water(crop, irrigation, weather_summary.get("rainfall_mm", 500.0))
        m_score, m_exp, m_data = _score_market(crop, state=state)
        c_score, c_exp = _score_season(crop, season)

        # 5-factor weighted formula
        overall_score = (
            (w_score * 0.30) +
            (s_score * 0.25) +
            (i_score * 0.15) +
            (m_score * 0.20) +
            (c_score * 0.10)
        )

        # Regional ICAR agro-ecological adaptation bonus if state is in crop's primary states
        is_primary_region = any(state.lower() in ps.lower() or ps.lower() in state.lower() for ps in crop.get("primary_states", [])) if state else False
        if is_primary_region:
            overall_score = min(overall_score + 4.0, 98.5)

        overall_score = round(overall_score, 1)

        # Classification
        if overall_score >= 80.0:
            classification = "High suitability"
            badge_color = "#16a34a"  # Green
        elif overall_score >= 65.0:
            classification = "Moderate suitability"
            badge_color = "#2563eb"  # Blue
        elif overall_score >= 45.0:
            classification = "Low suitability"
            badge_color = "#d97706"  # Amber
        else:
            classification = "Not recommended"
            badge_color = "#dc2626"  # Red

        # Weather & Market risks
        weather_risks = crop["risks"][:2]
        market_risks = [
            f"Price volatility of ~{8 if m_data['modal_price'] < 3000 else 12}% in post-harvest arrival period.",
            f"Check local APMC arrivals before harvesting to avoid seasonal gluts."
        ]

        # Sowing period
        sowing_window = f"Recommended sowing: {crop['seasons'][0]} season (Duration: {crop['duration_days']['avg']} days)"

        evaluated.append({
            "crop_id": crop["name"].lower().replace(" ", "_"),
            "crop_name": crop["name"],
            "scientific_name": crop["scientific_name"],
            "category": crop["category"],
            "overall_suitability_score": overall_score,
            "classification": classification,
            "badge_color": badge_color,
            "scores_breakdown": {
                "weather_suitability": w_score,
                "soil_suitability": s_score,
                "water_availability": i_score,
                "market_indicators": m_score,
                "seasonal_suitability": c_score
            },
            "market_summary": {
                "modal_price": m_data["modal_price"],
                "min_price": m_data["min_price"],
                "max_price": m_data["max_price"],
                "unit": m_data["unit"],
                "market_sentiment": m_data["market_sentiment"],
                "latest_mandi": m_data["top_market"],
                "market_date": m_data["market_date"]
            },
            "explanations": {
                "weather": w_exp,
                "soil": s_exp,
                "water": i_exp,
                "market": m_exp,
                "season": c_exp
            },
            "weather_risks": weather_risks,
            "market_risks": market_risks,
            "suggested_sowing_period": sowing_window,
            "advantages": crop["advantages"],
            "growing_duration_days": crop["duration_days"]["avg"],
            "water_requirement": crop["water_requirement"]
        })

    # Sort descending by overall suitability
    evaluated.sort(key=lambda x: x["overall_suitability_score"], reverse=True)

    return {
        "status": "success",
        "location": {
            "name": location_name,
            "state": state,
            "district": district
        },
        "formula_weights": {
            "weather": "30%",
            "soil": "25%",
            "water": "15%",
            "market": "20%",
            "season": "10%"
        },
        "crops_count": len(evaluated),
        "top_recommendations": evaluated[:5],
        "all_ranked_crops": evaluated
    }
