import { create } from 'zustand';
import { toursApi, daysApi, stopsApi, activitiesApi, routesApi } from '../api/client.js';

const useTourStore = create((set, get) => ({
  tours: [],
  currentTour: null,
  days: [],
  stops: {},
  activities: {},
  routes: {},
  loading: false,
  error: null,

  fetchMyTours: async () => {
    set({ loading: true, error: null });
    try {
      const tours = await toursApi.getMyTours();
      set({ tours, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createTour: async (data) => {
    set({ loading: true, error: null });
    try {
      const tour = await toursApi.create(data);
      set((s) => ({ tours: [...s.tours, tour], loading: false }));
      return tour;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateTour: async (tourId, data) => {
    try {
      const updated = await toursApi.update(tourId, data);
      set((s) => ({
        tours: s.tours.map((t) => (t.tourId === tourId ? updated : t)),
        currentTour: s.currentTour?.tourId === tourId ? updated : s.currentTour,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteTour: async (tourId) => {
    try {
      await toursApi.remove(tourId);
      set((s) => ({
        tours: s.tours.filter((t) => t.tourId !== tourId),
        currentTour: s.currentTour?.tourId === tourId ? null : s.currentTour,
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  loadTour: async (tourId) => {
    set({ loading: true, error: null });
    try {
      const [tour, days] = await Promise.all([
        toursApi.getById(tourId),
        daysApi.getByTour(tourId),
      ]);
      set({ currentTour: tour, days, loading: false });
      return tour;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchDays: async (tourId) => {
    try {
      const days = await daysApi.getByTour(tourId);
      set({ days });
      return days;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateDay: async (dayId, data) => {
    try {
      const updated = await daysApi.update(dayId, data);
      set((s) => ({ days: s.days.map((d) => (d.dayId === dayId ? updated : d)) }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  clearDayStops: async (dayId) => {
    try {
      await daysApi.clearStops(dayId);
      set((s) => ({ stops: { ...s.stops, [dayId]: [] } }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchStops: async (dayId) => {
    try {
      const list = await stopsApi.getByDay(dayId);
      const augmented = list.map((stop) => ({
        ...stop,
        _location: stop.location || stop._location || null,
      }));
      set((s) => ({ stops: { ...s.stops, [dayId]: augmented } }));
      return augmented;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  createStop: async (data) => {
    try {
      const stop = await stopsApi.create(data);
      const dayId = stop.dayId ?? data.dayId;
      const augmented = { ...stop, _location: stop.location || data.location };
      set((s) => ({
        stops: { ...s.stops, [dayId]: [...(s.stops[dayId] || []), augmented] },
      }));
      return augmented;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateStop: async (stopId, dayId, data) => {
    try {
      const updated = await stopsApi.update(stopId, data);
      set((s) => ({
        stops: {
          ...s.stops,
          [dayId]: (s.stops[dayId] || []).map((st) => (st.stopId === stopId ? { ...updated, _location: data.location || st._location } : st)),
        },
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteStop: async (stopId, dayId) => {
    try {
      await stopsApi.remove(stopId);
      set((s) => ({
        stops: {
          ...s.stops,
          [dayId]: (s.stops[dayId] || []).filter((st) => st.stopId !== stopId),
        },
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  reorderStops: async (dayId, stopIds) => {
    try {
      const reordered = await stopsApi.reorder(dayId, stopIds);
      set((s) => ({ stops: { ...s.stops, [dayId]: reordered } }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  moveStop: async (stopId, { targetDayId, targetOrder }) => {
    try {
      const moved = await stopsApi.move(stopId, { targetDayId, targetOrder });
      set((s) => {
        const newStops = {};
        for (const [dId, list] of Object.entries(s.stops)) {
          newStops[dId] = list.filter((st) => st.stopId !== stopId);
        }
        const targetList = [...(newStops[targetDayId] || [])];
        targetList.splice(typeof targetOrder === 'number' ? targetOrder : targetList.length, 0, moved);
        newStops[targetDayId] = targetList;
        return { stops: newStops };
      });
      return moved;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchActivities: async (stopId) => {
    try {
      const list = await activitiesApi.getByStop(stopId);
      set((s) => ({ activities: { ...s.activities, [stopId]: list } }));
      return list;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  createActivity: async (data) => {
    try {
      const activity = await activitiesApi.create(data);
      const stopId = activity.stopId ?? data.stopId;
      set((s) => ({
        activities: { ...s.activities, [stopId]: [...(s.activities[stopId] || []), activity] },
      }));
      return activity;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateActivity: async (activityId, stopId, data) => {
    try {
      const updated = await activitiesApi.update(activityId, data);
      set((s) => ({
        activities: {
          ...s.activities,
          [stopId]: (s.activities[stopId] || []).map((a) => (a.activityId === activityId ? updated : a)),
        },
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteActivity: async (activityId, stopId) => {
    try {
      await activitiesApi.remove(activityId);
      set((s) => ({
        activities: {
          ...s.activities,
          [stopId]: (s.activities[stopId] || []).filter((a) => a.activityId !== activityId),
        },
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchRoutes: async (dayId) => {
    try {
      const list = await routesApi.getByDay(dayId);
      set((s) => ({ routes: { ...s.routes, [dayId]: list } }));
      return list;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  createRoute: async (dayId, data) => {
    try {
      const route = await routesApi.create(data);
      set((s) => ({
        routes: { ...s.routes, [dayId]: [...(s.routes[dayId] || []), route] },
      }));
      return route;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateRoute: async (routeId, dayId, data) => {
    try {
      const updated = await routesApi.update(routeId, data);
      set((s) => ({
        routes: {
          ...s.routes,
          [dayId]: (s.routes[dayId] || []).map((r) => (r.routeId === routeId ? updated : r)),
        },
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteRoute: async (routeId, dayId) => {
    try {
      await routesApi.remove(routeId);
      set((s) => ({
        routes: {
          ...s.routes,
          [dayId]: (s.routes[dayId] || []).filter((r) => r.routeId !== routeId),
        },
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteRoutesByDay: async (dayId) => {
    try {
      await routesApi.removeByDay(dayId);
      set((s) => ({ routes: { ...s.routes, [dayId]: [] } }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));

export default useTourStore;
