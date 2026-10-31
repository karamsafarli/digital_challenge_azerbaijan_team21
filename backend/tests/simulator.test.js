import { describe, it, expect } from 'vitest';
import { advanceBus, moveAlong } from '../src/services/simulator.js';

const route = {
  lengthM: 1000,
  path: [
    [40.37, 49.83],
    [40.379, 49.83],
  ],
  typicalLoad: 0.5,
};

/** Deterministic rng returning the given values in a loop. */
const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('moveAlong', () => {
  it('moves forward and backward', () => {
    expect(moveAlong(100, 1, 50, 1000)).toEqual({ progressM: 150, direction: 1 });
    expect(moveAlong(100, -1, 50, 1000)).toEqual({ progressM: 50, direction: -1 });
  });

  it('bounces at the end of the route', () => {
    expect(moveAlong(980, 1, 50, 1000)).toEqual({ progressM: 970, direction: -1 });
  });

  it('bounces at the start of the route', () => {
    expect(moveAlong(20, -1, 50, 1000)).toEqual({ progressM: 30, direction: 1 });
  });
});

describe('advanceBus', () => {
  const bus = { progressM: 500, direction: 1, occupancy: 45, capacity: 90 };

  it('a held bus does not move', () => {
    const next = advanceBus(bus, route, 3, 'LOW', seq(0.01, 0.5, 0.5));
    expect(next.speedKmh).toBe(0);
    expect(next.progressM).toBe(500);
  });

  it('a moving bus advances and its GPS point follows the route', () => {
    const next = advanceBus(bus, route, 3, 'LOW', seq(0.9, 0.5, 0.5));
    expect(next.speedKmh).toBeGreaterThan(0);
    expect(next.progressM).toBeGreaterThan(500);
    expect(next.lat).toBeGreaterThan(40.37);
    expect(next.lat).toBeLessThan(40.379);
  });

  it('congestion slows the bus down', () => {
    const free = advanceBus(bus, route, 3, 'LOW', seq(0.9, 0.5, 0.5));
    const jammed = advanceBus(bus, route, 3, 'HIGH', seq(0.9, 0.5, 0.5));
    expect(jammed.speedKmh).toBeLessThan(free.speedKmh);
  });

  it('occupancy stays within 0 and 120% of capacity', () => {
    let state = { ...bus, occupancy: 0 };
    for (let i = 0; i < 200; i += 1) {
      state = { ...state, ...advanceBus(state, route, 3) };
      expect(state.occupancy).toBeGreaterThanOrEqual(0);
      expect(state.occupancy).toBeLessThanOrEqual(108);
    }
  });
});
