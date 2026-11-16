"""
EarthTrend India - Multi-Variable Correlation Service
Analyzes relationships across aligned time-series of environmental variables:
- Pearson product-moment linear correlation (r, p-value)
- Spearman rank-order monotonic correlation (rho, p-value)
- Full pairwise correlation matrix
- Scientific caveat explaining correlation does not imply causation
"""

import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Any
from services.data_service import get_series_for_region, VARIABLE_CONFIG


def align_two_series(series_a: Dict[str, Any], series_b: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Finds the intersection of common dates between two time series and aligns their values.
    """
    map_a = dict(zip(series_a["dates"], series_a["values"]))
    map_b = dict(zip(series_b["dates"], series_b["values"]))
    
    common_dates = sorted(list(set(map_a.keys()).intersection(set(map_b.keys()))))
    val_a = []
    val_b = []
    clean_dates = []
    
    for d in common_dates:
        va = map_a[d]
        vb = map_b[d]
        if va is not None and vb is not None and not np.isnan(va) and not np.isnan(vb):
            val_a.append(va)
            val_b.append(vb)
            clean_dates.append(d)
            
    return np.array(val_a, dtype=float), np.array(val_b, dtype=float), clean_dates


def compute_bivariate_correlation(region_id: str, var1: str, var2: str) -> Dict[str, Any]:
    """
    Computes Pearson and Spearman correlations between two environmental variables for a region.
    """
    s1 = get_series_for_region(region_id, var1)
    s2 = get_series_for_region(region_id, var2)
    
    a, b, dates = align_two_series(s1, s2)
    n = len(a)
    
    if n < 5:
        return {
            "status": "insufficient_overlap",
            "region_id": region_id,
            "var1": var1,
            "var2": var2,
            "sample_size": n,
            "message": "Insufficient temporally overlapping observations between datasets."
        }
        
    p_r, p_p = stats.pearsonr(a, b)
    s_r, s_p = stats.spearmanr(a, b)
    
    # Interpretation text
    direction = "positive" if p_r > 0 else "negative"
    strength = "strong" if abs(p_r) >= 0.7 else ("moderate" if abs(p_r) >= 0.4 else "weak")
    sig_text = "statistically significant" if p_p < 0.05 else "not statistically significant"
    
    interpretation = (
        f"A {strength} {direction} correlation ({p_r:+.3f}) exists between {VARIABLE_CONFIG[var1]['label']} "
        f"and {VARIABLE_CONFIG[var2]['label']} in {s1.get('region_name', region_id)}, which is {sig_text} (p={p_p:.4e}). "
        f"Note: Correlation indicates coordinated variation or common meteorological drivers, but does not prove direct causation."
    )
    
    return {
        "status": "success",
        "region_id": region_id,
        "region_name": s1.get("region_name", region_id),
        "var1": var1,
        "var2": var2,
        "sample_size": n,
        "common_period": {
            "start": dates[0],
            "end": dates[-1]
        },
        "pearson": {
            "r": float(p_r),
            "p_value": float(p_p),
            "is_significant": bool(p_p < 0.05)
        },
        "spearman": {
            "rho": float(s_r),
            "p_value": float(s_p),
            "is_significant": bool(s_p < 0.05)
        },
        "scatter_points": [{"x": float(x_val), "y": float(y_val), "date": d} for x_val, y_val, d in zip(a[-48:], b[-48:], dates[-48:])],
        "interpretation": interpretation,
        "scientific_disclaimer": "Empirical correlation does not prove causation; complex coupled land-atmosphere feedbacks and seasonal cycles must be considered."
    }


def compute_correlation_matrix(region_id: str) -> Dict[str, Any]:
    """
    Computes complete 6x6 correlation matrix across all supported NASA variables.
    """
    vars_list = list(VARIABLE_CONFIG.keys())
    matrix = []
    
    # Pre-fetch all series for the region
    series_cache = {v: get_series_for_region(region_id, v) for v in vars_list}
    
    for v1 in vars_list:
        row = []
        for v2 in vars_list:
            if v1 == v2:
                row.append({"var1": v1, "var2": v2, "r": 1.0, "p": 0.0, "n": len(series_cache[v1]["values"])})
            else:
                a, b, dates = align_two_series(series_cache[v1], series_cache[v2])
                if len(a) >= 5:
                    r, p = stats.pearsonr(a, b)
                    row.append({"var1": v1, "var2": v2, "r": round(float(r), 3), "p": float(p), "n": len(a)})
                else:
                    row.append({"var1": v1, "var2": v2, "r": 0.0, "p": 1.0, "n": 0})
        matrix.append(row)
        
    return {
        "region_id": region_id,
        "variables": vars_list,
        "labels": [VARIABLE_CONFIG[v]["label"] for v in vars_list],
        "matrix": matrix
    }
