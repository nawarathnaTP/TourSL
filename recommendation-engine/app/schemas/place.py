from pydantic import BaseModel


class Location(BaseModel):
    latitude: float
    longitude: float


class Place(BaseModel):
    """
    Simplified place shape we hand to the frontend.
    Keeps the API response lean instead of forwarding Google's full payload.
    """
    id: str
    name: str
    address: str | None = None
    location: Location | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    types: list[str] = []
    photo_url: str | None = None


class PlaceSearchResponse(BaseModel):
    results: list[Place]
    count: int
