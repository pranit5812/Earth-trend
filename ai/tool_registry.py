"""
AstroKites / AgriNova - Tool Registry
Defines the OpenAI-compatible tool specifications exposed to OpenRouter.
"""

from typing import List, Dict, Any

CLIMATE_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_weather_forecast",
            "description": "Retrieves real-time current weather and 7-day numerical forecast for any city or region worldwide. Use this when the user asks about tomorrow's weather, upcoming rainfall, or current conditions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or region name (e.g. 'Ahmedabad', 'Bengaluru', 'Mumbai', 'Paris')"
                    },
                    "ndays": {
                        "type": "integer",
                        "description": "Number of forecast days (1 to 14, default 7)",
                        "default": 7
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_climate_trend",
            "description": "Calculates rigorous statistical environmental trends on verified NASA Earth observations for an Indian city, state, or district. Executes Mann-Kendall test, Sen's slope rate per year, 95% confidence intervals, and Yue-Pilon autocorrelation prewhitening.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City, state, or district name (e.g. 'Ahmedabad', 'Maharashtra', 'Jaipur', 'Punjab')"
                    },
                    "variable": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "description": "NASA environmental variable to analyze (default: 'temperature')",
                        "default": "temperature"
                    },
                    "prewhiten": {
                        "type": "boolean",
                        "description": "Apply Yue-Pilon prewhitening to remove autocorrelation (default: true)",
                        "default": True
                    },
                    "start_year": {
                        "type": "integer",
                        "description": "Optional start year for analysis period (e.g. 1990, 2000)"
                    },
                    "end_year": {
                        "type": "integer",
                        "description": "Optional end year for analysis period (default: 2024)",
                        "default": 2024
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_regional_trends",
            "description": "Compares historical time-series observations and statistical trend rates across two or more locations using identical time horizons and non-parametric tests.",
            "parameters": {
                "type": "object",
                "properties": {
                    "locations": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of 2 or more cities or states to compare (e.g. ['Ahmedabad', 'Mumbai'])"
                    },
                    "variable": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "description": "Environmental variable to compare (default: 'temperature')",
                        "default": "temperature"
                    }
                },
                "required": ["locations"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_pan_india_opposite_trends",
            "description": "Scans across all 36 Indian States and Union Territories to detect geographic regions exhibiting opposing environmental trajectories (e.g., Northwest warming vs Northeast cooling, Deccan drying vs Gangetic wetting).",
            "parameters": {
                "type": "object",
                "properties": {
                    "variable": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "description": "Environmental variable to scan across India (default: 'temperature')",
                        "default": "temperature"
                    }
                },
                "required": ["variable"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_nasa_power_observations",
            "description": "Retrieves aligned empirical observations from NASA Earth Observation missions (NASA POWER, GPM IMERG, SMAP, MODIS) including mean, min, max, and recent observation points.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or state name"
                    },
                    "variable": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "default": "temperature"
                    },
                    "start_year": {"type": "integer"},
                    "end_year": {"type": "integer", "default": 2024}
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_bivariate_correlation",
            "description": "Calculates Pearson (r) and Spearman (rho) correlation between two environmental variables (e.g. rainfall and vegetation, temperature and soil moisture) to evaluate coupled Earth system interactions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or state name"
                    },
                    "variable_1": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "default": "rainfall"
                    },
                    "variable_2": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "default": "vegetation"
                    }
                },
                "required": ["location", "variable_1", "variable_2"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_soil_moisture_and_vegetation",
            "description": "Retrieves real NASA SMAP L4 root-zone soil moisture and NASA MODIS NDVI vegetation canopy status to assess agricultural water stress and vegetation canopy greenness.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or state name"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_date_climate_risk",
            "description": "Calculates historical probability of heatwaves, cold waves, or heavy rain around a target date based on multi-decadal historical NASA observations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "target_date": {
                        "type": "string",
                        "description": "Target date in YYYY-MM-DD format"
                    },
                    "ndays": {
                        "type": "integer",
                        "description": "Window in days (default: 30)",
                        "default": 30
                    }
                },
                "required": ["location", "target_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "geocode_location",
            "description": "Resolves a location name into latitude, longitude, and Indian administrative state ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location_name": {
                        "type": "string",
                        "description": "Name of the city, state, or district"
                    }
                },
                "required": ["location_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_dataset_provenance",
            "description": "Returns official NASA mission metadata, satellite instruments, resolution, and validation standards.",
            "parameters": {
                "type": "object",
                "properties": {
                    "variable": {
                        "type": "string",
                        "enum": ["temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"],
                        "description": "Optional variable name"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_best_travel_time",
            "description": "Evaluates historical NASA climate observations to recommend the best months and comfort score (0-100) for any Indian tourist destination (e.g. Goa, Manali, Kerala, Jaipur, Ooty, Darjeeling). Strictly India only.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Indian tourist destination, city, or state (e.g. 'Goa', 'Manali', 'Kerala', 'Jaipur', 'Shimla')"
                    },
                    "travel_type": {
                        "type": "string",
                        "enum": ["beach", "mountain", "adventure", "trekking", "wildlife", "city", "sightseeing", "religious", "cultural", "desert", "general"],
                        "description": "Type of travel activity to calibrate climate suitability weights",
                        "default": "general"
                    }
                },
                "required": ["destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_travel_dates",
            "description": "Intelligent travel date finder for Indian destinations. Identifies optimal continuous trip windows matching duration or analyzes fixed dates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Indian destination name"
                    },
                    "travel_type": {
                        "type": "string",
                        "description": "Travel activity type (e.g. 'beach', 'mountain', 'trekking', 'cultural')"
                    },
                    "duration_days": {
                        "type": "integer",
                        "description": "Trip duration in days (default: 7)"
                    }
                },
                "required": ["destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_travel_destinations",
            "description": "Compares 2 or 3 Indian destinations side-by-side (e.g. 'Goa' vs 'Kerala', 'Manali' vs 'Shimla') using standardized NASA POWER climate records.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destinations": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of 2 or 3 Indian destinations to compare (e.g. ['Goa', 'Kerala'])"
                    },
                    "travel_type": {
                        "type": "string",
                        "description": "Travel activity type"
                    }
                },
                "required": ["destinations"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_travel_risk_assessment",
            "description": "Identifies meteorological travel risks for an Indian destination (monsoon heavy rainfall, summer heatwaves, cyclones, high humidity).",
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Indian destination name"
                    }
                },
                "required": ["destination"]
            }
        }
    }
]


def get_registered_tools() -> List[Dict[str, Any]]:
    """Returns the tool definitions to pass to OpenRouter."""
    return CLIMATE_TOOLS_DEFINITIONS
