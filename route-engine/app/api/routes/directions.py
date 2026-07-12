import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.route import DirectionsRequest, DirectionsResponse
from app.services.google_routes import google_routes_service, DEFAULT_TRAVEL_MODES
from app.services.cache import get_cached_routes, cache_routes

router = APIRouter(prefix="/route-engine", tags=["directions"])


@router.post("/directions", response_model=DirectionsResponse)
async def find_routes(
    request: DirectionsRequest,
    db: AsyncSession = Depends(get_db),
):
    travel_modes = request.travel_modes or DEFAULT_TRAVEL_MODES

    cached = await get_cached_routes(
        db,
        request.origin.latitude,
        request.origin.longitude,
        request.destination.latitude,
        request.destination.longitude,
        travel_modes,
    )
    if cached is not None:
        return DirectionsResponse(options=cached)

    try:
        options = await google_routes_service.compute_routes(
            origin_lat=request.origin.latitude,
            origin_lng=request.origin.longitude,
            dest_lat=request.destination.latitude,
            dest_lng=request.destination.longitude,
            travel_modes=travel_modes,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)

    if options:
        await cache_routes(
            db,
            request.origin.latitude,
            request.origin.longitude,
            request.destination.latitude,
            request.destination.longitude,
            options,
        )

    return DirectionsResponse(options=options)
