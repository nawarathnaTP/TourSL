import { create } from 'zustand';
import { bookingsApi } from '../api/client.js';

const useBookingStore = create((set) => ({
  myBookings: [],
  packageBookings: [],
  loading: false,
  error: null,

  fetchMyBookings: async () => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingsApi.getMyBookings();
      set({ myBookings: bookings, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPackageBookings: async (packageId) => {
    set({ loading: true, error: null });
    try {
      const bookings = await bookingsApi.getByPackage(packageId);
      set({ packageBookings: bookings, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createBooking: async (data) => {
    try {
      const booking = await bookingsApi.create(data);
      set((s) => ({ myBookings: [...s.myBookings, booking] }));
      return booking;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  payBooking: async (bookingId) => {
    try {
      const updated = await bookingsApi.pay(bookingId);
      set((s) => ({
        myBookings: s.myBookings.map((b) => (b.bookingId === bookingId ? updated : b)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const updated = await bookingsApi.cancel(bookingId);
      set((s) => ({
        myBookings: s.myBookings.map((b) => (b.bookingId === bookingId ? updated : b)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));

export default useBookingStore;
