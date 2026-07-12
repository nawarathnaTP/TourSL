import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Clock, Trash2, ChevronDown, ChevronUp, Route, Activity, Calendar, Search, Star, Check, Loader2, Eye, EyeOff, Settings, DollarSign, Users, Car, Train, Footprints, Navigation } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import useAuthStore from '../store/authStore';
import useTourStore from '../store/tourStore';
import usePackageStore from '../store/packageStore';
import { placesApi, directionsApi } from '../api/client';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Spinner from '../components/shared/Spinner';
import { useToast } from '../components/shared/Toast';

function StopCard({ stop, dayId, onEdit, onDelete, onAddActivity, readOnly }) {
  const [expanded, setExpanded] = useState(false);
  const { activities, fetchActivities, deleteActivity } = useTourStore();
  const stopActivities = activities[stop.stopId] || [];
  const toast = useToast();

  useEffect(() => {
    if (expanded && !activities[stop.stopId]) {
      fetchActivities(stop.stopId);
    }
  }, [expanded, stop.stopId, activities, fetchActivities]);

  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={14} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-neutral-950 truncate">
            {stop._location?.placeName || `Stop ${(stop.stopOrder ?? 0) + 1}`}
          </h4>
          {stop.duration && (
            <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
              <Clock size={10} />
              {stop.duration} min
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors duration-200"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!readOnly && (
            <button
              onClick={() => onDelete(stop.stopId)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors duration-200"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-50">
          <div className="flex items-center justify-between mt-3 mb-2">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Activities</span>
            {!readOnly && (
              <button
                onClick={() => onAddActivity(stop.stopId)}
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors duration-200"
              >
                + Add
              </button>
            )}
          </div>
          {stopActivities.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">No activities yet</p>
          ) : (
            <div className="space-y-2">
              {stopActivities.map((act) => (
                <div key={act.activityId} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                  <div>
                    <span className="text-xs font-medium text-neutral-900">{act.description || 'Activity'}</span>
                    {act.duration && <span className="text-xs text-neutral-400 ml-2">{act.duration} min</span>}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={async () => {
                        await deleteActivity(act.activityId, stop.stopId);
                        toast('Activity removed', 'success');
                      }}
                      className="p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddStopModal({ open, onClose, dayId, dayStopsCount }) {
  const { createStop } = useTourStore();
  const toast = useToast();

  // Step 1: search, Step 2: configure selected place
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [stopOrder, setStopOrder] = useState('');
  const [duration, setDuration] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('search');
      setQuery('');
      setSearchResults([]);
      setSearching(false);
      setSearched(false);
      setSelectedPlace(null);
      setStopOrder('');
      setDuration('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await placesApi.search({ query: query.trim(), max_results: 10 });
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
      toast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setStep('configure');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createStop({
        dayId,
        location: {
          externalId: selectedPlace.id,
          placeName: selectedPlace.name,
          latitude: selectedPlace.location?.latitude,
          longitude: selectedPlace.location?.longitude,
          imageUrl: selectedPlace.photo_url || null,
        },
        stopOrder: stopOrder ? parseInt(stopOrder) : dayStopsCount + 1,
        duration: duration ? parseInt(duration) : 60,
      });
      toast('Stop added', 'success');
      onClose();
    } catch {
      toast('Failed to add stop', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={step === 'search' ? 'Add Stop — Search Place' : 'Add Stop — Configure'} maxWidth="max-w-xl">
      {step === 'search' && (
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places... e.g. 'Sigiriya Rock Fortress'"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 transition-colors duration-200 hover:border-neutral-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Button type="submit" size="sm" loading={searching}>Search</Button>
          </form>

          {/* Results */}
          {searching && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-emerald-600" />
            </div>
          )}

          {!searching && searched && searchResults.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-6">No places found. Try a different search.</p>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {searchResults.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200 text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                    <img
                      src={place.photo_url || `https://placehold.co/96x96/e5e5e5/737373?text=No+img`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-950 truncate">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{place.address}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {place.rating && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500">
                          <Star size={10} className="text-emerald-600 fill-emerald-600" />
                          {place.rating}
                        </span>
                      )}
                      {place.types?.slice(0, 2).map((type) => (
                        <span key={type} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <MapPin size={14} className="text-neutral-300 shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'configure' && selectedPlace && (
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          {/* Selected place preview */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
              <img
                src={selectedPlace.photo_url || `https://placehold.co/112x112/e5e5e5/737373?text=No+img`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-950">{selectedPlace.name}</p>
              {selectedPlace.address && (
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{selectedPlace.address}</p>
              )}
              {selectedPlace.rating && (
                <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500 mt-1">
                  <Star size={10} className="text-emerald-600 fill-emerald-600" />
                  {selectedPlace.rating}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep('search')}
              className="text-xs text-emerald-600 font-medium hover:text-emerald-700 shrink-0"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stop Order"
              type="number"
              min="1"
              placeholder={String(dayStopsCount + 1)}
              value={stopOrder}
              onChange={(e) => setStopOrder(e.target.value)}
            />
            <Input
              label="Duration (min)"
              type="number"
              min="1"
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <Button type="submit" loading={creating}>
            <Check size={14} />
            Add Stop
          </Button>
        </form>
      )}
    </Modal>
  );
}

const TRAVEL_MODE_META = {
  DRIVE: { icon: Car, label: 'Drive', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  TRANSIT: { icon: Train, label: 'Transit', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  WALK: { icon: Footprints, label: 'Walk', color: 'text-amber-600 bg-amber-50 border-amber-200' },
};

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatDistance(meters) {
  if (!meters) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

function RouteConnector({ fromStop, toStop, existingRoute, dayId, onDeleteRoute, readOnly }) {
  const [showPicker, setShowPicker] = useState(false);

  if (!fromStop?._location || !toStop?._location) {
    return (
      <div className="flex justify-center py-1">
        <div className="w-px h-6 bg-neutral-200" />
      </div>
    );
  }

  if (existingRoute) {
    const mode = existingRoute.transport?.type || 'DRIVE';
    const meta = TRAVEL_MODE_META[mode] || TRAVEL_MODE_META.DRIVE;
    const Icon = meta.icon;
    return (
      <div className="flex items-center justify-center py-1.5 group">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-100 bg-neutral-50/50 group-hover:border-neutral-200 transition-colors duration-200">
          <Icon size={13} className={meta.color.split(' ')[0]} />
          <span className="text-[11px] font-medium text-neutral-600">{meta.label}</span>
          {existingRoute.time && (
            <span className="text-[11px] text-neutral-400">{formatDuration(existingRoute.time)}</span>
          )}
          {existingRoute.distance && (
            <span className="text-[11px] text-neutral-400">· {formatDistance(Number(existingRoute.distance))}</span>
          )}
          {!readOnly && (
            <button
              onClick={() => onDeleteRoute(existingRoute.routeId)}
              className="p-0.5 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex justify-center py-1">
        <div className="w-px h-6 bg-neutral-200" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center py-1.5">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-200 text-neutral-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors duration-200"
        >
          <Navigation size={11} />
          <span className="text-[11px] font-medium">Add Route</span>
        </button>
      </div>

      <RoutePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        fromStop={fromStop}
        toStop={toStop}
        dayId={dayId}
      />
    </>
  );
}

function RoutePickerModal({ open, onClose, fromStop, toStop, dayId }) {
  const { createRoute } = useTourStore();
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!open) return;
    setOptions([]);
    setLoading(true);
    directionsApi.getDirections(
      { lat: fromStop._location.latitude, lng: fromStop._location.longitude },
      { lat: toStop._location.latitude, lng: toStop._location.longitude },
    ).then((data) => {
      setOptions(data.options || []);
    }).catch(() => {
      toast('Failed to fetch route options', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [open, fromStop, toStop, toast]);

  const handleSelect = async (option) => {
    setSaving(option.travel_mode);
    try {
      await createRoute(dayId, {
        startStopId: fromStop.stopId,
        endStopId: toStop.stopId,
        transportType: option.travel_mode,
        transportLabel: TRAVEL_MODE_META[option.travel_mode]?.label || option.travel_mode,
        distance: option.distance_meters,
        time: option.duration_seconds,
        polyline: option.polyline || null,
      });
      toast('Route added', 'success');
      onClose();
    } catch {
      toast('Failed to save route', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Choose Route" maxWidth="max-w-md">
      <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
        <MapPin size={12} className="text-emerald-600" />
        <span className="font-medium text-neutral-700 truncate">{fromStop._location?.placeName}</span>
        <span className="text-neutral-300">→</span>
        <MapPin size={12} className="text-emerald-600" />
        <span className="font-medium text-neutral-700 truncate">{toStop._location?.placeName}</span>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
        </div>
      )}

      {!loading && options.length === 0 && (
        <p className="text-sm text-neutral-400 text-center py-8">No route options available</p>
      )}

      {!loading && options.length > 0 && (
        <div className="space-y-2">
          {options.map((option) => {
            const meta = TRAVEL_MODE_META[option.travel_mode] || TRAVEL_MODE_META.DRIVE;
            const Icon = meta.icon;
            const isSaving = saving === option.travel_mode;
            return (
              <button
                key={option.travel_mode}
                onClick={() => handleSelect(option)}
                disabled={!!saving}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 text-left ${meta.color} hover:opacity-90 disabled:opacity-50`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/60 shrink-0">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {formatDuration(option.duration_seconds)}
                    {option.distance_meters ? ` · ${formatDistance(option.distance_meters)}` : ''}
                  </p>
                </div>
                {option.summary && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/50 shrink-0">{option.summary}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function DayPanel({ day, index, readOnly }) {
  const { stops, fetchStops, deleteStop, routes, fetchRoutes, deleteRoute } = useTourStore();
  const dayStops = (stops[day.dayId] || []).slice().sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
  const dayRoutes = routes[day.dayId] || [];
  const [showAddStop, setShowAddStop] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(null);
  const [actForm, setActForm] = useState({ description: '', duration: '' });
  const [creating, setCreating] = useState(false);
  const { createActivity } = useTourStore();
  const toast = useToast();

  useEffect(() => {
    fetchStops(day.dayId);
    fetchRoutes(day.dayId);
  }, [day.dayId, fetchStops, fetchRoutes]);

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createActivity({
        stopId: showAddActivity,
        duration: actForm.duration ? parseInt(actForm.duration) : undefined,
        description: actForm.description || undefined,
      });
      setShowAddActivity(null);
      setActForm({ description: '', duration: '' });
      toast('Activity added', 'success');
    } catch {
      toast('Failed to add activity', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    try {
      await deleteStop(stopId, day.dayId);
      toast('Stop removed', 'success');
    } catch {
      toast('Failed to delete stop', 'error');
    }
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      await deleteRoute(routeId, day.dayId);
      toast('Route removed', 'success');
    } catch {
      toast('Failed to delete route', 'error');
    }
  };

  const findRouteBetween = (fromStopId, toStopId) =>
    dayRoutes.find((r) => r.startStopId === fromStopId && r.endStopId === toStopId);

  return (
    <div className="border border-neutral-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Day {index + 1}</h3>
          {day.date && <p className="text-xs text-neutral-400 mt-0.5">{new Date(day.date).toLocaleDateString()}</p>}
        </div>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => setShowAddStop(true)}>
            <Plus size={14} />
            Stop
          </Button>
        )}
      </div>

      <div className="p-4 space-y-0">
        {dayStops.length === 0 ? (
          <div className="text-center py-8">
            <MapPin size={24} className="text-neutral-200 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No stops yet</p>
          </div>
        ) : (
          dayStops.map((stop, idx) => (
            <div key={stop.stopId}>
              <StopCard
                stop={stop}
                dayId={day.dayId}
                onDelete={handleDeleteStop}
                onAddActivity={setShowAddActivity}
                readOnly={readOnly}
              />
              {idx < dayStops.length - 1 && (
                <RouteConnector
                  fromStop={stop}
                  toStop={dayStops[idx + 1]}
                  existingRoute={findRouteBetween(stop.stopId, dayStops[idx + 1].stopId)}
                  dayId={day.dayId}
                  onDeleteRoute={handleDeleteRoute}
                  readOnly={readOnly}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Stop Modal — search + configure */}
      {!readOnly && (
        <>
          <AddStopModal
            open={showAddStop}
            onClose={() => setShowAddStop(false)}
            dayId={day.dayId}
            dayStopsCount={dayStops.length}
          />

          {/* Add Activity Modal */}
          <Modal open={!!showAddActivity} onClose={() => setShowAddActivity(null)} title="Add Activity">
            <form onSubmit={handleAddActivity} className="flex flex-col gap-4">
              <Input
                label="Description"
                placeholder="e.g. Guided tour of ruins"
                value={actForm.description}
                onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                required
              />
              <Input
                label="Duration (minutes)"
                type="number"
                placeholder="60"
                value={actForm.duration}
                onChange={(e) => setActForm({ ...actForm, duration: e.target.value })}
              />
              <Button type="submit" loading={creating}>Add Activity</Button>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}

const pkgStatusColors = {
  DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

function PackagePanel({ tourId }) {
  const { currentPackage, getByTour, updatePackage, publish, unpublish, cancelPackage } = usePackageStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [pkgForm, setPkgForm] = useState({ description: '', coverImageUrl: '', maxSlots: '', pricePerSlot: '' });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getByTour(tourId)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tourId, getByTour]);

  useEffect(() => {
    if (currentPackage) {
      setPkgForm({
        description: currentPackage.description || '',
        coverImageUrl: currentPackage.coverImageUrl || '',
        maxSlots: currentPackage.maxSlots?.toString() || '',
        pricePerSlot: currentPackage.pricePerSlot?.toString() || '',
      });
    }
  }, [currentPackage]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePackage(tourId, {
        description: pkgForm.description || undefined,
        coverImageUrl: pkgForm.coverImageUrl || undefined,
        maxSlots: pkgForm.maxSlots ? parseInt(pkgForm.maxSlots) : undefined,
        pricePerSlot: pkgForm.pricePerSlot ? parseFloat(pkgForm.pricePerSlot) : undefined,
      });
      setShowSettings(false);
      toast('Package updated', 'success');
    } catch {
      toast('Failed to update package', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publish(tourId);
      toast('Tour published!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to publish', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      await unpublish(tourId);
      toast('Tour unpublished', 'info');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to unpublish', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return null;

  const pkg = currentPackage;
  const status = pkg?.status || 'DRAFT';
  const isPublished = pkg?.isPublished || status === 'PUBLISHED';

  return (
    <>
      <div className="p-5 rounded-2xl border border-neutral-100 bg-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${pkgStatusColors[status]}`}>
              {status}
            </span>
            {pkg && (
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Users size={12} />{pkg.availableSlots ?? '?'} / {pkg.maxSlots ?? '?'} slots</span>
                {pkg.pricePerSlot && <span className="flex items-center gap-1"><DollarSign size={12} />${pkg.pricePerSlot} / person</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings size={14} />
              Package Settings
            </Button>
            {status !== 'CANCELLED' && (
              isPublished ? (
                <Button variant="outline" size="sm" onClick={handleUnpublish} loading={publishing}>
                  <EyeOff size={14} />
                  Unpublish
                </Button>
              ) : (
                <Button size="sm" onClick={handlePublish} loading={publishing}>
                  <Eye size={14} />
                  Publish
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Package Settings">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Description" placeholder="Describe your tour package..." value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
          <Input label="Cover Image URL" placeholder="https://..." value={pkgForm.coverImageUrl} onChange={(e) => setPkgForm({ ...pkgForm, coverImageUrl: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Slots" type="number" min="1" placeholder="10" value={pkgForm.maxSlots} onChange={(e) => setPkgForm({ ...pkgForm, maxSlots: e.target.value })} />
            <Input label="Price Per Slot ($)" type="number" min="0" step="0.01" placeholder="50.00" value={pkgForm.pricePerSlot} onChange={(e) => setPkgForm({ ...pkgForm, pricePerSlot: e.target.value })} />
          </div>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Modal>
    </>
  );
}

export default function TourPlannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTour, days, loading, loadTour } = useTourStore();
  const isGuide = user?.role === 'GUIDE';
  const isOwner = user && currentTour && user.id === currentTour.userId;

  useEffect(() => {
    loadTour(id);
  }, [id, loadTour]);

  if (loading || !currentTour) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size={32} className="text-emerald-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">
              {currentTour.title || `Tour #${currentTour.tourId}`}
            </h1>
            <p className="text-sm text-neutral-500">
              {currentTour.startDay && new Date(currentTour.startDay).toLocaleDateString()}
              {currentTour.endDay && ` - ${new Date(currentTour.endDay).toLocaleDateString()}`}
              {days.length > 0 && ` | ${days.length} days`}
            </p>
          </div>
        </div>

        {/* Package management for guides */}
        {isOwner && isGuide && <PackagePanel tourId={id} />}

        {/* Days */}
        {days.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-200 rounded-2xl">
            <Calendar size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-500">No days in this tour yet</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {days.map((day, i) => (
              <DayPanel key={day.dayId} day={day} index={i} readOnly={!isOwner} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
