"""
AstroKites Crop Recommendation Engine
Performs rule-based agronomic suitability scoring based on climate summary (rainfall, temperature),
soil characteristics, irrigation infrastructure, and growing duration.
"""

from typing import Dict, Any, List, Optional
from services.crop_database import get_all_crops, CROP_DATABASE


def recommend_crops(
    climate_summary: Dict[str, Any],
    soil_type: str = "Loamy soil",
    irrigation: str = "Good irrigation",
    duration_days: int = 120,
    season: Optional[str] = None,
    state: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ranks crops by agronomic compatibility with climate summary and farm conditions.
    """
    crops = get_all_crops()
    clean_soil = (soil_type or "Loamy soil").strip().lower()
    clean_irrigation = (irrigation or "Good irrigation").strip().lower()

    # Extract climate variables
    avg_temp = climate_summary.get("temperature", {}).get("mean_t2m_c", 26.5)
    total_rain = climate_summary.get("rainfall", {}).get("total_rainfall_mm", 600.0)

    # Scaled rainfall estimate for full crop cycle
    effective_rain = total_rain if duration_days >= 90 else total_rain * (120.0 / max(duration_days, 15))

    scored_crops = []

    for crop in crops:
        score = 0.0
        explanations = []

        # 1. Temperature suitability (0 - 30 pts)
        t_opt = crop["optimal_temp_range"]
        t_abs = crop["absolute_temp_range"]
        if t_opt[0] <= avg_temp <= t_opt[1]:
            score += 30.0
            explanations.append(f"Temperature {avg_temp:.1f}°C is optimal ({t_opt[0]}–{t_opt[1]}°C).")
        elif t_abs[0] <= avg_temp <= t_abs[1]:
            score += 20.0
            explanations.append(f"Temperature {avg_temp:.1f}°C is within acceptable range ({t_abs[0]}–{t_abs[1]}°C).")
        else:
            score += 8.0
            explanations.append(f"Temperature {avg_temp:.1f}°C deviates from ideal tolerance.")

        # 2. Water / Rainfall suitability (0 - 30 pts)
        r_opt = crop["rainfall_requirement_mm"]
        if "good" in clean_irrigation:
            score += 28.0
            explanations.append("Adequate irrigation satisfies water requirements throughout growth stages.")
        elif "limited" in clean_irrigation:
            if r_opt[0] * 0.7 <= effective_rain <= r_opt[1] * 1.3:
                score += 25.0
                explanations.append("Supplemental irrigation balances rainfall deficit.")
            else:
                score += 18.0
                explanations.append("Limited irrigation may require moisture conservation techniques.")
        else: # Rainfed
            if r_opt[0] <= effective_rain <= r_opt[1]:
                score += 30.0
                explanations.append(f"Rainfall ({effective_rain:.0f} mm) directly meets rainfed crop demand.")
            elif effective_rain >= r_opt[0] * 0.6:
                score += 18.0
                explanations.append(f"Sub-optimal rain ({effective_rain:.0f} mm) under rainfed conditions.")
            else:
                score += 10.0
                explanations.append("High drought stress risk under rainfed conditions.")

        # 3. Soil suitability (0 - 25 pts)
        suitable_soils = [s.lower() for s in crop["suitable_soils"]]
        if any(s in clean_soil for s in suitable_soils):
            score += 25.0
            explanations.append(f"{soil_type} matches {crop['name']}'s preferred soil profile.")
        elif "loam" in clean_soil or "alluvial" in clean_soil:
            score += 20.0
            explanations.append(f"{soil_type} offers favorable fertility and structure.")
        else:
            score += 12.0
            explanations.append(f"{soil_type} requires targeted conditioning.")

        # 4. Season suitability (0 - 15 pts)
        crop_seasons = [s.lower() for s in crop["sowing_season"]]
        if not season or season.lower() == "auto" or any(season.lower() in s for s in crop_seasons):
            score += 15.0
            explanations.append(f"Well-timed for current cropping window ({', '.join(crop['sowing_season'])}).")
        else:
            score += 6.0
            explanations.append(f"Off-season: preferred season is {', '.join(crop['sowing_season'])}.")

        total_score = round(min(score, 100.0), 1)
        suitability_class = (
            "Highly Suitable" if total_score >= 82
            else "Moderately Suitable" if total_score >= 68
            else "Marginally Suitable"
        )

        scored_crops.append({
            "crop_id": crop["id"],
            "crop_name": crop["name"],
            "category": crop["category"],
            "suitability_score": total_score,
            "suitability_class": suitability_class,
            "growing_duration_days": crop["growing_duration_days"],
            "water_requirement": crop["water_requirement"],
            "primary_states": crop["primary_states"][:4],
            "explanations": explanations,
            "common_risks": crop.get("common_risks", [])[:2]
        })

    # Sort descending
    scored_crops.sort(key=lambda x: x["suitability_score"], reverse=True)

    return {
        "status": "success",
        "crops_evaluated": len(scored_crops),
        "top_recommendations": scored_crops[:6],
        "all_recommendations": scored_crops
    }
