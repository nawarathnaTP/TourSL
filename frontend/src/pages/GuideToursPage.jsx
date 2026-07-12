import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Trash2, ArrowRight, EyeOff } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import useAuthStore from '../store/authStore';
import useTourStore from '../store/tourStore';
import usePackageStore from '../store/packageStore';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';

const statusColors = {
  DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

function GuideTourCard({ tour, pkg, onDelete, onUnpublish }) {
  const navigate = useNavigate();
  const startDate = tour.startDay ? new Date(tour.startDay).toLocaleDateString() : 'No date';
  const endDate = tour.endDay ? new Date(tour.endDay).toLocaleDateString() : '';
  const dayCount = tour.days?.length || '?';
  const status = pkg?.status || 'DRAFT';

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
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusColors[status]}`}>
            {status}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(tour.tourId); }}
            className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
        <Calendar size={12} />
        <span>{startDate}{endDate ? ` — ${endDate}` : ''}</span>
      </div>

      {pkg && (
        <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
          <span>{pkg.availableSlots ?? '?'} / {pkg.maxSlots ?? '?'} slots</span>
          {pkg.pricePerSlot && <span>${pkg.pricePerSlot} / person</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/tours/${tour.tourId}`)}
        >
          Open Tour
          <ArrowRight size={14} />
        </Button>
        {status === 'PUBLISHED' && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onUnpublish(tour.tourId); }}
          >
            <EyeOff size={14} />
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}

export default function GuideToursPage() {
  const { user } = useAuthStore();
  const { tours, loading, fetchMyTours, createTour, deleteTour } = useTourStore();
  const { myPackages, fetchMyPackages, unpublish } = usePackageStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMyTours();
    fetchMyPackages();
  }, [fetchMyTours, fetchMyPackages]);

  // Map tourId → package for quick lookup
  const pkgByTour = {};
  myPackages.forEach((p) => { pkgByTour[p.tourId] = p; });

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

  const handleUnpublish = async (tourId) => {
    try {
      await unpublish(tourId);
      await fetchMyPackages();
      toast('Tour unpublished', 'info');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to unpublish', 'error');
    }
  };

  return (
    <PageShell>
      <div className="w-full px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">My Tours</h1>
            <p className="text-sm text-neutral-500 mt-1">Create and manage your tour packages</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Tour
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} className="text-emerald-600" />
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-200 rounded-2xl">
            <MapPin size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">No tours yet. Create your first tour!</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create Tour
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map((tour) => (
              <GuideTourCard
                key={tour.tourId}
                tour={tour}
                pkg={pkgByTour[tour.tourId]}
                onDelete={setDeleteId}
                onUnpublish={handleUnpublish}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Tour">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Tour Title" placeholder="e.g. Cultural Triangle Adventure" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          <Button type="submit" loading={creating} className="mt-2">Create Tour</Button>
        </form>
      </Modal>

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
