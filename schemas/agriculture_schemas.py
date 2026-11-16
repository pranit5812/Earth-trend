"""
AstroKites Smart Agriculture Pydantic Schemas
Defines request and response schemas for all agricultural endpoints.
Supports both modern and legacy/nested payload formats gracefully.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CropAdvisorRequest(BaseModel):
    state: str = Field(..., description="Indian State (e.g., 'Madhya Pradesh', 'Maharashtra', 'Punjab')")
    district: Optional[str] = Field(None, description="District name (e.g., 'Jabalpur', 'Nashik', 'Amritsar')")
    city: Optional[str] = Field(None, description="City or village name")
    latitude: Optional[float] = Field(None, description="Latitude in decimal degrees")
    longitude: Optional[float] = Field(None, description="Longitude in decimal degrees")
    soil_type: Optional[str] = Field("Loamy soil", description="Soil type: Red, Black, Sandy, Clay, Loamy, Alluvial, Laterite, Unknown")
    season: Optional[str] = Field(None, description="Farming season: Kharif, Rabi, Zaid, or auto-detect")
    irrigation: Optional[str] = Field("Good irrigation", description="Irrigation level: Rainfed, Limited irrigation, Good irrigation")
    land_area_acres: Optional[float] = Field(None, description="Available farm land in acres")
    preferred_category: Optional[str] = Field(None, description="Preferred crop category: Cereals, Pulses, Oilseeds, Vegetables, Fruits, Cash crops")
    start_date: Optional[str] = Field(None, description="Optional custom start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Optional custom end date (YYYY-MM-DD)")


class RainfallAnalysisRequest(BaseModel):
    latitude: Optional[float] = Field(20.0, description="Latitude")
    longitude: Optional[float] = Field(74.78, description="Longitude")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    granularity: Optional[str] = Field("auto", description="Granularity: daily, monthly, yearly, auto")
    district: Optional[str] = None
    state: Optional[str] = None
    location: Optional[Any] = None
    date_range: Optional[Any] = None


class SoilAnalysisRequest(BaseModel):
    soil_type: str = Field(..., description="Basic soil type name")
    ph: Optional[float] = Field(None, description="Optional soil pH")
    organic_carbon_pct: Optional[float] = Field(None, description="Optional organic carbon percentage")
    npk_status: Optional[str] = Field(None, description="Optional NPK status")
    location: Optional[Any] = None


class CropPredictionRequest(BaseModel):
    crop_name: str = Field(..., description="Name of crop to predict")
    state: str = Field(..., description="State")
    district: Optional[str] = Field(None, description="District")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    target_year: Optional[int] = Field(2027, description="Target future year")
    target_season: Optional[str] = Field("Kharif", description="Target future season")
    soil_type: Optional[str] = None
    irrigation: Optional[str] = None
    location: Optional[Any] = None
    target_crop: Optional[str] = None
    expected_start_date: Optional[str] = None
    expected_end_date: Optional[str] = None


class CropRiskRequest(BaseModel):
    crop_name: str = Field(..., description="Crop name")
    state: Optional[str] = Field(None, description="State")
    district: Optional[str] = Field(None, description="District")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = "Loamy soil"
    irrigation: Optional[str] = "Good irrigation"
    date_range: Optional[Any] = None
    location: Optional[Any] = None


class CropCalendarRequest(BaseModel):
    crop_name: str = Field(..., description="Crop name")
    sowing_month: Optional[int] = Field(None, description="Sowing month 1-12")
    sowing_date: Optional[str] = Field(None, description="Sowing date YYYY-MM-DD")
    state: Optional[str] = None
    season: Optional[str] = None


class CompareCropsRequest(BaseModel):
    crop_names: List[str] = Field(..., min_length=2, max_length=5, description="List of 2 to 5 crop names to compare")
    state: Optional[str] = None
    district: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation: Optional[str] = None
    season: Optional[str] = None
    location: Optional[Any] = None
    date_range: Optional[Any] = None


class AgriculturalInsightsRequest(BaseModel):
    state: str = Field(..., description="State")
    district: Optional[str] = Field(None, description="District")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = "Loamy soil"
    location: Optional[Any] = None
    date_range: Optional[Any] = None
