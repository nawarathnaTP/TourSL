import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import Location as LocationModel
from app.models.search_query import SearchQuery
from app.models.query_location import QueryLocation
from app.schemas.place import Place, Location

CACHE_TTL_HOURS = 24


def _hash_params(**params) -> str:
    raw = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def _model_to_place(loc: LocationModel) -> Place:
    return Place(
        id=loc.google_place_id,
        name=loc.name,
        address=loc.address,
        location=Location(latitude=loc.latitude, longitude=loc.longitude),
        rating=loc.rating,
        user_rating_count=loc.user_rating_count,
        types=loc.types or [],
        photo_url=loc.photo_url,
    )


def _place_to_model(place: Place) -> LocationModel:
    return LocationModel(
        google_place_id=place.id,
        name=place.name,
        address=place.address,
        latitude=place.location.latitude if place.location else 0.0,
        longitude=place.location.longitude if place.location else 0.0,
        rating=place.rating,
        user_rating_count=place.user_rating_count,
        photo_url=place.photo_url,
        types=place.types or None,
    )


async def get_cached_results(db: AsyncSession, query_hash: str) -> list[Place] | None:
    now = datetime.now(timezone.utc)
    stmt = select(SearchQuery).where(
        SearchQuery.query_hash == query_hash,
        SearchQuery.expires_at > now,
    )
    result = await db.execute(stmt)
    search_query = result.scalar_one_or_none()
    if not search_query:
        return None

    stmt = (
        select(LocationModel)
        .join(QueryLocation)
        .where(QueryLocation.query_id == search_query.id)
        .order_by(QueryLocation.rank)
    )
    result = await db.execute(stmt)
    locations = result.scalars().all()
    return [_model_to_place(loc) for loc in locations]


async def cache_results(
    db: AsyncSession,
    query_hash: str,
    places: list[Place],
    search_type: str,
    query_text: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_meters: float | None = None,
    max_results: int = 20,
) -> None:
    search_query = SearchQuery(
        query_hash=query_hash,
        query_text=query_text,
        search_type=search_type,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        max_results=max_results,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=CACHE_TTL_HOURS),
    )
    db.add(search_query)

    for rank, place in enumerate(places, start=1):
        # Upsert location: reuse existing or create new
        stmt = select(LocationModel).where(
            LocationModel.google_place_id == place.id
        )
        result = await db.execute(stmt)
        location = result.scalar_one_or_none()

        if location:
            # Update with latest data from Google
            location.name = place.name
            location.address = place.address
            location.latitude = place.location.latitude if place.location else location.latitude
            location.longitude = place.location.longitude if place.location else location.longitude
            location.rating = place.rating
            location.user_rating_count = place.user_rating_count
            location.photo_url = place.photo_url
            location.types = place.types or location.types
            location.updated_at = datetime.now(timezone.utc)
        else:
            location = _place_to_model(place)
            db.add(location)
            await db.flush()

        db.add(QueryLocation(
            query_id=search_query.id,
            location_id=location.id,
            rank=rank,
        ))

    await db.commit()
