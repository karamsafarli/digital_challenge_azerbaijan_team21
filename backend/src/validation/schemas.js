import { z } from 'zod';

const id = z.coerce.number().int().positive();
export const LEVEL = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const idParams = z.object({ id });

export const createReportBody = z.object({
  routeId: id,
  busId: id.optional(),
  stopId: id.optional(),
  level: LEVEL,
  clientId: z.string().trim().min(1).max(64).optional(),
});

export const etaQuery = z.object({ routeId: id.optional() });

export const alertsQuery = z.object({
  status: z.enum(['ACTIVE', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL']).default('ACTIVE'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const updateAlertBody = z.object({ status: z.enum(['ACKNOWLEDGED', 'RESOLVED']) });

export const simulateRushBody = z.object({
  routeId: id,
  durationMinutes: z.coerce.number().min(1).max(60).optional(),
});
