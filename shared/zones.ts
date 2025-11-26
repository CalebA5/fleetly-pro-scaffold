import type { OperatorTier } from "./schema";

export interface ZonePolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface ServiceZone {
  id: string;
  name: string;
  displayName: string;
  description: string;
  geometry: ZonePolygon;
  center: [number, number];
  allowedTiers: OperatorTier[];
  demandLevel: "low" | "medium" | "high" | "surge";
  activeOperators: number;
  pendingJobs: number;
  color: string;
  borderColor: string;
}

export interface ZoneStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
}

export const ZONE_STYLES: Record<string, ZoneStyle> = {
  manual: {
    fillColor: "#10b981",
    fillOpacity: 0.15,
    strokeColor: "#059669",
    strokeWidth: 2,
    strokeOpacity: 0.8,
  },
  equipped: {
    fillColor: "#3b82f6",
    fillOpacity: 0.15,
    strokeColor: "#2563eb",
    strokeWidth: 2,
    strokeOpacity: 0.8,
  },
  professional: {
    fillColor: "#8b5cf6",
    fillOpacity: 0.15,
    strokeColor: "#7c3aed",
    strokeWidth: 2,
    strokeOpacity: 0.8,
  },
  surge: {
    fillColor: "#ef4444",
    fillOpacity: 0.25,
    strokeColor: "#dc2626",
    strokeWidth: 3,
    strokeOpacity: 1,
  },
  highDemand: {
    fillColor: "#f97316",
    fillOpacity: 0.2,
    strokeColor: "#ea580c",
    strokeWidth: 2,
    strokeOpacity: 0.9,
  },
};

export const DEMAND_COLORS = {
  low: { fill: "#22c55e", border: "#16a34a" },
  medium: { fill: "#eab308", border: "#ca8a04" },
  high: { fill: "#f97316", border: "#ea580c" },
  surge: { fill: "#ef4444", border: "#dc2626" },
};

export function createCirclePolygon(
  center: [number, number],
  radiusKm: number,
  points: number = 64
): ZonePolygon {
  const coords: number[][] = [];
  const earthRadius = 6371;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const latOffset = (radiusKm / earthRadius) * (180 / Math.PI);
    const lngOffset = latOffset / Math.cos(center[1] * Math.PI / 180);
    
    const lat = center[1] + latOffset * Math.sin(angle);
    const lng = center[0] + lngOffset * Math.cos(angle);
    coords.push([lng, lat]);
  }
  
  return {
    type: "Polygon",
    coordinates: [coords],
  };
}

export function createHexagonPolygon(
  center: [number, number],
  radiusKm: number
): ZonePolygon {
  return createCirclePolygon(center, radiusKm, 6);
}

export function generateCommunityZones(
  center: [number, number],
  tier: OperatorTier
): ServiceZone[] {
  const zones: ServiceZone[] = [];
  const tierConfigs = {
    manual: { innerRadius: 1.5, outerRadius: 3, zoneName: "Walking Zone" },
    equipped: { innerRadius: 4, outerRadius: 10, zoneName: "Local Zone" },
    professional: { innerRadius: 15, outerRadius: 50, zoneName: "Regional Zone" },
  };
  
  const config = tierConfigs[tier];
  
  zones.push({
    id: `${tier}-core`,
    name: `${config.zoneName} (Core)`,
    displayName: "Your Core Area",
    description: `High-priority jobs within ${config.innerRadius}km`,
    geometry: createCirclePolygon(center, config.innerRadius),
    center,
    allowedTiers: [tier],
    demandLevel: "high",
    activeOperators: Math.floor(Math.random() * 5) + 1,
    pendingJobs: Math.floor(Math.random() * 8) + 2,
    color: ZONE_STYLES[tier].fillColor,
    borderColor: ZONE_STYLES[tier].strokeColor,
  });
  
  zones.push({
    id: `${tier}-extended`,
    name: `${config.zoneName} (Extended)`,
    displayName: "Extended Area",
    description: `Available jobs up to ${config.outerRadius}km`,
    geometry: createCirclePolygon(center, config.outerRadius),
    center,
    allowedTiers: [tier],
    demandLevel: "medium",
    activeOperators: Math.floor(Math.random() * 10) + 3,
    pendingJobs: Math.floor(Math.random() * 15) + 5,
    color: ZONE_STYLES[tier].fillColor,
    borderColor: ZONE_STYLES[tier].strokeColor,
  });
  
  return zones;
}

export function convertZonesToGeoJSON(zones: ServiceZone[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map(zone => ({
      type: "Feature" as const,
      id: zone.id,
      properties: {
        id: zone.id,
        name: zone.name,
        displayName: zone.displayName,
        description: zone.description,
        demandLevel: zone.demandLevel,
        activeOperators: zone.activeOperators,
        pendingJobs: zone.pendingJobs,
        color: zone.color,
        borderColor: zone.borderColor,
        allowedTiers: zone.allowedTiers,
      },
      geometry: zone.geometry,
    })),
  };
}

export function isPointInZone(
  point: [number, number],
  zone: ServiceZone
): boolean {
  const polygon = zone.geometry.coordinates[0];
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

export function getZonesContainingPoint(
  point: [number, number],
  zones: ServiceZone[]
): ServiceZone[] {
  return zones.filter(zone => isPointInZone(point, zone));
}
