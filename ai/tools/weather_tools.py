"""
AstroKites / AgriNova - Weather and Forecast Tools
Connects to real weather forecasting APIs (OpenWeather / Open-Meteo live forecasts)
and AstroKites historical climate risk/probability models.
"""

import os
import datetime
import urllib.request
import urllib.parse
import json
import logging
from typing import Dict, Any, Optional
from ai.tools.geography_tools import geocode_location

logger = logging.getLogger("astroke.ai.tools.weather")


def get_weather_forecast(
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    ndays: int = 7
) -> Dict[str, Any]:
    """
    Retrieves live real-time weather and 7-day forecast for any location worldwide.
    Provides daily maximum/minimum temperatures, precipitation sums, rain probability,
    and weather condition summaries.
    """
    lat = latitude
    lon = longitude
    loc_name = location

    # Geocode if coordinates are missing
    if lat is None or lon is None:
        geo = geocode_location(location)
        if geo.get("status") != "success":
            return {
                "status": "error",
                "message": f"Could not determine geographical coordinates for '{location}' to retrieve weather forecast."
            }
        lat = geo["latitude"]
        lon = geo["longitude"]
        loc_name = geo["name"]

    ndays = min(max(int(ndays), 1), 14)

    # 1. Try OpenWeather API if configured
    owm_key = os.environ.get("OPENWEATHER_API_KEY", "").strip()
    if owm_key and not owm_key.startswith("your_"):
        try:
            url = f"https://api.openweathermap.org/data/2.5/forecast/daily?lat={lat}&lon={lon}&cnt={ndays}&units=metric&appid={owm_key}"
            req = urllib.request.Request(url, headers={"User-Agent": "AstroKites/1.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                daily_list = []
                for item in data.get("list", []):
                    dt_str = datetime.date.fromtimestamp(item["dt"]).isoformat()
                    weather_desc = item.get("weather", [{}])[0].get("description", "Clear").title()
                    daily_list.append({
                        "date": dt_str,
                        "temp_max_c": round(item["temp"]["max"], 1),
                        "temp_min_c": round(item["temp"]["min"], 1),
                        "temp_day_c": round(item["temp"]["day"], 1),
                        "rain_mm": round(item.get("rain", 0.0), 1),
                        "rain_probability_pct": int(item.get("pop", 0) * 100),
                        "condition": weather_desc,
                        "humidity_pct": item.get("humidity", 0)
                    })
                return {
                    "status": "success",
                    "location": loc_name,
                    "latitude": lat,
                    "longitude": lon,
                    "provider": "OpenWeather Daily Forecast API",
                    "retrieved_at": datetime.datetime.now().isoformat(),
                    "forecast_days": len(daily_list),
                    "days": daily_list,
                    "tomorrow_forecast": daily_list[1] if len(daily_list) > 1 else daily_list[0]
                }
        except Exception as e:
            logger.warning("OpenWeather fetch failed for (%s, %s): %s. Falling back to Open-Meteo.", lat, lon, e)

    # 2. Free live meteorological forecast via Open-Meteo
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&daily="
            f"temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
            f"&timezone=auto&forecast_days={ndays}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AstroKites-Climate-Assistant/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            daily_raw = data.get("daily", {})
            times = daily_raw.get("time", [])
            t_max = daily_raw.get("temperature_2m_max", [])
            t_min = daily_raw.get("temperature_2m_min", [])
            p_sum = daily_raw.get("precipitation_sum", [])
            p_prob = daily_raw.get("precipitation_probability_max", [])
            w_max = daily_raw.get("wind_speed_10m_max", [])

            daily_list = []
            for i in range(len(times)):
                rain_prob = p_prob[i] if i < len(p_prob) and p_prob[i] is not None else 0
                rain_mm = p_sum[i] if i < len(p_sum) and p_sum[i] is not None else 0.0
                cond = "Rain / Showers" if rain_prob >= 50 or rain_mm >= 2.0 else "Partly Cloudy / Clear"

                daily_list.append({
                    "date": times[i],
                    "temp_max_c": round(t_max[i], 1) if i < len(t_max) and t_max[i] is not None else None,
                    "temp_min_c": round(t_min[i], 1) if i < len(t_min) and t_min[i] is not None else None,
                    "rain_mm": round(rain_mm, 1),
                    "rain_probability_pct": int(rain_prob),
                    "wind_speed_max_kmh": round(w_max[i], 1) if i < len(w_max) and w_max[i] is not None else None,
                    "condition": cond
                })

            tomorrow = daily_list[1] if len(daily_list) > 1 else (daily_list[0] if daily_list else None)

            return {
                "status": "success",
                "location": loc_name,
                "latitude": lat,
                "longitude": lon,
                "provider": "Open-Meteo Global Numerical Weather Prediction (WMO ECMWF/GFS assimilated)",
                "retrieved_at": datetime.datetime.now().isoformat(),
                "forecast_days": len(daily_list),
                "days": daily_list,
                "tomorrow_forecast": tomorrow
            }
    except Exception as e:
        logger.error("Open-Meteo weather fetch failed: %s", str(e))
        return {
            "status": "error",
            "message": f"Live weather forecast service is currently unreachable for {loc_name}: {str(e)}"
        }


def check_date_climate_risk(
    location: str,
    target_date: str,
    ndays: int = 30
) -> Dict[str, Any]:
    """
    Evaluates historical climate probabilities of extreme heat (>35°C), cold (<5°C),
    and heavy precipitation (>=5mm/day) around a target date based on multi-decadal observations.
    """
    geo = geocode_location(location)
    if geo.get("status") != "success":
        return {
            "status": "error",
            "message": f"Could not resolve coordinates for '{location}' to evaluate climate risk."
        }

    try:
        from Backend import check_date, CheckDateRequest
        req = CheckDateRequest(
            lat=geo["latitude"],
            lon=geo["longitude"],
            date=target_date,
            ndays=ndays,
            window=7
        )
        res = check_date(req)
        return {
            "status": "success",
            "location": geo["name"],
            "coordinates": {"lat": geo["latitude"], "lon": geo["longitude"]},
            "target_date": target_date,
            "analysis_window_days": ndays,
            "climate_risk_details": res.get("details", {}),
            "source": "NASA POWER 30-Year Historical Daily Reanalysis"
        }
    except Exception as e:
        logger.error("check_date_climate_risk failed: %s", str(e))
        return {
            "status": "error",
            "message": f"Failed to calculate historical climate probabilities for {location}: {str(e)}"
        }
