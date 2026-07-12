import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    query_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    query_text: Mapped[str | None] = mapped_column(Text)
    search_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "text" or "nearby"
    # Nearby search params (null for text searches)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    radius_meters: Mapped[float | None] = mapped_column(Float)
    max_results: Mapped[int] = mapped_column(Integer, default=20)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    location_links: Mapped[list["QueryLocation"]] = relationship(
        back_populates="query"
    )
