// Anomaly rule: a route whose density has stayed HIGH for the whole window (default 10 min)
// -> recommend assigning an extra reserve bus.

export const ALERT_TYPE = 'EXTRA_BUS_NEEDED';

export function buildAlertMessage(routeNumber, windowMinutes) {
  return `Xətt №${routeNumber}: ${windowMinutes} dəqiqədir sıxlıq Yüksəkdir. Əlavə avtobus ehtiyatı ayrılmalıdır.`;
}

/**
 * Decide whether a route needs an alert.
 * @param snapshots  density snapshots of the route [{ level, createdAt }]
 * @param reports    crowd reports of the route [{ level, createdAt }]
 * @param options.windowMinutes   how long density must stay HIGH
 * @param options.minHighReports  HIGH passenger reports required inside the window
 * @param options.maxGapMinutes   largest allowed hole between snapshots (data must be continuous)
 * @param options.hasActiveAlert  an OPEN/ACKNOWLEDGED alert already exists -> do not duplicate
 * @param options.lastResolvedAt  when the operator last resolved an alert for this route; the HIGH
 *                                period must lie entirely after it (no instant re-alert after a fix)
 */
export function evaluateAnomaly({
  snapshots = [],
  reports = [],
  now = new Date(),
  windowMinutes = 10,
  minHighReports = 3,
  maxGapMinutes = 2,
  hasActiveAlert = false,
  lastResolvedAt = null,
}) {
  const windowStart = new Date(now.getTime() - windowMinutes * 60000);
  const highReportCount = reports.filter(
    (r) => r.level === 'HIGH' && new Date(r.createdAt) >= windowStart,
  ).length;
  const base = { triggered: false, highReportCount };

  if (hasActiveAlert) return { ...base, reason: 'ACTIVE_ALERT_EXISTS' };
  if (lastResolvedAt && new Date(lastResolvedAt) > windowStart) {
    return { ...base, reason: 'RECENTLY_RESOLVED' };
  }

  const sorted = [...snapshots]
    .map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
    .filter((s) => s.createdAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt);

  // The snapshot at or right before the window start tells us the level when the window began.
  const beforeWindow = sorted.filter((s) => s.createdAt <= windowStart);
  const inWindow = sorted.filter((s) => s.createdAt > windowStart);
  const anchor = beforeWindow[beforeWindow.length - 1];

  if (!anchor || windowStart - anchor.createdAt > maxGapMinutes * 60000) {
    return { ...base, reason: 'NOT_ENOUGH_HISTORY' };
  }

  const timeline = [anchor, ...inWindow];
  for (let i = 1; i < timeline.length; i += 1) {
    if (timeline[i].createdAt - timeline[i - 1].createdAt > maxGapMinutes * 60000) {
      return { ...base, reason: 'DATA_GAP' };
    }
  }
  if (now - timeline[timeline.length - 1].createdAt > maxGapMinutes * 60000) {
    return { ...base, reason: 'DATA_GAP' };
  }

  if (!timeline.every((s) => s.level === 'HIGH')) {
    return { ...base, reason: 'NOT_CONSISTENTLY_HIGH' };
  }

  if (highReportCount < minHighReports) {
    return { ...base, reason: 'NOT_ENOUGH_HIGH_REPORTS' };
  }

  // Find when the current HIGH streak began (for the operator's information)
  let highSince = anchor.createdAt;
  for (let i = beforeWindow.length - 1; i >= 0 && beforeWindow[i].level === 'HIGH'; i -= 1) {
    highSince = beforeWindow[i].createdAt;
  }

  return { triggered: true, reason: 'SUSTAINED_HIGH_DENSITY', highReportCount, highSince };
}
