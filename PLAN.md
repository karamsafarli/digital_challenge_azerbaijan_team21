# Smart Transit & Crowdsourcing Engine — Implementation Plan

Competition window: **11:00 – 15:00 (4 hours)**. Target: everything running and docs written by **14:30**, last 30 min for checking and submitting.

---

## 1. What the judges score (and what that means for us)

| Criterion | Weight | What we do about it |
|---|---|---|
| Functional correctness | **35%** | Every required feature works end to end: bus positions + ETA, crowd reporting, density map/list, 10-minute HIGH-density alert. |
| Architecture & code quality | 20% | Clean layers (routes → controllers → services → Prisma), validation, a clear README diagram. |
| Testing & reliability | 15% | Unit tests for ETA / density / anomaly logic, API tests with supertest, input validation, rate limiting, healthcheck. |
| Purposeful AI use | 15% | Keep a **prompt log from minute one** → feeds the AI declaration. |
| Usability & applicability | 15% | Simple UI in Azerbaijani, map + list, works on a phone, one-command `docker compose up`. |

**Rules to respect:** no help from outside the team, no code sharing with other teams, no pre-built solution templates (official scaffolding tools such as `npm create vite` are fine), AI tools and the internet are allowed.

**Deliverables:**
1. Source code (GitHub repo or zip)
2. `README.md`: how to run it (Docker and local) + architecture (frontend → backend → DB/API flow)
3. `AI_DECLARATION.md`: which AI tools, how, and which prompts
4. Technical explanation document (**Word/Notepad**): structure, the problem, technologies chosen, future development → emailed to `alumnicommunity@idda.az`, CC `etibar.seyidzade@aztu.edu.az`, subject **"Digital Challenge Azerbaijan - yarımfinal"**

---

## 2. Requirements → features

### Passenger module
- **P1** Pick a route or a stop → show buses' live positions on a map + **ETA** to the stop.
- **P2** Report a bus's crowding level: **Aşağı / Orta / Yüksək** (Low / Medium / High).

### Operator module & analytics engine
- **O1** Density map/list per route, built from crowd reports + GPS data and updated live.
- **O2** **Anomaly alert:** if a route's density is HIGH for 10 minutes → create the notification *"Əlavə avtobus ehtiyatı ayrılmalıdır"* (an extra reserve bus should be assigned) in the operator panel.
- Extras if time allows: acknowledge/resolve alerts, a simple chart of reports over time, a "simulate rush hour" demo button.

### Key interpretation decisions
- **No real GPS feed exists**, so the backend runs a **bus simulator** that moves buses along real Baku route coordinates and writes GPS pings. This is our data source and it is stated openly in the docs.
- **Route density level** = recency-weighted aggregate of crowd reports in the last N minutes, combined with simulated on-board occupancy (sensor/GPS data) → score 0–1 → LOW / MEDIUM / HIGH.
- **Anomaly rule (configurable via env):** a route is flagged when its aggregated level has stayed HIGH for the whole `ALERT_WINDOW_MINUTES` (default **10**), checked every 30 s, with at least `ALERT_MIN_REPORTS` HIGH reports in that window. Only **one open alert per route** (no spam). For the live demo, set the window to 1 minute or use the "simulate rush" button, which back-dates reports. Both are documented.
- **ETA** = remaining distance along the route polyline ÷ average speed, with the speed reduced by the route's congestion level.

---

## 3. Architecture

```
React (Vite + Tailwind + react-leaflet)
   │  REST (axios)            ▲ Socket.IO (bus:positions, density:update, alert:new)
   ▼                          │
Node.js + Express API ────────┘
   ├─ routes/ controllers/ (zod validation, rate limiting)
   ├─ services/  eta.js · density.js · anomaly.js · simulator.js
   ├─ jobs/      simulator tick (every 3 s) · analytics tick (every 30 s)
   ▼
Prisma ORM → PostgreSQL
```

**Stack:** React 18 + Vite + TailwindCSS + react-leaflet (OpenStreetMap tiles) + socket.io-client · Node 20 + Express + Prisma + zod + socket.io + express-rate-limit · PostgreSQL 16 · Vitest + supertest · Docker Compose (db, backend, frontend).

**Why Prisma:** typed schema, migrations and seeding are built in, and it is fast to write. (Drizzle and Sequelize would also work; Prisma is the fastest way to get there with a team of mixed experience.)

### Data model (Prisma)
- `Route` (id, number "65", name, color, polyline JSON)
- `Stop` (id, name, lat, lng)
- `RouteStop` (routeId, stopId, order, distanceFromStartM)
- `Bus` (id, plate, routeId, capacity, lat, lng, progressM, speedKmh, occupancy, updatedAt)
- `GpsPing` (busId, lat, lng, speedKmh, occupancy, createdAt): history for analytics
- `CrowdReport` (id, routeId, busId?, stopId?, level LOW|MEDIUM|HIGH, clientId, createdAt)
- `DensitySnapshot` (routeId, score, level, reportCount, createdAt): timeline used by the anomaly rule
- `Alert` (id, routeId, type, message, status OPEN|ACKNOWLEDGED|RESOLVED, createdAt, resolvedAt)

### API (draft)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | healthcheck (DB ping) |
| GET | `/api/routes` | routes with stops |
| GET | `/api/routes/:id/buses` | live buses on a route |
| GET | `/api/stops/:id/eta` | upcoming buses + ETA for a stop |
| POST | `/api/reports` | crowd report `{routeId, busId?, stopId?, level}` (validated, rate-limited) |
| GET | `/api/operator/density` | current density per route |
| GET | `/api/operator/alerts?status=OPEN` | alerts |
| PATCH | `/api/operator/alerts/:id` | acknowledge / resolve |
| POST | `/api/operator/simulate-rush` | demo: inject HIGH reports for a route |

### Folder layout
```
digital_challenge/
├─ docker-compose.yml
├─ README.md · AI_DECLARATION.md · TECHNICAL_DOC.md (→ .docx at the end) · PLAN.md
├─ backend/   Dockerfile, package.json, prisma/{schema.prisma, seed.js},
│             src/{app.js, server.js, config.js, routes/, controllers/, services/, jobs/, socket.js}, tests/
└─ frontend/  Dockerfile, package.json, vite + tailwind config,
              src/{api/, hooks/useSocket.js, pages/Passenger.jsx, pages/Operator.jsx, components/}
```

---

## 4. Step-by-step implementation (we do these one at a time)

| # | Step | Time | Output / done when |
|---|---|---|---|
| **0** | Project setup | 11:00–11:20 | Folders, `git init`, docker-compose with Postgres running, backend "hello" + Vite/Tailwind app start. `AI_DECLARATION.md` prompt log started. |
| **1** | Prisma schema + seed | 11:20–11:45 | Migration runs. Seed: 3–4 Baku routes (real stop names and approximate coordinates), ~4 buses per route. |
| **2** | Core services (pure functions) + unit tests | 11:45–12:25 | `eta.js`, `density.js`, `anomaly.js` with Vitest tests passing. |
| **3** | Simulator + analytics jobs + Socket.IO | 12:25–12:50 | Buses move in the DB, density snapshots are written, alerts are created, events are emitted. |
| **4** | REST API + validation + API tests | 12:50–13:15 | All endpoints above work, supertest tests pass. |
| **5** | Passenger UI | 13:15–13:50 | Route/stop picker, Leaflet map with moving buses, ETA list, report buttons (Aşağı/Orta/Yüksək). |
| **6** | Operator UI | 13:50–14:20 | Density list + map coloured by level, live alerts panel with acknowledge/resolve, simulate-rush button. |
| **7** | Docs | in parallel from ~13:00 | README (run steps + architecture), AI declaration, technical doc → Word. |
| **8** | Final check & submit | 14:20–15:00 | `docker compose down -v && docker compose up --build` from a clean state, run the demo scenario, push/zip, send the email. |

**Cut line if we fall behind:** drop charts and the alert acknowledge flow first, then the map (the list view still meets "xəritəsini (və ya siyahısını)", i.e. map *or list*). Never drop the alert rule, ETA or reporting.

### Suggested team split (3 people, mixed levels)
- **Experienced:** steps 1–4 (backend core, the engine, Docker)
- **Intermediate:** steps 5–6 (frontend), working against the agreed API contract above with mock data until the backend is ready
- **Beginner:** prompt log, README, AI declaration, technical doc, seed coordinates for Baku stops, manual testing against the demo checklist

---

## 5. Demo scenario (for the judges)
1. `docker compose up --build` → open http://localhost:5173
2. Passenger: choose route 65 → buses moving on the map, pick a stop → ETA list updates live.
3. Report "Yüksək" a few times → the operator panel's density for route 65 turns red within seconds.
4. Operator: press "Simulate rush" (or wait for the window) → alert *"Əlavə avtobus ehtiyatı ayrılmalıdır"* appears live → acknowledge it.
5. Show `npm test` output.
