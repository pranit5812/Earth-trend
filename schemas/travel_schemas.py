"""
AstroKites Smart Travel Planner - Pydantic Request & Response Schemas
Provides strict validation for Indian travel requests, destinations, comfort scoring, and comparisons.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator


class TravelClimateRequest(BaseModel):
    destination: str = Field(..., description="Indian city, state, or tourist destination name", min_length=2)
    start_year: Optional[int] = Field(2015, description="Historical analysis start year (1984 to 2024)")
    end_year: Optional[int] = Field(2024, description="Historical analysis end year (1984 to 2024)")
    latitude: Optional[float] = Field(None, description="Optional custom latitude in India")
    longitude: Optional[float] = Field(None, description="Optional custom longitude in India")


class BestTimeRequest(BaseModel):
    destination: str = Field(..., description="Indian destination (e.g. Goa, Manali, Ooty, Jaipur)")
    travel_type: Optional[str] = Field("general", description="beach, mountain, adventure, trekking, wildlife, city, sightseeing, religious, cultural, desert, general")
    start_year: Optional[int] = Field(2015, description="Historical start year")
    end_year: Optional[int] = Field(2024, description="Historical end year")


class BestDatesRequest(BaseModel):
    destination: str = Field(..., description="Indian destination name")
    travel_type: Optional[str] = Field("general", description="Travel activity type")
    duration_days: Optional[int] = Field(7, ge=1, le=30, description="Trip duration in days (1 to 30)")
    is_flexible: Optional[bool] = Field(True, description="Whether travel dates are flexible or fixed")
    start_date: Optional[str] = Field(None, description="YYYY-MM-DD for fixed travel dates")
    end_date: Optional[str] = Field(None, description="YYYY-MM-DD for fixed travel dates")
    start_year: Optional[int] = Field(2015)
    end_year: Optional[int] = Field(2024)


class DestinationComparisonRequest(BaseModel):
    destinations: List[str] = Field(..., min_length=2, max_length=3, description="2 or 3 Indian destinations to compare (e.g. ['Goa', 'Kerala'])")
    travel_type: Optional[str] = Field("general", description="Travel activity type")
    start_year: Optional[int] = Field(2015)
    end_year: Optional[int] = Field(2024)


class TravelRiskRequest(BaseModel):
    destination: str = Field(..., description="Indian destination name")
    start_year: Optional[int] = Field(2015)
    end_year: Optional[int] = Field(2024)


class DestinationItem(BaseModel):
    id: str
    name: str
    state_name: str
    district: str
    lat: float
    lon: float
    climate_zone: str
    primary_types: List[str]
    description: str
