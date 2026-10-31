import { vi } from 'vitest';

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
