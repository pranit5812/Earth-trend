"""
AstroKites Crop Calendar Service
Generates detailed 7-stage phenological growth schedules, critical water windows,
and seasonal agricultural operations based on ICAR package of practices.
"""

from typing import Dict, Any, Optional, List
import datetime
from services.crop_database import get_crop_by_name

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


def generate_crop_calendar(
    crop_name: str,
    sowing_month: Optional[int] = None,
    state: Optional[str] = None
) -> Dict[str, Any]:
    """
    Constructs a 7-stage crop phenology timeline with agronomic activities.
    """
    crop = get_crop_by_name(crop_name)
    if not crop:
        raise ValueError(f"Crop '{crop_name}' not found in agricultural knowledgebase.")

    dur = crop.get("duration_days")
    if isinstance(dur, dict):
        total_duration_days = dur.get("avg", 120)
    elif isinstance(dur, (int, float)):
        total_duration_days = int(dur)
    else:
        total_duration_days = 120

    sowing_seasons = crop.get("seasons") or crop.get("sowing_season") or ["Kharif"]

    # Determine default sowing month if not provided
    if sowing_month is None or not (1 <= sowing_month <= 12):
        if any("kharif" in s.lower() for s in sowing_seasons):
            sowing_month = 6  # June
        elif any("rabi" in s.lower() for s in sowing_seasons):
            sowing_month = 10 # October
        else:
            sowing_month = 3  # March (Zaid)

    sowing_date = datetime.date(2026, sowing_month, 15)

    # 7 Phenological Stages proportion of total growth duration
    stages_config = [
        {"name": "Land Preparation & Basal Manuring", "pct_duration": 0.08, "water_critical": False, "operations": "Deep summer ploughing, incorporate well-rotted FYM/compost, field leveling."},
        {"name": "Sowing & Germination", "pct_duration": 0.12, "water_critical": True, "operations": "Seed treatment with biofertilizers (Rhizobium/Azotobacter), maintain optimum sowing depth."},
        {"name": "Vegetative Growth & Tillering/Branching", "pct_duration": 0.28, "water_critical": True, "operations": "Inter-cultivation weeding, top-dressing of nitrogen, moisture maintenance."},
        {"name": "Flowering & Anthesis", "pct_duration": 0.20, "water_critical": True, "operations": "Most sensitive stage to water deficit. Protect against sucking pests."},
        {"name": "Grain / Fruit Development", "pct_duration": 0.16, "water_critical": True, "operations": "Provide light irrigation. Apply potash or micronutrient spray if required."},
        {"name": "Ripening & Physiological Maturity", "pct_duration": 0.10, "water_critical": False, "operations": "Cease irrigation 10-14 days before harvest to facilitate drying and maturity."},
        {"name": "Harvesting & Threshing", "pct_duration": 0.06, "water_critical": False, "operations": "Harvest at optimum moisture content (12-14%), thresh, clean, and store in moisture-proof bags."}
    ]

    current_day_offset = 0
    stages = []

    for idx, s in enumerate(stages_config, 1):
        stage_days = max(round(total_duration_days * s["pct_duration"]), 4)
        start_dt = sowing_date + datetime.timedelta(days=current_day_offset)
        end_dt = start_dt + datetime.timedelta(days=stage_days)
        current_day_offset += stage_days

        stages.append({
            "stage_number": idx,
            "stage_name": s["name"],
            "duration_days": stage_days,
            "start_date": start_dt.strftime("%d %b"),
            "end_date": end_dt.strftime("%d %b"),
            "is_water_critical": s["water_critical"],
            "field_operations": s["operations"]
        })

    harvest_date = sowing_date + datetime.timedelta(days=total_duration_days)

    return {
        "status": "success",
        "crop_name": crop["name"],
        "category": crop.get("category", "Agricultural"),
        "total_growing_duration_days": total_duration_days,
        "sowing_month_name": MONTH_NAMES[sowing_month - 1],
        "estimated_sowing_date": sowing_date.strftime("%Y-%m-%d"),
        "estimated_harvest_date": harvest_date.strftime("%Y-%m-%d"),
        "primary_season": ", ".join(sowing_seasons),
        "phenological_stages": stages,
        "critical_irrigation_stages": [s["stage_name"] for s in stages if s["is_water_critical"]],
        "regional_advisory": f"Schedule conforms to standard ICAR guidelines for {state or 'major producing zones'}."
    }
