// Operator console: announcements, report moderation and engine settings.

import { prisma } from '../db.js';
import { analyzeRoute } from '../jobs/analyticsJob.js';
import { activeAnnouncements, broadcastAnnouncements } from '../services/announcements.js';
import { getAllLatestDensity } from '../services/densityStore.js';
import { currentSettings, updateSettings } from '../services/settings.js';
import { broadcast, EVENTS } from '../socket.js';
import { HttpError, notFound } from '../utils/httpError.js';

const routeSelect = { id: true, number: true, name: true, color: true };

// ---- Announcements ----

export async function listAnnouncements(req, res) {
  res.json(await activeAnnouncements());
}

export async function createAnnouncement(req, res) {
  const { routeId, message, severity, durationMinutes } = req.body;
  if (routeId) {
    const route = await prisma.route.findUnique({ where: { id: routeId }, select: { id: true } });
    if (!route) throw notFound('Xətt');
  }
  const announcement = await prisma.announcement.create({
    data: {
      routeId: routeId ?? null,
      message,
      severity,
      expiresAt: durationMinutes ? new Date(Date.now() + durationMinutes * 60000) : null,
      createdById: req.user.id,
    },
    include: { route: { select: { id: true, number: true, color: true } } },
  });
  await broadcastAnnouncements();
  res.status(201).json(announcement);
}

export async function removeAnnouncement(req, res) {
  const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Elan');
  await prisma.announcement.update({ where: { id: existing.id }, data: { active: false } });
  await broadcastAnnouncements();
  res.status(204).end();
}

// ---- Report moderation ----

export const reportInclude = {
  user: { select: { id: true, name: true, email: true, blocked: true } },
  route: { select: { number: true, color: true } },
  bus: { select: { plate: true } },
};

export async function listReports(req, res) {
  const reports = await prisma.crowdReport.findMany({
    take: req.query.limit,
    orderBy: { createdAt: 'desc' },
    include: reportInclude,
  });
  res.json(reports);
}

async function reanalyze(routeIds) {
  const routes = await prisma.route.findMany({ where: { id: { in: [...new Set(routeIds)] } }, select: routeSelect });
  for (const route of routes) await analyzeRoute(route);
  broadcast(EVENTS.DENSITY_UPDATE, getAllLatestDensity());
}

/** Flag (or unflag) a report: flagged reports no longer count towards route density. */
export async function moderateReport(req, res) {
  const report = await prisma.crowdReport.findUnique({ where: { id: req.params.id } });
  if (!report) throw notFound('Bildiriş');
  const updated = await prisma.crowdReport.update({
    where: { id: report.id },
    data: { flagged: req.body.flagged },
    include: reportInclude,
  });
  await reanalyze([report.routeId]);
  res.json(updated);
}

/** Block or unblock a passenger. Blocking also flags their reports from the last hour. */
export async function setUserBlocked(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw notFound('İstifadəçi');
  if (user.role !== 'PASSENGER') throw new HttpError(400, 'Yalnız sərnişin hesabları bloklana bilər');

  const { blocked } = req.body;
  await prisma.user.update({ where: { id: user.id }, data: { blocked } });

  let flaggedCount = 0;
  if (blocked) {
    const since = new Date(Date.now() - 60 * 60000);
    const recent = await prisma.crowdReport.findMany({
      where: { userId: user.id, createdAt: { gte: since }, flagged: false },
      select: { id: true, routeId: true },
    });
    if (recent.length) {
      await prisma.crowdReport.updateMany({ where: { id: { in: recent.map((r) => r.id) } }, data: { flagged: true } });
      await reanalyze(recent.map((r) => r.routeId));
    }
    flaggedCount = recent.length;
  }
  res.json({ id: user.id, blocked, flaggedCount });
}

// ---- Settings ----

export function getSettings(req, res) {
  res.json(currentSettings());
}

export async function saveSettings(req, res) {
  res.json(await updateSettings(req.body));
}
