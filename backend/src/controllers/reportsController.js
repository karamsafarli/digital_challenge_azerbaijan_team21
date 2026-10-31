import { prisma } from '../db.js';
import { config } from '../config.js';
import { analyzeRoute } from '../jobs/analyticsJob.js';
import { getAllLatestDensity } from '../services/densityStore.js';
import { broadcast, broadcastToOperators, EVENTS } from '../socket.js';
import { reportInclude } from './consoleController.js';
import { HttpError, notFound } from '../utils/httpError.js';

/** Passenger crowd report: validate references, throttle per account, recompute density at once. */
export async function createReport(req, res) {
  const { routeId, busId, stopId, level, clientId } = req.body;
  const userId = req.user.id;

  const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { blocked: true } });
  if (reporter?.blocked) throw new HttpError(403, 'Hesabınız bildiriş göndərmək üçün bloklanıb');

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true, number: true, name: true, color: true },
  });
  if (!route) throw notFound('Marşrut');

  if (busId) {
    const bus = await prisma.bus.findUnique({ where: { id: busId }, select: { routeId: true } });
    if (!bus || bus.routeId !== routeId) throw new HttpError(400, 'Avtobus bu marşruta aid deyil');
  }
  if (stopId) {
    const onRoute = await prisma.routeStop.findFirst({ where: { routeId, stopId } });
    if (!onRoute) throw new HttpError(400, 'Dayanacaq bu marşrutda deyil');
  }

  if (config.reportCooldownSeconds > 0) {
    const recent = await prisma.crowdReport.findFirst({
      where: {
        userId,
        routeId,
        createdAt: { gte: new Date(Date.now() - config.reportCooldownSeconds * 1000) },
      },
    });
    if (recent) {
      throw new HttpError(
        429,
        `Bu marşrut üçün artıq bildiriş göndərmisiniz. ${config.reportCooldownSeconds} saniyə sonra yenidən cəhd edin.`,
      );
    }
  }

  const report = await prisma.crowdReport.create({
    data: { routeId, busId, stopId, level, clientId, userId },
    include: reportInclude,
  });
  broadcastToOperators(EVENTS.REPORT_NEW, report);

  const { density } = await analyzeRoute(route);
  broadcast(EVENTS.DENSITY_UPDATE, getAllLatestDensity());

  res.status(201).json({ report, density });
}
