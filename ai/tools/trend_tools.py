"""
AstroKites / AgriNova - Trend Analysis & Climate Intelligence Tools
Directly connects to AstroKites rigorous statistical engine:
- Non-parametric Mann-Kendall test
- Sen's slope robust linear trajectory
- Yue-Pilon prewhitening for lag-1 autocorrelation
- Multi-region side-by-side comparison
- Pan-India contrasting/opposite trend detection
- Bivariate Pearson & Spearman coupling
"""

import logging
from typing import Dict, Any, List, Optional
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.trend_engine import comprehensive_trend_analysis, detect_climatological_anomalies
from services.opposite_trend_service import compare_regions, detect_opposite_trends
from services.correlation_service import compute_bivariate_correlation
from ai.tools.geography_tools import geocode_location

logger = logging.getLogger("astroke.ai.tools.trends")


def analyze_climate_trend(
    location: str,
    variable: str = "temperature",
    prewhiten: bool = True,
    alpha: float = 0.05,
    start_year: Optional[int] = None,
    end_year: Optional[int] = 2024
) -> Dict[str, Any]:
    """
    Executes rigorous statistical trend detection for a city, state, or district.
    Computes Sen's slope, Mann-Kendall p-value, 95% confidence intervals,
    and climatological anomalies on verified NASA observations.
    """
    var = variable.lower().strip()
    if var not in VARIABLE_CONFIG:
        return {
            "status": "error",
            "message": f"Unsupported variable '{variable}'. Must be one of: {list(VARIABLE_CONFIG.keys())}"
        }

    geo = geocode_location(location)
    if geo.get("status") != "success":
        return {
            "status": "error",
            "message": f"Could not determine geographical coordinates for '{location}' to analyze trends."
        }

    region_id = geo.get("region_id", "IN-MH")

    try:
        series = get_series_for_region(region_id, var, start_year, end_year)
        dates = series.get("dates", [])
        values = series.get("values", [])

        if not dates or len([v for v in values if v is not None]) < 5:
            return {
                "status": "error",
                "message": f"Insufficient observations for {geo['name']} to calculate statistical trends."
            }

        trend = comprehensive_trend_analysis(dates, values, var, prewhiten=prewhiten, alpha=alpha)

        ci = trend.get("confidence_interval_95", {})
        mk = trend.get("mann_kendall", {})
        lr = trend.get("linear_regression", {})

        return {
            "status": "success",
            "location": geo["name"],
            "region_id": region_id,
            "variable": var,
            "label": series.get("label", var.title()),
            "unit": series.get("unit", ""),
            "dataset_source": series.get("source", ""),
            "n_observations": trend.get("n_observations", len(dates)),
            "date_range": trend.get("date_range", {}),
            "trend_direction": trend.get("trend_direction", "Stable"),
            "is_significant": trend.get("is_significant", False),
            "p_value": trend.get("p_value", 1.0),
            "annual_rate": trend.get("annual_rate", 0.0),
            "sens_slope": trend.get("sens_slope", 0.0),
            "confidence_interval_95": {
                "lower": ci.get("lower", 0.0),
                "upper": ci.get("upper", 0.0)
            },
            "mann_kendall_statistics": {
                "z_score": mk.get("z_stat", 0.0),
                "s_score": mk.get("s_stat", 0),
                "tau": mk.get("tau", 0.0)
            },
            "linear_regression": {
                "slope": lr.get("slope", 0.0),
                "r_squared": lr.get("r_squared", 0.0),
                "p_value": lr.get("p_value", 1.0)
            },
            "autocorrelation": trend.get("autocorrelation", {}),
            "anomalies_count": trend.get("anomalies_count", 0),
            "recent_anomalies": trend.get("recent_anomalies", [])[:5]
        }
    except Exception as e:
        logger.error("Trend analysis failed for %s (%s): %s", location, var, str(e))
        return {
            "status": "error",
            "message": f"Trend analysis computation failed for {geo['name']}: {str(e)}"
        }


def compare_regional_trends(
    locations: List[str],
    variable: str = "temperature"
) -> Dict[str, Any]:
    """
    Compares historical observations and statistical trend rates across 2 or more locations
    using identical temporal periods and standardized non-parametric tests.
    """
    if not locations or len(locations) < 2:
        return {
            "status": "error",
            "message": "At least 2 locations are required for a regional comparison."
        }

    var = variable.lower().strip()
    if var not in VARIABLE_CONFIG:
        return {
            "status": "error",
            "message": f"Unsupported variable '{variable}'. Supported variables: {list(VARIABLE_CONFIG.keys())}"
        }

    # Resolve each location to its region_id
    resolved_locations = []
    for loc in locations:
        geo = geocode_location(loc)
        if geo.get("status") == "success":
            resolved_locations.append(geo)

    if len(resolved_locations) < 2:
        return {
            "status": "error",
            "message": f"Could not resolve at least 2 valid geographical regions from: {locations}"
        }

    region_ids = [r["region_id"] for r in resolved_locations]

    try:
        comp_raw = compare_regions(region_ids, var)
        regions_data = []
        for i, reg in enumerate(comp_raw.get("regions_compared", [])):
            tr = reg.get("trend", {})
            ci = tr.get("confidence_interval_95", {})
            loc_label = resolved_locations[i]["name"] if i < len(resolved_locations) else reg.get("region_name")

            regions_data.append({
                "location_name": loc_label,
                "region_id": reg.get("region_id"),
                "trend_verdict": tr.get("trend_direction", "Stable"),
                "annual_rate": tr.get("annual_rate", 0.0),
                "p_value": tr.get("p_value", 1.0),
                "is_significant": tr.get("is_significant", False),
                "confidence_interval_95": [ci.get("lower", 0.0), ci.get("upper", 0.0)],
                "source": reg.get("source"),
                "unit": reg.get("unit")
            })

        # Calculate rate divergence delta between first two regions
        delta = None
        if len(regions_data) >= 2:
            delta = round(regions_data[0]["annual_rate"] - regions_data[1]["annual_rate"], 4)

        return {
            "status": "success",
            "variable": var,
            "unit": VARIABLE_CONFIG[var]["unit"],
            "divergence_delta": delta,
            "regions_compared": regions_data,
            "comparison_summary": comp_raw.get("summary", "")
        }
    except Exception as e:
        logger.error("Regional comparison failed for %s (%s): %s", locations, var, str(e))
        return {
            "status": "error",
            "message": f"Failed to execute regional comparison: {str(e)}"
        }


def detect_pan_india_opposite_trends(variable: str = "temperature") -> Dict[str, Any]:
    """
    Scans across all 36 Indian States and Union Territories to detect regions with opposing
    environmental trajectories (e.g. warming vs cooling, wetting vs drying).
    """
    var = variable.lower().strip()
    if var not in VARIABLE_CONFIG:
        return {"status": "error", "message": f"Unsupported variable '{variable}'"}

    try:
        res = detect_opposite_trends(var)
        return {
            "status": "success",
            "variable": var,
            "increasing_count": res.get("increasing_count", 0),
            "decreasing_count": res.get("decreasing_count", 0),
            "stable_count": res.get("stable_count", 0),
            "top_contrasting_pairs": res.get("top_contrasting_pairs", [])[:4],
            "increasing_regions": [r["region_name"] for r in res.get("increasing_regions", [])[:5]],
            "decreasing_regions": [r["region_name"] for r in res.get("decreasing_regions", [])[:5]]
        }
    except Exception as e:
        logger.error("Opposite trend scan failed for %s: %s", var, str(e))
        return {"status": "error", "message": f"Opposite trend scan failed: {str(e)}"}


def get_bivariate_correlation(
    location: str,
    variable_1: str = "rainfall",
    variable_2: str = "vegetation"
) -> Dict[str, Any]:
    """
    Calculates Pearson linear correlation (r) and Spearman rank correlation (rho)
    between two environmental variables to assess coupled Earth system feedbacks.
    """
    geo = geocode_location(location)
    if geo.get("status") != "success":
        return {"status": "error", "message": f"Could not resolve coordinates for '{location}'"}

    region_id = geo.get("region_id", "IN-MH")

    try:
        corr = compute_bivariate_correlation(region_id, variable_1, variable_2)
        return {
            "status": "success",
            "location": geo["name"],
            "variable_1": variable_1,
            "variable_2": variable_2,
            "pearson_r": corr["pearson"]["r"],
            "pearson_p_value": corr["pearson"]["p_value"],
            "pearson_significant": corr["pearson"]["is_significant"],
            "spearman_rho": corr["spearman"]["rho"],
            "spearman_p_value": corr["spearman"]["p_value"],
            "sample_size": corr.get("sample_size", 0),
            "common_period": corr.get("common_period", {}),
            "assessment": corr.get("interpretation", ""),
            "scientific_disclaimer": corr.get("scientific_disclaimer", "")
        }
    except Exception as e:
        logger.error("Bivariate correlation failed for %s: %s", location, str(e))
        return {"status": "error", "message": f"Correlation computation failed: {str(e)}"}


def get_soil_moisture_and_vegetation(location: str) -> Dict[str, Any]:
    """
    Retrieves real NASA SMAP L4 root-zone soil moisture and MODIS NDVI vegetation canopy
    series to assess agricultural moisture stress and canopy vigor.
    """
    geo = geocode_location(location)
    if geo.get("status") != "success":
        return {"status": "error", "message": f"Could not resolve coordinates for '{location}'"}

    region_id = geo.get("region_id", "IN-MH")

    try:
        smap_series = get_series_for_region(region_id, "soil_moisture")
        modis_series = get_series_for_region(region_id, "vegetation")

        smap_vals = [v for v in smap_series.get("values", []) if v is not None]
        modis_vals = [v for v in modis_series.get("values", []) if v is not None]

        recent_soil = smap_vals[-1] if smap_vals else None
        recent_ndvi = modis_vals[-1] if modis_vals else None

        # Mean soil moisture baseline
        mean_soil = sum(smap_vals) / len(smap_vals) if smap_vals else 0.0
        mean_ndvi = sum(modis_vals) / len(modis_vals) if modis_vals else 0.0

        soil_status = "Optimal"
        if recent_soil is not None:
            if recent_soil < 0.15:
                soil_status = "Severe Root-Zone Dryness / Agricultural Water Stress"
            elif recent_soil < 0.22:
                soil_status = "Moderate Root-Zone Dryness"
            elif recent_soil > 0.40:
                soil_status = "Saturated / High Soil Moisture"

        return {
            "status": "success",
            "location": geo["name"],
            "region_id": region_id,
            "soil_moisture": {
                "latest_value": round(recent_soil, 3) if recent_soil is not None else None,
                "unit": "m³/m³",
                "mean_baseline": round(mean_soil, 3),
                "status": soil_status,
                "source": "NASA SMAP L4 Root-Zone Soil Moisture (9km)"
            },
            "vegetation_ndvi": {
                "latest_value": round(recent_ndvi, 3) if recent_ndvi is not None else None,
                "unit": "NDVI",
                "mean_baseline": round(mean_ndvi, 3),
                "source": "NASA MODIS MOD13Q1 Vegetation Index (250m)"
            },
            "note": "Field-specific agronomic decisions and crop planting should be verified with local Krishi Vigyan Kendra (KVK) or agricultural extension guidelines."
        }
    except Exception as e:
        logger.error("Soil moisture retrieval failed for %s: %s", location, str(e))
        return {"status": "error", "message": f"Failed to retrieve soil moisture/vegetation data: {str(e)}"}
