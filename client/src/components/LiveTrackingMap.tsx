import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Clock, Loader2, TruckIcon } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface LiveTrackingData {
  isTracking: boolean;
  message?: string;
  operatorLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: string;
  };
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  distance?: string;
  estimatedArrival?: string;
  isEnRoute: boolean;
  jobStatus: string;
}

interface LiveTrackingMapProps {
  jobId: string;
  operatorName?: string;
}

export function LiveTrackingMap({ jobId, operatorName }: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const operatorMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { data: trackingData, isLoading, error } = useQuery<LiveTrackingData>({
    queryKey: ["/api/jobs", jobId, "live-tracking"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-114.0719, 51.0447], // Calgary default
      zoom: 12,
    });

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !trackingData?.isTracking) return;

    const map = mapRef.current;

    if (trackingData.operatorLocation) {
      const { latitude, longitude, heading } = trackingData.operatorLocation;

      if (operatorMarkerRef.current) {
        operatorMarkerRef.current.setLngLat([longitude, latitude]);
        if (heading !== undefined) {
          const el = operatorMarkerRef.current.getElement();
          el.style.transform = `rotate(${heading}deg)`;
        }
      } else {
        const el = document.createElement("div");
        el.className = "operator-marker";
        el.innerHTML = `
          <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        `;

        operatorMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      }
    }

    if (trackingData.customerLocation) {
      const { latitude, longitude } = trackingData.customerLocation;

      if (!customerMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "customer-marker";
        el.innerHTML = `
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        customerMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      }
    }

    if (trackingData.operatorLocation && trackingData.customerLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([trackingData.operatorLocation.longitude, trackingData.operatorLocation.latitude]);
      bounds.extend([trackingData.customerLocation.longitude, trackingData.customerLocation.latitude]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else if (trackingData.operatorLocation) {
      map.flyTo({
        center: [trackingData.operatorLocation.longitude, trackingData.operatorLocation.latitude],
        zoom: 14,
      });
    }
  }, [trackingData, mapLoaded]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!trackingData?.isTracking) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {trackingData?.message || "Waiting for operator to share location..."}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Live tracking will begin when the operator starts the job
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange-500" />
            Live Tracking
          </CardTitle>
          {trackingData.isEnRoute && (
            <Badge className="bg-green-500 text-white animate-pulse">
              <TruckIcon className="w-3 h-3 mr-1" />
              En Route
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainerRef} className="h-56 w-full" />
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            {trackingData.estimatedArrival && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
                  <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-eta">
                    {trackingData.estimatedArrival}
                  </p>
                </div>
              </div>
            )}
            {trackingData.distance && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                  <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-distance">
                    {trackingData.distance}
                  </p>
                </div>
              </div>
            )}
          </div>
          {operatorName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {operatorName} is on the way
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
