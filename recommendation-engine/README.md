# Recommendation Engine

FastAPI backend that fetches tourist spots from the Google Places API,
caches results in PostgreSQL, and serves a clean, frontend-friendly JSON shape.
Starting point for a tourist-spot recommendation system.

## Prerequisites

- Docker & Docker Compose

## Setup

1. Create a `.env` file with the following variables:

   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   DB_USER=sychpra
   DB_PASSWORD=psql123
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

2. Build and start the containers:

   ```bash
   docker compose up -d --build
   ```

   This starts two containers:
   - **recommendation-db** — PostgreSQL 16 on port 5433
   - **recommendation-engine** — FastAPI app on port 8000

   Migrations run automatically on app startup.

Visit:
- `http://localhost:8000/docs` — interactive API docs (Swagger UI)
- `http://localhost:8000/` — health check

## Endpoints

### `GET /api/places/search?query=temples in Kandy`
Free-text search. Good for a search bar. Results are cached for 24 hours.

### `GET /api/places/nearby?lat=6.9271&lng=79.8612&radius=5000&types=tourist_attraction,museum`
Search around a lat/lng point. `types` defaults to `tourist_attraction` if omitted.

## Database

PostgreSQL 16 running in Docker on port **5433** (5432 is used by Planning Service).

### Tables
- **locations** — cached Google Places data (name, coords, rating, types, photo, metadata)
- **search_queries** — cached search queries with expiry (24h TTL)
- **query_locations** — many-to-many connector with rank to preserve result order

### Migrations

```bash
# Generate a new migration after changing models
alembic revision --autogenerate -m "description of change"

# Apply pending migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Check current migration version
alembic current
```

## Local Development (without Docker)

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Start the database only:

   ```bash
   docker compose up -d db
   ```

3. Set `DATABASE_URL` in `.env` to point to localhost:

   ```
   DATABASE_URL=postgresql+asyncpg://sychpra:psql123@localhost:5433/recommendation_db
   ```

4. Run migrations and start the app:

   ```bash
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

## Project Structure

```
app/
├── main.py                  # FastAPI app, CORS, lifespan, router registration
├── core/
│   └── config.py            # Settings loaded from .env
├── api/
│   └── routes/
│       └── places.py        # HTTP endpoints
├── db/
│   ├── base.py              # SQLAlchemy declarative base
│   └── session.py           # Async engine and session factory
├── models/
│   ├── location.py          # Location model
│   ├── search_query.py      # SearchQuery model
│   └── query_location.py    # QueryLocation junction model
├── services/
│   ├── google_places.py     # Google Places API client
│   └── cache.py             # Database caching logic
└── schemas/
    └── place.py             # Pydantic response models
alembic/
├── env.py                   # Alembic async configuration
└── versions/                # Migration files
Dockerfile                   # App container image
docker-compose.yml           # App + PostgreSQL containers
```
