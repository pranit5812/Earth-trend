"""
EarthTrend India - FastAPI v1 Router
Provides all required endpoints under /api/v1/
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from services.cache_db import (
    get_all_datasets, get_dataset_by_variable,
    get_all_reports, get_report_by_id
)
from services.india_geo_service import (
    get_all_states, get_state_by_name_or_id,
    get_districts_for_state, calculate_spatial_hotspots
)
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.trend_engine import comprehensive_trend_analysis, detect_climatological_anomalies
from services.opposite_trend_service import detect_opposite_trends, compare_regions
from services.correlation_service import compute_bivariate_correlation, compute_correlation_matrix
from services.ai_assistant_service import query_scientific_assistant
from services.report_generator import generate_pdf_report
from services.year_compare_service import compare_region_years
from services.imd_alerts_service import get_climate_alerts

router = APIRouter(prefix="/api/v1", tags=["EarthTrend v1"])


@router.get("/alerts")
def get_alerts(
    state: Optional[str] = Query(None, description="Filter by Indian State (e.g. Kerala, Punjab)"),
    severity: Optional[str] = Query(None, description="Filter by severity: Red, Orange, Yellow"),
    category: Optional[str] = Query(None, description="Filter by category: heavy_rainfall, heatwave, thunderstorm, cold_wave"),
    refresh: bool = Query(False, description="Force refresh alerts cache")
):
    """
    Returns prioritized official India Meteorological Department (IMD)
    forecast warnings and weather alerts for Indian states and districts.
    """
    try:
        return get_climate_alerts(state=state, severity=severity, category=category, force_refresh=refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch climate alerts: {str(e)}")



# Request models
class TrendAnalyzeRequest(BaseModel):
    region_id: str = Field("IN-MH", description="State or District ID, e.g. IN-MH, IN-RJ")
    variable: str = Field("temperature", description="One of: temperature, rainfall, soil_moisture, vegetation, wind_speed, humidity")
    start_year: Optional[int] = None
    end_year: Optional[int] = 2024
    prewhiten: bool = True
    alpha: float = 0.05


class CompareRequest(BaseModel):
    region_ids: List[str] = Field(["IN-MH", "IN-RJ"], description="List of 2 or more region IDs")
    variable: str = Field("temperature", description="Environmental variable to compare")


class YearCompareRequest(BaseModel):
    region: str = Field("Goa", description="Indian state ID/name or tourist destination, e.g. Goa, Manali, IN-MH")
    variable: str = Field("temperature", description="One of: temperature, rainfall, humidity, wind_speed, solar_radiation")
    year1: int = Field(2026, description="Base year, e.g. 2026")
    year2: int = Field(2020, description="Comparison year, e.g. 2020")


class CorrelationRequest(BaseModel):
    region_id: str = Field("IN-MH")
    variable_1: str = Field("rainfall")
    variable_2: str = Field("vegetation")


class AssistantRequest(BaseModel):
    question: str = Field(..., description="Scientific inquiry about trends, opposite patterns, or correlations")


class ReportCreateRequest(BaseModel):
    region_id: str = Field("IN-MH")
    variable: str = Field("temperature")


# 1. Variables & Datasets Metadata
@router.get("/variables")
def list_variables():
    """Returns the 6 supported NASA environmental variables and their unit definitions."""
    return {
        "status": "success",
        "variables": [
            {
                "id": k,
                "label": v["label"],
                "unit": v["unit"],
                "dataset_id": v["dataset"]
            }
            for k, v in VARIABLE_CONFIG.items()
        ]
    }


@router.get("/datasets")
def list_datasets():
    """Returns official NASA dataset provenance, mission metadata, spatial/temporal resolution, and QA."""
    datasets = get_all_datasets()
    return {
        "status": "success",
        "count": len(datasets),
        "datasets": datasets
    }


# 2. Regional Geography
@router.get("/regions/states")
def list_states():
    """Returns all 36 Indian States and Union Territories with coordinates and bounding boxes."""
    return {
        "status": "success",
        "count": len(get_all_states()),
        "states": get_all_states()
    }


@router.get("/regions/districts")
def list_districts(state: str = Query(..., description="State ID or name, e.g. IN-MH or Maharashtra")):
    """Returns key agricultural and climate-vulnerable districts for a given state."""
    districts = get_districts_for_state(state)
    return {
        "status": "success",
        "state": state,
        "count": len(districts),
        "districts": districts
    }


# 3. Observations Time-Series
@router.get("/data/series")
def get_series(
    region: str = Query("IN-MH", description="State or District ID"),
    variable: str = Query("temperature", description="Environmental variable"),
    start_year: Optional[int] = Query(None),
    end_year: Optional[int] = Query(2024)
):
    """Retrieves aligned observations time-series for an Indian region."""
    try:
        data = get_series_for_region(region, variable, start_year, end_year)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 4. Statistical Trend Detection
@router.post("/trends/analyze")
def analyze_trend(req: TrendAnalyzeRequest):
    """
    Executes rigorous non-parametric Mann-Kendall test, Sen's slope estimator,
    confidence intervals, and Yue-Pilon pre-whitening on NASA observations.
    """
    try:
        series = get_series_for_region(req.region_id, req.variable, req.start_year, req.end_year)
        trend = comprehensive_trend_analysis(
            series["dates"],
            series["values"],
            req.variable,
            prewhiten=req.prewhiten,
            alpha=req.alpha
        )
        return {
            "status": "success",
            "region": {
                "id": req.region_id,
                "name": series.get("region_name", req.region_id)
            },
            "variable": req.variable,
            "unit": series["unit"],
            "source": series["source"],
            "dataset_meta": series.get("dataset_meta"),
            "time_series": {
                "dates": series["dates"],
                "values": series["values"]
            },
            "trend": trend
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. Geographical Trend Map
@router.get("/trends/map")
def get_trends_map(variable: str = Query("temperature", description="Environmental variable")):
    """
    Computes trend direction, rate of change, and statistical significance for every Indian state.
    Used for choropleth and marker visualizations on the Leaflet map.
    """
    try:
        data = detect_opposite_trends(variable)
        hotspots = calculate_spatial_hotspots(data["all_regions"])
        return {
            "status": "success",
            "variable": variable,
            "summary": {
                "increasing": data["increasing_count"],
                "decreasing": data["decreasing_count"],
                "stable": data["stable_count"]
            },
            "regions": data["all_regions"],
            "hotspots": hotspots["hotspots"],
            "coldspots": hotspots["coldspots"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. Regional Comparison
@router.post("/compare")
def compare_selected_regions(req: CompareRequest):
    """Compares historical time-series and trend rates across 2 or more Indian regions."""
    try:
        data = compare_regions(req.region_ids, req.variable)
        return {"status": "success", "comparison": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare/years")
def post_compare_region_years(req: YearCompareRequest):
    """Compares a single Indian region/destination across different years (e.g. 2026 vs 2020)."""
    try:
        data = compare_region_years(req.region, req.variable, req.year1, req.year2)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare/years")
def get_compare_region_years(
    region: str = Query("Goa"),
    variable: str = Query("temperature"),
    year1: int = Query(2026),
    year2: int = Query(2020)
):
    """Compares a single Indian region/destination across different years via GET."""
    try:
        data = compare_region_years(region, variable, year1, year2)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 7. Opposite Trend Detective
@router.get("/trends/opposite")
def get_opposite_trends(variable: str = Query("temperature")):
    """Automatically scans and surfaces regions with opposing environmental trends."""
    try:
        data = detect_opposite_trends(variable)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 8. Multi-Variable Correlation Analysis
@router.post("/correlation")
def get_bivariate_correlation(req: CorrelationRequest):
    """Computes Pearson r and Spearman rho correlation between two variables with scatter data."""
    try:
        corr = compute_bivariate_correlation(req.region_id, req.variable_1, req.variable_2)
        return {"status": "success", "correlation": corr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation/matrix")
def get_matrix(region: str = Query("IN-MH")):
    """Computes full 6x6 correlation matrix for a specified region."""
    try:
        mat = compute_correlation_matrix(region)
        return {"status": "success", "data": mat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 9. Climatological Anomalies
@router.post("/anomalies")
def get_anomalies(req: TrendAnalyzeRequest):
    """Flags unusual environmental deviations exceeding 2 standard deviations from baseline."""
    try:
        series = get_series_for_region(req.region_id, req.variable, req.start_year, req.end_year)
        anomalies = detect_climatological_anomalies(series["dates"], series["values"])
        return {
            "status": "success",
            "region_id": req.region_id,
            "variable": req.variable,
            "anomalies_count": len(anomalies),
            "anomalies": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 10. Data Quality & Coverage
@router.get("/data-quality")
def get_data_quality():
    """Provides dataset quality flags, temporal latency, missing-value tolerance, and sensor status."""
    datasets = get_all_datasets()
    return {
        "status": "success",
        "data_quality_report": [
            {
                "dataset": d["name"],
                "variable": d["variable"],
                "mission": d["mission"],
                "resolution": d["spatial_res"],
                "temporal_coverage": f"{d['coverage_start']} to {d['coverage_end']}",
                "qc_status": "Operational / Validated",
                "qc_procedure": d["qc_procedure"],
                "attribution": d["attribution"]
            }
            for d in datasets
        ]
    }


# 11. Scientific AI Assistant
@router.post("/assistant/explain")
def explain_with_ai(req: AssistantRequest):
    """Answers user inquiries grounded strictly in verified backend statistical calculations."""
    try:
        res = query_scientific_assistant(req.question)
        return {"status": "success", "assistant": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 12. Scientific PDF Reports
@router.post("/reports")
def create_report(req: ReportCreateRequest):
    """Generates a downloadable PDF scientific report and registers it in the archive."""
    try:
        res = generate_pdf_report(req.region_id, req.variable)
        return {"status": "success", "report": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
def list_reports():
    """Lists all previously compiled scientific reports."""
    reports = get_all_reports()
    return {"status": "success", "count": len(reports), "reports": reports}


@router.get("/reports/{report_id}")
def get_report_meta(report_id: str):
    """Retrieves metadata for a specific report."""
    rep = get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"status": "success", "report": rep}


@router.get("/reports/{report_id}/download")
def download_report(report_id: str):
    """Streams the generated PDF report file."""
    rep = get_report_by_id(report_id)
    if not rep or not os.path.exists(rep["file_path"]):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        rep["file_path"],
        media_type="application/pdf",
        filename=rep["metadata"].get("filename", f"{report_id}.pdf")
    )
