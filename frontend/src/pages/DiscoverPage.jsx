import { useState } from 'react';
import { Search, MapPin, Star, Navigation, Loader2, ChevronDown, ChevronUp, MapPinned, Tag } from 'lucide-react';
import PageShell from '../components/Layout/PageShell';
import { placesApi } from '../api/client';
import Button from '../components/shared/Button';

function PlaceCard({ place, isExpanded, onToggle }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer ${
        isExpanded
          ? 'border-emerald-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          : 'border-neutral-100 hover:border-neutral-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
      }`}
      onClick={onToggle}
    >
      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
        <img
          src={place.photo_url || `https://placehold.co/400x300/171717/10b981?text=${encodeURIComponent(place.name?.slice(0, 12) || 'Place')}`}
          alt={place.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isExpanded ? 'scale-105' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {place.rating && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-900">
              <Star size={10} className="text-emerald-600 fill-emerald-600" />
              {place.rating}
              {place.user_rating_count && (
                <span className="text-neutral-400 font-normal">({place.user_rating_count.toLocaleString()})</span>
              )}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm text-neutral-600">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-neutral-950 mb-1">{place.name}</h3>
        {place.address && (
          <p className="text-xs text-neutral-400 flex items-start gap-1">
            <MapPin size={10} className="shrink-0 mt-0.5" />
            <span className={isExpanded ? '' : 'line-clamp-2'}>{place.address}</span>
          </p>
        )}
        {!isExpanded && place.types?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {place.types.slice(0, 3).map((type) => (
              <span
                key={type}
                className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-medium text-neutral-600"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-neutral-100 pt-4 flex flex-col gap-3">
          {place.rating && (
            <div className="flex items-center gap-2">
              <Star size={14} className="text-emerald-600 fill-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-neutral-900">{place.rating} / 5</p>
                {place.user_rating_count && (
                  <p className="text-[11px] text-neutral-400">{place.user_rating_count.toLocaleString()} reviews</p>
                )}
              </div>
            </div>
          )}
          {place.location && (
            <div className="flex items-center gap-2">
              <MapPinned size={14} className="text-neutral-400" />
              <p className="text-xs text-neutral-500">
                {place.location.latitude?.toFixed(5)}, {place.location.longitude?.toFixed(5)}
              </p>
            </div>
          )}
          {place.types?.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag size={14} className="text-neutral-400 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {place.types.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-medium text-emerald-700"
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [nearbyResults, setNearbyResults] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setExpandedId(null);
    try {
      const data = await placesApi.search({ query: query.trim(), max_results: 20 });
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNearby = () => {
    if (!navigator.geolocation) return;
    setNearbyLoading(true);
    setExpandedId(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await placesApi.nearby({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            radius: 10000,
            max_results: 12,
          });
          setNearbyResults(data.results || []);
        } catch {
          setNearbyResults([]);
        } finally {
          setNearbyLoading(false);
        }
      },
      () => setNearbyLoading(false)
    );
  };

  return (
    <PageShell>
      <div className="w-full px-6 py-10">
        {/* Search header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 mb-1">Discover Sri Lanka</h1>
          <p className="text-sm text-neutral-500 mb-6">Search for attractions, temples, beaches, and more</p>

          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places... e.g. 'temples in Kandy'"
                className="w-full pl-11 pr-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 transition-colors duration-200 hover:border-neutral-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Button type="submit" loading={loading}>Search</Button>
            <Button variant="outline" type="button" onClick={handleNearby} loading={nearbyLoading}>
              <Navigation size={14} />
              Nearby
            </Button>
          </form>
        </div>

        {/* Search results */}
        {searched && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-neutral-950 mb-4">
              Search Results {results.length > 0 && `(${results.length})`}
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-emerald-600" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl">
                <Search size={32} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No results found. Try a different search term.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {results.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isExpanded={expandedId === place.id}
                    onToggle={() => toggleExpand(place.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Nearby results */}
        {nearbyResults.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-950 mb-4">Nearby Places</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nearbyResults.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isExpanded={expandedId === place.id}
                  onToggle={() => toggleExpand(place.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state when nothing searched yet */}
        {!searched && nearbyResults.length === 0 && (
          <div className="text-center py-20">
            <MapPin size={40} className="text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 text-sm">Search for a place or tap Nearby to explore around you</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
