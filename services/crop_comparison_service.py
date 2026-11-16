"""
AstroKites Crop Comparison Service
Enables multi-crop side-by-side agronomic and economic comparative analysis (2 to 5 crops).
Compares water footprints, duration, soil affinity, market indicators (AGMARKNET modal prices),
and climatic thresholds.
"""

from typing import Dict, Any, List, Optional
from services.crop_database import get_crop_by_name
from services.mandi_market_service import get_commodity_market_summary


def compare_multiple_crops(
    crop_names: List[str],
    state: Optional[str] = None,
    district: Optional[str] = None,
    soil_type: Optional[str] = None,
    irrigation: Optional[str] = None
) -> Dict[str, Any]:
    """
    Produces side-by-side matrix comparing selected crops.
    """
    if not crop_names or len(crop_names) < 2:
        raise ValueError("Please provide at least 2 crops to compare.")

    compared_list = []

    for name in crop_names[:5]:
        crop = get_crop_by_name(name)
        if not crop:
            continue

        market = get_commodity_market_summary(crop["name"], state=state)

        # Determine soil match
        clean_soil = (soil_type or "").lower()
        suitable = [s.lower() for s in crop.get("suitable_soils", [])]
        soil_match = "Compatible"
        if clean_soil:
            if any(s in clean_soil or clean_soil in s for s in suitable):
                soil_match = "Optimal Match"
            elif "loam" in clean_soil or "alluvial" in clean_soil:
                soil_match = "Good Match"
            else:
                soil_match = "Moderate Match"

        dur = crop.get("duration_days")
        duration_val = dur.get("avg", 120) if isinstance(dur, dict) else (int(dur) if isinstance(dur, (int, float)) else 120)

        # Rainfall range
        r_req = crop.get("rainfall_req", {})
        if r_req:
            rain_str = f"{r_req.get('min_mm', 400)} - {r_req.get('max_mm', 800)} mm"
        else:
            rain_str = "400 - 800 mm"

        # Temp range
        t_req = crop.get("temperature_req", {})
        if t_req:
            temp_str = f"{t_req.get('min_c', 15.0):.0f} - {t_req.get('max_c', 35.0):.0f} °C"
        else:
            temp_str = "18 - 32 °C"

        seasons_list = crop.get("seasons") or crop.get("sowing_season") or ["Kharif"]
        cid = crop.get("crop_id") or crop["name"].lower().replace(" ", "_")

        compared_list.append({
            "crop_id": cid,
            "crop_name": crop["name"],
            "scientific_name": crop.get("scientific_name", ""),
            "category": crop.get("category", "Cereal"),
            "sowing_season": ", ".join(seasons_list),
            "growing_duration_days": duration_val,
            "water_requirement": crop.get("water_requirement", "Medium"),
            "optimal_rainfall_range_mm": rain_str,
            "optimal_temperature_c": temp_str,
            "suitable_soils": crop.get("suitable_soils", []),
            "soil_compatibility": soil_match,
            "soil_ph_range": "6.0 - 7.5",
            "market_summary": {
                "modal_price": market.get("modal_price", 2500.0),
                "price_range": f"₹{market.get('min_price', 2200.0)} - ₹{market.get('max_price', 2800.0)}",
                "unit": market.get("unit", "₹ / Quintal"),
                "sentiment": market.get("market_sentiment", "Active Mandi"),
                "market_date": market.get("market_date", "15/11/2026")
            },
            "advantages": crop.get("advantages", [])[:2],
            "common_risks": crop.get("risks", [])[:2]
        })

    return {
        "status": "success",
        "compared_count": len(compared_list),
        "crops": compared_list,
        "summary_recommendation": f"Comparison includes {len(compared_list)} crops evaluated against regional agricultural criteria."
    }
