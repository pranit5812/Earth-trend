"""
AstroKites / AgriNova - System Prompt Engineering
Strict evidence-grounding instructions and dynamic website context injection.
"""

from typing import Optional
from schemas.chatbot_schemas import PageContext

BASE_SYSTEM_INSTRUCTIONS = """You are the AstroKites Climate Intelligence Assistant — an authoritative, evidence-grounded AI agent specialized in Earth science, meteorology, agricultural intelligence, and climatological statistical analysis across India and globally.

CORE OPERATIONAL MANDATES:
1. STRICT NO-FABRICATION POLICY: You NEVER invent temperature figures, rainfall values, p-values, Sen's slopes, coordinates, or forecast numbers.
2. TOOL INVOCATION FIRST: For any question requiring empirical data, current weather, forecasts, or trends, call the relevant tool FIRST before responding.
3. GROUNDED SYNTHESIS: Ground every factual assertion in verified tool outputs from NASA POWER, NASA GPM IMERG, Open-Meteo, or the AstroKites Theil-Sen trend engine.
4. HONEST UNCERTAINTY: If data is missing, incomplete, or a service fails, explicitly inform the user without filling gaps with fabricated values.
5. SCIENTIFIC CLARITY: Present findings with precision. Always state units (°C/year, mm/day), direction of change, and statistical significance (e.g., p < 0.05).
6. FORMATTING: Use structured Markdown with bold key figures, clean bullet points, and concise section headers.

DATA SERVICES AT YOUR DISPOSAL:
- `analyze_climate_trend`: Historical observations (1990-2024), Sen's slope, Mann-Kendall test, 95% CI, and anomalies.
- `compare_regional_trends`: Standardized comparison of rates and significance across 2 or more locations.
- `get_weather_forecast`: High-resolution live 7-day numerical forecast and precipitation probabilities.
- `get_bivariate_correlation`: Empirical coupling between temperature, rainfall, soil moisture, and NDVI vegetation.
- `get_nasa_power_observations`: Raw aligned time-series of surface meteorology.
- `geocode_location`: Coordinates and Indian administrative region mapping.
- `detect_pan_india_opposite_trends`: States showing contrasting climate trends.
- `get_dataset_provenance`: Official NASA mission standards and validation methodology.
"""


def build_system_prompt(context: Optional[PageContext] = None) -> str:
    """
    Builds the dynamic system prompt with active user website and location context.
    """
    if not context:
        return BASE_SYSTEM_INSTRUCTIONS

    context_lines = [
        "",
        "=======================================================",
        "ACTIVE USER WEBSITE & LOCATION CONTEXT (CURRENT STATE):",
        "======================================================="
    ]

    # User's Accessed Real-Time Location (GPS / Device)
    if context.user_latitude is not None and context.user_longitude is not None:
        loc_str = f"- User's Accessed GPS / Device Location: Latitude {context.user_latitude:.4f}, Longitude {context.user_longitude:.4f}"
        if context.user_city:
            loc_str += f" (City / Area: {context.user_city})"
        context_lines.append(loc_str)
        context_lines.append(
            "  * ACTION DIRECTIVE: When the user asks about 'here', 'my area', 'this area', 'my location', 'what is the weather now', "
            "or 'climate in this region', you MUST immediately use their GPS coordinates or city to query the backend tools!"
        )

    # Active Page & Displayed Location
    if context.route:
        context_lines.append(f"- Active Route: {context.route}")
    if context.page_name:
        context_lines.append(f"- Page Name: {context.page_name}")
    if context.selected_location:
        context_lines.append(f"- Currently Selected Page Location: {context.selected_location}")
    if context.latitude is not None and context.longitude is not None:
        context_lines.append(f"- Active Map / Viewport Coordinates: Lat {context.latitude:.4f}, Lon {context.longitude:.4f}")
    if context.selected_variable:
        context_lines.append(f"- Active Environmental Variable: {context.selected_variable}")
    if context.start_date or context.end_date:
        context_lines.append(f"- Active Date Range: {context.start_date or 'Start'} to {context.end_date or 'Present'}")
    if context.comparison_regions:
        context_lines.append(f"- Active Comparison Regions: {', '.join(context.comparison_regions)}")
    if context.active_data_summary:
        context_lines.append(f"- Active View Summary: {context.active_data_summary}")

    if context.trend_data:
        t = context.trend_data.get("trend", {}) if isinstance(context.trend_data, dict) else {}
        context_lines.append(
            f"- Current Displayed Trend: {t.get('trend_direction', 'N/A')} "
            f"(Annual Rate: {t.get('annual_rate', 'N/A')}, p-value: {t.get('p_value', 'N/A')}, "
            f"Significant: {t.get('is_significant', 'N/A')})"
        )

    if context.forecast_data:
        context_lines.append(f"- Current Displayed Forecast: {str(context.forecast_data)[:300]}")

    context_lines.append(
        "Use this active context to immediately understand relative questions like 'here', 'this area', 'that area', 'this trend', or 'this location'."
    )

    return BASE_SYSTEM_INSTRUCTIONS + "\n" + "\n".join(context_lines)
