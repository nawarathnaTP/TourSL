import { create } from 'zustand';
import { packagesApi } from '../api/client.js';

const usePackageStore = create((set) => ({
  myPackages: [],
  publishedPackages: [],
  currentPackage: null,
  loading: false,
  error: null,

  fetchMyPackages: async () => {
    set({ loading: true, error: null });
    try {
      const pkgs = await packagesApi.getMyPackages();
      set({ myPackages: pkgs, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPublished: async () => {
    set({ loading: true, error: null });
    try {
      const pkgs = await packagesApi.getPublished();
      set({ publishedPackages: pkgs, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  getByTour: async (tourId) => {
    try {
      const pkg = await packagesApi.getByTour(tourId);
      set({ currentPackage: pkg });
      return pkg;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updatePackage: async (tourId, data) => {
    try {
      const updated = await packagesApi.update(tourId, data);
      set((s) => ({
        currentPackage: updated,
        myPackages: s.myPackages.map((p) => (p.tourId === tourId ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  publish: async (tourId) => {
    try {
      const updated = await packagesApi.publish(tourId);
      set((s) => ({
        currentPackage: updated,
        myPackages: s.myPackages.map((p) => (p.tourId === tourId ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  unpublish: async (tourId) => {
    try {
      const updated = await packagesApi.unpublish(tourId);
      set((s) => ({
        currentPackage: updated,
        myPackages: s.myPackages.map((p) => (p.tourId === tourId ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  cancelPackage: async (tourId) => {
    try {
      const updated = await packagesApi.cancel(tourId);
      set((s) => ({
        currentPackage: updated,
        myPackages: s.myPackages.map((p) => (p.tourId === tourId ? updated : p)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));

export default usePackageStore;
