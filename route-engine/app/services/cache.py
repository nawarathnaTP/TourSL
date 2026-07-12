from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cached_route import CachedRoute
from app.schemas.route import RouteOption

CACHE_TTL = {
    "DRIVE": timedelta(days=7),
    "TRANSIT": timedelta(hours=24),
    "WALK": timedelta(days=30),
    "BICYCLE": timedelta(days=14),
    "TWO_WHEELER": timedelta(days=7),
}

DEFAULT_TTL = timedelta(days=7)


def _round_coord(val: float) -> float:
    return round(val, 3)


async def get_cached_routes(
    db: AsyncSession,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    travel_modes: list[str],
) -> list[RouteOption] | None:
    now = datetime.now(timezone.utc)
    o_lat = _round_coord(origin_lat)
    o_lng = _round_coord(origin_lng)
    d_lat = _round_coord(dest_lat)
    d_lng = _round_coord(dest_lng)

    stmt = select(CachedRoute).where(
        CachedRoute.origin_lat == o_lat,
        CachedRoute.origin_lng == o_lng,
        CachedRoute.dest_lat == d_lat,
        CachedRoute.dest_lng == d_lng,
        CachedRoute.travel_mode.in_(travel_modes),
        CachedRoute.expires_at > now,
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    if not rows:
        return None

    # Only return cache hit if we have results for all requested modes
    cached_modes = {r.travel_mode for r in rows}
    if not set(travel_modes).issubset(cached_modes):
        return None

    return [
        RouteOption(
            travel_mode=r.travel_mode,
            distance_meters=r.distance_meters or 0,
            duration_seconds=r.duration_seconds or 0,
            summary=r.summary or "",
            polyline=r.polyline or "",
        )
        for r in rows
    ]


async def cache_routes(
    db: AsyncSession,
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    options: list[RouteOption],
) -> None:
    o_lat = _round_coord(origin_lat)
    o_lng = _round_coord(origin_lng)
    d_lat = _round_coord(dest_lat)
    d_lng = _round_coord(dest_lng)

    for option in options:
        ttl = CACHE_TTL.get(option.travel_mode, DEFAULT_TTL)
        db.add(CachedRoute(
            origin_lat=o_lat,
            origin_lng=o_lng,
            dest_lat=d_lat,
            dest_lng=d_lng,
            travel_mode=option.travel_mode,
            distance_meters=option.distance_meters,
            duration_seconds=option.duration_seconds,
            summary=option.summary,
            polyline=option.polyline,
            expires_at=datetime.now(timezone.utc) + ttl,
        ))

    await db.commit()
