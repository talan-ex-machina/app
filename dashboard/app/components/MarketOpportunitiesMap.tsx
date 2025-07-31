import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

export interface MarketOpportunity {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  market_potential: string;
  opportunity_type: string;
  market_size: string;
  entry_difficulty: string;
  key_advantages: string[];
  population: number;
  recommended_priority: number;
}

interface MarketOpportunitiesMapProps {
  opportunities: MarketOpportunity[];
  darkMode?: boolean;
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

export default function MarketOpportunitiesMap({ opportunities, darkMode }: MarketOpportunitiesMapProps) {
  const center = useMemo(() => {
    if (opportunities.length === 0) return [20, 0];
    // Center on the first opportunity
    return [opportunities[0].latitude, opportunities[0].longitude];
  }, [opportunities]);

  return (
    <div className="w-full" style={{ height: 400, minHeight: 400 }}>
      <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700" style={{ height: '100%' }}>
        <MapContainer center={center as [number, number]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url={darkMode
            ? 'https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          attribution='&copy; OpenStreetMap contributors'
        />
        {opportunities.map((op, idx) => (
          <Marker key={idx} position={[op.latitude, op.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="space-y-1">
                <div className="font-bold">{op.city}, {op.country}</div>
                <div><strong>Potential:</strong> {op.market_potential}</div>
                <div><strong>Type:</strong> {op.opportunity_type}</div>
                <div><strong>Market Size:</strong> {op.market_size}</div>
                <div><strong>Population:</strong> {typeof op.population === 'number' ? op.population.toLocaleString() : 'N/A'}</div>
                <div><strong>Entry Difficulty:</strong> {op.entry_difficulty}</div>
                <div><strong>Advantages:</strong> {Array.isArray(op.key_advantages) ? op.key_advantages.join(', ') : 'N/A'}</div>
                <div>
                  <strong>Priority:</strong>
                  <span
                    className={`px-2 py-1 rounded font-bold ml-1 ${darkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
                  >
                    {op.recommended_priority}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>
    </div>
  );
}
