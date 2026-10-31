import { vi } from 'vitest';
import { signToken } from '../../src/services/auth.js';

export const passengerToken = signToken({ id: 2, role: 'PASSENGER', name: 'Test Sərnişin' });
export const operatorToken = signToken({ id: 1, role: 'OPERATOR', name: 'Test Operator' });
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/** Fresh Prisma-shaped mock; every model method is a vi.fn() the test can program. */
export function createMockPrisma() {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  });
  return {
    user: model(),
    route: model(),
    stop: model(),
    routeStop: model(),
    bus: model(),
    crowdReport: model(),
    densitySnapshot: model(),
    alert: model(),
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
}
