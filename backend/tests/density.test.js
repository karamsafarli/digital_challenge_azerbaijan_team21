import { describe, it, expect } from 'vitest';
import {
  computeRouteDensity,
  occupancyScore,
  recencyWeight,
  reportScore,
  scoreToLevel,
} from '../src/services/density.js';

const now = new Date('2026-10-31T12:00:00Z');
const minutesAgo = (m) => new Date(now.getTime() - m * 60000);
const report = (level, ageMin) => ({ level, createdAt: minutesAgo(ageMin) });

describe('scoreToLevel', () => {
  it('maps thresholds to levels', () => {
    expect(scoreToLevel(0)).toBe('LOW');
    expect(scoreToLevel(0.39)).toBe('LOW');
    expect(scoreToLevel(0.4)).toBe('MEDIUM');
    expect(scoreToLevel(0.69)).toBe('MEDIUM');
    expect(scoreToLevel(0.7)).toBe('HIGH');
    expect(scoreToLevel(1)).toBe('HIGH');
  });
});

describe('recencyWeight', () => {
  it('halves every half-life', () => {
    expect(recencyWeight(0)).toBe(1);
    expect(recencyWeight(5)).toBeCloseTo(0.5);
    expect(recencyWeight(10)).toBeCloseTo(0.25);
  });
});

describe('reportScore', () => {
  it('returns null when there are no reports', () => {
    expect(reportScore([], now)).toEqual({ score: null, count: 0 });
  });

  it('ignores reports outside the window and unknown levels', () => {
    const { count } = reportScore([report('HIGH', 1), report('HIGH', 30), report('BOGUS', 1)], now);
    expect(count).toBe(1);
  });

  it('weights recent reports more than old ones', () => {
    const recentHigh = reportScore([report('HIGH', 0), report('LOW', 10)], now).score;
    const recentLow = reportScore([report('LOW', 0), report('HIGH', 10)], now).score;
    expect(recentHigh).toBeGreaterThan(recentLow);
  });
});

describe('occupancyScore', () => {
  it('averages load factor and clamps overloaded buses to 1', () => {
    expect(occupancyScore([])).toBeNull();
    expect(occupancyScore([{ occupancy: 45, capacity: 90 }, { occupancy: 200, capacity: 90 }])).toBeCloseTo(0.75);
  });
});

describe('computeRouteDensity', () => {
  it('is LOW with no data at all', () => {
    expect(computeRouteDensity({ now })).toMatchObject({ score: 0, level: 'LOW', reportCount: 0 });
  });

  it('uses occupancy only when nobody has reported', () => {
    const result = computeRouteDensity({ buses: [{ occupancy: 81, capacity: 90 }], now });
    expect(result.level).toBe('HIGH');
    expect(result.avgOccupancy).toBeCloseTo(0.9);
  });

  it('many HIGH reports make the route HIGH even with half-empty buses', () => {
    const result = computeRouteDensity({
      reports: [report('HIGH', 0), report('HIGH', 1), report('HIGH', 2)],
      buses: [{ occupancy: 45, capacity: 90 }],
      now,
    });
    expect(result.reportCount).toBe(3);
    expect(result.level).toBe('HIGH');
  });

  it('LOW reports on empty buses give LOW', () => {
    const result = computeRouteDensity({
      reports: [report('LOW', 0), report('LOW', 2)],
      buses: [{ occupancy: 10, capacity: 90 }],
      now,
    });
    expect(result.level).toBe('LOW');
  });
});
