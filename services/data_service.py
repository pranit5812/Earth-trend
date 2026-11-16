"""
EarthTrend India - Unified Data Dispatcher
Coordinates fetching, caching, quality-checking, and time-alignment for all 6 NASA variables:
1. Temperature (NASA POWER T2M)
2. Rainfall (NASA GPM IMERG V07)
3. Soil Moisture (NASA SMAP L4)
4. Vegetation (NASA MODIS MOD13Q1 NDVI)
5. Wind Speed (NASA POWER WS10M)
6. Humidity (NASA POWER RH2M)
"""

from typing import Dict, List, Optional, Any
from services.india_geo_service import get_state_by_name_or_id
from services.nasa_power_service import get_variable_time_series as get_power_series
from services.nasa_gpm_service import get_gpm_precipitation_series
from services.nasa_smap_service import get_smap_soil_moisture_series
from services.nasa_modis_service import get_modis_ndvi_series
from services.cache_db import get_dataset_by_variable, get_all_datasets


VARIABLE_CONFIG = {
    "temperature": {"unit": "°C", "dataset": "NASA_POWER_T2M", "label": "Temperature"},
    "rainfall": {"unit": "mm/day", "dataset": "NASA_GPM_IMERG_V07", "label": "Rainfall / Precipitation"},
    "soil_moisture": {"unit": "m³/m³", "dataset": "NASA_SMAP_L4_SMGP", "label": "Soil Moisture"},
    "vegetation": {"unit": "NDVI", "dataset": "NASA_MODIS_MOD13Q1_V61", "label": "Vegetation Index (NDVI)"},
    "wind_speed": {"unit": "m/s", "dataset": "NASA_POWER_WS10M", "label": "Wind Speed"},
    "humidity": {"unit": "%", "dataset": "NASA_POWER_RH2M", "label": "Relative Humidity"}
}


def get_series_for_region(
    region_id: str,
    variable: str,
    start_year: Optional[int] = None,
    end_year: Optional[int] = 2024
) -> Dict[str, Any]:
    """
    Fetches observations series for any of the 6 variables for a specified Indian state/district.
    """
    var = variable.lower().strip()
    if var not in VARIABLE_CONFIG:
        raise ValueError(f"Unsupported variable '{variable}'. Must be one of: {list(VARIABLE_CONFIG.keys())}")
        
    state = get_state_by_name_or_id(region_id)
    if not state:
        # Fallback to Delhi coordinates if region is unknown
        lat, lon, reg_name = 28.6139, 77.2090, region_id
    else:
        lat, lon, reg_name = state["lat"], state["lon"], state["name"]
        
    if var in ["temperature", "wind_speed", "humidity"]:
        s_yr = start_year or 1990
        series = get_power_series(region_id, var, lat, lon, s_yr, end_year)
    elif var == "rainfall":
        s_yr = start_year or 2000
        series = get_gpm_precipitation_series(region_id, lat, lon, s_yr, end_year)
    elif var == "soil_moisture":
        s_yr = start_year or 2015
        series = get_smap_soil_moisture_series(region_id, lat, lon, s_yr, end_year)
    elif var == "vegetation":
        s_yr = start_year or 2000
        series = get_modis_ndvi_series(region_id, lat, lon, s_yr, end_year)
        
    dataset_meta = get_dataset_by_variable(var)
    series["region_name"] = reg_name
    series["region_id"] = region_id
    series["dataset_meta"] = dataset_meta
    series["label"] = VARIABLE_CONFIG[var]["label"]
    return series
