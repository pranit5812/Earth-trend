"""
AstroKites / AgriNova - Tool Executor
Safely dispatches and executes backend tools called by OpenRouter models,
validating arguments and formatting structured evidence.
"""

import json
import logging
from typing import Dict, Any, Tuple, List, Optional
from ai.tools.geography_tools import geocode_location
from ai.tools.weather_tools import get_weather_forecast, check_date_climate_risk
from ai.tools.nasa_power_tools import get_nasa_power_observations, get_dataset_provenance
from ai.tools.trend_tools import (
    analyze_climate_trend,
    compare_regional_trends,
    detect_pan_india_opposite_trends,
    get_bivariate_correlation,
    get_soil_moisture_and_vegetation
)
from services.travel_comfort_engine import (
    get_best_time_to_travel,
    find_best_travel_dates,
    compare_destinations,
    assess_travel_weather_risks
)

logger = logging.getLogger("astroke.ai.executor")

TOOL_DISPATCH_MAP = {
    "get_weather_forecast": get_weather_forecast,
    "check_date_climate_risk": check_date_climate_risk,
    "analyze_climate_trend": analyze_climate_trend,
    "compare_regional_trends": compare_regional_trends,
    "detect_pan_india_opposite_trends": detect_pan_india_opposite_trends,
    "get_nasa_power_observations": get_nasa_power_observations,
    "get_bivariate_correlation": get_bivariate_correlation,
    "get_soil_moisture_and_vegetation": get_soil_moisture_and_vegetation,
    "geocode_location": geocode_location,
    "get_dataset_provenance": get_dataset_provenance,
    # Smart Travel Planner India Tools
    "get_best_travel_time": get_best_time_to_travel,
    "find_travel_dates": find_best_travel_dates,
    "compare_travel_destinations": compare_destinations,
    "get_travel_risk_assessment": assess_travel_weather_risks,
}


def execute_tool_call(
    tool_name: str,
    arguments_json: str,
    context: Optional[Any] = None
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str]]:
    """
    Executes a single tool call.
    Returns:
    - result_payload: Dict to send back to model
    - sources: List of data source citation dictionaries
    - metrics: Statistical summary dict (if applicable)
    - viz_type: Visualization hint (e.g. 'trend_chart', 'comparison_table')
    """
    logger.info("Executing tool: %s with args: %s", tool_name, arguments_json)

    if tool_name not in TOOL_DISPATCH_MAP:
        err_msg = f"Tool '{tool_name}' is not registered or supported by AstroKites."
        logger.warning(err_msg)
        return {"status": "error", "message": err_msg}, [], None, None

    # Parse arguments safely
    try:
        args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
        if not isinstance(args, dict):
            args = {}
    except Exception as e:
        err_msg = f"Failed to parse tool arguments as valid JSON: {str(e)}"
        return {"status": "error", "message": err_msg}, [], None, None

    # Resolve relative location terms ("here", "my area", "this area", "my location") using context
    loc_key = "location" if "location" in args else ("location_name" if "location_name" in args else None)
    if loc_key and isinstance(args.get(loc_key), str):
        val_clean = args[loc_key].strip().lower()
        if val_clean in ["here", "my area", "this area", "that area", "my location", "current location", "where i am", "current", "local"]:
            if context and getattr(context, "user_latitude", None) is not None and getattr(context, "user_longitude", None) is not None:
                if tool_name == "get_weather_forecast":
                    args["latitude"] = context.user_latitude
                    args["longitude"] = context.user_longitude
                    args["location"] = getattr(context, "user_city", None) or f"{context.user_latitude:.2f}°N, {context.user_longitude:.2f}°E"
                else:
                    args[loc_key] = getattr(context, "user_city", None) or f"{context.user_latitude:.2f},{context.user_longitude:.2f}"
            elif context and (getattr(context, "selected_location", None) or getattr(context, "latitude", None) is not None):
                if tool_name == "get_weather_forecast" and getattr(context, "latitude", None) is not None:
                    args["latitude"] = context.latitude
                    args["longitude"] = context.longitude
                    args["location"] = getattr(context, "selected_location", None) or f"{context.latitude:.2f}°N, {context.longitude:.2f}°E"
                else:
                    args[loc_key] = getattr(context, "selected_location", None) or f"{context.latitude:.2f},{context.longitude:.2f}"

    func = TOOL_DISPATCH_MAP[tool_name]

    try:
        res = func(**args)
    except TypeError as e:
        err_msg = f"Invalid parameters passed to {tool_name}: {str(e)}"
        logger.error(err_msg)
        return {"status": "error", "message": err_msg}, [], None, None
    except Exception as e:
        err_msg = f"Execution error in {tool_name}: {str(e)}"
        logger.exception(err_msg)
        return {"status": "error", "message": err_msg}, [], None, None

    sources: List[Dict[str, Any]] = []
    metrics: Optional[Dict[str, Any]] = None
    viz_type: Optional[str] = None

    # Extract citations & metrics based on tool result
    if tool_name == "analyze_climate_trend" and res.get("status") == "success":
        sources.append({
            "name": res.get("dataset_source", "NASA Earth Science Reanalysis"),
            "variable": res.get("variable"),
            "observations_count": res.get("n_observations"),
            "period": f"{res.get('date_range', {}).get('start')} to {res.get('date_range', {}).get('end')}"
        })
        metrics = {
            "location": res.get("location"),
            "variable": res.get("variable"),
            "unit": res.get("unit"),
            "trend_direction": res.get("trend_direction"),
            "annual_rate": res.get("annual_rate"),
            "p_value": res.get("p_value"),
            "is_significant": res.get("is_significant"),
            "confidence_interval_95": res.get("confidence_interval_95")
        }
        viz_type = "trend_chart"

    elif tool_name == "compare_regional_trends" and res.get("status") == "success":
        for reg in res.get("regions_compared", []):
            sources.append({
                "name": reg.get("source", "NASA Earth Science"),
                "location": reg.get("location_name"),
                "variable": res.get("variable")
            })
        viz_type = "comparison_table"

    elif tool_name == "get_weather_forecast" and res.get("status") == "success":
        sources.append({
            "name": res.get("provider", "Numerical Weather Prediction API"),
            "location": res.get("location"),
            "retrieved_at": res.get("retrieved_at")
        })
        viz_type = "forecast_summary"

    elif tool_name == "get_nasa_power_observations" and res.get("status") == "success":
        sources.append({
            "name": res.get("source_dataset", "NASA POWER Reanalysis"),
            "variable": res.get("variable"),
            "location": res.get("location")
        })

    elif tool_name == "get_bivariate_correlation" and res.get("status") == "success":
        sources.append({
            "name": "NASA Earth Science Synchronized Series",
            "variables": f"{res.get('variable_1')} & {res.get('variable_2')}",
            "sample_size": res.get("sample_size")
        })
        viz_type = "correlation_card"

    elif tool_name == "get_soil_moisture_and_vegetation" and res.get("status") == "success":
        sources.append({"name": "NASA SMAP L4 Root-Zone Soil Moisture", "resolution": "9km"})
        sources.append({"name": "NASA MODIS MOD13Q1 Vegetation Index", "resolution": "250m"})
        viz_type = "soil_moisture_card"

    elif tool_name in ["get_best_travel_time", "find_travel_dates", "get_travel_risk_assessment"] and res.get("status") == "success":
        sources.append({
            "name": "NASA POWER API (Surface Meteorology & Solar Radiation)",
            "coverage": "Multi-decadal historical observations across India"
        })
        sources.append({
            "name": "AstroKites Travel Comfort Scoring Engine",
            "description": "Rule-based 5-factor meteorological comfort assessment (0-100)"
        })
        if tool_name == "get_best_travel_time":
            dest_info = res.get("destination", {})
            metrics = {
                "destination": dest_info.get("name"),
                "state": dest_info.get("state"),
                "overall_best_month": res.get("overall_best_month"),
                "top_months": ", ".join(res.get("top_recommended_months", [])[:4]),
                "travel_type": res.get("travel_type")
            }
            viz_type = "travel_calendar"

    elif tool_name == "compare_travel_destinations" and res.get("status") == "success":
        sources.append({"name": "NASA POWER Surface Climatology", "coverage": "India Destinations"})
        sources.append({"name": "AstroKites Travel Comfort Scoring Engine"})
        viz_type = "comparison_table"

    return res, sources, metrics, viz_type
