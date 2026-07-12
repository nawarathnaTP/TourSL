import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CreditCard, XCircle, CheckCircle, Eye } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import useBookingStore from '../store/bookingStore';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';

const statusConfig = {
  PENDING_PAYMENT: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  CONFIRMED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { myBookings, loading, fetchMyBookings, payBooking, cancelBooking } = useBookingStore();
  const toast = useToast();

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const handlePay = async (id) => {
    try {
      await payBooking(id);
      toast('Payment successful!', 'success');
    } catch {
      toast('Payment failed', 'error');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelBooking(id);
      toast('Booking cancelled', 'info');
    } catch {
      toast('Failed to cancel', 'error');
    }
  };

  return (
    <PageShell>
      <div className="w-full px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 mb-2">My Bookings</h1>
        <p className="text-sm text-neutral-500 mb-8">Track and manage your tour bookings</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} className="text-emerald-600" />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-200 rounded-2xl">
            <Calendar size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myBookings.map((booking) => {
              const config = statusConfig[booking.status] || { color: 'bg-neutral-50 text-neutral-500 border-neutral-200', icon: Clock };
              const StatusIcon = config.icon;
              return (
                <div key={booking.bookingId} className="p-6 rounded-2xl border border-neutral-100 animate-fade-up">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                        <StatusIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-950">
                          {booking.tourTitle || 'Booking'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {booking.slotsBooked} slot{booking.slotsBooked > 1 ? 's' : ''}
                          {booking.totalPrice && ` | $${booking.totalPrice} total`}
                        </p>
                        <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.color}`}>
                          {booking.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.tourId && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/tours/${booking.tourId}`)}>
                          <Eye size={14} />
                          View Tour
                        </Button>
                      )}
                      {booking.status === 'PENDING_PAYMENT' && (
                        <>
                          <Button size="sm" onClick={() => handlePay(booking.bookingId)}>
                            <CreditCard size={14} />
                            Pay Now
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(booking.bookingId)}>
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <Button variant="outline" size="sm" onClick={() => handleCancel(booking.bookingId)}>
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>

                  {booking.paymentDeadline && booking.status === 'PENDING_PAYMENT' && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg w-fit">
                      <Clock size={12} />
                      Pay before {new Date(booking.paymentDeadline).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
