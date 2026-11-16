"""
EarthTrend India - Opposite Trend Detective Service
Automatically identifies and analyzes contrasting environmental trends across Indian regions:
e.g. Northwest warming vs Northeast cooling,
Deccan drying vs Gangetic wetting,
Intensifying urban wind stagnation vs coastal wind acceleration.
"""

from typing import Dict, List, Any
from services.india_geo_service import get_all_states, get_state_by_name_or_id
from services.data_service import get_series_for_region
from services.trend_engine import comprehensive_trend_analysis, benjamini_hochberg_fdr


def detect_opposite_trends(variable: str, alpha: float = 0.05) -> Dict[str, Any]:
    """
    Scans all 36 Indian states and union territories to identify diverging and opposite trends.
    Applies False Discovery Rate (FDR) correction across all spatial tests.
    """
    states = get_all_states()
    results = []
    
    for s in states:
        try:
            series = get_series_for_region(s["id"], variable)
            trend = comprehensive_trend_analysis(series["dates"], series["values"], variable, alpha=alpha)
            results.append({
                "region_id": s["id"],
                "region_name": s["name"],
                "zone": s.get("zone", "Central"),
                "lat": s["lat"],
                "lon": s["lon"],
                "trend_direction": trend["trend_direction"],
                "is_significant": trend["is_significant"],
                "p_value": trend["p_value"],
                "annual_rate": trend["annual_rate"],
                "sens_slope": trend["sens_slope"],
                "confidence_interval": trend["confidence_interval_95"],
                "n_observations": trend["n_observations"]
            })
        except Exception as e:
            continue
            
    # Apply FDR correction
    p_vals = [r["p_value"] for r in results]
    fdr_results = benjamini_hochberg_fdr(p_vals, q=alpha)
    for r, fdr in zip(results, fdr_results):
        r["fdr_p_value"] = fdr["adjusted_p"]
        r["fdr_significant"] = fdr["fdr_significant"]
        
    increasing = [r for r in results if r["trend_direction"] == "Increasing"]
    decreasing = [r for r in results if r["trend_direction"] == "Decreasing"]
    stable = [r for r in results if r["trend_direction"] == "No Statistically Significant Trend"]
    
    # Identify top contrasting pairs
    contrasting_pairs = []
    for inc in sorted(increasing, key=lambda x: x["annual_rate"], reverse=True)[:5]:
        for dec in sorted(decreasing, key=lambda x: x["annual_rate"])[:5]:
            divergence = inc["annual_rate"] - dec["annual_rate"]
            contrasting_pairs.append({
                "positive_region": inc,
                "negative_region": dec,
                "divergence_delta": round(divergence, 4),
                "summary": f"{inc['region_name']} shows a statistically significant increase ({inc['annual_rate']:+.4f}/yr, p={inc['p_value']:.4f}) while {dec['region_name']} exhibits a decrease ({dec['annual_rate']:+.4f}/yr, p={dec['p_value']:.4f})."
            })
            
    return {
        "variable": variable,
        "total_regions_analyzed": len(results),
        "increasing_count": len(increasing),
        "decreasing_count": len(decreasing),
        "stable_count": len(stable),
        "increasing_regions": increasing,
        "decreasing_regions": decreasing,
        "stable_regions": stable,
        "top_contrasting_pairs": contrasting_pairs[:6],
        "all_regions": results
    }


def compare_regions(region_ids: List[str], variable: str) -> Dict[str, Any]:
    """
    Compares two or more specific Indian states or districts.
    """
    comparisons = []
    for rid in region_ids:
        series = get_series_for_region(rid, variable)
        trend = comprehensive_trend_analysis(series["dates"], series["values"], variable)
        comparisons.append({
            "region_id": rid,
            "region_name": series.get("region_name", rid),
            "variable": variable,
            "unit": series["unit"],
            "source": series["source"],
            "dates": series["dates"],
            "values": series["values"],
            "trend": trend
        })
        
    return {
        "variable": variable,
        "regions_compared": comparisons,
        "comparison_count": len(comparisons)
    }
