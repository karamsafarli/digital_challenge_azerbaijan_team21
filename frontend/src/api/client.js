import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 10000 });

/** Turn an axios error into a user-facing message from the API (or a generic one). */
export function errorMessage(err) {
  return err?.response?.data?.error || 'Serverlə əlaqə alınmadı. Yenidən cəhd edin.';
}

const data = (promise) => promise.then((res) => res.data);

export const api = {
  routes: () => data(http.get('/routes')),
  routeBuses: (routeId) => data(http.get(`/routes/${routeId}/buses`)),
  stops: () => data(http.get('/stops')),
  stopEta: (stopId, routeId) => data(http.get(`/stops/${stopId}/eta`, { params: { routeId } })),
  createReport: (body) => data(http.post('/reports', body)),

  density: () => data(http.get('/operator/density')),
  alerts: (status = 'ACTIVE') => data(http.get('/operator/alerts', { params: { status } })),
  updateAlert: (id, status) => data(http.patch(`/operator/alerts/${id}`, { status })),
  stats: () => data(http.get('/operator/stats')),
  config: () => data(http.get('/operator/config')),
  simulateRush: (routeId) => data(http.post('/operator/simulate-rush', { routeId })),
  cancelRush: (routeId) => data(http.delete(`/operator/simulate-rush/${routeId}`)),
};
