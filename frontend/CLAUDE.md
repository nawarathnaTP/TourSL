# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color

---

## Project Context — TourSL

TourSL is a tour planning and booking platform for Sri Lanka tourism. It consists of two backend services and this frontend.

### Backend Services

#### 1. Planning Service (Spring Boot — port 8001)
Java/Spring Boot microservice handling tour creation, itinerary planning, and booking management.

**Entities:**
- `User` (parent) → `Tourist` / `Guide` (roles: TOURIST, GUIDE)
- `Tour` → `Day` → `Stop` → `Activity`
- `Location` (lat/lng, place name, external ID, image URL)
- `Route` (connects two stops: distance, time, cost, transport option)
- `TransportOption` (type, label)
- `GuideTourPackage` (wraps a Tour for public booking: price, slots, status)
- `Booking` (tourist books a package: slots, total price, payment deadline)

**Auth:** JWT-based (access + refresh tokens), Google OAuth, BCrypt passwords

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/tourist/register` | Register as tourist |
| POST | `/api/auth/tourist/google` | Google OAuth for tourists |
| POST | `/api/auth/guide/register` | Register as guide |
| POST | `/api/auth/guide/google` | Google OAuth for guides |
| POST | `/api/auth/login` | Login (email + password) |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/tours` | Create a tour |
| GET | `/api/tours/{tourId}` | Get tour by ID |
| GET | `/api/tours/my-tours` | Get authenticated user's tours |
| PUT | `/api/tours/{tourId}` | Update a tour |
| DELETE | `/api/tours/{tourId}` | Delete a tour |
| GET | `/api/days/{dayId}` | Get day by ID |
| GET | `/api/days/tour/{tourId}` | Get all days for a tour |
| PUT | `/api/days/{dayId}` | Update a day |
| PUT | `/api/days/{dayId}/clear` | Clear all stops from a day |
| POST | `/api/stops` | Add a stop |
| GET | `/api/stops/{stopId}` | Get stop by ID |
| GET | `/api/stops/day/{dayId}` | Get all stops for a day |
| PUT | `/api/stops/{stopId}` | Update a stop |
| PUT | `/api/stops/day/{dayId}/reorder` | Reorder stops in a day |
| PUT | `/api/stops/{stopId}/move` | Move stop to another day |
| DELETE | `/api/stops/{stopId}` | Delete a stop |
| POST | `/api/activities` | Add an activity |
| GET | `/api/activities/{activityId}` | Get activity by ID |
| GET | `/api/activities/stop/{stopId}` | Get all activities for a stop |
| PUT | `/api/activities/{activityId}` | Update an activity |
| DELETE | `/api/activities/{activityId}` | Delete an activity |
| POST | `/api/routes` | Create a route |
| GET | `/api/routes/{routeId}` | Get route by ID |
| GET | `/api/routes/day/{dayId}` | Get all routes for a day |
| PUT | `/api/routes/{routeId}` | Update a route |
| DELETE | `/api/routes/{routeId}` | Delete a route |
| DELETE | `/api/routes/day/{dayId}` | Delete all routes for a day |
| POST | `/api/bookings` | Create booking (reserves slots) |
| PATCH | `/api/bookings/{bookingId}/pay` | Pay for booking |
| PATCH | `/api/bookings/{bookingId}/cancel` | Cancel booking |
| GET | `/api/bookings/my-bookings` | Get tourist's bookings |
| GET | `/api/bookings/package/{packageId}` | Get bookings for a package |
| GET | `/api/guide-packages/tour/{tourId}` | Get package for tour |
| PUT | `/api/guide-packages/tour/{tourId}` | Update package details |
| PATCH | `/api/guide-packages/tour/{tourId}/publish` | Publish package |
| PATCH | `/api/guide-packages/tour/{tourId}/unpublish` | Unpublish package |
| PATCH | `/api/guide-packages/tour/{tourId}/cancel` | Cancel package |
| GET | `/api/guide-packages/my-packages` | Get guide's packages |
| GET | `/api/guide-packages/published` | Browse all published packages |

**Booking Flow:**
1. Tourist creates booking → slots reserved (PENDING_PAYMENT)
2. 15-minute payment deadline auto-set
3. Tourist calls `/pay` → CONFIRMED
4. Scheduler expires unpaid bookings and restores slots
5. Cancel restores slots

**Package Statuses:** DRAFT → PUBLISHED → FILLED / CANCELLED

#### 2. Route Engine (FastAPI — port 8002)
Python/FastAPI service that computes driving/transit/walking routes between two locations using Google Routes API, with database caching.

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/route-engine/directions` | Compute routes between two points |

**`/api/route-engine/directions` request body:**
```json
{
  "origin": { "latitude": 7.2906, "longitude": 80.6337 },
  "destination": { "latitude": 6.9271, "longitude": 79.8612 },
  "travel_modes": ["DRIVE", "TRANSIT", "WALK"]  // optional, defaults to all three
}
```

**Response shape:**
```json
{
  "options": [
    {
      "travel_mode": "DRIVE",
      "distance_meters": 116000,
      "duration_seconds": 7200,
      "summary": "A1",
      "polyline": "encoded_polyline_string"
    }
  ]
}
```

#### 3. Recommendation Engine (FastAPI — port 8000)
Python/FastAPI service that wraps Google Places API (New) to provide place search and nearby discovery.

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places/search` | Free-text place search |
| GET | `/api/places/nearby` | Nearby places by lat/lng |

**`/api/places/search` params:**
- `query` (string, required) — e.g. "temples in Kandy"
- `max_results` (int, 1-20, default 20)

**`/api/places/nearby` params:**
- `lat` (float, required)
- `lng` (float, required)
- `radius` (float, 1-50000, default 5000) — meters
- `types` (string, optional) — comma-separated, e.g. "tourist_attraction,museum,park"
- `max_results` (int, 1-20, default 20)

**Place response shape:**
```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "address": "string | null",
      "location": { "latitude": 0.0, "longitude": 0.0 },
      "rating": 4.5,
      "user_rating_count": 120,
      "types": ["tourist_attraction", "point_of_interest"],
      "photo_url": "string | null"
    }
  ],
  "count": 1
}
```

### Key Frontend Needs
The frontend should support two user roles:
1. **Tourist** — browse published tour packages, book tours, manage bookings, search/discover places
2. **Guide** — create tours with day-by-day itineraries (stops, activities, routes), package tours for publishing, manage bookings received

Core pages to build:
- Landing / Home page
- Login / Register (tourist vs guide role selection + Google OAuth)
- Dashboard (role-specific: tourist sees bookings + published packages; guide sees their tours + packages)
- Tour Planner (guide: create/edit tour with days → stops → activities → routes)
- Tour Package Browser (tourist: browse published packages, view details, book)
- Place Search / Discovery (search bar + nearby exploration using Recommendation Engine)
- Booking Management (tourist: my bookings; guide: bookings on their packages)
- Tour Detail View (full itinerary view with map, stops, activities, routes)
