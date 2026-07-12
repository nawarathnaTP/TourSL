import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Star, ArrowRight, Eye } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import usePackageStore from '../store/packageStore';
import useBookingStore from '../store/bookingStore';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';

function getDayCount(pkg) {
  if (pkg.startDay && pkg.endDay) {
    const start = new Date(pkg.startDay);
    const end = new Date(pkg.endDay);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : '?';
  }
  return '?';
}

function PackageBrowseCard({ pkg, onBook, onViewTour }) {
  return (
    <div className="group rounded-2xl border border-neutral-100 overflow-hidden hover:border-neutral-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
        <img
          src={pkg.coverImageUrl || `https://placehold.co/600x400/171717/10b981?text=Tour+${pkg.tourId || ''}`}
          alt="Tour"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-semibold text-neutral-950 mb-1">
          {pkg.tourTitle || `Sri Lanka Tour`}
        </h3>
        <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
          {pkg.description || 'Experience the beauty of Sri Lanka with an expert local guide.'}
        </p>

        <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {getDayCount(pkg)} days
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {pkg.availableSlots ?? '?'} spots left
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-neutral-950">
              ${pkg.pricePerSlot || '?'}
            </span>
            <span className="text-xs text-neutral-400 ml-1">/ person</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onViewTour(pkg.tourId)}>
              <Eye size={14} />
              View Tour
            </Button>
            <Button size="sm" onClick={() => onBook(pkg)}>
              Book Now
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePackagesPage() {
  const navigate = useNavigate();
  const { publishedPackages, loading, fetchPublished } = usePackageStore();
  const { createBooking } = useBookingStore();
  const toast = useToast();

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [slots, setSlots] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      await createBooking({ packageId: selectedPkg.packageId, slotsBooked: parseInt(slots) });
      toast('Booking created! Pay within 15 minutes to confirm.', 'success');
      setSelectedPkg(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <PageShell>
      <div className="w-full px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Browse Tours</h1>
          <p className="text-sm text-neutral-500 mt-1">Find and book your perfect Sri Lanka adventure</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-emerald-600" />
          </div>
        ) : publishedPackages.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-200 rounded-2xl">
            <MapPin size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No tours available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedPackages.map((pkg) => (
              <PackageBrowseCard key={pkg.packageId || pkg.tourId} pkg={pkg} onBook={setSelectedPkg} onViewTour={(tourId) => navigate(`/tours/${tourId}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal open={!!selectedPkg} onClose={() => setSelectedPkg(null)} title="Book Tour" maxWidth="max-w-sm">
        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-neutral-50">
            <p className="text-sm font-semibold text-neutral-950">
              {selectedPkg?.tourTitle || 'Tour Package'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              ${selectedPkg?.pricePerSlot || '?'} per person
            </p>
          </div>
          <Input
            label="Number of Slots"
            type="number"
            min="1"
            max={selectedPkg?.availableSlots || 10}
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            required
          />
          <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700">
            Total: <span className="font-bold">${(selectedPkg?.pricePerSlot || 0) * slots}</span>
            <span className="block mt-1 text-emerald-600">15-minute payment window after booking</span>
          </div>
          <Button type="submit" loading={booking}>Confirm Booking</Button>
        </form>
      </Modal>
    </PageShell>
  );
}
