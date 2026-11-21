# Doomsday Ready

A full-stack app that helps MCU fans **plan their rewatch** before *Avengers: Doomsday* and **work out the cheapest exact seat bundles** for a watch party.
Built for the Blinto Talent Accelerator 2027 – Full Stack Developer Internship assessment (brief: [`docs/Blinto_Assessment_Brief.pdf`](docs/Blinto_Assessment_Brief.pdf)).

## Main features
- **Movies** – create/edit movies, choose prerequisites, tick watched. Circular dependencies are rejected (`409 CIRCULAR_DEPENDENCY`).
- **Rewatch Plan** – pick a target movie, get every transitive prerequisite once, in a valid order, with watched ticks, progress bar and remaining minutes.
- **Booking** – pick a cinema, enter a group size (1–10,000), get the fewest bundles that fill the seats *exactly*, or "Not Possible".
- Both algorithms are written from scratch (no graph / optimisation libraries) and unit-tested.

## Tech stack
| Layer | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components (Radix Dialog/Slot), Axios, Lucide |
| Backend | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| Tests | Vitest (algorithms + validators), API smoke-test script |
| Infra | Docker Compose (bonus) |

## Folder structure
```
doomsday-ready/
├── backend/
│   ├── prisma/            schema.prisma, migrations/, seed.ts
│   ├── src/
│   │   ├── algorithms/    rewatch-order.ts, booking-optimizer.ts   (core logic, framework-free)
│   │   ├── controllers/   HTTP in/out only
│   │   ├── services/      business logic + Prisma access
│   │   ├── routes/ validators/ middleware/ config/ utils/ types/
│   │   ├── app.ts, server.ts
│   ├── tests/             Vitest unit tests
│   └── scripts/           api-smoke-test.ts
├── frontend/src/
│   ├── app/               /movies, /rewatch-plan, /booking
│   ├── components/        layout, movies, rewatch, booking, ui
│   ├── services/ hooks/ lib/ types/ constants/
├── docs/                  assessment brief (PDF)
├── docker-compose.yml
└── README.md
```

## Database design
`Movie` has a **self-referencing many-to-many** relation through the explicit join table `MoviePrerequisite(movieId, prerequisiteId)` (composite primary key, cascade deletes).
`Cinema.bundleSizes` is a native PostgreSQL `INTEGER[]`.

```mermaid
erDiagram
    Movie {
        string id PK
        string title UK
        int releaseYear
        int runtime "1-300 min"
        boolean watched "default false"
        datetime createdAt
        datetime updatedAt
    }
    MoviePrerequisite {
        string movieId PK, FK "the dependent movie"
        string prerequisiteId PK, FK "must be watched first"
    }
    Cinema {
        string id PK
        string name UK
        int_array bundleSizes "1-10 unique values, each 1-500"
        datetime createdAt
        datetime updatedAt
    }
    Movie ||--o{ MoviePrerequisite : "has prerequisites"
    Movie ||--o{ MoviePrerequisite : "is prerequisite of"
```

## Algorithm 1 – Rewatch order (`backend/src/algorithms/rewatch-order.ts`)
Movies are **nodes** of a directed graph; an edge `movie → prerequisite` means "watch the prerequisite first".

* **DFS** starts at the target and recursively visits prerequisites.
* **Cycle detection** uses three states per node: *Unvisited*, *Visiting* (on the current DFS path) and *Visited* (finished). Reaching a *Visiting* node means a back-edge, i.e. a cycle → `CircularDependencyError`.
* **Topological sort** comes from **post-order**: a movie is appended only after all its prerequisites finished, so every prerequisite precedes its dependents. *Visited* nodes are skipped, so shared prerequisites appear exactly once. The target finishes last and is removed from the result.
* **Validating edits:** before saving new prerequisites for movie `M`, the service builds the *proposed* graph and runs the DFS from `M`. Any new cycle must pass through `M`, so a cycle is found if and only if the edit is invalid → `409 CIRCULAR_DEPENDENCY` (a self-reference is rejected the same way).
* Complexity O(V + E).

## Algorithm 2 – Booking optimiser (`backend/src/algorithms/booking-optimizer.ts`)
Minimum **coin change** with bottom-up **dynamic programming**.

* `dp[i]` = fewest bundles giving exactly `i` seats; `dp[0] = 0`, others `Infinity`.
* For each `i` from 1…groupSize and each bundle size `s ≤ i`: `dp[i] = min(dp[i], dp[i − s] + 1)`.
* `choice[i]` stores the bundle size that produced the optimum for `i`.
* **Reconstruction:** if `dp[groupSize]` is `Infinity`, return `possible: false`. Otherwise start at `groupSize`, read `choice[remaining]`, count it, subtract it, repeat until 0, then group by size.
* Complexity O(groupSize × bundles) ≤ 100,000 steps. Greedy fails on cases like `[1,3,4]` for 6 (greedy 4+1+1 vs optimal 3+3); DP does not.

## API (base `/api`)
| Method | Path | Notes |
|---|---|---|
| POST | `/movies` | body `{title, releaseYear, runtime, watched?, prerequisites?: string[]}` → 201 |
| GET | `/movies` | all movies, each with `prerequisites: [{id,title}]` |
| PATCH | `/movies/:id` | any of `title, releaseYear, runtime, watched, prerequisites` |
| GET | `/movies/:id/rewatch-order` | ordered prerequisites + summary |
| POST | `/cinemas` | body `{name, bundleSizes: number[]}` → 201 |
| GET | `/cinemas` | all cinemas |
| GET | `/cinemas/:id/booking?groupSize=11` | booking quote |

**Examples**
```jsonc
// GET /api/movies/<doomsdayId>/rewatch-order
{
  "targetMovie": { "id": "…", "title": "Avengers: Doomsday", "releaseYear": 2026, "runtime": 150, "watched": false },
  "rewatchOrder": [ { "id": "…", "title": "Iron Man", "releaseYear": 2008, "runtime": 126, "watched": true }, /* … 6 more */ ],
  "summary": { "totalMovies": 7, "watchedMovies": 4, "unwatchedMovies": 3, "remainingRuntime": 460 }
}

// GET /api/cinemas/<cinemaId>/booking?groupSize=11   (bundles 2, 5)
{ "cinema": { "id": "…", "name": "Cinema Hall A", "bundleSizes": [2, 5] },
  "possible": true, "groupSize": 11, "totalBundles": 4,
  "bundles": [ { "size": 5, "quantity": 1 }, { "size": 2, "quantity": 3 } ], "totalSeats": 11 }

// not possible → "possible": false, "totalBundles": 0, "bundles": [], "totalSeats": 0

// PATCH /api/movies/<ironManId>  { "prerequisites": ["<endgameId>"] }
// 409  { "code": "CIRCULAR_DEPENDENCY", "message": "Circular movie dependency detected." }
```
**Errors** always look like `{ "code", "message", "details"? }`: `400 VALIDATION_ERROR` (with per-field `details`), `404 NOT_FOUND`, `409 CIRCULAR_DEPENDENCY | DUPLICATE_TITLE | DUPLICATE_NAME`, `500 INTERNAL_ERROR`.

## Setup

### Option A – Docker (one command)
```bash
docker compose up --build
```
Frontend → http://localhost:3000 · API → http://localhost:5000/api.
The backend container runs `prisma migrate deploy`, then the idempotent seed, then starts the API.

### Option B – Local development
Requires Node 20+ and a PostgreSQL database.
```bash
# 1. Database (or use your own Postgres)
docker compose up -d db

# 2. Backend
cd backend
cp .env.example .env              # PORT, DATABASE_URL, CORS_ORIGIN
npm install
npx prisma migrate deploy         # apply migrations (use `npm run prisma:migrate` while developing)
npm run prisma:seed               # sample data
npm run dev                       # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                       # http://localhost:3000
```

### Environment variables
| File | Variable | Example |
|---|---|---|
| `backend/.env` | `PORT` | `5000` |
| | `DATABASE_URL` | `postgresql://doomsday:doomsday@localhost:5432/doomsday_ready` |
| | `CORS_ORIGIN` | `http://localhost:3000` (comma-separated list allowed) |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |

## Tests
```bash
cd backend
npm test            # Vitest: both algorithms + validators
npm run test:api    # end-to-end check of every endpoint (needs the API running + seeded)
```
Algorithm tests cover: no/one/multiple prerequisites, deep chains, shared prerequisites, no duplicates, target excluded, ordering, cycle detection, watched count and remaining runtime; and for booking all four assessment examples, single/multiple identical bundles, impossible groups, minimality, reconstruction and invalid inputs.
`test:api` checks the seeded assessment results (Doomsday → 7 movies, Civil War → 3, Ragnarok → empty, Endgame→Iron Man → 409), duplicate/invalid input handling, and the four booking examples.

## Sample data & expected results
`npm run prisma:seed` (idempotent) loads the assessment movies and four cinemas:

| Cinema | Bundles | Used for |
|---|---|---|
| Cinema Hall A | 2, 5 | group 11 → **4 bundles: 5×1, 2×3** |
| Cinema Hall B | 1, 3, 4 | group 6 → **2 bundles: 3×2** |
| Cinema Hall C | 6, 9, 20 | group 44 → **4 bundles: 20×1, 9×2, 6×1** |
| Cinema Hall D | 4, 6 | group 7 → **Not possible** |

Seeded watched state: Iron Man, The First Avenger, The Avengers and Civil War are watched, so *Avengers: Doomsday* shows **4 / 7 watched (57 %), 3 remaining, 460 minutes** (Ragnarok 130 + Infinity War 149 + Endgame 181).
Rewatch results: Doomsday → Iron Man, The First Avenger, The Avengers, Civil War, Ragnarok, Infinity War, Endgame · Civil War → Iron Man, The First Avenger, The Avengers · Ragnarok → empty.

## Implementation decisions (where the brief was open)
- **Release year** must be an integer from 1888 to 2100. Runtime 1–300 as specified.
- **Titles/names** are trimmed; uniqueness is case-sensitive (database unique index). Duplicates → `409 DUPLICATE_TITLE` / `DUPLICATE_NAME`.
- A movie listing **itself** as prerequisite is treated as a cycle (`409 CIRCULAR_DEPENDENCY`). Unknown prerequisite IDs → `400`.
- `PATCH` with `prerequisites` **replaces** the whole prerequisite list (send `[]` to clear).
- The explicit join table `MoviePrerequisite` is used instead of Prisma's implicit many-to-many so the migration SQL is deterministic.
- Prerequisites at each level are visited in release-year order, which makes the rewatch list chronological where the graph allows.
- Booking sorts bundles largest-first; when several optimal combinations exist, the DP returns one of them.
- The Doomsday seed runtime (150 min) is a placeholder; the other years/runtimes are the real release values.
- The brief only requires creating movies and cinemas through the API; cinemas have no UI form (the Booking view lists them), as the brief asks for no cinema management screen.
- Validation checks and the cycle check are not wrapped in a serialisable transaction, so two simultaneous conflicting edits could in theory race; acceptable for this scope.

## AI usage disclosure
This project was generated with the help of an AI assistant (Anthropic's Claude) working from the assessment brief: it drafted the project structure, both algorithms, the API, the frontend, the tests, the Docker setup and this README. The assistant ran the algorithm unit tests in its own environment; the full stack (database, API, frontend, Docker) must be run on your machine to confirm it end to end. The submitting developer is responsible for reviewing, understanding and, where appropriate, rewriting this code, and should edit this section so it accurately reflects their own contribution.
