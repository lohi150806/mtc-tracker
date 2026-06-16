import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTheme } from '../context/ThemeContext';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

type Terminal = {
  name: string;
  position: [number, number];
  code: string;
  description: string;
};

const terminals: Terminal[] = [
  {
    name: 'CMBT',
    code: 'Koyambedu',
    position: [13.0694, 80.1948],
    description: 'Chennai Mofussil Bus Terminus — the largest hub for inter-city and city routes.',
  },
  {
    name: 'Broadway',
    code: 'Parry’s Corner',
    position: [13.0925, 80.287],
    description: 'Central terminus near Parry’s Corner serving north Chennai and the harbour area.',
  },
  {
    name: 'Tambaram',
    code: 'GST Road',
    position: [12.9249, 80.1],
    description: 'Major southern terminus connecting suburban routes along GST Road.',
  },
  {
    name: 'T. Nagar',
    code: 'Pondy Bazaar',
    position: [13.0418, 80.2341],
    description: 'Busy commercial-district terminus serving the T. Nagar shopping zone.',
  },
];

type SampleRoute = {
  id: string;
  name: string;
  color: string;
  description: string;
  path: [number, number][];
};

const sampleRoutes: SampleRoute[] = [
  {
    id: '27B',
    name: 'CMBT → Broadway',
    color: '#0ea5e9',
    description: 'Route 27B linking Koyambedu (CMBT) to Broadway via Aminjikarai and Egmore.',
    path: [
      [13.0694, 80.1948],
      [13.0732, 80.2206],
      [13.0786, 80.2546],
      [13.0878, 80.2756],
      [13.0925, 80.287],
    ],
  },
  {
    id: '21G',
    name: 'CMBT → T. Nagar',
    color: '#22c55e',
    description: 'Route 21G connecting CMBT to T. Nagar via Vadapalani and Panagal Park.',
    path: [
      [13.0694, 80.1948],
      [13.0521, 80.2122],
      [13.0476, 80.2206],
      [13.0418, 80.2341],
    ],
  },
  {
    id: '18',
    name: 'T. Nagar → Tambaram',
    color: '#f59e0b',
    description: 'Route 18 running south from T. Nagar to Tambaram via Guindy and St. Thomas Mount.',
    path: [
      [13.0418, 80.2341],
      [13.0067, 80.2206],
      [12.9806, 80.1979],
      [12.9516, 80.1422],
      [12.9249, 80.1],
    ],
  },
  {
    id: '5C',
    name: 'Broadway → Tambaram',
    color: '#a855f7',
    description: 'Route 5C from Broadway to Tambaram via Mylapore, Adyar and GST Road.',
    path: [
      [13.0925, 80.287],
      [13.0368, 80.2676],
      [13.0012, 80.2565],
      [12.9622, 80.1809],
      [12.9249, 80.1],
    ],
  },
];

export default function MapPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <section className="min-h-screen bg-[#0B1220] px-4 py-6 text-[#E2E8F0] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#E2E8F0]">Chennai Route Map</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Interactive map of sample MTC bus routes and major terminals across Chennai.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#1E293B] bg-[#0F172A] shadow-panel">
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

            {sampleRoutes.map((route) => (
              <Polyline
                key={route.id}
                positions={route.path}
                pathOptions={{ color: route.color, weight: 4, opacity: 0.85 }}
              >
                <Tooltip sticky>
                  {route.id} · {route.name}
                </Tooltip>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      Route {route.id} — {route.name}
                    </div>
                    <p className="mt-1 text-slate-600">{route.description}</p>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {terminals.map((terminal) => (
              <Marker key={terminal.name} position={terminal.position}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {terminal.name} ({terminal.code})
                    </div>
                    <p className="mt-1 text-slate-600">{terminal.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {sampleRoutes.map((route) => (
            <div
              key={route.id}
              className="flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-xs text-[#94A3B8]"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: route.color }} />
              <span className="font-semibold text-[#E2E8F0]">{route.id}</span>
              {route.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
