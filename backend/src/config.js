import 'dotenv/config';

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // Anomaly rule: route density HIGH for this many minutes -> alert
  alertWindowMinutes: num(process.env.ALERT_WINDOW_MINUTES, 10),
  alertMinReports: num(process.env.ALERT_MIN_REPORTS, 3),
  // Background job intervals
  simulatorTickMs: num(process.env.SIMULATOR_TICK_MS, 3000),
  analyticsTickMs: num(process.env.ANALYTICS_TICK_MS, 30000),
  gpsPingEveryTicks: num(process.env.GPS_PING_EVERY_TICKS, 5),
  // Crowd reports considered when computing current density
  densityWindowMinutes: num(process.env.DENSITY_WINDOW_MINUTES, 15),
  jobsEnabled: process.env.JOBS_ENABLED !== 'false',
  // Anti-spam: one report per client per route within this many seconds
  reportCooldownSeconds: num(process.env.REPORT_COOLDOWN_SECONDS, 30),
  reportRateLimitPerMinute: num(process.env.REPORT_RATE_LIMIT_PER_MINUTE, 20),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};
