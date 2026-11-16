"""
AstroKites / AgriNova - NASA Earth Science Data Tools
Retrieves verified NASA satellite observation time-series and mission provenance:
1. NASA POWER MERRA-2 (Temperature, Wind Speed, Relative Humidity)
2. NASA GPM IMERG V07 (Precipitation / Rainfall)
3. NASA SMAP L4 SPL4SMGP (Root-Zone Soil Moisture)
4. NASA MODIS MOD13Q1 V6.1 (Vegetation NDVI)
"""

import logging
from typing import Dict, Any, Optional
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.cache_db import get_dataset_by_variable, get_all_datasets
from ai.tools.geography_tools import geocode_location

logger = logging.getLogger("astroke.ai.tools.nasa")


def get_nasa_power_observations(
    location: str,
    variable: str = "temperature",
    start_year: Optional[int] = None,
    end_year: Optional[int] = 2024
) -> Dict[str, Any]:
    """
    Retrieves aligned empirical observations for any of the 6 NASA variables:
    temperature, rainfall, soil_moisture, vegetation, wind_speed, humidity.
    """
    var = variable.lower().strip()
    if var not in VARIABLE_CONFIG:
        return {
            "status": "error",
            "message": f"Unsupported environmental variable '{variable}'. Supported variables are: {list(VARIABLE_CONFIG.keys())}"
        }

    geo = geocode_location(location)
    if geo.get("status") != "success":
        return {
            "status": "error",
            "message": f"Could not determine geographical region for '{location}'. Please specify an Indian city or state."
        }

    region_id = geo.get("region_id", "IN-MH")

    try:
        series = get_series_for_region(region_id, var, start_year, end_year)
        vals = [v for v in series.get("values", []) if v is not None]

        if not vals:
            return {
                "status": "error",
                "message": f"No valid NASA observations found for {geo['name']} ({var}) in the requested period."
            }

        dates = series.get("dates", [])
        min_val = min(vals)
        max_val = max(vals)
        mean_val = sum(vals) / len(vals)

        # Recent 6 months sample
        recent_samples = [
            {"date": dates[i], "value": round(series["values"][i], 2)}
            for i in range(max(0, len(dates) - 6), len(dates))
            if series["values"][i] is not None
        ]

        return {
            "status": "success",
            "location": geo["name"],
            "region_id": region_id,
            "variable": var,
            "label": series.get("label", var.title()),
            "unit": series.get("unit", ""),
            "source_dataset": series.get("source", ""),
            "n_observations": len(vals),
            "date_range": {
                "start": dates[0] if dates else None,
                "end": dates[-1] if dates else None
            },
            "statistics": {
                "mean": round(mean_val, 3),
                "min": round(min_val, 3),
                "max": round(max_val, 3)
            },
            "recent_observations": recent_samples,
            "provenance": series.get("dataset_meta")
        }
    except Exception as e:
        logger.error("Failed to fetch NASA series for %s (%s): %s", location, var, str(e))
        return {
            "status": "error",
            "message": f"NASA Earth Science data retrieval failed for {geo['name']}: {str(e)}"
        }


def get_dataset_provenance(variable: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns official NASA mission provenance, sensor instruments, temporal and
    spatial resolution, and calibration/validation standards.
    """
    if variable:
        var = variable.lower().strip()
        meta = get_dataset_by_variable(var)
        if meta:
            return {"status": "success", "dataset": meta}
        return {"status": "error", "message": f"No provenance found for variable '{variable}'"}

    datasets = get_all_datasets()
    return {
        "status": "success",
        "count": len(datasets),
        "datasets": datasets
    }
