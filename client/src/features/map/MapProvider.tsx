import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MapMarker, MapViewport, MapTileLayer, Coordinates } from './types';

interface MapContextValue {
  markers: MapMarker[];
  viewport: MapViewport;
  tileLayer: MapTileLayer;
  addMarker: (marker: MapMarker) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<MapMarker>) => void;
  clearMarkers: () => void;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setTileLayer: (layer: MapTileLayer) => void;
  flyTo: (coords: Coordinates, zoom?: number) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  defaultCenter?: Coordinates;
  defaultZoom?: number;
}

export const MapProvider = ({ 
  children, 
  defaultCenter = { lat: 40.7128, lng: -74.0060 },
  defaultZoom = 13 
}: MapProviderProps) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [viewport, setViewportState] = useState<MapViewport>({
    center: defaultCenter,
    zoom: defaultZoom,
  });
  const [tileLayer, setTileLayer] = useState<MapTileLayer>('default');

  const addMarker = useCallback((marker: MapMarker) => {
    setMarkers(prev => [...prev, marker]);
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<MapMarker>) => {
    setMarkers(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const setViewport = useCallback((updates: Partial<MapViewport>) => {
    setViewportState(prev => ({ ...prev, ...updates }));
  }, []);

  const flyTo = useCallback((coords: Coordinates, zoom?: number) => {
    setViewportState(prev => ({
      center: coords,
      zoom: zoom ?? prev.zoom,
    }));
  }, []);

  return (
    <MapContext.Provider
      value={{
        markers,
        viewport,
        tileLayer,
        addMarker,
        removeMarker,
        updateMarker,
        clearMarkers,
        setViewport,
        setTileLayer,
        flyTo,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within MapProvider');
  }
  return context;
};
