import { prisma } from '../db.js';
import { broadcast, EVENTS } from '../socket.js';

export function activeAnnouncements(now = new Date()) {
  return prisma.announcement.findMany({
    where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    include: { route: { select: { id: true, number: true, color: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/** Push the current list of active announcements to every client. */
export async function broadcastAnnouncements() {
  broadcast(EVENTS.ANNOUNCEMENTS_UPDATE, await activeAnnouncements());
}
