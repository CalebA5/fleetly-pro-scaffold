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
  const { location, startTracking, reset } = useRealtimeLocation({
    enableHighAccuracy: true,
    autoStart: false,
  });

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationRef = useRef(location);
  const currentJobIdRef = useRef(currentJobId);
  const wasOnlineRef = useRef(false);

  // Keep refs updated with latest values
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    currentJobIdRef.current = currentJobId;
  }, [currentJobId]);

  // Consolidated effect: Start tracking + setup update interval when online, cleanup both when offline
  useEffect(() => {
    // Only proceed if operator is online with active tier
    if (!isOnline || !activeTier) {
      console.log(`[LocationTracker] Operator offline or no active tier - skipping tracking`);
      wasOnlineRef.current = false;
      return;
    }

    // Guard: Only start tracking when transitioning from offline to online
    if (!wasOnlineRef.current) {
      console.log(`[LocationTracker] Starting location tracking for operator ${operatorId} on tier ${activeTier}`);
      startTracking();
      wasOnlineRef.current = true;
    }

    // Setup location update interval
    const UPDATE_INTERVAL = 30000; // 30 seconds
    
    const checkAndSendLocation = async () => {
      // Read latest location from ref
      const currentLocation = locationRef.current;
      if (!currentLocation) {
        console.log(`[LocationTracker] Waiting for GPS fix...`);
        return;
      }

      try {
        await apiRequest("/api/operator-location", {
          method: "POST",
          body: JSON.stringify({
            operatorId,
            jobId: currentJobIdRef.current || null,
            latitude: currentLocation.latitude.toString(),
            longitude: currentLocation.longitude.toString(),
            heading: null,
            speed: null,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`[LocationTracker] Location updated: ${currentLocation.latitude}, ${currentLocation.longitude}${currentJobIdRef.current ? ` (job: ${currentJobIdRef.current})` : ' (no active job)'}`);
      } catch (error) {
        console.error("[LocationTracker] Failed to update location:", error);
      }
    };

    // Start interval immediately - it will wait for GPS inside callback
    updateIntervalRef.current = setInterval(() => {
      checkAndSendLocation();
    }, UPDATE_INTERVAL);
    console.log(`[LocationTracker] Update interval started (${UPDATE_INTERVAL}ms)`);
    
    // Send initial update immediately
    checkAndSendLocation();

    // Cleanup: Reset geolocation (clears watcher + state), clear interval
    return () => {
      console.log(`[LocationTracker] Cleanup: resetting tracking and clearing interval`);
      reset(); // Atomically clears watchId, location, error, isTracking
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      wasOnlineRef.current = false;
    };
    // NOTE: location intentionally NOT in deps to prevent restart on every GPS update
    // Location is accessed via ref which is always up-to-date
    // startTracking is now stable (doesn't depend on isTracking state)
  }, [isOnline, activeTier, operatorId, startTracking, reset]);

  // This component doesn't render anything - it's just for side effects
  return null;
}
