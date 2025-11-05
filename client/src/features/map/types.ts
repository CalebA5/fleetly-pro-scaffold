export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: Coordinates;
  type: 'operator' | 'customer' | 'pickup' | 'dropoff';
  data?: any;
  onClick?: () => void;
}

export interface MapViewport {
  center: Coordinates;
  zoom: number;
}

export type MapTileLayer = 'default' | 'satellite';

export interface MapConfig {
  defaultCenter: Coordinates;
  defaultZoom: number;
  minZoom?: number;
  maxZoom?: number;
}
