"""
EarthTrend India - Scientific AI Assistant Service
Answers user scientific queries using actual underlying statistical calculations and verified NASA observations.
Strictly prohibits data hallucination:
- Quotes exact NASA dataset metadata
- Reports verified Mann-Kendall p-values and Sen's slope rates
- Distinguishes empirical observations from climate dynamics interpretations
"""

import re
from typing import Dict, Any, List, Optional
from services.india_geo_service import get_all_states, get_state_by_name_or_id
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.trend_engine import comprehensive_trend_analysis
from services.opposite_trend_service import detect_opposite_trends
from services.correlation_service import compute_bivariate_correlation


def query_scientific_assistant(user_prompt: str) -> Dict[str, Any]:
    """
    Interprets natural language questions and grounds answers in verified calculations.
    """
    prompt = user_prompt.lower().strip()
    
    # 1. Detect Variable
    target_var = "temperature"
    if any(k in prompt for k in ["rain", "precip", "rainfall"]):
        target_var = "rainfall"
    elif any(k in prompt for k in ["soil", "moisture"]):
        target_var = "soil_moisture"
    elif any(k in prompt for k in ["ndvi", "vegetation", "green", "crop", "forest"]):
        target_var = "vegetation"
    elif any(k in prompt for k in ["wind", "storm"]):
        target_var = "wind_speed"
    elif any(k in prompt for k in ["humid", "relative humidity"]):
        target_var = "humidity"
        
    # 2. Detect Region
    target_state = None
    for s in get_all_states():
        if s["name"].lower() in prompt or s["id"].lower() in prompt:
            target_state = s
            break
            
    # 3. Handle Question Types
    
    # Type 0: Greetings & Capabilities
    greeting_triggers = ["hello", "hi", "hey", "greetings", "help", "who are you", "what can you do", "explain yourself"]
    is_pure_greeting = any(prompt == g or prompt.startswith(f"{g} ") or prompt.endswith(f" {g}") for g in greeting_triggers) or prompt in ["help", "info", "?"]
    if is_pure_greeting and not any(k in prompt for k in ["temperature", "rain", "soil", "vegetation", "wind", "humidity", "trend", "maharashtra", "delhi", "kerala", "gujarat", "punjab", "tamil"]):
        return {
            "query": user_prompt,
            "variable": "overview",
            "response": (
                "👋 **Hello! I am your Earth System Scientific Assistant.**\n\n"
                "I evaluate verified NASA observations (POWER, GPM IMERG, SMAP, MODIS) and statistical trend analyses across India without hallucinations.\n\n"
                "**Here are some things you can ask me:**\n"
                "• *'Which Indian states show increasing temperatures?'*\n"
                "• *'Where is rainfall declining across India?'*\n"
                "• *'Is the temperature trend in Maharashtra statistically significant?'*\n"
                "• *'What is the relationship between rainfall and vegetation?'*\n"
                "• *'What are the opposite trends in soil moisture?'*\n"
                "• *'What is the climate trend in Rajasthan?'*\n\n"
                "Feel free to specify any Indian state or one of the 6 variables: **temperature, rainfall, soil moisture, vegetation, wind speed, or humidity**."
            ),
            "evidence_data": {"type": "greeting"}
        }
    
    # Type A: Opposite or Pan-India distribution (e.g. "which states show increasing...", "where is rainfall declining")
    if any(k in prompt for k in ["which states", "where is", "across india", "opposite", "diverging", "highest"]):
        res = detect_opposite_trends(target_var)
        inc_names = [r["region_name"] for r in res["increasing_regions"][:5]]
        dec_names = [r["region_name"] for r in res["decreasing_regions"][:5]]
        
        reply_lines = [
            f"### Verified NASA Analysis: {VARIABLE_CONFIG[target_var]['label']} across India",
            f"**Dataset Source:** {VARIABLE_CONFIG[target_var]['dataset']}",
            "",
            f"- **Statistically Significant Increases ({res['increasing_count']} regions, p < 0.05):** " + (", ".join(inc_names) if inc_names else "None"),
            f"- **Statistically Significant Decreases ({res['decreasing_count']} regions, p < 0.05):** " + (", ".join(dec_names) if dec_names else "None"),
            f"- **Stable / No Significant Trend:** {res['stable_count']} regions.",
            ""
        ]
        if res["top_contrasting_pairs"]:
            top = res["top_contrasting_pairs"][0]
            reply_lines.append(f"**Key Spatial Divergence:** {top['summary']}")
            reply_lines.append("")
        reply_lines.append("*Scientific Note: Significance is determined using two-tailed Mann-Kendall non-parametric testing with False Discovery Rate (FDR) control.*")
        
        return {
            "query": user_prompt,
            "variable": target_var,
            "response": "\n".join(reply_lines),
            "evidence_data": res
        }
        
    # Type B: Multi-variable relationship (e.g. "relationship between rainfall and vegetation", "temperature vs soil moisture")
    if any(k in prompt for k in ["relationship", "correlation", "versus", "vs", "affect"]):
        var1 = "rainfall" if "rain" in prompt else "temperature"
        var2 = "vegetation" if ("vegetation" in prompt or "ndvi" in prompt) else ("soil_moisture" if "soil" in prompt else "rainfall")
        if var1 == var2:
            var2 = "temperature"
            
        region_id = target_state["id"] if target_state else "IN-MH"
        corr = compute_bivariate_correlation(region_id, var1, var2)
        
        return {
            "query": user_prompt,
            "variable": f"{var1}_vs_{var2}",
            "response": f"### Multi-Variable Relationship: {VARIABLE_CONFIG[var1]['label']} vs {VARIABLE_CONFIG[var2]['label']}\n\n"
                        f"- **Region Evaluated:** {corr['region_name']}\n"
                        f"- **Pearson Correlation (r):** {corr['pearson']['r']:+.3f} (p = {corr['pearson']['p_value']:.4e})\n"
                        f"- **Spearman Rank Correlation (rho):** {corr['spearman']['rho']:+.3f} (p = {corr['spearman']['p_value']:.4e})\n"
                        f"- **Sample Size:** {corr['sample_size']} synchronized observations ({corr['common_period']['start']} to {corr['common_period']['end']})\n\n"
                        f"**Scientific Assessment:** {corr['interpretation']}\n\n"
                        f"> *Caveat:* {corr['scientific_disclaimer']}",
            "evidence_data": corr
        }
        
    # Type C: Specific State/District Trend Inquiry (e.g. "Is temperature increasing in Maharashtra?", "What is the trend in Rajasthan?")
    state = target_state or get_state_by_name_or_id("IN-MH")
    series = get_series_for_region(state["id"], target_var)
    trend = comprehensive_trend_analysis(series["dates"], series["values"], target_var)
    
    sig_str = "Statistically Significant" if trend["is_significant"] else "NOT Statistically Significant"
    
    reply = (
        f"### Trend Detective Report: {state['name']} — {VARIABLE_CONFIG[target_var]['label']}\n\n"
        f"- **NASA Dataset:** {trend.get('variable')} ({series['source']})\n"
        f"- **Trend Direction:** **{trend['trend_direction']}** ({sig_str})\n"
        f"- **Sen's Slope Rate of Change:** `{trend['annual_rate']:+.4f} {series['unit']}/year`\n"
        f"- **Mann-Kendall p-value:** `{trend['p_value']:.4e}` (Z-statistic: `{trend['mann_kendall']['z_stat']:.2f}`)\n"
        f"- **95% Confidence Interval:** `[{trend['confidence_interval_95']['lower']:+.4f}, {trend['confidence_interval_95']['upper']:+.4f}]`\n"
        f"- **Observations Analyzed:** `{trend['n_observations']} monthly points` ({trend['date_range']['start']} to {trend['date_range']['end']})\n"
        f"- **Climatological Anomalies Detected:** `{trend['anomalies_count']} unusual occurrences`\n\n"
        f"**Scientific Summary:** The historical time series indicates that {target_var} in {state['name']} is "
        f"{trend['trend_direction'].lower()} at a rate of {abs(trend['annual_rate']):.4f} {series['unit']} per year. "
        f"Because p {'< 0.05' if trend['p_value'] < 0.05 else '>= 0.05'}, this pattern {'meets' if trend['is_significant'] else 'does not meet'} "
        f"the standard threshold for statistical significance under the non-parametric Mann-Kendall test."
    )
    
    return {
        "query": user_prompt,
        "region": state["name"],
        "variable": target_var,
        "response": reply,
        "evidence_data": trend
    }
