import { describe, it, expect } from 'vitest';
import {
  computeStopEtas,
  distanceToStop,
  effectiveSpeedKmh,
  etaSeconds,
  MIN_SPEED_KMH,
  DEFAULT_SPEED_KMH,
  stopsBetween,
} from '../src/services/eta.js';

const L = 10000; // 10 km route

describe('distanceToStop', () => {
  it('forward bus, stop ahead', () => {
    expect(distanceToStop({ progressM: 2000, direction: 1 }, 5000, L)).toBe(3000);
  });

  it('forward bus, stop behind: drives to the end and comes back', () => {
    // 8000 to the end + 9000 back to the stop at 1000
    expect(distanceToStop({ progressM: 2000, direction: 1 }, 1000, L)).toBe(17000);
  });

  it('backward bus, stop ahead (lower distance)', () => {
    expect(distanceToStop({ progressM: 6000, direction: -1 }, 1000, L)).toBe(5000);
  });

  it('backward bus, stop behind: goes to the start and turns around', () => {
    expect(distanceToStop({ progressM: 6000, direction: -1 }, 8000, L)).toBe(14000);
  });

  it('bus standing at the stop', () => {
    expect(distanceToStop({ progressM: 5000, direction: 1 }, 5000, L)).toBe(0);
  });
});

describe('stopsBetween', () => {
  it('counts intermediate stops only', () => {
    const stops = [0, 2000, 4000, 6000, 8000, 10000];
    expect(stopsBetween({ progressM: 1000, direction: 1 }, 6000, L, stops)).toBe(2); // 2000, 4000
  });
});

describe('effectiveSpeedKmh', () => {
  it('slows down on congested routes', () => {
    expect(effectiveSpeedKmh(30, 'LOW')).toBe(30);
    expect(effectiveSpeedKmh(30, 'HIGH')).toBeCloseTo(21);
  });

  it('falls back to the average speed when the bus is stopped', () => {
    expect(effectiveSpeedKmh(0, 'LOW')).toBe(DEFAULT_SPEED_KMH);
  });

  it('never goes below the minimum speed', () => {
    expect(effectiveSpeedKmh(9, 'HIGH')).toBe(MIN_SPEED_KMH);
  });
});

describe('etaSeconds', () => {
  it('3.6 km at 36 km/h is 360 s, plus dwell time', () => {
    expect(etaSeconds(3600, 36)).toBe(360);
    expect(etaSeconds(3600, 36, 2)).toBe(400);
  });
});

describe('computeStopEtas', () => {
  it('sorts buses by arrival time', () => {
    const buses = [
      { id: 1, plate: 'A', progressM: 1000, direction: 1, speedKmh: 30 },
      { id: 2, plate: 'B', progressM: 4500, direction: 1, speedKmh: 30 },
      { id: 3, plate: 'C', progressM: 8000, direction: -1, speedKmh: 30 },
    ];
    const etas = computeStopEtas(buses, { lengthM: L, stopDistances: [0, 5000, 10000] }, 5000);
    expect(etas.map((e) => e.busId)).toEqual([2, 3, 1]);
    expect(etas[0].distanceM).toBe(500);
  });

  it('gives later ETAs when the route is congested', () => {
    const buses = [{ id: 1, plate: 'A', progressM: 0, direction: 1, speedKmh: 30 }];
    const route = { lengthM: L, stopDistances: [] };
    const [low] = computeStopEtas(buses, route, 5000, 'LOW');
    const [high] = computeStopEtas(buses, route, 5000, 'HIGH');
    expect(high.etaSeconds).toBeGreaterThan(low.etaSeconds);
  });
});
