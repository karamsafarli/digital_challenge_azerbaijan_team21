import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { asyncHandler, validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  alertsQuery,
  createReportBody,
  etaQuery,
  idParams,
  loginBody,
  registerBody,
  simulateRushBody,
  updateAlertBody,
} from '../validation/schemas.js';
import { login, me, register } from '../controllers/authController.js';
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

  const authLimiter = rateLimit({
    windowMs: 60000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Çox sayda giriş cəhdi. Bir dəqiqə sonra yenidən cəhd edin.' },
  });

  // Authentication
  router.post('/auth/register', authLimiter, validate({ body: registerBody }), asyncHandler(register));
  router.post('/auth/login', authLimiter, validate({ body: loginBody }), asyncHandler(login));
  router.get('/auth/me', requireAuth(), asyncHandler(me));

  // Passenger module: public read-only transit data, reporting needs a passenger account
  router.get('/routes', asyncHandler(listRoutes));
  router.get('/routes/:id', validate({ params: idParams }), asyncHandler(getRoute));
  router.get('/routes/:id/buses', validate({ params: idParams }), asyncHandler(listRouteBuses));
  router.get('/stops', asyncHandler(listStops));
  router.get('/stops/:id/eta', validate({ params: idParams, query: etaQuery }), asyncHandler(getStopEta));
  router.post(
    '/reports',
    reportLimiter,
    requireAuth('PASSENGER'),
    validate({ body: createReportBody }),
    asyncHandler(createReport),
  );

  // Operator module: every endpoint requires an operator account
  const operator = Router();
  operator.use(requireAuth('OPERATOR'));
  operator.get('/config', getConfig);
  operator.get('/density', asyncHandler(getDensity));
  operator.get('/stats', asyncHandler(getStats));
  operator.get('/alerts', validate({ query: alertsQuery }), asyncHandler(listAlerts));
  operator.patch('/alerts/:id', validate({ params: idParams, body: updateAlertBody }), asyncHandler(updateAlert));
  operator.post('/simulate-rush', validate({ body: simulateRushBody }), asyncHandler(simulateRush));
  operator.delete('/simulate-rush/:id', validate({ params: idParams }), asyncHandler(cancelRush));
  router.use('/operator', operator);

  return router;
}
