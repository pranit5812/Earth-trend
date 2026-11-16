"""
AstroKites Smart Travel Planner - FastAPI Router
Implements the 7 core travel endpoints strictly restricted to destinations within India.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from schemas.travel_schemas import (
    TravelClimateRequest,
    BestTimeRequest,
    BestDatesRequest,
    DestinationComparisonRequest,
    TravelRiskRequest
)
from services.travel_destinations import (
    get_all_destinations,
    search_indian_destinations,
    resolve_indian_destination
)
from services.travel_climate_service import analyze_destination_climate
from services.travel_comfort_engine import (
    get_best_time_to_travel,
    find_best_travel_dates,
    compare_destinations,
    assess_travel_weather_risks
)

router = APIRouter(prefix="/travel", tags=["Smart Travel Planner India"])


@router.get("/destinations")
def list_destinations(query: Optional[str] = Query(None), travel_type: Optional[str] = Query(None)):
    """Lists or searches verified Indian tourist destinations."""
    if query:
        results = search_indian_destinations(query, travel_type)
        return {"status": "success", "count": len(results), "destinations": results}
    all_dests = get_all_destinations()
    return {"status": "success", "count": len(all_dests), "destinations": all_dests}


@router.post("/climate-analysis")
def post_climate_analysis(req: TravelClimateRequest):
    """
    Historical climate analysis for an Indian destination.
    Aggregates 12-month NASA POWER observations: temperature, rainfall, humidity, wind, and solar radiation.
    """
    res = analyze_destination_climate(
        req.destination,
        req.start_year or 2015,
        req.end_year or 2024,
        req.latitude,
        req.longitude
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Invalid Indian destination"))
    return res


@router.post("/best-time")
def post_best_time(req: BestTimeRequest):
    """
    Evaluates 12 months for an Indian destination and returns the Best Time to Travel
    using the rule-based Travel Comfort Score (0-100) adapted to the travel activity.
    """
    res = get_best_time_to_travel(
        req.destination,
        req.travel_type or "general",
        req.start_year or 2015,
        req.end_year or 2024
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Invalid Indian destination"))
    return res


@router.post("/best-dates")
def post_best_dates(req: BestDatesRequest):
    """
    Intelligent date recommendation engine:
    - Flexible dates: identifies continuous multi-day trip windows matching duration.
    - Fixed dates: analyzes climate suitability and risks for the selected dates.
    """
    res = find_best_travel_dates(
        destination=req.destination,
        travel_type=req.travel_type or "general",
        duration_days=req.duration_days or 7,
        is_flexible=req.is_flexible if req.is_flexible is not None else True,
        start_date=req.start_date,
        end_date=req.end_date,
        start_year=req.start_year or 2015,
        end_year=req.end_year or 2024
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Invalid Indian destination"))
    return res


@router.post("/destination-comparison")
def post_destination_comparison(req: DestinationComparisonRequest):
    """
    Compares 2 or 3 Indian destinations side-by-side (e.g. Goa vs Kerala, Manali vs Shimla)
    across temperature, rainfall, humidity, wind speed, solar radiation, and comfort scores.
    """
    res = compare_destinations(
        req.destinations,
        req.travel_type or "general",
        req.start_year or 2015,
        req.end_year or 2024
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Failed to compare destinations"))
    return res


@router.post("/travel-calendar")
def post_travel_calendar(req: BestTimeRequest):
    """
    Returns the interactive 12-Month Travel Comfort Calendar with classifications
    (Green: Excellent, Light Green: Good, Yellow: Moderate, Orange: Less Suitable).
    """
    res = get_best_time_to_travel(
        req.destination,
        req.travel_type or "general",
        req.start_year or 2015,
        req.end_year or 2024
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Invalid Indian destination"))
    
    return {
        "status": "success",
        "destination": res["destination"],
        "travel_type": req.travel_type or "general",
        "monthly_calendar": res["monthly_calendar"],
        "peak_season": res["top_recommended_months"]
    }


@router.post("/risk-analysis")
def post_risk_analysis(req: TravelRiskRequest):
    """
    Evaluates historical meteorological risks: monsoon downpours, extreme heatwaves,
    high humidity, and coastal cyclone vulnerabilities.
    """
    res = assess_travel_weather_risks(
        req.destination,
        req.start_year or 2015,
        req.end_year or 2024
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Failed to assess travel risks"))
    return res


@router.post("/travel-insights")
def post_travel_insights(req: BestTimeRequest):
    """
    Generates regional Indian climate insights (Southwest monsoon, Northeast monsoon,
    diurnal ranges, packing essentials, and activity advice).
    """
    best_time = get_best_time_to_travel(req.destination, req.travel_type or "general")
    if best_time.get("status") == "error":
        raise HTTPException(status_code=400, detail=best_time.get("message", "Invalid Indian destination"))
        
    risks = assess_travel_weather_risks(req.destination)
    
    return {
        "status": "success",
        "destination": best_time["destination"],
        "travel_type": req.travel_type or "general",
        "best_months": best_time["top_recommended_months"],
        "seasonal_recommendation": best_time["summary_recommendation"],
        "monthly_comfort_calendar": best_time["monthly_calendar"],
        "identified_risks": risks.get("assessed_risks", []),
        "packing_recommendations": [
            "Breathable cotton attire for warm afternoon hours",
            "Compact rain shell / windbreaker during monsoon / coastal visits",
            "UV protection (hat, sunglasses, sunscreen) for high solar exposure days",
            "Warm layers if visiting Himalayan hill stations or desert nights"
        ]
    }
