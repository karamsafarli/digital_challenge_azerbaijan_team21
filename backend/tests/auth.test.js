import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { bearer, createMockPrisma, operatorToken, passengerToken } from './helpers/mockPrisma.js';
import { signToken, verifyToken } from '../src/services/auth.js';

const db = vi.hoisted(() => ({ prisma: null }));
vi.mock('../src/db.js', () => db);
vi.mock('../src/jobs/analyticsJob.js', () => ({ analyzeRoute: vi.fn() }));

const { createApp } = await import('../src/app.js');

let app;
let prisma;
const passwordHash = bcrypt.hashSync('secret123', 4);
const passenger = { id: 2, name: 'Aysel', email: 'aysel@test.az', role: 'PASSENGER', passwordHash };
const operator = { id: 1, name: 'Dispetçer', email: 'op@test.az', role: 'OPERATOR', passwordHash };

beforeEach(() => {
  prisma = createMockPrisma();
  db.prisma = prisma;
  app = createApp();
});

describe('POST /api/auth/register', () => {
  it('creates a PASSENGER account and returns a token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve({ id: 7, ...data }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Aysel', email: 'AYSEL@Test.az ', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: 7, name: 'Aysel', email: 'aysel@test.az', role: 'PASSENGER' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(verifyToken(res.body.token)).toMatchObject({ id: 7, role: 'PASSENGER' });
    // password is stored hashed, never in plain text
    const stored = prisma.user.create.mock.calls[0][0].data;
    expect(stored.passwordHash).not.toBe('secret123');
    expect(stored.role).toBe('PASSENGER');
  });

  it('ignores attempts to self-register as an operator', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve({ id: 8, ...data }));
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Hacker', email: 'h@test.az', password: 'secret123', role: 'OPERATOR' });
    expect(res.body.user.role).toBe('PASSENGER');
  });

  it('rejects a duplicate e-mail with 409', async () => {
    prisma.user.findUnique.mockResolvedValue(passenger);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Aysel', email: 'aysel@test.az', password: 'secret123' });
    expect(res.status).toBe(409);
  });

  it('validates name, e-mail and password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.path).sort()).toEqual(['body.email', 'body.name', 'body.password']);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(passenger);
    const res = await request(app).post('/api/auth/login').send({ email: 'aysel@test.az', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('PASSENGER');
  });

  it('returns the same 401 for an unknown user and a wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'x@test.az', password: 'secret123' });
    prisma.user.findUnique.mockResolvedValue(passenger);
    const wrong = await request(app).post('/api/auth/login').send({ email: 'aysel@test.az', password: 'bad' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error);
  });

  it('refuses a passenger account on the operator login (403)', async () => {
    prisma.user.findUnique.mockResolvedValue(passenger);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aysel@test.az', password: 'secret123', role: 'OPERATOR' });
    expect(res.status).toBe(403);
  });

  it('accepts an operator on the operator login', async () => {
    prisma.user.findUnique.mockResolvedValue(operator);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'op@test.az', password: 'secret123', role: 'OPERATOR' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('OPERATOR');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    prisma.user.findUnique.mockResolvedValue(passenger);
    const res = await request(app).get('/api/auth/me').set(bearer(passengerToken));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('aysel@test.az');
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set(bearer(`${passengerToken}x`));
    expect(res.status).toBe(401);
  });
});

describe('role-based access control', () => {
  it.each([
    ['get', '/api/operator/density'],
    ['get', '/api/operator/alerts'],
    ['patch', '/api/operator/alerts/1'],
    ['post', '/api/operator/simulate-rush'],
  ])('%s %s: 401 without token, 403 for passengers', async (method, url) => {
    expect((await request(app)[method](url)).status).toBe(401);
    expect((await request(app)[method](url).set(bearer(passengerToken))).status).toBe(403);
  });

  it('operators can reach operator endpoints', async () => {
    const res = await request(app).get('/api/operator/alerts').set(bearer(operatorToken));
    expect(res.status).toBe(200);
  });

  it('reporting requires a passenger account', async () => {
    const body = { routeId: 1, level: 'HIGH' };
    expect((await request(app).post('/api/reports').send(body)).status).toBe(401);
    expect((await request(app).post('/api/reports').set(bearer(operatorToken)).send(body)).status).toBe(403);
  });

  it('public transit data stays readable without login', async () => {
    expect((await request(app).get('/api/routes')).status).toBe(200);
  });

  it('rejects an expired token', async () => {
    const expired = signToken({ id: 2, role: 'PASSENGER', name: 'x' });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 13 * 3600 * 1000);
    const res = await request(app).get('/api/auth/me').set(bearer(expired));
    vi.useRealTimers();
    expect(res.status).toBe(401);
  });
});
