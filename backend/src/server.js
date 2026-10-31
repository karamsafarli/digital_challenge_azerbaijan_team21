import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { initSocket } from './socket.js';
import { startSimulator } from './jobs/simulatorJob.js';
import { startAnalytics } from './jobs/analyticsJob.js';

const app = createApp();
const server = http.createServer(app);
initSocket(server);

const timers = [];

server.listen(config.port, () => {
  console.log(`Smart Transit API listening on http://localhost:${config.port}`);
  console.log(
    `Anomaly rule: HIGH for ${config.alertWindowMinutes} min with >= ${config.alertMinReports} HIGH reports`,
  );
  if (config.jobsEnabled) {
    timers.push(startSimulator(), startAnalytics());
  }
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  timers.forEach(clearInterval);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
