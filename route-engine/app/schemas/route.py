from pydantic import BaseModel


class LatLng(BaseModel):
    latitude: float
    longitude: float


class DirectionsRequest(BaseModel):
    origin: LatLng
    destination: LatLng
    travel_modes: list[str] | None = None


class RouteOption(BaseModel):
    travel_mode: str
    distance_meters: int
    duration_seconds: int
    summary: str
    polyline: str


class DirectionsResponse(BaseModel):
    options: list[RouteOption]
