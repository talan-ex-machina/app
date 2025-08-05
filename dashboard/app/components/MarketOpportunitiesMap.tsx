import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { map } from 'leaflet';
import { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas-pro';

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

  const mapRef = useRef<HTMLDivElement>(null);
  
  const [hasData, setHasData] = useState(false);
  const [chartsCaptured, setChartsCaptured] = useState(false);

  const captureAndSendCharts = async () => {
    const charts = [
      { ref: mapRef, name: 'market-opportunities-map', hasData: opportunities.length > 0 },
    ];

    try {
      for (const { ref, name, hasData } of charts) {
        if (ref.current && hasData) {
          const canvas = await html2canvas(ref.current, {
            allowTaint: true,
            useCORS: true,
            scale: 2, 
            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF'
          });
          const imageData = canvas.toDataURL('image/png');
          console.log(`Sending ${name} chart image`);
          await fetch('http://localhost:5000/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chartName: name, imageData, imageInfo: opportunities }),
          });
        }
      }
      setChartsCaptured(true);
      console.log('All charts captured and sent successfully');
    } catch (error) {
      console.error('Error capturing charts:', error);
    }
  };
  useEffect(() => {
    const dataExists = opportunities.length > 0;
    
    if (dataExists && !chartsCaptured) {
      setHasData(true);
      const timer = setTimeout(() => {
        captureAndSendCharts();
      }, 3500); 
      
      return () => clearTimeout(timer);
    }
  }, [opportunities, chartsCaptured,]);

  useEffect(() => {
    setChartsCaptured(false);
  }, [opportunities.length]);

  const center = useMemo(() => {
    if (opportunities.length === 0) return [20, 0];
    // Center on the first opportunity
    return [opportunities[0].latitude, opportunities[0].longitude];
  }, [opportunities]);

  return (
    <div className="w-full" style={{ height: 400, minHeight: 400 }}>
      <div ref={mapRef} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} style={{ height: '100%' }}>
        <MapContainer center={center as [number, number]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
