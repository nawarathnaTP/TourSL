import { useEffect, useState } from 'react';
import { Calendar, Clock, XCircle, CheckCircle, CreditCard, Users } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import usePackageStore from '../store/packageStore';
import { bookingsApi } from '../api/client';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useToast } from '../components/shared/Toast';

const statusConfig = {
  PENDING_PAYMENT: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending Payment' },
  CONFIRMED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Confirmed' },
  CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, label: 'Cancelled' },
};

export default function GuideBookingsPage() {
  const { myPackages, fetchMyPackages } = usePackageStore();
  const toast = useToast();

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch packages, then fetch bookings for each package
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await fetchMyPackages();
      } catch {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchMyPackages]);

  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      if (myPackages.length === 0) {
        setAllBookings([]);
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.all(
          myPackages.map((pkg) =>
            bookingsApi.getByPackage(pkg.packageId).catch(() => [])
          )
        );
        if (!cancelled) {
          setAllBookings(results.flat());
        }
      } catch {
        if (!cancelled) setAllBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBookings();
    return () => { cancelled = true; };
  }, [myPackages]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await bookingsApi.cancel(cancelId);
      setAllBookings((prev) =>
        prev.map((b) => (b.bookingId === cancelId ? updated : b))
      );
      setCancelId(null);
      toast('Booking cancelled', 'success');
    } catch {
      toast('Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageShell>
      <div className="w-full px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Bookings Received</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage bookings from tourists on your tours</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} className="text-emerald-600" />
          </div>
        ) : allBookings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-200 rounded-2xl">
            <Users size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No bookings received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allBookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.CANCELLED;
              const StatusIcon = config.icon;
              return (
                <div key={booking.bookingId} className="p-6 rounded-2xl border border-neutral-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                        <StatusIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-950">
                          {booking.tourTitle || 'Tour Booking'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Tourist: {booking.touristId ? booking.touristId.slice(0, 8) + '...' : 'Unknown'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-neutral-500">
                            {booking.slotsBooked} slot{booking.slotsBooked > 1 ? 's' : ''}
                          </span>
                          {booking.totalPrice && (
                            <span className="text-xs font-medium text-neutral-700">
                              ${booking.totalPrice}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        {booking.bookedAt && (
                          <p className="text-[11px] text-neutral-400 mt-1.5">
                            Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {booking.status !== 'CANCELLED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelId(booking.bookingId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {booking.paymentDeadline && booking.status === 'PENDING_PAYMENT' && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                      <Clock size={12} />
                      Payment deadline: {new Date(booking.paymentDeadline).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? The reserved slots will be restored."
        confirmText="Cancel Booking"
        loading={cancelling}
      />
    </PageShell>
  );
}
