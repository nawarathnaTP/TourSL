import httpx

from app.core.config import settings
from app.schemas.route import RouteOption

BASE_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

FIELD_MASK = ",".join([
    "routes.distanceMeters",
    "routes.duration",
    "routes.polyline.encodedPolyline",
    "routes.description",
])

DEFAULT_TRAVEL_MODES = ["DRIVE", "TRANSIT", "WALK"]


class GoogleRoutesService:
    def __init__(self):
        self._headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_ROUTES_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }

    async def compute_routes(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        travel_modes: list[str] | None = None,
    ) -> list[RouteOption]:
        modes = travel_modes or DEFAULT_TRAVEL_MODES
        results: list[RouteOption] = []

        async with httpx.AsyncClient(timeout=10) as client:
            for mode in modes:
                payload = {
                    "origin": {
                        "location": {
                            "latLng": {"latitude": origin_lat, "longitude": origin_lng}
                        }
                    },
                    "destination": {
                        "location": {
                            "latLng": {"latitude": dest_lat, "longitude": dest_lng}
                        }
                    },
                    "travelMode": mode,
                    "computeAlternativeRoutes": True,
                }

                resp = await client.post(
                    BASE_URL, json=payload, headers=self._headers,
                )

                if resp.status_code != 200:
                    continue

                data = resp.json()
                for route in data.get("routes", []):
                    duration_str = route.get("duration", "0s")
                    duration_seconds = int(duration_str.rstrip("s"))

                    results.append(RouteOption(
                        travel_mode=mode,
                        distance_meters=route.get("distanceMeters", 0),
                        duration_seconds=duration_seconds,
                        summary=route.get("description", f"{mode} route"),
                        polyline=route.get("polyline", {}).get("encodedPolyline", ""),
                    ))

        return results


google_routes_service = GoogleRoutesService()
