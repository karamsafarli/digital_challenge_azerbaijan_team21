// Route density = recency-weighted crowd reports blended with on-board occupancy (GPS/sensor data).

export const LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

export const LEVEL_LABELS_AZ = { LOW: 'Aşağı', MEDIUM: 'Orta', HIGH: 'Yüksək' };

// Numeric value a single passenger report contributes
export const LEVEL_SCORE = { LOW: 0.2, MEDIUM: 0.55, HIGH: 0.9 };

export const DEFAULTS = {
  windowMinutes: 15, // reports older than this are ignored
  halfLifeMinutes: 5, // a report loses half its weight every 5 minutes
  mediumThreshold: 0.4,
  highThreshold: 0.7,
};

export function scoreToLevel(score, { mediumThreshold, highThreshold } = DEFAULTS) {
  if (score >= highThreshold) return 'HIGH';
  if (score >= mediumThreshold) return 'MEDIUM';
  return 'LOW';
}

/** Weight of a report given its age; newer reports count more. */
export function recencyWeight(ageMinutes, halfLifeMinutes = DEFAULTS.halfLifeMinutes) {
  if (ageMinutes < 0) return 1;
  return 0.5 ** (ageMinutes / halfLifeMinutes);
}

/** Weighted average of report scores within the window, or null if there are none. */
export function reportScore(reports, now, opts = {}) {
  const { windowMinutes, halfLifeMinutes } = { ...DEFAULTS, ...opts };
  let weighted = 0;
  let totalWeight = 0;
  let count = 0;

  for (const report of reports) {
    const ageMinutes = (now - new Date(report.createdAt)) / 60000;
    if (ageMinutes > windowMinutes || !(report.level in LEVEL_SCORE)) continue;
    const w = recencyWeight(ageMinutes, halfLifeMinutes);
    weighted += w * LEVEL_SCORE[report.level];
    totalWeight += w;
    count += 1;
  }

  return { score: totalWeight > 0 ? weighted / totalWeight : null, count };
}

/** Average load factor (0..1) of the buses on a route, or null without buses. */
export function occupancyScore(buses) {
  const valid = buses.filter((b) => b.capacity > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, b) => acc + Math.min(Math.max(b.occupancy / b.capacity, 0), 1), 0);
  return sum / valid.length;
}

/**
 * Combined route density.
 * Crowd reports dominate once there are enough of them; occupancy fills the gap otherwise.
 */
export function computeRouteDensity({ reports = [], buses = [], now = new Date(), ...opts }) {
  const { score: crowd, count } = reportScore(reports, now, opts);
  const occupancy = occupancyScore(buses);

  let score;
  if (crowd !== null && occupancy !== null) {
    const crowdWeight = count >= 3 ? 0.7 : 0.5;
    score = crowdWeight * crowd + (1 - crowdWeight) * occupancy;
  } else {
    score = crowd ?? occupancy ?? 0;
  }

  return {
    score: Math.round(score * 1000) / 1000,
    level: scoreToLevel(score, { ...DEFAULTS, ...opts }),
    reportCount: count,
    avgOccupancy: occupancy === null ? 0 : Math.round(occupancy * 1000) / 1000,
  };
}
