import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from './MapProvider';
import { MapTileLayer } from './types';

const TILE_LAYERS: Record<MapTileLayer, { url: string; attribution: string }> = {
  default: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

const OPERATOR_ICON = L.divIcon({
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #215885 0%, #2d6ea0 100%);
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(33, 88, 133, 0.4);
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M2 7h20M2 7l3-4h14l3 4M2 7v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
      </svg>
    </div>
  `,
  className: 'custom-operator-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const PICKUP_ICON = L.divIcon({
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(249, 115, 22, 0.4);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  `,
  className: 'custom-pickup-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const DROPOFF_ICON = L.divIcon({
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(34, 197, 94, 0.4);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3v12m0 0l-4-4m4 4l4-4"/>
      </svg>
    </div>
  `,
  className: 'custom-dropoff-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CUSTOMER_ICON = L.divIcon({
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0116 0"/>
      </svg>
    </div>
  `,
  className: 'custom-customer-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const getIconForMarker = (type: 'operator' | 'customer' | 'pickup' | 'dropoff') => {
  switch (type) {
    case 'operator': return OPERATOR_ICON;
    case 'pickup': return PICKUP_ICON;
    case 'dropoff': return DROPOFF_ICON;
    case 'customer': return CUSTOMER_ICON;
  }
};

interface MapViewProps {
  height?: string;
  className?: string;
  showLayerControl?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export const MapView = ({ 
  height = '500px', 
  className = '',
  showLayerControl = true,
  onMapClick,
}: MapViewProps) => {
  const { viewport, markers, tileLayer, setTileLayer } = useMap();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([viewport.center.lat, viewport.center.lng], viewport.zoom);

    L.control.zoom({ position: 'topright' }).addTo(map);

    if (showLayerControl) {
      const layerControl = L.control.layers(
        {},
        {},
        { position: 'topright' }
      ).addTo(map);
      
      map.on('baselayerchange', (e: any) => {
        if (e.name === 'Satellite') {
          setTileLayer('satellite');
        } else {
          setTileLayer('default');
        }
      });
    }

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const layerConfig = TILE_LAYERS[tileLayer];
    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [tileLayer]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([viewport.center.lat, viewport.center.lng], viewport.zoom);
  }, [viewport]);

  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkerIds = new Set(markers.map(m => m.id));
    
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    markers.forEach(markerData => {
      let marker = markersRef.current.get(markerData.id);
      
      if (!marker) {
        marker = L.marker(
          [markerData.position.lat, markerData.position.lng],
          { icon: getIconForMarker(markerData.type) }
        );
        
        if (markerData.onClick) {
          marker.on('click', markerData.onClick);
        }
        
        marker.addTo(mapRef.current!);
        markersRef.current.set(markerData.id, marker);
      } else {
        marker.setLatLng([markerData.position.lat, markerData.position.lng]);
      }
    });
  }, [markers]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden shadow-lg"
      />
      {showLayerControl && (
        <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setTileLayer('default')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tileLayer === 'default'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            data-testid="button-map-default"
          >
            Map
          </button>
          <button
            onClick={() => setTileLayer('satellite')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
              tileLayer === 'satellite'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            data-testid="button-map-satellite"
          >
            Satellite
          </button>
        </div>
      )}
    </div>
  );
};
