import { describe, it, expect } from 'vitest';
import { buildAlertMessage, evaluateAnomaly } from '../src/services/anomaly.js';

const now = new Date('2026-10-31T12:00:00Z');
const minutesAgo = (m) => new Date(now.getTime() - m * 60000);

/** Snapshots every 30 s from `fromMin` minutes ago until now. */
function snapshotSeries(fromMin, levelAt = () => 'HIGH') {
  const result = [];
  for (let m = fromMin; m >= 0; m -= 0.5) {
    result.push({ level: levelAt(m), createdAt: minutesAgo(m) });
  }
  return result;
}

const highReports = (n) => Array.from({ length: n }, (_, i) => ({ level: 'HIGH', createdAt: minutesAgo(i) }));

describe('evaluateAnomaly', () => {
  it('triggers when density is HIGH for the full 10 minutes', () => {
    const result = evaluateAnomaly({ snapshots: snapshotSeries(12), reports: highReports(5), now });
    expect(result.triggered).toBe(true);
    expect(result.reason).toBe('SUSTAINED_HIGH_DENSITY');
    expect(result.highReportCount).toBe(5);
    expect(result.highSince).toEqual(minutesAgo(12));
  });

  it('does not trigger when HIGH lasted only 9 minutes', () => {
    const snapshots = snapshotSeries(12, (m) => (m <= 9 ? 'HIGH' : 'MEDIUM'));
    const result = evaluateAnomaly({ snapshots, reports: highReports(5), now });
    expect(result.triggered).toBe(false);
    expect(result.reason).toBe('NOT_CONSISTENTLY_HIGH');
  });

  it('does not trigger if density dropped in the middle of the window', () => {
    const snapshots = snapshotSeries(12, (m) => (m === 5 ? 'MEDIUM' : 'HIGH'));
    expect(evaluateAnomaly({ snapshots, reports: highReports(5), now }).triggered).toBe(false);
  });

  it('needs history covering the whole window', () => {
    const result = evaluateAnomaly({ snapshots: snapshotSeries(6), reports: highReports(5), now });
    expect(result).toMatchObject({ triggered: false, reason: 'NOT_ENOUGH_HISTORY' });
  });

  it('rejects timelines with gaps (e.g. analytics engine was down)', () => {
    const snapshots = snapshotSeries(12).filter((s) => s.createdAt < minutesAgo(7) || s.createdAt > minutesAgo(3));
    expect(evaluateAnomaly({ snapshots, reports: highReports(5), now }).reason).toBe('DATA_GAP');
  });

  it('rejects stale data (no recent snapshot)', () => {
    const snapshots = snapshotSeries(15).filter((s) => s.createdAt < minutesAgo(4));
    expect(evaluateAnomaly({ snapshots, reports: highReports(5), now }).reason).toBe('DATA_GAP');
  });

  it('requires enough HIGH passenger reports inside the window', () => {
    const reports = [...highReports(2), { level: 'HIGH', createdAt: minutesAgo(20) }];
    const result = evaluateAnomaly({ snapshots: snapshotSeries(12), reports, now });
    expect(result).toMatchObject({ triggered: false, reason: 'NOT_ENOUGH_HIGH_REPORTS', highReportCount: 2 });
  });

  it('does not duplicate an alert that is already active', () => {
    const result = evaluateAnomaly({
      snapshots: snapshotSeries(12),
      reports: highReports(5),
      now,
      hasActiveAlert: true,
    });
    expect(result).toMatchObject({ triggered: false, reason: 'ACTIVE_ALERT_EXISTS' });
  });

  it('does not re-alert right after the operator resolved the previous alert', () => {
    const result = evaluateAnomaly({
      snapshots: snapshotSeries(12),
      reports: highReports(5),
      now,
      lastResolvedAt: minutesAgo(3),
    });
    expect(result).toMatchObject({ triggered: false, reason: 'RECENTLY_RESOLVED' });
  });

  it('alerts again if density stays HIGH for a full window after the resolution', () => {
    const result = evaluateAnomaly({
      snapshots: snapshotSeries(12),
      reports: highReports(5),
      now,
      lastResolvedAt: minutesAgo(11),
    });
    expect(result.triggered).toBe(true);
  });

  it('respects a custom window (demo mode)', () => {
    const result = evaluateAnomaly({
      snapshots: snapshotSeries(1.5),
      reports: [0, 0.2, 0.4].map((m) => ({ level: 'HIGH', createdAt: minutesAgo(m) })),
      now,
      windowMinutes: 1,
    });
    expect(result.triggered).toBe(true);
  });
});

describe('buildAlertMessage', () => {
  it('contains the route number and the required recommendation', () => {
    const msg = buildAlertMessage('65', 10);
    expect(msg).toContain('№65');
    expect(msg).toContain('Əlavə avtobus ehtiyatı ayrılmalıdır');
  });
});
