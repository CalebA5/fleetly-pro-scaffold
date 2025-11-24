import { useEffect, useRef } from "react";
import { useRealtimeLocation } from "@/hooks/useRealtimeLocation";
import { apiRequest } from "@/lib/queryClient";

interface LocationTrackerProps {
  operatorId: string;
  isOnline: boolean;
  activeTier: string | null;
  currentJobId?: string | null;
}

export function LocationTracker({
  operatorId,
  isOnline,
  activeTier,
  currentJobId = null
}: LocationTrackerProps) {
  const { location, startTracking, stopTracking, isTracking } = useRealtimeLocation({
    enableHighAccuracy: true,
    autoStart: false,
  });

  const lastUpdateRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start/stop tracking based on online status
  useEffect(() => {
    if (isOnline && activeTier) {
      console.log(`[LocationTracker] Starting location tracking for operator ${operatorId} on tier ${activeTier}`);
      startTracking();
    } else {
      console.log(`[LocationTracker] Stopping location tracking for operator ${operatorId}`);
      stopTracking();
    }

    return () => {
      stopTracking();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isOnline, activeTier, operatorId, startTracking, stopTracking]);

  // Send location updates to backend every 30 seconds
  useEffect(() => {
    // Clear interval AND stop geolocation tracking immediately if operator goes offline
    if (!isOnline || !isTracking) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
        lastUpdateRef.current = 0;
        console.log(`[LocationTracker] Cleared update interval - operator offline or tracking stopped`);
      }
      // Always stop geolocation watcher when offline to prevent stale updates
      if (!isOnline) {
        stopTracking();
        console.log(`[LocationTracker] Stopped geolocation watcher - operator offline`);
      }
      return;
    }

    if (!location) {
      return;
    }

    const now = Date.now();
    const UPDATE_INTERVAL = 30000; // 30 seconds

    // Send initial update immediately
    if (lastUpdateRef.current === 0) {
      sendLocationUpdate();
      lastUpdateRef.current = now;
    }

    // Set up periodic updates
    if (!updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(() => {
        sendLocationUpdate();
      }, UPDATE_INTERVAL);
    }

    async function sendLocationUpdate() {
      if (!location) return;

      try {
        await apiRequest("/api/operator-location", {
          method: "POST",
          body: JSON.stringify({
            operatorId,
            jobId: currentJobId || null,
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
            heading: null, // Could be extracted from geolocation if available
            speed: null,   // Could be extracted from geolocation if available
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`[LocationTracker] Location updated: ${location.latitude}, ${location.longitude}${currentJobId ? ` (job: ${currentJobId})` : ' (no active job)'}`);
      } catch (error) {
        console.error("[LocationTracker] Failed to update location:", error);
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [location, isOnline, isTracking, operatorId, currentJobId]);

  // This component doesn't render anything - it's just for side effects
  return null;
}
