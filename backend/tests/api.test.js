import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createMockPrisma } from './helpers/mockPrisma.js';

// Mock DB and analytics engine so these tests cover the HTTP layer (validation, status codes, rules).
const db = vi.hoisted(() => ({ prisma: null }));
vi.mock('../src/db.js', () => db);

const analytics = vi.hoisted(() => ({ analyzeRoute: vi.fn() }));
vi.mock('../src/jobs/analyticsJob.js', () => analytics);

const { createApp } = await import('../src/app.js');

const ROUTE = { id: 1, number: '65', name: 'Dərnəgül – 20 Yanvar', color: '#9333ea' };
let app;
let prisma;

beforeEach(() => {
  prisma = createMockPrisma();
  db.prisma = prisma;
  analytics.analyzeRoute.mockResolvedValue({ density: { routeId: 1, level: 'MEDIUM', score: 0.5 } });
  app = createApp();
});

describe('POST /api/reports', () => {
  const valid = { routeId: 1, level: 'HIGH', clientId: 'device-1' };

  it('creates a report and returns the recomputed density', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.crowdReport.findFirst.mockResolvedValue(null);
    prisma.crowdReport.create.mockResolvedValue({ id: 10, ...valid });

    const res = await request(app).post('/api/reports').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.report.id).toBe(10);
    expect(res.body.density.level).toBe('MEDIUM');
    expect(analytics.analyzeRoute).toHaveBeenCalledWith(ROUTE);
  });

  it.each([
    [{ routeId: 1, level: 'VERY_HIGH' }, 'body.level'],
    [{ level: 'HIGH' }, 'body.routeId'],
    [{ routeId: -3, level: 'HIGH' }, 'body.routeId'],
    [{ routeId: 1, level: 'HIGH', clientId: 'x'.repeat(65) }, 'body.clientId'],
  ])('rejects invalid body %j', async (body, path) => {
    const res = await request(app).post('/api/reports').send(body);
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.path)).toContain(path);
    expect(prisma.crowdReport.create).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown route', async () => {
    prisma.route.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/reports').send(valid);
    expect(res.status).toBe(404);
  });

  it('rejects a bus that does not belong to the route', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.bus.findUnique.mockResolvedValue({ routeId: 2 });
    const res = await request(app).post('/api/reports').send({ ...valid, busId: 7 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Avtobus/);
  });

  it('rejects a stop that is not on the route', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.routeStop.findFirst.mockResolvedValue(null);
    const res = await request(app).post('/api/reports').send({ ...valid, stopId: 3 });
    expect(res.status).toBe(400);
  });

  it('throttles repeated reports from the same device (429)', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.crowdReport.findFirst.mockResolvedValue({ id: 9 });
    const res = await request(app).post('/api/reports').send(valid);
    expect(res.status).toBe(429);
    expect(prisma.crowdReport.create).not.toHaveBeenCalled();
  });

  it('rate-limits floods from one IP', async () => {
    prisma.route.findUnique.mockResolvedValue(null);
    const statuses = [];
    for (let i = 0; i < 22; i += 1) {
      statuses.push((await request(app).post('/api/reports').send(valid)).status);
    }
    expect(statuses).toContain(429);
  });
});

describe('GET /api/stops/:id/eta', () => {
  it('returns arrivals sorted by ETA across routes', async () => {
    prisma.stop.findUnique.mockResolvedValue({
      id: 5,
      name: 'Nəsimi',
      lat: 40.42,
      lng: 49.82,
      routes: [
        {
          distanceM: 3000,
          route: {
            id: 1,
            number: '65',
            color: '#000',
            lengthM: 6000,
            stops: [{ distanceM: 0 }, { distanceM: 3000 }, { distanceM: 6000 }],
            buses: [
              { id: 1, plate: 'A', progressM: 0, direction: 1, speedKmh: 30, occupancy: 40, capacity: 90 },
              { id: 2, plate: 'B', progressM: 2500, direction: 1, speedKmh: 30, occupancy: 80, capacity: 90 },
            ],
          },
        },
      ],
    });

    const res = await request(app).get('/api/stops/5/eta');

    expect(res.status).toBe(200);
    expect(res.body.stop.name).toBe('Nəsimi');
    expect(res.body.arrivals.map((a) => a.plate)).toEqual(['B', 'A']);
    expect(res.body.arrivals[0]).toMatchObject({ routeNumber: '65', distanceM: 500, occupancy: 80 });
  });

  it('returns 404 for an unknown stop', async () => {
    prisma.stop.findUnique.mockResolvedValue(null);
    expect((await request(app).get('/api/stops/999/eta')).status).toBe(404);
  });

  it('rejects a non-numeric id', async () => {
    expect((await request(app).get('/api/stops/abc/eta')).status).toBe(400);
  });
});

describe('PATCH /api/operator/alerts/:id', () => {
  it('acknowledges an open alert', async () => {
    prisma.alert.findUnique.mockResolvedValue({ id: 1, status: 'OPEN', acknowledgedAt: null });
    prisma.alert.update.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

    const res = await request(app).patch('/api/operator/alerts/1').send({ status: 'ACKNOWLEDGED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACKNOWLEDGED');
    expect(res.body.acknowledgedAt).toBeTruthy();
  });

  it('refuses to reopen a resolved alert (409)', async () => {
    prisma.alert.findUnique.mockResolvedValue({ id: 1, status: 'RESOLVED' });
    const res = await request(app).patch('/api/operator/alerts/1').send({ status: 'ACKNOWLEDGED' });
    expect(res.status).toBe(409);
    expect(prisma.alert.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid status', async () => {
    const res = await request(app).patch('/api/operator/alerts/1').send({ status: 'OPEN' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown alert', async () => {
    prisma.alert.findUnique.mockResolvedValue(null);
    const res = await request(app).patch('/api/operator/alerts/42').send({ status: 'RESOLVED' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/operator/alerts', () => {
  it('defaults to active (OPEN + ACKNOWLEDGED) alerts', async () => {
    await request(app).get('/api/operator/alerts');
    expect(prisma.alert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } }, take: 50 }),
    );
  });

  it('rejects an unknown status filter', async () => {
    expect((await request(app).get('/api/operator/alerts?status=FOO')).status).toBe(400);
  });
});

describe('GET /api/routes', () => {
  it('serialises routes with ordered stops', async () => {
    prisma.route.findMany.mockResolvedValue([
      {
        ...ROUTE,
        lengthM: 5765.4,
        path: [[40.4, 49.8]],
        stops: [{ order: 0, distanceM: 0, stop: { id: 3, name: 'Dərnəgül', lat: 40.4, lng: 49.8 } }],
      },
    ]);
    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ number: '65', lengthM: 5765, stops: [{ id: 3, name: 'Dərnəgül' }] });
  });
});
