import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { asyncHandler, validate } from '../middleware/validate.js';
import {
  alertsQuery,
  createReportBody,
  etaQuery,
  idParams,
  simulateRushBody,
  updateAlertBody,
} from '../validation/schemas.js';
import { getRoute, listRouteBuses, listRoutes } from '../controllers/routesController.js';
import { getStopEta, listStops } from '../controllers/stopsController.js';
import { createReport } from '../controllers/reportsController.js';
import {
  cancelRush,
  getConfig,
  getDensity,
  getStats,
  listAlerts,
  simulateRush,
  updateAlert,
} from '../controllers/operatorController.js';

export function createApiRouter() {
  const router = Router();

  const reportLimiter = rateLimit({
    windowMs: 60000,
    limit: config.reportRateLimitPerMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.' },
  });

  // Passenger module
  router.get('/routes', asyncHandler(listRoutes));
  router.get('/routes/:id', validate({ params: idParams }), asyncHandler(getRoute));
  router.get('/routes/:id/buses', validate({ params: idParams }), asyncHandler(listRouteBuses));
  router.get('/stops', asyncHandler(listStops));
  router.get('/stops/:id/eta', validate({ params: idParams, query: etaQuery }), asyncHandler(getStopEta));
  router.post('/reports', reportLimiter, validate({ body: createReportBody }), asyncHandler(createReport));

  // Operator module
  router.get('/operator/config', getConfig);
  router.get('/operator/density', asyncHandler(getDensity));
  router.get('/operator/stats', asyncHandler(getStats));
  router.get('/operator/alerts', validate({ query: alertsQuery }), asyncHandler(listAlerts));
  router.patch(
    '/operator/alerts/:id',
    validate({ params: idParams, body: updateAlertBody }),
    asyncHandler(updateAlert),
  );
  router.post('/operator/simulate-rush', validate({ body: simulateRushBody }), asyncHandler(simulateRush));
  router.delete('/operator/simulate-rush/:id', validate({ params: idParams }), asyncHandler(cancelRush));

  return router;
}
