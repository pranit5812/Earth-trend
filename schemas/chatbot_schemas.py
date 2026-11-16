"""
AstroKites / AgriNova - Chatbot Schemas
Pydantic models for conversational AI requests, page contexts, and structured responses.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class PageContext(BaseModel):
    """Real-time website state supplied by the React frontend."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    route: Optional[str] = Field(None, description="Current browser route e.g. /trends, /forecast")
    page_name: Optional[str] = Field(None, description="Active view e.g. Trend Detective, Forecast, Maps")
    
    # Selected location on active page
    selected_location: Optional[str] = Field(None, alias="selected_city", description="Active selected city or region name")
    latitude: Optional[float] = Field(None, alias="selected_latitude", description="Active latitude coordinate")
    longitude: Optional[float] = Field(None, alias="selected_longitude", description="Active longitude coordinate")
    
    # Real-time User GPS / Device location (accessed on demand)
    user_latitude: Optional[float] = Field(None, description="User device latitude from browser geolocation")
    user_longitude: Optional[float] = Field(None, description="User device longitude from browser geolocation")
    user_city: Optional[str] = Field(None, description="User city or detected area name")

    selected_variable: Optional[str] = Field(None, description="Active variable e.g. temperature, rainfall")
    start_date: Optional[str] = Field(None, alias="selected_start_date", description="Selected start date/year")
    end_date: Optional[str] = Field(None, alias="selected_end_date", description="Selected end date/year")
    temporal_resolution: Optional[str] = Field(None, alias="selected_temporal_resolution", description="Daily, monthly, or climatology")
    
    trend_data: Optional[Dict[str, Any]] = Field(None, alias="current_trend_results", description="Current active trend results on page")
    forecast_data: Optional[Dict[str, Any]] = Field(None, alias="current_forecast_results", description="Current active forecast on page")
    comparison_regions: Optional[List[str]] = Field(None, alias="selected_comparison_regions", description="Selected comparison region IDs")
    active_data_summary: Optional[str] = Field(None, description="Brief summary of what the user is currently viewing")
    additional_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary extra metadata")


class ChatMessage(BaseModel):
    role: str = Field(..., description="user, assistant, system, or tool")
    content: Optional[str] = Field("", description="Message text")
    name: Optional[str] = Field(None, description="Tool name if role is tool")
    tool_call_id: Optional[str] = Field(None, description="OpenRouter tool call ID")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None, description="Model tool calls")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query or instruction", min_length=1)
    context: Optional[PageContext] = Field(default_factory=PageContext, description="Client page context")
    conversation_id: Optional[str] = Field(None, description="UUID session ID. Generated if omitted")
    stream: Optional[bool] = Field(False, description="Whether to stream response tokens via SSE")


class ChatResponse(BaseModel):
    status: str = Field("success", description="success or error")
    conversation_id: str
    message: str = Field(..., description="Natural language grounded answer")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="Verified NASA and API citations")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Statistical cards (p-value, Sen's slope, etc.)")
    evidence_data: Optional[Dict[str, Any]] = Field(None, description="Raw validated tool payload for charts/tables")
    visualization_type: Optional[str] = Field(None, description="trend_chart, comparison_table, metrics_card, forecast_summary")
    tool_calls_executed: List[str] = Field(default_factory=list, description="List of actual backend tools invoked")
    error: Optional[str] = None


class ChatFeedbackRequest(BaseModel):
    conversation_id: str
    message_id: Optional[str] = None
    rating: int = Field(..., description="1 for positive, -1 for negative")
    comment: Optional[str] = None
