import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createMockPrisma } from './helpers/mockPrisma.js';

const db = vi.hoisted(() => ({ prisma: null }));
vi.mock('../src/db.js', () => db);

const { createApp } = await import('../src/app.js');

beforeEach(() => {
  db.prisma = createMockPrisma();
});

describe('GET /api/health', () => {
  it('returns ok when the database answers', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
  });

  it('returns 503 when the database is down', async () => {
    db.prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.db).toBe('down');
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(createApp()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(createApp())
      .post('/api/reports')
      .set('Content-Type', 'application/json')
      .send('{"routeId": ');
    expect(res.status).toBe(400);
  });
});
