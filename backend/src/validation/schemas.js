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

const email = z.string().trim().toLowerCase().email('E-poçt ünvanı düzgün deyil').max(120);

export const registerBody = z.object({
  name: z.string().trim().min(2, 'Ad ən azı 2 simvol olmalıdır').max(60),
  email,
  password: z.string().min(6, 'Şifrə ən azı 6 simvol olmalıdır').max(100),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Şifrəni daxil edin').max(100),
  role: z.enum(['PASSENGER', 'OPERATOR']).optional(),
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
