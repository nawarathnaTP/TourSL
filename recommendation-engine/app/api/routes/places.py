import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.place import PlaceSearchResponse
from app.services.google_places import google_places_service
from app.services.cache import get_cached_results, cache_results, _hash_params

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/search", response_model=PlaceSearchResponse)
async def search_places(
    query: str = Query(..., description="Free text search, e.g. 'temples in Kandy'"),
    max_results: int = Query(20, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    query_hash = _hash_params(type="text", query=query, max_results=max_results)

    cached = await get_cached_results(db, query_hash)
    if cached is not None:
        return PlaceSearchResponse(results=cached, count=len(cached))

    try:
        results = await google_places_service.search_text(query, max_results)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)

    await cache_results(
        db, query_hash, results,
        search_type="text",
        query_text=query,
        max_results=max_results,
    )

    return PlaceSearchResponse(results=results, count=len(results))


@router.get("/nearby", response_model=PlaceSearchResponse)
async def nearby_places(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(5000, ge=1, le=50000, description="Radius in meters"),
    types: str | None = Query(
        None,
        description="Comma-separated place types, e.g. 'tourist_attraction,museum,park'",
    ),
    max_results: int = Query(20, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    included_types = [t.strip() for t in types.split(",")] if types else ["tourist_attraction"]

    query_hash = _hash_params(
        type="nearby", lat=lat, lng=lng, radius=radius,
        types=included_types, max_results=max_results,
    )

    cached = await get_cached_results(db, query_hash)
    if cached is not None:
        return PlaceSearchResponse(results=cached, count=len(cached))

    try:
        results = await google_places_service.search_nearby(
            latitude=lat,
            longitude=lng,
            radius_meters=radius,
            included_types=included_types,
            max_results=max_results,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)

    await cache_results(
        db, query_hash, results,
        search_type="nearby",
        latitude=lat,
        longitude=lng,
        radius_meters=radius,
        max_results=max_results,
    )

    return PlaceSearchResponse(results=results, count=len(results))
