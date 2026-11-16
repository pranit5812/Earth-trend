"""
EarthTrend India - Scientific Trend Engine
Implements:
- Mann-Kendall Non-Parametric Trend Test
- Seasonal Mann-Kendall (Hirsch-Slack)
- Sen's Slope Estimator with 95% Confidence Intervals
- Linear Regression (OLS) with R2 and p-value
- Lag-1 Autocorrelation Detection and Yue-Pilon Pre-whitening
- Benjamini-Hochberg False Discovery Rate (FDR) Correction
- Anomaly Detection (Z-Score against Climatological Baseline)
"""

import math
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from scipy import stats


def linear_regression_trend(x_values: np.ndarray, y_values: np.ndarray) -> Dict[str, Any]:
    """
    Computes Ordinary Least Squares (OLS) linear regression.
    """
    valid_mask = ~np.isnan(y_values) & ~np.isnan(x_values)
    x = x_values[valid_mask]
    y = y_values[valid_mask]
    n = len(x)
    if n < 3:
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "r_squared": 0.0,
            "p_value": 1.0,
            "std_err": 0.0,
            "annual_rate": 0.0
        }
    
    res = stats.linregress(x, y)
    r2 = float(res.rvalue ** 2) if not np.isnan(res.rvalue) else 0.0
    return {
        "slope": float(res.slope),
        "intercept": float(res.intercept),
        "r_squared": r2,
        "p_value": float(res.pvalue) if not np.isnan(res.pvalue) else 1.0,
        "std_err": float(res.stderr) if res.stderr and not np.isnan(res.stderr) else 0.0,
        "annual_rate": float(res.slope) # if x is in years
    }


def mann_kendall_test(data: np.ndarray, alpha: float = 0.05) -> Dict[str, Any]:
    """
    Standard Mann-Kendall non-parametric trend test with tie correction.
    """
    clean_data = data[~np.isnan(data)]
    n = len(clean_data)
    if n < 4:
        return {
            "trend": "no_trend",
            "p_value": 1.0,
            "z_stat": 0.0,
            "tau": 0.0,
            "s_stat": 0,
            "var_s": 0.0,
            "is_significant": False
        }
    
    # Calculate S
    s = 0
    for k in range(n - 1):
        diffs = clean_data[k + 1:] - clean_data[k]
        s += np.sum(np.sign(diffs))
    
    # Ties correction
    unique_vals, counts = np.unique(clean_data, return_counts=True)
    tie_groups = counts[counts > 1]
    
    tie_sum = np.sum(tie_groups * (tie_groups - 1) * (2 * tie_groups + 5))
    var_s = (n * (n - 1) * (2 * n + 5) - tie_sum) / 18.0
    
    # Calculate Z statistic
    if var_s > 0:
        if s > 0:
            z = (s - 1) / np.sqrt(var_s)
        elif s < 0:
            z = (s + 1) / np.sqrt(var_s)
        else:
            z = 0.0
    else:
        z = 0.0
    
    # Two-tailed p-value
    p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    
    # Kendall's Tau
    denom = 0.5 * n * (n - 1)
    if tie_sum > 0:
        tie_sum_tau = np.sum(tie_groups * (tie_groups - 1)) / 2.0
        denom = np.sqrt((denom - tie_sum_tau) * denom)
    tau = s / denom if denom > 0 else 0.0
    
    is_sig = bool(p_value < alpha)
    if is_sig:
        trend = "increasing" if z > 0 else "decreasing"
    else:
        trend = "stable"
    
    return {
        "trend": trend,
        "p_value": float(p_value),
        "z_stat": float(z),
        "tau": float(tau),
        "s_stat": int(s),
        "var_s": float(var_s),
        "is_significant": is_sig
    }


def sens_slope_estimator(x: np.ndarray, y: np.ndarray, alpha: float = 0.05) -> Dict[str, Any]:
    """
    Computes Sen's slope estimator and non-parametric 95% confidence intervals.
    """
    valid = ~np.isnan(x) & ~np.isnan(y)
    x_c = x[valid]
    y_c = y[valid]
    n = len(x_c)
    if n < 3:
        return {
            "sens_slope": 0.0,
            "conf_lower": 0.0,
            "conf_upper": 0.0,
            "median_intercept": 0.0
        }
    
    # Pairwise slopes
    slopes = []
    for i in range(n - 1):
        dx = x_c[i + 1:] - x_c[i]
        dy = y_c[i + 1:] - y_c[i]
        non_zero = dx != 0
        if np.any(non_zero):
            slopes.extend((dy[non_zero] / dx[non_zero]).tolist())
    
    if not slopes:
        return {
            "sens_slope": 0.0,
            "conf_lower": 0.0,
            "conf_upper": 0.0,
            "median_intercept": 0.0
        }
    
    slopes = np.sort(np.array(slopes))
    n_slopes = len(slopes)
    median_slope = float(np.median(slopes))
    
    # Confidence interval calculation
    # Ties in y
    _, counts = np.unique(y_c, return_counts=True)
    tie_groups = counts[counts > 1]
    tie_sum = np.sum(tie_groups * (tie_groups - 1) * (2 * tie_groups + 5))
    var_s = (n * (n - 1) * (2 * n + 5) - tie_sum) / 18.0
    
    z_crit = stats.norm.ppf(1.0 - alpha / 2.0)
    c_alpha = z_crit * np.sqrt(var_s)
    
    m1 = int(np.floor((n_slopes - c_alpha) / 2.0))
    m2 = int(np.ceil((n_slopes + c_alpha) / 2.0))
    
    m1 = max(0, min(n_slopes - 1, m1))
    m2 = max(0, min(n_slopes - 1, m2))
    
    conf_lower = float(slopes[m1])
    conf_upper = float(slopes[m2])
    
    # Median intercept: median(y_i - slope * x_i)
    intercept = float(np.median(y_c - median_slope * x_c))
    
    return {
        "sens_slope": median_slope,
        "conf_lower": conf_lower,
        "conf_upper": conf_upper,
        "median_intercept": intercept
    }


def autocorrelation_lag1(series: np.ndarray) -> Tuple[float, bool]:
    """
    Computes lag-1 autocorrelation and tests if statistically significant at 5% level.
    """
    clean = series[~np.isnan(series)]
    n = len(clean)
    if n < 10:
        return 0.0, False
    
    mean = np.mean(clean)
    var = np.var(clean)
    if var == 0:
        return 0.0, False
    
    c1 = np.sum((clean[:-1] - mean) * (clean[1:] - mean)) / ((n - 1) * var)
    # Anderson (1942) 95% confidence limits for lag-1 autocorrelation
    lim_upper = (-1.0 + 1.96 * np.sqrt(n - 2)) / (n - 1)
    lim_lower = (-1.0 - 1.96 * np.sqrt(n - 2)) / (n - 1)
    
    is_sig = bool(c1 > lim_upper or c1 < lim_lower)
    return float(c1), is_sig


def yue_pilon_prewhiten(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """
    Yue-Pilon (2002) Trend-Free Pre-Whitening (TFPW) procedure.
    Removes AR(1) serial autocorrelation while preserving monotonic trend slope.
    """
    clean_mask = ~np.isnan(y)
    y_c = y[clean_mask]
    x_c = x[clean_mask]
    n = len(y_c)
    if n < 10:
        return y
    
    sens = sens_slope_estimator(x_c, y_c)
    slope = sens["sens_slope"]
    
    # Step 1: Detrend the series
    detrended = y_c - slope * x_c
    
    # Step 2: Calculate lag-1 autocorrelation of detrended residuals
    r1, is_sig = autocorrelation_lag1(detrended)
    if not is_sig or abs(r1) < 0.1:
        # Autocorrelation not significant; return original series
        return y
    
    # Step 3: AR(1) prewhiten residuals
    prewhitened_res = detrended[1:] - r1 * detrended[:-1]
    
    # Step 4: Blend monotonic trend back
    blended = prewhitened_res + slope * x_c[1:]
    
    result = np.full_like(y, np.nan)
    indices = np.where(clean_mask)[0][1:]
    result[indices] = blended
    return result


def seasonal_mann_kendall(monthly_values: Dict[int, List[float]], alpha: float = 0.05) -> Dict[str, Any]:
    """
    Hirsch-Slack Seasonal Mann-Kendall test across 12 calendar months.
    """
    total_s = 0
    total_var_s = 0.0
    season_results = {}
    
    for month in range(1, 13):
        vals = np.array(monthly_values.get(month, []), dtype=float)
        clean = vals[~np.isnan(vals)]
        if len(clean) >= 3:
            mk = mann_kendall_test(clean, alpha=alpha)
            total_s += mk["s_stat"]
            total_var_s += mk["var_s"]
            season_results[month] = mk
        else:
            season_results[month] = {"s_stat": 0, "var_s": 0.0, "p_value": 1.0, "trend": "insufficient_data"}
    
    if total_var_s > 0:
        if total_s > 0:
            z = (total_s - 1) / np.sqrt(total_var_s)
        elif total_s < 0:
            z = (total_s + 1) / np.sqrt(total_var_s)
        else:
            z = 0.0
    else:
        z = 0.0
    
    p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    is_sig = bool(p_value < alpha)
    trend = "increasing" if (is_sig and z > 0) else ("decreasing" if (is_sig and z < 0) else "stable")
    
    return {
        "trend": trend,
        "seasonal_p_value": float(p_value),
        "seasonal_z_stat": float(z),
        "seasonal_s_stat": int(total_s),
        "is_significant": is_sig,
        "by_season": season_results
    }


def benjamini_hochberg_fdr(p_values: List[float], q: float = 0.05) -> List[Dict[str, Any]]:
    """
    Benjamini-Hochberg False Discovery Rate (FDR) control for multiple hypothesis testing.
    """
    m = len(p_values)
    if m == 0:
        return []
    
    indexed = sorted(enumerate(p_values), key=lambda x: x[1])
    adjusted = [0.0] * m
    significant = [False] * m
    
    # Step-up FDR correction
    cum_min = 1.0
    for rank_idx in range(m - 1, -1, -1):
        orig_idx, p = indexed[rank_idx]
        rank = rank_idx + 1
        adj_p = (p * m) / rank
        cum_min = min(cum_min, adj_p)
        adjusted[orig_idx] = float(min(1.0, cum_min))
        significant[orig_idx] = bool(adjusted[orig_idx] < q)
    
    return [{"original_p": p, "adjusted_p": adj, "fdr_significant": sig} for p, adj, sig in zip(p_values, adjusted, significant)]


def detect_climatological_anomalies(
    dates: List[str],
    values: List[float],
    baseline_years: Tuple[int, int] = (1991, 2020),
    z_threshold: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Calculates monthly/seasonal anomalies against standard 30-year climatological baseline.
    Flags extreme anomalies exceeding z_threshold standard deviations.
    """
    if len(dates) != len(values) or len(values) == 0:
        return []
    
    # Group baseline values by calendar month
    monthly_baseline = {m: [] for m in range(1, 13)}
    parsed_dates = []
    for d_str, v in zip(dates, values):
        if np.isnan(v):
            continue
        try:
            parts = d_str.split("-")
            yr = int(parts[0])
            mo = int(parts[1])
            parsed_dates.append((d_str, yr, mo, v))
            if baseline_years[0] <= yr <= baseline_years[1]:
                monthly_baseline[mo].append(v)
        except Exception:
            continue
    
    # Compute baseline mean & std for each month
    baseline_stats = {}
    for m in range(1, 13):
        b_vals = np.array(monthly_baseline[m])
        if len(b_vals) >= 5:
            baseline_stats[m] = {
                "mean": float(np.mean(b_vals)),
                "std": float(max(1e-6, np.std(b_vals)))
            }
        else:
            # Fallback to all data if baseline period is sparse
            all_m_vals = [v for (_, _, mo, v) in parsed_dates if mo == m]
            if all_m_vals:
                baseline_stats[m] = {
                    "mean": float(np.mean(all_m_vals)),
                    "std": float(max(1e-6, np.std(all_m_vals)))
                }
            else:
                baseline_stats[m] = {"mean": 0.0, "std": 1.0}
    
    # Compute anomalies
    anomalies = []
    for d_str, yr, mo, val in parsed_dates:
        stats_m = baseline_stats[mo]
        mean_m = stats_m["mean"]
        std_m = stats_m["std"]
        anomaly = val - mean_m
        z_score = anomaly / std_m
        
        if abs(z_score) >= z_threshold:
            severity = "extreme" if abs(z_score) >= 3.0 else "severe"
            anom_type = "positive_anomaly" if z_score > 0 else "negative_anomaly"
            anomalies.append({
                "date": d_str,
                "value": float(val),
                "baseline_mean": float(mean_m),
                "baseline_std": float(std_m),
                "anomaly": float(anomaly),
                "z_score": float(z_score),
                "severity": severity,
                "type": anom_type
            })
    
    return anomalies


def comprehensive_trend_analysis(
    dates: List[str],
    values: List[float],
    variable: str,
    prewhiten: bool = True,
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Executes complete scientific trend detective evaluation:
    1. Data preparation and clean array mapping.
    2. Yue-Pilon Pre-whitening if serial correlation exists.
    3. Mann-Kendall test on sanitized observations.
    4. Sen's non-parametric slope with 95% confidence intervals.
    5. OLS linear regression for comparative parametric statistics.
    6. Seasonal Mann-Kendall across 12 calendar months.
    7. Climatological anomaly scan.
    """
    clean_indices = [i for i, v in enumerate(values) if v is not None and not np.isnan(v)]
    n_obs = len(clean_indices)
    
    if n_obs < 5:
        return {
            "status": "insufficient_data",
            "n_observations": n_obs,
            "variable": variable,
            "trend_direction": "no_trend",
            "is_significant": False,
            "p_value": 1.0,
            "annual_rate": 0.0,
            "sens_slope": 0.0,
            "message": "At least 5 valid observations are required for statistical trend analysis."
        }
    
    y = np.array([values[i] for i in clean_indices], dtype=float)
    
    # Generate fractional year coordinates for time axis
    years = []
    monthly_dict = {m: [] for m in range(1, 13)}
    for i in clean_indices:
        d = dates[i]
        parts = d.split("-")
        yr = int(parts[0])
        mo = int(parts[1]) if len(parts) > 1 else 1
        day = int(parts[2]) if len(parts) > 2 else 15
        frac_yr = yr + (mo - 1) / 12.0 + (day - 1) / 365.25
        years.append(frac_yr)
        monthly_dict[mo].append(values[i])
    
    x = np.array(years, dtype=float)
    
    # 1. Autocorrelation check
    r1, r1_sig = autocorrelation_lag1(y)
    
    # 2. Prewhitening if needed
    if prewhiten and r1_sig:
        y_test = yue_pilon_prewhiten(x, y)
        prewhitened_applied = True
    else:
        y_test = y
        prewhitened_applied = False
    
    # 3. Mann-Kendall Test
    mk_res = mann_kendall_test(y_test, alpha=alpha)
    
    # 4. Sen's Slope
    sens_res = sens_slope_estimator(x, y, alpha=alpha)
    
    # 5. Linear Regression
    ols_res = linear_regression_trend(x, y)
    
    # 6. Seasonal Mann-Kendall
    smk_res = seasonal_mann_kendall(monthly_dict, alpha=alpha)
    
    # 7. Direction Classification
    # Strictly scientific: must be statistically significant at alpha (p < 0.05)
    if mk_res["is_significant"]:
        if sens_res["sens_slope"] > 0:
            trend_direction = "Increasing"
        elif sens_res["sens_slope"] < 0:
            trend_direction = "Decreasing"
        else:
            trend_direction = "No Statistically Significant Trend"
    else:
        trend_direction = "No Statistically Significant Trend"
    
    # Annual rate = Sen's slope (since x is in fractional years)
    annual_rate = sens_res["sens_slope"]
    
    # 8. Anomalies
    anomalies = detect_climatological_anomalies(
        [dates[i] for i in clean_indices],
        y.tolist()
    )
    
    return {
        "status": "success",
        "variable": variable,
        "n_observations": n_obs,
        "date_range": {
            "start": dates[clean_indices[0]],
            "end": dates[clean_indices[-1]]
        },
        "trend_direction": trend_direction,
        "is_significant": mk_res["is_significant"],
        "p_value": mk_res["p_value"],
        "annual_rate": annual_rate,
        "sens_slope": sens_res["sens_slope"],
        "confidence_interval_95": {
            "lower": sens_res["conf_lower"],
            "upper": sens_res["conf_upper"]
        },
        "mann_kendall": {
            "tau": mk_res["tau"],
            "z_stat": mk_res["z_stat"],
            "s_stat": mk_res["s_stat"],
            "var_s": mk_res["var_s"]
        },
        "linear_regression": ols_res,
        "autocorrelation": {
            "lag1_r": r1,
            "is_significant": r1_sig,
            "prewhitening_applied": prewhitened_applied
        },
        "seasonal_trend": smk_res,
        "anomalies_count": len(anomalies),
        "recent_anomalies": anomalies[-10:] if anomalies else []
    }
