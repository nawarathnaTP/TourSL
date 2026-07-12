import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('toursl_auth');
    if (raw) {
      const data = JSON.parse(raw);
      const token = data.accessToken || data.access_token || data.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('toursl_auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const authApi = {
  registerTourist: (data) => api.post('/auth/tourist/register', data).then(r => r.data),
  registerGuide: (data) => api.post('/auth/guide/register', data).then(r => r.data),
  googleTourist: (data) => api.post('/auth/tourist/google', data).then(r => r.data),
  googleGuide: (data) => api.post('/auth/guide/google', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  refresh: (data) => api.post('/auth/refresh', data).then(r => r.data),
};

// --- Tours ---
export const toursApi = {
  create: (data) => api.post('/tours', data).then(r => r.data),
  getById: (id) => api.get(`/tours/${id}`).then(r => r.data),
  getMyTours: () => api.get('/tours/my-tours').then(r => r.data),
  update: (id, data) => api.put(`/tours/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/tours/${id}`).then(r => r.data),
};

// --- Days ---
export const daysApi = {
  getById: (id) => api.get(`/days/${id}`).then(r => r.data),
  getByTour: (tourId) => api.get(`/days/tour/${tourId}`).then(r => r.data),
  update: (id, data) => api.put(`/days/${id}`, data).then(r => r.data),
  clearStops: (id) => api.put(`/days/${id}/clear`).then(r => r.data),
};

// --- Stops ---
export const stopsApi = {
  create: (data) => api.post('/stops', data).then(r => r.data),
  getById: (id) => api.get(`/stops/${id}`).then(r => r.data),
  getByDay: (dayId) => api.get(`/stops/day/${dayId}`).then(r => r.data),
  update: (id, data) => api.put(`/stops/${id}`, data).then(r => r.data),
  reorder: (dayId, stopIds) => api.put(`/stops/day/${dayId}/reorder`, { stopIds }).then(r => r.data),
  move: (id, data) => api.put(`/stops/${id}/move`, data).then(r => r.data),
  remove: (id) => api.delete(`/stops/${id}`).then(r => r.data),
};

// --- Activities ---
export const activitiesApi = {
  create: (data) => api.post('/activities', data).then(r => r.data),
  getById: (id) => api.get(`/activities/${id}`).then(r => r.data),
  getByStop: (stopId) => api.get(`/activities/stop/${stopId}`).then(r => r.data),
  update: (id, data) => api.put(`/activities/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/activities/${id}`).then(r => r.data),
};

// --- Routes ---
export const routesApi = {
  create: (data) => api.post('/routes', data).then(r => r.data),
  getById: (id) => api.get(`/routes/${id}`).then(r => r.data),
  getByDay: (dayId) => api.get(`/routes/day/${dayId}`).then(r => r.data),
  update: (id, data) => api.put(`/routes/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/routes/${id}`).then(r => r.data),
  removeByDay: (dayId) => api.delete(`/routes/day/${dayId}`).then(r => r.data),
};

// --- Guide Packages ---
export const packagesApi = {
  getByTour: (tourId) => api.get(`/guide-packages/tour/${tourId}`).then(r => r.data),
  update: (tourId, data) => api.put(`/guide-packages/tour/${tourId}`, data).then(r => r.data),
  publish: (tourId) => api.patch(`/guide-packages/tour/${tourId}/publish`).then(r => r.data),
  unpublish: (tourId) => api.patch(`/guide-packages/tour/${tourId}/unpublish`).then(r => r.data),
  cancel: (tourId) => api.patch(`/guide-packages/tour/${tourId}/cancel`).then(r => r.data),
  getMyPackages: () => api.get('/guide-packages/my-packages').then(r => r.data),
  getPublished: () => api.get('/guide-packages/published').then(r => r.data),
};

// --- Bookings ---
export const bookingsApi = {
  create: (data) => api.post('/bookings', data).then(r => r.data),
  pay: (id) => api.patch(`/bookings/${id}/pay`).then(r => r.data),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`).then(r => r.data),
  getMyBookings: () => api.get('/bookings/my-bookings').then(r => r.data),
  getByPackage: (packageId) => api.get(`/bookings/package/${packageId}`).then(r => r.data),
};

// --- Directions (Route Engine on port 8002) ---
export const directionsApi = {
  getDirections: (origin, destination, travelModes) =>
    api.post('/route-engine/directions', {
      origin: { latitude: origin.lat, longitude: origin.lng },
      destination: { latitude: destination.lat, longitude: destination.lng },
      travel_modes: travelModes || null,
    }).then(r => r.data),
};

// --- Places (Recommendation Engine on port 8000) ---
export const placesApi = {
  search: (params) => api.get('/places/search', { params }).then(r => r.data),
  nearby: (params) => api.get('/places/nearby', { params }).then(r => r.data),
};

export default api;
