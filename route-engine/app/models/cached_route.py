import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, Numeric, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CachedRoute(Base):
    __tablename__ = "cached_routes"

    __table_args__ = (
        Index(
            "ix_cached_route_lookup",
            "origin_lat", "origin_lng", "dest_lat", "dest_lng", "travel_mode",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    origin_lat: Mapped[float] = mapped_column(Numeric(9, 3), nullable=False)
    origin_lng: Mapped[float] = mapped_column(Numeric(9, 3), nullable=False)
    dest_lat: Mapped[float] = mapped_column(Numeric(9, 3), nullable=False)
    dest_lng: Mapped[float] = mapped_column(Numeric(9, 3), nullable=False)
    travel_mode: Mapped[str] = mapped_column(String(20), nullable=False)

    distance_meters: Mapped[int | None] = mapped_column(Integer)
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    summary: Mapped[str | None] = mapped_column(String(500))
    polyline: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
