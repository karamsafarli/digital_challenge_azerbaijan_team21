# Smart Transit & Crowdsourcing Engine (Bakı)

Real-time bus location, ETA and crowding analytics for Baku public transport: a passenger module plus an operator module.

> Status: work in progress. Full run instructions and the architecture section are finalized in Step 7.

## Quick start (Docker)
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

## Accounts and roles
| Role | How to get access | Can do |
|---|---|---|
| Passenger | Register on the login page, or use the demo passenger account | Live map, ETA, crowd reports |
| Operator (dispatcher) | Seeded account only (no self-registration) | Density dashboard, alerts, rush simulation |

Demo account e-mails and passwords are defined in [`backend/.env.example`](backend/.env.example) (`OPERATOR_*`, `DEMO_PASSENGER_*`) and created by the seed on startup. Access is enforced on the server: operator endpoints return 401/403 for other users, and alert socket events are delivered only to authenticated operators.

## Frontend development (backend in Docker, frontend with live reload)
```bash
docker compose up -d --build db backend
cd frontend && npm install && npm run dev
```
Open http://localhost:5173. Vite proxies `/api` and `/socket.io` to the backend container on port 4000, so frontend edits show up instantly without rebuilding. After backend code changes, run `docker compose up -d --build backend`.

## Full local development (only the database in Docker)
```bash
docker compose up -d db
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```
