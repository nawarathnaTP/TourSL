# Route Engine

A Python/FastAPI microservice that finds routes and transport options between locations in Sri Lanka for the TourSL platform. It wraps the Google Routes API, caches results in a PostgreSQL database, and will eventually support multi-stop and full-trip optimization.

## Role in the TourSL Architecture

```
Frontend (React/Vite - port 5173)
    |
    |--- GET/POST /api/places/*       --> Recommendation Engine (port 8000)
    |                                      Fetches locations from Google Places
    |
    |--- POST /api/route-engine/*      --> Route Engine (port 8002)      <-- THIS SERVICE
    |                                      Finds routes between locations
    |
    |--- GET/POST /api/*               --> Planning Service (port 8001)
                                           Stores tours, days, stops, chosen routes
```

The Recommendation Engine helps tourists **find places**. The Route Engine helps them **find routes between those places**. The Planning Service **stores the chosen results**.

## How It Works

1. Tourist has two stops on a day (e.g., Colombo Fort and Temple of Tooth in Kandy)
2. Tourist clicks "Find Routes" on the frontend
3. Frontend sends both stops' coordinates to the Route Engine
4. Route Engine checks its cache — if a matching route exists and hasn't expired, returns it immediately
5. On cache miss, Route Engine calls the Google Routes API, caches the results, and returns them
6. Tourist sees multiple route options (e.g., "Drive via A1 - 2hrs", "Train - 3hrs")
7. Tourist picks one and clicks "Choose Route"
8. Frontend saves the chosen route (including the polyline) to the Planning Service
9. When viewing the tour later, the polyline is fetched from the Planning Service DB and rendered on Google Maps

```
POST /api/route-engine/directions
    |
    |-- Round coordinates (3 decimal places, ~111m precision)
    |-- Query DB for cached routes matching (origin, dest, mode)
    |
    |-- Cache HIT (and not expired)
    |       --> Return cached data immediately
    |
    |-- Cache MISS
            --> Call Google Routes API
            --> Store results in cached_routes table
            --> Return results
```

## Tech Stack

- **Python 3.12+**
- **FastAPI** — async web framework
- **httpx** — async HTTP client for Google Routes API
- **SQLAlchemy** (async) + **asyncpg** — database ORM and driver
- **PostgreSQL** — route cache storage
- **Google Routes API** — real route/directions data

## Project Structure

```
Route-Engine/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py            # Settings (API key, DB URL, CORS)
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py           # Async engine + session factory
│   │   └── base.py              # SQLAlchemy declarative base
│   ├── models/
│   │   ├── __init__.py
│   │   └── cached_route.py      # CachedRoute DB model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── route.py             # Pydantic request/response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── google_routes.py     # Google Routes API client
│   │   └── cache.py             # Cache lookup + store logic
│   └── api/
│       ├── __init__.py
│       └── routes/
│           ├── __init__.py
│           └── directions.py    # Endpoint definitions
├── requirements.txt
├── .env
└── README.md
```

## API Endpoints

### Phase 1: Point-to-Point Directions

```
POST /api/route-engine/directions
```

**Request:**

```json
{
  "origin": {
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "destination": {
    "latitude": 7.2906,
    "longitude": 80.6337
  },
  "travel_modes": ["DRIVE", "TRANSIT"]
}
```

- `origin` / `destination` — lat/lng of the two stops
- `travel_modes` — optional filter. Supported: `DRIVE`, `TRANSIT`, `WALK`, `BICYCLE`, `TWO_WHEELER`. Defaults to `["DRIVE", "TRANSIT", "WALK"]`

**Response:**

```json
{
  "options": [
    {
      "travel_mode": "DRIVE",
      "distance_meters": 116000,
      "duration_seconds": 7200,
      "summary": "Via A1 Expressway",
      "polyline": "e~blFmfiyM..."
    },
    {
      "travel_mode": "TRANSIT",
      "distance_meters": 120000,
      "duration_seconds": 10800,
      "summary": "Train via Peradeniya",
      "polyline": "a~clFnfiyM..."
    }
  ]
}
```

The `polyline` is an encoded polyline string that the Google Maps JS SDK can decode and render directly on a map using `google.maps.geometry.encoding.decodePath()`.

### Phase 2: Single-Day Optimization (Future)

```
POST /api/route-engine/optimize-day
```

**Request:**

```json
{
  "stops": [
    { "stop_id": "uuid-1", "latitude": 7.2936, "longitude": 80.6350, "label": "Temple of Tooth" },
    { "stop_id": "uuid-2", "latitude": 7.2716, "longitude": 80.5966, "label": "Royal Botanical" },
    { "stop_id": "uuid-3", "latitude": 7.2928, "longitude": 80.6413, "label": "Kandy Lake" },
    { "stop_id": "uuid-4", "latitude": 7.2855, "longitude": 80.6280, "label": "Bahirawakanda" },
    { "stop_id": "uuid-5", "latitude": 7.2920, "longitude": 80.6370, "label": "Kandy View Point" }
  ],
  "travel_mode": "DRIVE",
  "fixed_start": "uuid-1"
}
```

- `stops` — all stops in the day with their coordinates
- `travel_mode` — transport mode to optimize for
- `fixed_start` — optional. Keep this stop as the first in the order (e.g., hotel)

**Response:**

```json
{
  "optimized_order": ["uuid-1", "uuid-3", "uuid-5", "uuid-4", "uuid-2"],
  "total_distance_meters": 18000,
  "total_duration_seconds": 3000,
  "legs": [
    {
      "from_stop_id": "uuid-1",
      "to_stop_id": "uuid-3",
      "distance_meters": 800,
      "duration_seconds": 180,
      "polyline": "abc..."
    },
    {
      "from_stop_id": "uuid-3",
      "to_stop_id": "uuid-5",
      "distance_meters": 500,
      "duration_seconds": 120,
      "polyline": "def..."
    }
  ]
}
```

### Phase 3: Full-Trip Optimization (Future)

```
POST /api/route-engine/optimize-trip
```

**Request:**

```json
{
  "stops": [
    { "stop_id": "uuid-1", "latitude": 6.93, "longitude": 79.85, "label": "Colombo Fort", "duration_minutes": 60 },
    { "stop_id": "uuid-2", "latitude": 7.29, "longitude": 80.63, "label": "Temple of Tooth", "duration_minutes": 120 }
  ],
  "num_days": 4,
  "fixed_assignments": {
    "uuid-2": 2
  },
  "max_day_hours": 10,
  "travel_mode": "DRIVE"
}
```

- `stops` — all stops across the entire trip with their durations
- `num_days` — number of days in the trip
- `fixed_assignments` — optional. Pin specific stops to specific days (e.g., pre-booked tickets)
- `max_day_hours` — max hours of activity + travel per day

**Response:**

```json
{
  "days": [
    {
      "day_number": 1,
      "stops": ["uuid-1", "uuid-5", "uuid-9"],
      "total_travel_minutes": 85,
      "total_day_minutes": 445,
      "legs": [
        { "from": "uuid-1", "to": "uuid-5", "duration_seconds": 1800, "polyline": "..." },
        { "from": "uuid-5", "to": "uuid-9", "duration_seconds": 3300, "polyline": "..." }
      ]
    }
  ],
  "total_trip_travel_minutes": 660
}
```

## Database

### Cache Table: `cached_routes`

Single table for Phase 1. Caches Google Routes API responses to reduce API costs and latency.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `origin_lat` | NUMERIC(9,6) | Rounded origin latitude |
| `origin_lng` | NUMERIC(9,6) | Rounded origin longitude |
| `dest_lat` | NUMERIC(9,6) | Rounded destination latitude |
| `dest_lng` | NUMERIC(9,6) | Rounded destination longitude |
| `travel_mode` | VARCHAR | DRIVE, TRANSIT, WALK, etc. |
| `distance_meters` | INTEGER | Route distance |
| `duration_seconds` | INTEGER | Route travel time |
| `summary` | VARCHAR | Route summary (e.g., "Via A1 Expressway") |
| `polyline` | TEXT | Encoded polyline for map rendering |
| `created_at` | TIMESTAMP | When the cache entry was created |
| `expires_at` | TIMESTAMP | When the cache entry expires |

**Coordinate rounding:** Coordinates are rounded to 3 decimal places (~111m precision) before cache lookup. This ensures that slightly different coordinates for the same location hit the same cache entry.

**Cache TTL by travel mode:**

| Travel Mode | TTL | Reason |
|---|---|---|
| DRIVE | 7 days | Road conditions change occasionally |
| TRANSIT | 24 hours | Schedules change more frequently |
| WALK | 30 days | Walking paths rarely change |
| BICYCLE | 14 days | Bike routes are relatively stable |

## Algorithms

### Single-Day Optimization (Phase 2)

**Problem:** Given N stops on a day, find the visiting order that minimizes total travel time. This is the Travelling Salesman Problem (TSP) — specifically the open-path variant (no return to start).

**Step 1 — Build a distance matrix:** Call the Google Route Matrix API with all N stops. This returns travel times between every pair in a single API call (N x N elements).

**Step 2 — Solve TSP:** For realistic day sizes (3-8 stops), brute-force permutation is fast enough:

| Stops | Permutations | Time |
|---|---|---|
| 5 | 120 | instant |
| 7 | 5,040 | instant |
| 8 | 40,320 | instant |
| 10 | 3,628,800 | ~1 second |

For N > 12 (unlikely for a single day), fall back to the Nearest Neighbor heuristic (O(n^2), good but not guaranteed optimal).

**Step 3 — Get polylines:** Call the Google Routes API for each consecutive pair in the optimal order (N-1 calls) to get polylines for map rendering.

### Full-Trip Optimization (Phase 3)

**Problem:** Given N stops and D days, decide which stops go on which day AND the best order within each day.

**Two-phase approach:**

1. **Cluster stops into days** — Group stops geographically using K-Means clustering, then rebalance based on constraints (day duration limits, stop durations)
2. **Order days geographically** — Solve TSP on day centroids so the trip flows as a path across the country, not zigzagging
3. **Optimize within each day** — Apply the single-day TSP to each day (reuses Phase 2)
4. **Ensure overnight continuity** — Adjust so the last stop of Day N is near the first stop of Day N+1

**Constraints handled:**

| Constraint | Description |
|---|---|
| Day duration limit | A day can hold ~10-12hrs of activity + travel |
| Overnight continuity | Last stop of Day N near first stop of Day N+1 |
| Fixed assignments | "Sigiriya must be on Day 2" (pre-booked tickets) |
| Stop duration | A hike takes 4hrs, a viewpoint takes 30min — affects how many stops fit in a day |

## Future Enhancements

### Smart Route Features
- **Route preferences** — filter by budget (cheapest), time (fastest), scenic (prefer coastal/hill roads)
- **Avoid options** — toll roads, highways, ferries
- **Scenic route detection** — prefer known scenic routes like the Ella to Kandy train

### Sri Lanka-Specific Transport Intelligence
- **Tuk-tuk** as a transport mode with per-km fare estimation (rates vary by region)
- **Sri Lanka Railways** timetable integration — suggest actual train schedules
- **Inter-city buses** (government CTB + private) with approximate schedules
- **Domestic flights** (Colombo to Jaffna, etc.)

### Integration with Recommendation Engine
- **Cross-engine intelligence** — Recommendation Engine suggests locations, Route Engine suggests the best order to visit them
- **En-route suggestions** — "You're driving from Colombo to Galle — here are 3 interesting stops along the way"
- **Combined itinerary endpoint** — given a region + interests, return stops AND routes as a complete day plan

### Real-Time & Live Features
- **Live traffic** — adjust ETAs based on current conditions
- **Live cost estimates** — fuel prices, current tuk-tuk/taxi rates
- **Weather-aware routing** — monsoon season awareness, landslide risk warnings

### Cache Intelligence
- **User route history** — track which routes tourists actually choose to build preference data
- **Sri Lanka road metadata** — known scenic routes, dangerous roads, road conditions, construction zones
- **Popular route stats** — "80% of tourists chose the train for Colombo to Kandy"

## Planning Service Changes Required

To support route rendering on Google Maps, the Planning Service `Route` entity needs a `polyline` (TEXT) column added. This stores the encoded polyline of the chosen route so it can be rendered on a map without re-calling any API.

**Fields added to Route entity/DTOs:**

- `Route.java` — add `private String polyline;` with `@Column(columnDefinition = "TEXT")`
- `RouteRequest.java` — add `private String polyline;`
- `RouteResponse.java` — add `private String polyline;`

## Frontend Integration

### Vite Proxy

Add to `vite.config.js`:

```js
'/api/route-engine': { target: 'http://localhost:8002' }
```

### Rendering a Saved Route on Google Maps

```js
// Fetch routes for a day from Planning Service
const routes = await fetch(`/api/routes/day/${dayId}`).then(r => r.json());

// Draw each route on the map
routes.forEach(route => {
  const path = google.maps.geometry.encoding.decodePath(route.polyline);
  new google.maps.Polyline({
    path: path,
    map: map,
    strokeColor: "#4285F4",
    strokeWeight: 4,
  });
});
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GOOGLE_ROUTES_API_KEY` | Google Routes API key | (required) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/route_engine` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,http://localhost:5173` |

### Google API Setup

The Route Engine uses the [Google Routes API](https://developers.google.com/maps/documentation/routes) (the modern replacement for the Directions API). Enable these APIs in your Google Cloud Console:

- **Routes API** — for computing routes between two points
- **Route Matrix API** — for computing distance matrices (needed for Phase 2 optimization)

The same API key used for Google Places in the Recommendation Engine can be reused if these APIs are enabled on it.

## Development Phases

```
Phase 1 (current)  -->  Point-to-point directions with caching
                        Single endpoint, single DB table
                        Google Routes API wrapper

Phase 2 (next)     -->  Single-day stop optimization (TSP)
                        Google Route Matrix API integration
                        Brute-force solver for N <= 10

Phase 3 (future)   -->  Full-trip optimization (clustering + TSP)
                        Constraint-aware day assignment
                        Cross-engine integration with Recommendation Engine
```
