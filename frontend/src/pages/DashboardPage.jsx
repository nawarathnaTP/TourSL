import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Package, Compass, MapPin, Calendar, ArrowRight, Clock, Trash2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import useAuthStore from '../store/authStore';
import useTourStore from '../store/tourStore';
import useBookingStore from '../store/bookingStore';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';

const bookingStatusConfig = {
  PENDING_PAYMENT: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  CONFIRMED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

function TourCard({ tour, onDelete }) {
  const navigate = useNavigate();
  const startDate = tour.startDay ? new Date(tour.startDay).toLocaleDateString() : 'No date';
  const endDate = tour.endDay ? new Date(tour.endDay).toLocaleDateString() : '';
  const dayCount = tour.days?.length || '?';

  return (
    <div className="group p-5 rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <MapPin size={18} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">
              {tour.title || `Tour #${tour.tourId}`}
            </h3>
            <p className="text-xs text-neutral-400">{dayCount} days</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(tour.tourId); }}
          className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
        <Calendar size={12} />
        <span>{startDate}{endDate ? ` — ${endDate}` : ''}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => navigate(`/tours/${tour.tourId}`)}
      >
        View Tour
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}

function BookingCard({ booking, onPay, onCancel }) {
  const config = bookingStatusConfig[booking.status] || { color: 'bg-neutral-50 text-neutral-500 border-neutral-200', icon: Clock };
  const StatusIcon = config.icon;

  return (
    <div className="p-5 rounded-2xl border border-neutral-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.color}`}>
            <StatusIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">
              {booking.tourTitle || 'Booking'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {booking.slotsBooked} slot{booking.slotsBooked > 1 ? 's' : ''}
              {booking.totalPrice && ` | $${booking.totalPrice}`}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${config.color}`}>
          {booking.status?.replace('_', ' ')}
        </span>
      </div>

      {booking.paymentDeadline && booking.status === 'PENDING_PAYMENT' && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg w-fit">
          <Clock size={12} />
          Pay by {new Date(booking.paymentDeadline).toLocaleString()}
        </div>
      )}

      <div className="flex items-center gap-2">
        {booking.status === 'PENDING_PAYMENT' && (
          <>
            <Button size="sm" onClick={() => onPay(booking.bookingId)}>
              <CreditCard size={14} />
              Pay Now
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onCancel(booking.bookingId)}>
              Cancel
            </Button>
          </>
        )}
        {booking.status === 'CONFIRMED' && (
          <Button variant="outline" size="sm" onClick={() => onCancel(booking.bookingId)}>
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { tours, loading: toursLoading, fetchMyTours, createTour, deleteTour } = useTourStore();
  const { myBookings, loading: bookingsLoading, fetchMyBookings, payBooking, cancelBooking } = useBookingStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('tours');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.role === 'GUIDE') {
      navigate('/guide/tours', { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    fetchMyTours();
    fetchMyBookings();
  }, [fetchMyTours, fetchMyBookings]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tour = await createTour({ title, startDay: startDate, endDay: endDate });
      setShowCreate(false);
      setTitle('');
      setStartDate('');
      setEndDate('');
      toast('Tour created', 'success');
      navigate(`/tours/${tour.tourId}`);
    } catch {
      toast('Failed to create tour', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTour(deleteId);
      setDeleteId(null);
      toast('Tour deleted', 'success');
    } catch {
      toast('Failed to delete tour', 'error');
    } finally {
      setDeleting(false);
    }
  };

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
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Welcome, {user?.firstName || 'there'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Plan your own tours, browse packages, and discover Sri Lanka
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => setShowCreate(true)}
            className="group p-5 rounded-2xl border border-neutral-100 hover:border-emerald-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Plus size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-950 mb-1">Create Tour</h3>
            <p className="text-xs text-neutral-400">Plan your own custom Sri Lanka itinerary</p>
          </button>
          <Link to="/browse" className="group p-5 rounded-2xl border border-neutral-100 hover:border-emerald-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Package size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-950 mb-1">Browse Tours</h3>
            <p className="text-xs text-neutral-400">Find and book guided tour packages</p>
          </Link>
          <Link to="/discover" className="group p-5 rounded-2xl border border-neutral-100 hover:border-emerald-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Compass size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-950 mb-1">Discover Sri Lanka</h3>
            <p className="text-xs text-neutral-400">Search attractions, temples, beaches, and more</p>
          </Link>
        </div>

        {/* Manage Tours section */}
        <section>
          <div className="flex items-center gap-1 mb-6 border-b border-neutral-100">
            <button
              onClick={() => setActiveTab('tours')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px ${
                activeTab === 'tours'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              My Tours ({tours.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px ${
                activeTab === 'bookings'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              My Bookings ({myBookings.length})
            </button>
          </div>

          {activeTab === 'tours' && (
            <>
              {toursLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size={28} className="text-emerald-600" />
                </div>
              ) : tours.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl">
                  <MapPin size={32} className="text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 mb-4">No tours yet. Create your first itinerary!</p>
                  <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                    <Plus size={14} />
                    Create Tour
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tours.map((tour) => (
                    <TourCard key={tour.tourId} tour={tour} onDelete={setDeleteId} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'bookings' && (
            <>
              {bookingsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size={28} className="text-emerald-600" />
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl">
                  <Package size={32} className="text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 mb-4">No bookings yet</p>
                  <Link to="/browse">
                    <Button variant="outline" size="sm">Browse Available Tours</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBookings.map((b) => (
                    <BookingCard key={b.bookingId} booking={b} onPay={handlePay} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Create Tour Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Tour">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Tour Title" placeholder="e.g. Southern Coast Adventure" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          <Button type="submit" loading={creating} className="mt-2">Create Tour</Button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Tour"
        message="Are you sure? This will permanently delete the tour and all its data."
        confirmText="Delete"
        loading={deleting}
      />
    </PageShell>
  );
}
