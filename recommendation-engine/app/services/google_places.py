import httpx

from app.core.config import settings
from app.schemas.place import Place, Location

# Places API (New) base URL
BASE_URL = "https://places.googleapis.com/v1/places"

# Only request the fields we actually use — keeps Google billing tier lower
# and response payloads small. Add fields here as your frontend needs more.
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.types",
    "places.photos",
])


def _photo_url(photo_name: str, max_width: int = 800) -> str:
    """
    Build a URL that serves the actual photo image via Google's Place Photo endpoint.
    photo_name looks like: places/{place_id}/photos/{photo_reference}
    """
    return (
        f"https://places.googleapis.com/v1/{photo_name}/media"
        f"?maxWidthPx={max_width}&key={settings.GOOGLE_PLACES_API_KEY}"
    )


def _to_place(raw: dict) -> Place:
    photos = raw.get("photos") or []
    photo_url = _photo_url(photos[0]["name"]) if photos else None

    loc = raw.get("location")
    location = Location(latitude=loc["latitude"], longitude=loc["longitude"]) if loc else None

    return Place(
        id=raw.get("id", ""),
        name=raw.get("displayName", {}).get("text", "Unknown"),
        address=raw.get("formattedAddress"),
        location=location,
        rating=raw.get("rating"),
        user_rating_count=raw.get("userRatingCount"),
        types=raw.get("types", []),
        photo_url=photo_url,
    )


class GooglePlacesService:
    def __init__(self):
        self._headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }

    async def search_text(self, query: str, max_results: int = 20) -> list[Place]:
        """
        Free-text search, e.g. "tourist attractions in Colombo".
        """
        payload = {
            "textQuery": query,
            "maxResultCount": max_results,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BASE_URL}:searchText",
                json=payload,
                headers=self._headers,
            )
            resp.raise_for_status()
            data = resp.json()

        return [_to_place(p) for p in data.get("places", [])]

    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_meters: float = 5000,
        included_types: list[str] | None = None,
        max_results: int = 20,
    ) -> list[Place]:
        """
        Search around a lat/lng point. Good for "tourist spots near me".
        included_types e.g. ["tourist_attraction", "museum", "park"]
        """
        payload = {
            "maxResultCount": max_results,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": latitude, "longitude": longitude},
                    "radius": radius_meters,
                }
            },
        }
        if included_types:
            payload["includedTypes"] = included_types

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BASE_URL}:searchNearby",
                json=payload,
                headers=self._headers,
            )
            resp.raise_for_status()
            data = resp.json()

        return [_to_place(p) for p in data.get("places", [])]


google_places_service = GooglePlacesService()
