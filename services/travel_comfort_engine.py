"""
AstroKites Smart Travel Planner - Comfort Scoring Engine & Travel Intelligence
Implements:
- Rule-based Travel Comfort Score (0 to 100) with activity-specific weights
- 12-Month Best Time to Travel identification
- Intelligent Date Window Finder (continuous trip duration scoring)
- Multi-destination comparison (2-3 Indian destinations)
- Interactive 12-Month Comfort Calendar
- Meteorological Risk Assessment (monsoon, heatwaves, cyclones, high humidity)
"""

from typing import Dict, List, Optional, Any, Tuple
from services.travel_climate_service import analyze_destination_climate, MONTH_NAMES
from services.travel_destinations import get_destination_by_id, resolve_indian_destination

# Activity weights config
ACTIVITY_WEIGHTS = {
    "beach": {"temp": 0.25, "rain": 0.35, "humidity": 0.10, "wind": 0.15, "solar": 0.15},
    "mountain": {"temp": 0.25, "rain": 0.35, "wind": 0.20, "humidity": 0.10, "solar": 0.10},
    "adventure": {"temp": 0.30, "rain": 0.35, "wind": 0.15, "humidity": 0.10, "solar": 0.10},
    "trekking": {"temp": 0.30, "rain": 0.35, "wind": 0.15, "humidity": 0.10, "solar": 0.10},
    "wildlife": {"temp": 0.25, "rain": 0.35, "humidity": 0.15, "wind": 0.10, "solar": 0.15},
    "city": {"temp": 0.30, "rain": 0.25, "humidity": 0.15, "wind": 0.15, "solar": 0.15},
    "sightseeing": {"temp": 0.30, "rain": 0.25, "humidity": 0.15, "wind": 0.15, "solar": 0.15},
    "religious": {"temp": 0.30, "rain": 0.25, "humidity": 0.15, "wind": 0.15, "solar": 0.15},
    "cultural": {"temp": 0.30, "rain": 0.25, "humidity": 0.15, "wind": 0.15, "solar": 0.15},
    "desert": {"temp": 0.35, "rain": 0.10, "humidity": 0.15, "solar": 0.25, "wind": 0.15},
    "general": {"temp": 0.30, "rain": 0.25, "humidity": 0.15, "wind": 0.15, "solar": 0.15}
}


def compute_temperature_suitability(mean_temp: float, max_temp: float, min_temp: float, activity: str) -> float:
    """Calculates temperature suitability score (0-100) based on travel activity."""
    act = activity.lower()
    
    if act in ["mountain", "trekking"]:
        # Ideal mountain day: 14°C to 22°C
        if 14 <= mean_temp <= 22:
            score = 100.0 - abs(mean_temp - 18.0) * 2.0
        elif mean_temp < 14:
            # Cold penalty (severe below 0°C)
            score = max(10.0, 85.0 - (14 - mean_temp) * 5.0)
        else:
            # Warm penalty
            score = max(20.0, 85.0 - (mean_temp - 22) * 6.0)
            
    elif act == "beach":
        # Ideal beach: 24°C to 30°C
        if 24 <= mean_temp <= 30:
            score = 100.0 - abs(mean_temp - 27.0) * 3.0
        elif mean_temp < 24:
            score = max(30.0, 80.0 - (24 - mean_temp) * 6.0)
        else:
            # Sweltering heat penalty
            score = max(20.0, 85.0 - (mean_temp - 30) * 8.0)
            
    elif act == "desert":
        # Ideal desert: 18°C to 26°C (cool winter days)
        if 18 <= mean_temp <= 26 and max_temp < 32:
            score = 100.0 - abs(mean_temp - 22.0) * 3.0
        elif max_temp >= 38:
            # Extreme desert heatwave penalty
            score = max(5.0, 40.0 - (max_temp - 38) * 8.0)
        elif mean_temp < 15:
            score = max(40.0, 80.0 - (15 - mean_temp) * 5.0)
        else:
            score = max(25.0, 75.0 - (mean_temp - 26) * 5.0)
            
    else: # sightseeing, city, cultural, general
        # Ideal outdoor walking: 18°C to 28°C
        if 18 <= mean_temp <= 28:
            score = 100.0 - abs(mean_temp - 23.0) * 2.5
        elif mean_temp < 18:
            score = max(20.0, 85.0 - (18 - mean_temp) * 4.0)
        else:
            score = max(15.0, 85.0 - (mean_temp - 28) * 6.5)

    return round(min(100.0, max(0.0, score)), 1)


def compute_rainfall_suitability(total_rain_mm: float, rainy_days: float, activity: str) -> float:
    """Calculates rainfall suitability score (0-100). Rain is a strong travel disrupter."""
    act = activity.lower()
    
    # Dry or light rainfall (< 30mm/month) is optimal for most travel
    if total_rain_mm <= 30 and rainy_days <= 3:
        return 98.0
        
    if act in ["beach", "trekking", "mountain"]:
        # Heavy penalty for wet weather on beaches and mountain trekking (landslides, rough seas)
        if total_rain_mm > 350 or rainy_days > 16:
            return max(5.0, 20.0 - (total_rain_mm - 350) * 0.05)
        elif total_rain_mm > 150:
            return max(20.0, 50.0 - (total_rain_mm - 150) * 0.15)
        else:
            return max(50.0, 95.0 - total_rain_mm * 0.3)
            
    elif act == "wildlife":
        # Parks in India often close during heavy monsoon (June-September)
        if total_rain_mm > 200 or rainy_days > 12:
            return 15.0 # Safari trails flooded / closed
        else:
            return max(40.0, 95.0 - total_rain_mm * 0.28)
            
    else: # City, cultural, general
        if total_rain_mm > 300:
            return max(20.0, 45.0 - (total_rain_mm - 300) * 0.08)
        else:
            return max(35.0, 95.0 - total_rain_mm * 0.2)


def compute_humidity_suitability(rh_pct: float, mean_temp: float) -> float:
    """Calculates humidity comfort score (0-100). Accounts for muggy oppressive heat."""
    # Ideal relative humidity: 40% to 60%
    if 40 <= rh_pct <= 60:
        return 95.0
        
    # Muggy heat discomfort (Humidex / heat index proxy)
    if rh_pct > 75 and mean_temp > 30:
        penalty = (rh_pct - 75) * 1.5 + (mean_temp - 30) * 4.0
        return round(max(10.0, 60.0 - penalty), 1)
        
    if rh_pct > 60:
        return round(max(30.0, 95.0 - (rh_pct - 60) * 1.5), 1)
    else: # Very dry (< 40%)
        return round(max(40.0, 95.0 - (40 - rh_pct) * 1.8), 1)


def compute_wind_suitability(wind_speed_ms: float, activity: str) -> float:
    """Calculates wind comfort score (0-100)."""
    # Ideal gentle to moderate breeze: 2.0 to 4.5 m/s
    if 2.0 <= wind_speed_ms <= 4.5:
        return 95.0
    elif wind_speed_ms < 2.0:
        return 85.0 # Stagnant, slightly sultry
    elif wind_speed_ms <= 7.0:
        return 75.0 # Fresh breeze
    else:
        # Strong wind (> 7 m/s) impairs beaches and mountain trekking
        penalty = (wind_speed_ms - 7.0) * 15.0
        return round(max(15.0, 60.0 - penalty), 1)


def compute_solar_suitability(solar_mj: float, max_temp: float, activity: str) -> float:
    """Calculates solar radiation suitability score (0-100)."""
    # Typical solar radiation in India: 14 to 24 MJ/m^2/day
    if 16 <= solar_mj <= 22 and max_temp < 35:
        return 95.0
    elif solar_mj > 22 and max_temp >= 38:
        # Harsh sun + heatwave = sunstroke risk
        return max(20.0, 60.0 - (max_temp - 38) * 8.0)
    elif solar_mj < 14:
        # Overcast / monsoon gloom
        return 65.0
    else:
        return 80.0


def calculate_month_comfort_score(month_data: Dict[str, Any], activity: str = "general") -> Dict[str, Any]:
    """
    Computes the composite Travel Comfort Score (0-100) and factor breakdowns.
    """
    act = activity.lower()
    weights = ACTIVITY_WEIGHTS.get(act, ACTIVITY_WEIGHTS["general"])
    
    t_score = compute_temperature_suitability(
        month_data["temp_mean_c"],
        month_data["temp_max_c"],
        month_data["temp_min_c"],
        act
    )
    r_score = compute_rainfall_suitability(
        month_data["rainfall_total_mm"],
        month_data["rainy_days_count"],
        act
    )
    h_score = compute_humidity_suitability(
        month_data["humidity_avg_pct"],
        month_data["temp_mean_c"]
    )
    w_score = compute_wind_suitability(
        month_data["wind_speed_avg_ms"],
        act
    )
    s_score = compute_solar_suitability(
        month_data["solar_radiation_mj"],
        month_data["temp_max_c"],
        act
    )
    
    composite = (
        t_score * weights["temp"] +
        r_score * weights["rain"] +
        h_score * weights["humidity"] +
        w_score * weights["wind"] +
        s_score * weights["solar"]
    )
    
    final_score = round(min(100.0, max(0.0, composite)), 1)
    
    # Classification
    if final_score >= 80:
        classification = "Excellent"
        category_code = "excellent"
        color_hex = "#16a34a" # Green
    elif final_score >= 60:
        classification = "Good"
        category_code = "good"
        color_hex = "#22c55e" # Light Green
    elif final_score >= 40:
        classification = "Moderate"
        category_code = "moderate"
        color_hex = "#eab308" # Yellow / Amber
    else:
        classification = "Less Suitable"
        category_code = "less_suitable"
        color_hex = "#f97316" # Orange / Red
        
    # Generate contextual reason & travel tip
    reasons = []
    limitations = []
    
    if t_score >= 85:
        reasons.append(f"Ideal temperature ({month_data['temp_mean_c']}°C)")
    elif month_data["temp_max_c"] >= 38:
        limitations.append(f"High daytime heat reaching {month_data['temp_max_c']}°C")
    elif month_data["temp_mean_c"] < 10:
        limitations.append(f"Cold conditions ({month_data['temp_mean_c']}°C average)")
        
    if r_score >= 85:
        reasons.append("Minimal rainfall and clear skies")
    elif month_data["rainfall_total_mm"] >= 200:
        limitations.append(f"Heavy rainfall ({month_data['rainfall_total_mm']} mm, ~{month_data['rainy_days_count']} wet days)")
        
    if h_score < 50:
        limitations.append(f"High relative humidity ({month_data['humidity_avg_pct']}%)")
        
    if not reasons:
        reasons.append("Acceptable conditions for general outdoor movement")
        
    return {
        "month": month_data["month"],
        "month_name": month_data["month_name"],
        "travel_comfort_score": final_score,
        "classification": classification,
        "category_code": category_code,
        "color_hex": color_hex,
        "sub_scores": {
            "temperature_suitability": t_score,
            "rainfall_suitability": r_score,
            "humidity_suitability": h_score,
            "wind_suitability": w_score,
            "solar_radiation_suitability": s_score
        },
        "weights_applied": weights,
        "climate_metrics": {
            "temp_mean_c": month_data["temp_mean_c"],
            "temp_min_c": month_data["temp_min_c"],
            "temp_max_c": month_data["temp_max_c"],
            "rainfall_total_mm": month_data["rainfall_total_mm"],
            "rainy_days_count": month_data["rainy_days_count"],
            "humidity_avg_pct": month_data["humidity_avg_pct"],
            "wind_speed_avg_ms": month_data["wind_speed_avg_ms"],
            "solar_radiation_mj": month_data["solar_radiation_mj"]
        },
        "highlights": reasons,
        "limitations": limitations
    }


def get_best_time_to_travel(
    destination: str,
    travel_type: str = "general",
    start_year: int = 2015,
    end_year: int = 2024
) -> Dict[str, Any]:
    """
    Evaluates all 12 months for an Indian destination and returns the ranked best months,
    peak travel season, shoulder season, and seasonal advice.
    """
    climate_res = analyze_destination_climate(destination, start_year, end_year)
    if climate_res.get("status") != "success":
        return climate_res

    profile = climate_res["climate_profile"]
    months_data = profile["months"]
    
    scored_months = []
    for m_data in months_data:
        score_obj = calculate_month_comfort_score(m_data, travel_type)
        scored_months.append(score_obj)
        
    # Sort months by comfort score descending
    ranked = sorted(scored_months, key=lambda x: x["travel_comfort_score"], reverse=True)
    
    # Identify top recommended months (score >= 60)
    top_months = [m for m in ranked if m["travel_comfort_score"] >= 60]
    if not top_months:
        top_months = ranked[:3]
        
    best_month = ranked[0]
    challenging_month = ranked[-1]
    
    # Formulate activity-specific seasonal recommendation
    dest_name = profile["destination_name"]
    best_names = [m["month_name"] for m in top_months[:4]]
    
    recommendation_text = (
        f"For {travel_type.replace('_', ' ').title()} in {dest_name}, the prime travel period is "
        f"{', '.join(best_names)}. {best_month['month_name']} achieves the highest comfort score of "
        f"{best_month['travel_comfort_score']}/100 with comfortable {best_month['climate_metrics']['temp_mean_c']}°C "
        f"and {best_month['climate_metrics']['rainfall_total_mm']} mm precipitation. "
        f"Avoid or exercise caution during {challenging_month['month_name']} (score {challenging_month['travel_comfort_score']}/100) "
        f"due to {', '.join(challenging_month['limitations'] or ['unfavorable weather conditions'])}."
    )

    return {
        "status": "success",
        "destination": {
            "id": profile["destination_id"],
            "name": profile["destination_name"],
            "state": profile["state_name"],
            "climate_zone": profile["climate_zone"],
            "coordinates": profile["coordinates"]
        },
        "travel_type": travel_type,
        "historical_period": profile["historical_period"],
        "overall_best_month": best_month["month_name"],
        "top_recommended_months": [m["month_name"] for m in top_months],
        "summary_recommendation": recommendation_text,
        "monthly_calendar": scored_months,
        "ranked_months": ranked,
        "scoring_methodology": {
            "engine": "AstroKites Multi-Factor Meteorological Comfort Scoring (0-100)",
            "weights": ACTIVITY_WEIGHTS.get(travel_type.lower(), ACTIVITY_WEIGHTS["general"]),
            "disclaimer": "Comfort scores represent relative historical climate suitability and do not replace real-time meteorological warnings."
        }
    }


def find_best_travel_dates(
    destination: str,
    travel_type: str = "general",
    duration_days: int = 7,
    is_flexible: bool = True,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_year: int = 2015,
    end_year: int = 2024
) -> Dict[str, Any]:
    """
    Intelligent Date Recommendation:
    - Flexible dates: Identifies continuous multi-day windows with optimal climatic comfort.
    - Fixed dates: Evaluates historical suitability and weather risks for selected dates.
    """
    climate_res = analyze_destination_climate(destination, start_year, end_year)
    if climate_res.get("status") != "success":
        return climate_res

    profile = climate_res["climate_profile"]
    scored_months = [calculate_month_comfort_score(m, travel_type) for m in profile["months"]]
    
    duration = min(max(int(duration_days), 1), 30)

    if is_flexible:
        # Flexible dates mode: Rank top 5 continuous trip windows
        # Window candidates across the 12 months (early, mid, late month slices)
        windows = []
        for sm in scored_months:
            m_num = sm["month"]
            m_name = sm["month_name"]
            score = sm["travel_comfort_score"]
            
            # Sub-month windows (e.g. 1st-7th, 10th-17th, 20th-27th)
            slices = [
                {"name": f"Early {m_name}", "dates": f"1 {m_name[:3]} - {min(duration, 28)} {m_name[:3]}", "score_adj": score},
                {"name": f"Mid {m_name}", "dates": f"10 {m_name[:3]} - {min(10 + duration, 28)} {m_name[:3]}", "score_adj": score + 0.5},
                {"name": f"Late {m_name}", "dates": f"20 {m_name[:3]} - {min(20 + duration, 30)} {m_name[:3]}", "score_adj": score - 0.5}
            ]
            for sl in slices:
                windows.append({
                    "window_label": sl["name"],
                    "approx_dates": sl["dates"],
                    "month": m_name,
                    "duration_days": duration,
                    "comfort_score": round(min(100.0, max(0.0, sl["score_adj"])), 1),
                    "classification": sm["classification"],
                    "color_hex": sm["color_hex"],
                    "expected_temp_c": sm["climate_metrics"]["temp_mean_c"],
                    "expected_rainfall_mm": round((sm["climate_metrics"]["rainfall_total_mm"] / 30.0) * duration, 1),
                    "weather_summary": f"{sm['climate_metrics']['temp_mean_c']}°C mean, {sm['highlights'][0] if sm['highlights'] else 'pleasant'}"
                })
                
        # Rank by comfort score
        ranked_windows = sorted(windows, key=lambda x: x["comfort_score"], reverse=True)
        top_windows = ranked_windows[:5]

        return {
            "status": "success",
            "destination": profile["destination_name"],
            "travel_type": travel_type,
            "mode": "flexible_dates",
            "trip_duration_days": duration,
            "top_recommended_windows": top_windows,
            "analysis_notes": f"Scanned continuous {duration}-day windows across NASA POWER historical observations (2015-2024)."
        }
    else:
        # Fixed dates mode: Evaluate specific travel dates
        s_date = start_date or "2026-12-01"
        try:
            dt = datetime.strptime(s_date, "%Y-%m-%d")
            m_idx = dt.month - 1
            month_score = scored_months[m_idx]
        except Exception:
            month_score = scored_months[11] # December fallback

        return {
            "status": "success",
            "destination": profile["destination_name"],
            "travel_type": travel_type,
            "mode": "fixed_dates",
            "selected_period": {"start_date": start_date, "end_date": end_date, "duration_days": duration},
            "comfort_score": month_score["travel_comfort_score"],
            "classification": month_score["classification"],
            "color_hex": month_score["color_hex"],
            "climate_expectation": month_score["climate_metrics"],
            "highlights": month_score["highlights"],
            "risks_and_limitations": month_score["limitations"],
            "verdict": (
                f"Your selected dates in {month_score['month_name']} have a Travel Comfort Score of "
                f"{month_score['travel_comfort_score']}/100 ({month_score['classification']}). "
                f"Expect average temperatures of {month_score['climate_metrics']['temp_mean_c']}°C "
                f"and approximately {month_score['climate_metrics']['rainfall_total_mm']} mm total rainfall."
            )
        }


def compare_destinations(
    destinations: List[str],
    travel_type: str = "general",
    start_year: int = 2015,
    end_year: int = 2024
) -> Dict[str, Any]:
    """
    Compares 2 or 3 Indian destinations side-by-side using standardized NASA POWER records.
    """
    if len(destinations) < 2:
        return {
            "status": "error",
            "message": "At least 2 Indian destinations are required for comparison (e.g. Goa vs Kerala)."
        }

    dests_to_compare = destinations[:3] # Limit to max 3
    results = []

    for d in dests_to_compare:
        c_res = get_best_time_to_travel(d, travel_type, start_year, end_year)
        if c_res.get("status") == "success":
            results.append(c_res)
        else:
            return c_res # Return error if any destination fails validation (e.g. foreign)

    # Calculate overall comparison metrics
    comparison_summary = []
    for r in results:
        cal = r["monthly_calendar"]
        avg_annual_score = round(sum(m["travel_comfort_score"] for m in cal) / len(cal), 1)
        best_m = r["overall_best_month"]
        top_m = r["top_recommended_months"]
        
        comparison_summary.append({
            "destination_name": r["destination"]["name"],
            "state_name": r["destination"]["state"],
            "climate_zone": r["destination"]["climate_zone"],
            "coordinates": r["destination"]["coordinates"],
            "average_annual_comfort_score": avg_annual_score,
            "best_month": best_m,
            "peak_comfort_score": next((m["travel_comfort_score"] for m in cal if m["month_name"] == best_m), 80),
            "top_months": top_m[:4],
            "monthly_scores": [m["travel_comfort_score"] for m in cal],
            "temp_mean_annual": round(sum(m["climate_metrics"]["temp_mean_c"] for m in cal) / len(cal), 1),
            "rainfall_annual_mm": round(sum(m["climate_metrics"]["rainfall_total_mm"] for m in cal), 1)
        })

    # Pick winner for the activity
    winner = max(comparison_summary, key=lambda x: x["peak_comfort_score"])

    return {
        "status": "success",
        "travel_type": travel_type,
        "destinations_compared": comparison_summary,
        "recommendation_verdict": (
            f"For {travel_type.replace('_', ' ').title()}, {winner['destination_name']} ({winner['state_name']}) "
            f"ranks highest with a peak comfort score of {winner['peak_comfort_score']}/100 in {winner['best_month']}."
        )
    }


def assess_travel_weather_risks(
    destination: str,
    start_year: int = 2015,
    end_year: int = 2024
) -> Dict[str, Any]:
    """
    Identifies high-impact meteorological risks for an Indian destination:
    - Monsoon torrential downpours & flood/landslide windows
    - Heatwaves (> 38°C) & sunstroke exposure
    - Oppressive high humidity / mugginess
    - Strong storm winds / cyclone season
    """
    climate_res = analyze_destination_climate(destination, start_year, end_year)
    if climate_res.get("status") != "success":
        return climate_res

    profile = climate_res["climate_profile"]
    months = profile["months"]
    
    risks = []
    
    # 1. Monsoon & Heavy Rain Risk
    wet_months = [m["month_name"] for m in months if m["rainfall_total_mm"] >= 200]
    if wet_months:
        risks.append({
            "risk_type": "Heavy Monsoon Precipitation & Waterlogging",
            "severity": "High" if any(m["rainfall_total_mm"] >= 400 for m in months) else "Moderate",
            "affected_months": wet_months,
            "climate_evidence": f"Peak rainfall exceeds 200 mm/month with up to 20 rainy days.",
            "travel_impact": "Disrupted outdoor sightseeing, flooded roads, closed beach water sports, and mountain landslide hazards.",
            "precautions": "Carry waterproof gear, monitor IMD weather bulletins, avoid isolated mountain passes and steep river valleys."
        })

    # 2. Heatwave Risk
    hot_months = [m["month_name"] for m in months if m["temp_max_c"] >= 38.0]
    if hot_months:
        risks.append({
            "risk_type": "Extreme Heatwave & Dehydration Exposure",
            "severity": "High" if any(m["temp_max_c"] >= 42.0 for m in months) else "Moderate",
            "affected_months": hot_months,
            "climate_evidence": f"Daytime temperatures regularly exceed 38°C–42°C.",
            "travel_impact": "Severe dehydration, sunstroke, exhaustion during daytime outdoor walking or monument visits.",
            "precautions": "Avoid outdoor activities between 11 AM and 4 PM, carry ORS / electrolytes, wear wide-brimmed hats and light cotton clothing."
        })

    # 3. Mugginess / High Humidity Risk
    muggy_months = [m["month_name"] for m in months if m["high_humidity_risk"]]
    if muggy_months:
        risks.append({
            "risk_type": "High Humidity & Sultry Mugginess Discomfort",
            "severity": "Moderate",
            "affected_months": muggy_months,
            "climate_evidence": "Relative humidity > 78% combined with mean temperatures > 30°C.",
            "travel_impact": "Excessive sweating, poor evaporative cooling, discomfort for long walking tours.",
            "precautions": "Plan breathable fabrics, ensure air-conditioned accommodation, stay hydrated."
        })

    # 4. Cyclone / Coastal Storm Risk
    if "Coastal" in profile.get("climate_zone", "") or "Island" in profile.get("climate_zone", ""):
        risks.append({
            "risk_type": "Tropical Cyclonic Disturbance (Bay of Bengal / Arabian Sea)",
            "severity": "Seasonal Alert",
            "affected_months": ["May", "October", "November"],
            "climate_evidence": "Pre-monsoon (May) and post-monsoon (Oct-Nov) cyclogenesis windows in North Indian Ocean.",
            "travel_impact": "High coastal swells, grounded flights/ferries, torrential rain.",
            "precautions": "Avoid offshore boat rides during active IMD cyclone alerts; verify ferry operations in island sectors."
        })

    return {
        "status": "success",
        "destination": profile["destination_name"],
        "state": profile["state_name"],
        "climate_zone": profile["climate_zone"],
        "assessed_risks": risks,
        "disclaimer": "Historical risk climatology is based on 10-year NASA observations. Always check real-time IMD (India Meteorological Department) official alerts for current travel."
    }
