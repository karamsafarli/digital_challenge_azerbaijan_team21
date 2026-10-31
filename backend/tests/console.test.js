import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { bearer, createMockPrisma, operatorToken, passengerToken } from './helpers/mockPrisma.js';
import { config } from '../src/config.js';

const db = vi.hoisted(() => ({ prisma: null }));
vi.mock('../src/db.js', () => db);
const analytics = vi.hoisted(() => ({ analyzeRoute: vi.fn() }));
vi.mock('../src/jobs/analyticsJob.js', () => analytics);

const { createApp } = await import('../src/app.js');

const AS_OPERATOR = bearer(operatorToken);
const AS_PASSENGER = bearer(passengerToken);
const ROUTE = { id: 1, number: '65', name: 'Dərnəgül – 20 Yanvar', color: '#9333ea', path: [[40.42, 49.86], [40.40, 49.80]] };
const bus = (id, routeId, occupancy, status = 'IN_SERVICE') => ({ id, plate: `B-${id}`, routeId, occupancy, capacity: 90, status });

let app;
let prisma;

beforeEach(() => {
  prisma = createMockPrisma();
  db.prisma = prisma;
  analytics.analyzeRoute.mockResolvedValue({ density: { level: 'MEDIUM', score: 0.5 } });
  app = createApp();
});

describe('POST /api/operator/dispatch', () => {
  it('sends a reserve bus, spreads passengers and resolves open alerts', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.bus.findFirst.mockResolvedValue(bus(99, null, 0, 'RESERVE'));
    prisma.bus.findMany.mockResolvedValue([bus(1, 1, 90), bus(2, 1, 90)]);
    prisma.alert.findMany.mockResolvedValueOnce([{ id: 7, status: 'OPEN', details: { score: 0.9 } }]);
    prisma.dispatchAction.create.mockResolvedValue({ id: 1, type: 'RESERVE_DISPATCH' });

    const res = await request(app).post('/api/operator/dispatch').set(AS_OPERATOR).send({ toRouteId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.action.type).toBe('RESERVE_DISPATCH');
    // new bus joins with a third of the 180 passengers, existing buses drop to 60
    expect(prisma.bus.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99 }, data: expect.objectContaining({ routeId: 1, status: 'IN_SERVICE', occupancy: 60 }) }),
    );
    expect(prisma.bus.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { occupancy: 60 } });
    expect(prisma.alert.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: expect.objectContaining({ status: 'RESOLVED' }) }),
    );
    expect(prisma.announcement.create).toHaveBeenCalled();
    expect(analytics.analyzeRoute).toHaveBeenCalled();
  });

  it('returns 409 when the depot is empty', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.bus.findFirst.mockResolvedValue(null);
    const res = await request(app).post('/api/operator/dispatch').set(AS_OPERATOR).send({ toRouteId: 1 });
    expect(res.status).toBe(409);
  });

  it('refuses to strip a donor route below the minimum', async () => {
    prisma.route.findUnique.mockResolvedValue(ROUTE);
    prisma.bus.findMany.mockResolvedValue([bus(1, 2, 10), bus(2, 2, 20)]);
    const res = await request(app).post('/api/operator/dispatch').set(AS_OPERATOR).send({ toRouteId: 1, fromRouteId: 2 });
    expect(res.status).toBe(409);
  });

  it('rejects the same source and target route', async () => {
    const res = await request(app).post('/api/operator/dispatch').set(AS_OPERATOR).send({ toRouteId: 1, fromRouteId: 1 });
    expect(res.status).toBe(400);
  });

  it('is operator-only', async () => {
    const res = await request(app).post('/api/operator/dispatch').set(AS_PASSENGER).send({ toRouteId: 1 });
    expect(res.status).toBe(403);
  });
});

describe('announcements', () => {
  it('operators publish announcements', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 1 });
    prisma.announcement.create.mockImplementation(({ data }) => Promise.resolve({ id: 3, ...data }));
    const res = await request(app)
      .post('/api/operator/announcements')
      .set(AS_OPERATOR)
      .send({ routeId: 1, message: 'Xətt 65-də 10 dəqiqəlik gecikmə', severity: 'WARNING', durationMinutes: 30 });
    expect(res.status).toBe(201);
    expect(res.body.severity).toBe('WARNING');
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('validates the message', async () => {
    const res = await request(app).post('/api/operator/announcements').set(AS_OPERATOR).send({ message: 'hi' });
    expect(res.status).toBe(400);
  });

  it('anyone can read active announcements', async () => {
    prisma.announcement.findMany.mockResolvedValue([{ id: 1, message: 'Test elan' }]);
    const res = await request(app).get('/api/announcements');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('moderation', () => {
  it('flagging a report recomputes the route density', async () => {
    prisma.crowdReport.findUnique.mockResolvedValue({ id: 5, routeId: 1 });
    prisma.crowdReport.update.mockResolvedValue({ id: 5, flagged: true });
    prisma.route.findMany.mockResolvedValue([ROUTE]);
    const res = await request(app).patch('/api/operator/reports/5').set(AS_OPERATOR).send({ flagged: true });
    expect(res.status).toBe(200);
    expect(analytics.analyzeRoute).toHaveBeenCalledWith(ROUTE);
  });

  it('blocking a passenger flags their recent reports', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: 'PASSENGER' });
    prisma.crowdReport.findMany.mockResolvedValue([{ id: 1, routeId: 1 }, { id: 2, routeId: 1 }]);
    prisma.route.findMany.mockResolvedValue([ROUTE]);
    const res = await request(app).patch('/api/operator/users/2').set(AS_OPERATOR).send({ blocked: true });
    expect(res.status).toBe(200);
    expect(res.body.flaggedCount).toBe(2);
    expect(prisma.crowdReport.updateMany).toHaveBeenCalledWith({ where: { id: { in: [1, 2] } }, data: { flagged: true } });
  });

  it('operators cannot be blocked', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'OPERATOR' });
    const res = await request(app).patch('/api/operator/users/1').set(AS_OPERATOR).send({ blocked: true });
    expect(res.status).toBe(400);
  });

  it('a blocked passenger cannot report', async () => {
    prisma.user.findUnique.mockResolvedValue({ blocked: true });
    const res = await request(app).post('/api/reports').set(AS_PASSENGER).send({ routeId: 1, level: 'HIGH' });
    expect(res.status).toBe(403);
    expect(prisma.crowdReport.create).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/operator/config', () => {
  const original = { ...config };
  beforeEach(() => Object.assign(config, original));

  it('updates the anomaly rule at runtime', async () => {
    const res = await request(app).patch('/api/operator/config').set(AS_OPERATOR).send({ alertWindowMinutes: 5 });
    expect(res.status).toBe(200);
    expect(res.body.alertWindowMinutes).toBe(5);
    expect(config.alertWindowMinutes).toBe(5);
    expect(prisma.setting.upsert).toHaveBeenCalled();
    Object.assign(config, original);
  });

  it('rejects out-of-range values and empty bodies', async () => {
    expect((await request(app).patch('/api/operator/config').set(AS_OPERATOR).send({ alertWindowMinutes: 0 })).status).toBe(400);
    expect((await request(app).patch('/api/operator/config').set(AS_OPERATOR).send({})).status).toBe(400);
  });
});
