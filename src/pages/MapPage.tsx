import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bus, MapPin, Search, AlertCircle } from 'lucide-react';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTheme } from '../context/ThemeContext';
import { findBusRoute, type MockBusRoute } from '../data/mockBusRoutes';
import { useImportedRoutes } from '../context/ImportedRoutesContext';
import type { ImportedRoute } from '../types';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];
const ROUTE_COLOR = '#0ea5e9';

/** Convert a stop to a display name. */
function stopName(stop: string | { name: string }): string {
  return typeof stop === 'string' ? stop : stop.name;
}

/**
 * A display-oriented route that can come from either mock data or imported data.
 * When coordinates aren't available (imported data), we show a card-only view.
 */
type DisplayRoute = MockBusRoute | (ImportedRoute & { coordinates: [number, number][] });

function hasCoords(route: DisplayRoute): route is MockBusRoute {
  return route.coordinates.length > 0;
}

// Pans/zooms the map: fits the active route's bounds, or recenters on Chennai.
function MapController({ route }: { route: DisplayRoute | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && hasCoords(route)) {
      map.fitBounds(route.coordinates, { padding: [48, 48], animate: true });
    } else {
      map.setView(CHENNAI_CENTER, 12, { animate: true });
    }
  }, [route, map]);
  return null;
}

function RouteInfoCard({ route }: { route: DisplayRoute }) {
  // Determine the display values — imported routes have these fields directly
  const startPoint = 'source' in route ? route.source : (route as MockBusRoute).startPoint;
  const endPoint = 'destination' in route ? route.destination : (route as MockBusRoute).endPoint;
  const routeName = 'routeName' in route ? route.routeName : (route as MockBusRoute).routeName;
  const distance = 'distance' in route ? route.distance : null;
  const duration = 'estimatedDuration' in route ? route.estimatedDuration : null;

  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
          <Bus size={18} />
        </span>
        <div>
          <div className="text-lg font-bold text-[#E2E8F0]">{route.busNumber}</div>
          <div className="text-xs text-[#94A3B8]">{routeName}</div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Starting Point</dt>
          <dd className="font-semibold text-[#E2E8F0]">{startPoint}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Destination</dt>
          <dd className="font-semibold text-[#E2E8F0]">{endPoint}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Total Stops</dt>
          <dd className="font-semibold text-[#E2E8F0]">{route.stops.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Bus Number</dt>
          <dd className="font-semibold text-[#E2E8F0]">{route.busNumber}</dd>
        </div>
        {distance && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Distance</dt>
            <dd className="font-semibold text-[#E2E8F0]">{distance}</dd>
          </div>
        )}
        {duration && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#94A3B8]">Est. Duration</dt>
            <dd className="font-semibold text-[#E2E8F0]">{duration}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-[#94A3B8]">Stops</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {route.stops.map((stop) => (
            <span
              key={stopName(stop)}
              className="rounded-full border border-[#1E293B] bg-[#11203b] px-2.5 py-1 text-xs text-[#E2E8F0]"
            >
              {stopName(stop)}
            </span>
          ))}
        </div>
      </div>

      {!hasCoords(route) && (
        <div className="mt-3 rounded-md border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
          No map coordinates available for this imported route. Route card details are shown below.
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const { importedRoutes } = useImportedRoutes();

  const [query, setQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<DisplayRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Merge imported routes into a searchable index (Memoized). */
  const importedIndex = useMemo(() => {
    const index = new Map<string, DisplayRoute>();
    for (const r of importedRoutes) {
      const display: DisplayRoute = {
        ...r,
        coordinates: [],
      };
      index.set(r.busNumber.toUpperCase(), display);
    }
    return index;
  }, [importedRoutes]);

  const hasImport = importedRoutes.length > 0;

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a bus number to search.');
      setSelectedRoute(null);
      return;
    }

    setLoading(true);
    // Brief delay so the loading state is visible for the lookup.
    setTimeout(() => {
      const key = trimmed.toUpperCase();

      // 1. Check imported routes first
      if (hasImport) {
        const imported = importedIndex.get(key);
        if (imported) {
          setSelectedRoute(imported);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // 2. Fall back to mock data
      const match = findBusRoute(trimmed);
      if (match) {
        setSelectedRoute(match);
        setError(null);
      } else {
        setSelectedRoute(null);
        setError('No route found for this bus number.');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <section className="min-h-screen bg-[#0B1220] px-4 py-6 text-[#E2E8F0] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#E2E8F0]">Chennai Route Map</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Search an MTC bus number to view its route, stops and details on the map.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter bus number (e.g., 21G, 47A, M15)"
              aria-label="Bus number"
              className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] py-2.5 pl-10 pr-3 text-[#E2E8F0] outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] px-5 py-2.5 font-semibold text-[#0B1220] transition hover:bg-[#0c9ddc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={16} />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Error / empty states */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {!error && !selectedRoute && !loading && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm text-[#94A3B8]">
            <MapPin size={18} />
            Enter a bus number above to display its route on the map.
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2 overflow-hidden rounded-lg border border-[#1E293B] bg-[#0F172A] shadow-panel">
            <MapContainer
              center={CHENNAI_CENTER}
              zoom={12}
              scrollWheelZoom
              style={{ height: '70vh', width: '100%' }}
            >
              <TileLayer
                key={theme}
                url={tileUrl}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapController route={selectedRoute} />

              {selectedRoute && (
                <>
                  <Polyline
                    positions={selectedRoute.coordinates}
                    pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 0.85 }}
                  />
                  {selectedRoute.coordinates.map((position, index) => (
                    <Marker key={`${selectedRoute.busNumber}-${index}`} position={position}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{stopName(selectedRoute.stops[index] ?? 'Stop')}</div>
                          <div className="text-slate-600">
                            {selectedRoute.busNumber} · {selectedRoute.routeName}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}
            </MapContainer>
          </div>

          {/* Route details / side panel */}
          <div className="lg:col-span-1">
            {loading ? (
              <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 text-sm text-[#94A3B8]">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0EA5E9] border-t-transparent" />
                Loading route…
              </div>
            ) : selectedRoute ? (
              <RouteInfoCard route={selectedRoute} />
            ) : (
              <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[#1E293B] bg-[#0F172A] p-4 text-center text-sm text-[#94A3B8]">
                Route details will appear here once you search a bus number.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
