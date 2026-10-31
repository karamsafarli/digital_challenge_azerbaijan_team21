import { describe, it, expect } from 'vitest';
import { MIN_BUSES_PER_ROUTE, pickDonorBus, redistributeOccupancy, suggestDonors } from '../src/services/fleet.js';

describe('redistributeOccupancy', () => {
  it('spreads passengers evenly when a bus joins and keeps the total', () => {
    const { existing, added } = redistributeOccupancy([90, 80, 70]);
    expect(existing).toEqual([60, 60, 60]);
    expect(added).toBe(60);
    expect(existing.reduce((a, b) => a + b, 0) + added).toBe(240);
  });

  it('never loses passengers to rounding', () => {
    const { existing, added } = redistributeOccupancy([10, 11]);
    expect(existing.reduce((a, b) => a + b, 0) + added).toBe(21);
  });

  it('handles a route with no buses', () => {
    expect(redistributeOccupancy([])).toEqual({ existing: [], added: 0 });
  });
});

describe('pickDonorBus', () => {
  const bus = (id, occupancy) => ({ id, occupancy, capacity: 90 });

  it('takes the emptiest bus', () => {
    expect(pickDonorBus([bus(1, 50), bus(2, 10), bus(3, 70)]).id).toBe(2);
  });

  it(`refuses when the route would drop below ${MIN_BUSES_PER_ROUTE} buses`, () => {
    expect(pickDonorBus([bus(1, 50), bus(2, 10)])).toBeNull();
  });
});

describe('suggestDonors', () => {
  it('suggests quiet routes with spare buses, emptiest first, never the target or HIGH routes', () => {
    const routes = [
      { routeId: 1, level: 'HIGH', score: 0.9, busCount: 4 },
      { routeId: 2, level: 'LOW', score: 0.3, busCount: 4 },
      { routeId: 3, level: 'LOW', score: 0.2, busCount: 2 },
      { routeId: 4, level: 'MEDIUM', score: 0.5, busCount: 3 },
      { routeId: 5, level: 'HIGH', score: 0.8, busCount: 5 },
    ];
    expect(suggestDonors(routes, 1).map((r) => r.routeId)).toEqual([2, 4]);
  });
});
