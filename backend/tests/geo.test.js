import { describe, it, expect } from 'vitest';
import { cumulativeDistances, haversineM, pointAlong } from '../src/utils/geo.js';

const path = [
  [40.37, 49.83],
  [40.38, 49.83],
  [40.38, 49.85],
];

describe('geo utils', () => {
  it('haversine: 0.01° latitude is about 1.11 km', () => {
    expect(haversineM([40.37, 49.83], [40.38, 49.83])).toBeCloseTo(1112, -1);
  });

  it('cumulativeDistances starts at 0 and increases', () => {
    const d = cumulativeDistances(path);
    expect(d[0]).toBe(0);
    expect(d[1]).toBeGreaterThan(0);
    expect(d[2]).toBeGreaterThan(d[1]);
  });

  it('pointAlong returns endpoints and interpolates midpoints', () => {
    const total = cumulativeDistances(path)[2];
    expect(pointAlong(path, 0)).toEqual(path[0]);
    expect(pointAlong(path, total + 500)).toEqual(path[2]);
    const [lat] = pointAlong(path, haversineM(path[0], path[1]) / 2);
    expect(lat).toBeCloseTo(40.375, 4);
  });
});
