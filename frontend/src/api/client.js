import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 10000 });

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}
export const getAuthToken = () => authToken;

/** Called when the API rejects our token (expired / invalid) so the app can log out. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

http.interceptors.request.use((request) => {
  if (authToken) request.headers.Authorization = `Bearer ${authToken}`;
  return request;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && authToken && !isAuthCall) onUnauthorized?.();
    return Promise.reject(error);
  },
);

/** Turn an axios error into a user-facing message from the API (or a generic one). */
export function errorMessage(err) {
  const data = err?.response?.data;
  if (data?.details?.length) return data.details[0].message;
  return data?.error || 'Serverlə əlaqə alınmadı. Yenidən cəhd edin.';
}

const data = (promise) => promise.then((res) => res.data);

export const api = {
  login: (body) => data(http.post('/auth/login', body)),
  register: (body) => data(http.post('/auth/register', body)),
  me: () => data(http.get('/auth/me')),

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
  saveConfig: (body) => data(http.patch('/operator/config', body)),

  fleet: () => data(http.get('/operator/fleet')),
  dispatch: (body) => data(http.post('/operator/dispatch', body)),
  returnToDepot: (busId) => data(http.post(`/operator/fleet/${busId}/return`)),

  announcements: () => data(http.get('/announcements')),
  createAnnouncement: (body) => data(http.post('/operator/announcements', body)),
  removeAnnouncement: (id) => data(http.delete(`/operator/announcements/${id}`)),

  reports: (limit = 50) => data(http.get('/operator/reports', { params: { limit } })),
  moderateReport: (id, flagged) => data(http.patch(`/operator/reports/${id}`, { flagged })),
  setUserBlocked: (id, blocked) => data(http.patch(`/operator/users/${id}`, { blocked })),
};
