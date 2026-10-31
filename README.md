# Smart Transit & Crowdsourcing Engine (Bakı)

Real-time bus location, ETA and crowding analytics for Baku public transport: a passenger module plus an operator module.

> Status: work in progress. Full run instructions and the architecture section are finalized in Step 7.

## Quick start (Docker)
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

## Local development
```bash
docker compose up -d db
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```
