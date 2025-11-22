import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  formattedAddress?: string;
}

interface UseRealtimeLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
}

export const useRealtimeLocation = (options: UseRealtimeLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    autoStart = false
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'User-Agent': 'Fleetly-Location-App'
          }
        }
      );
      const data = await response.json();

      if (data.display_name) {
        const address = data.address;
        const formattedAddr = [
          address.road,
          address.city || address.town || address.village,
          address.state
        ].filter(Boolean).join(", ");
        return formattedAddr || data.display_name;
      }
      return '';
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return '';
    }
  }, []);

  // Start continuous location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    if (isTracking) {
      return; // Already tracking
    }

    setIsTracking(true);
    setError(null);

    // Use watchPosition for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Get formatted address
        const formattedAddress = await reverseGeocode(latitude, longitude);

        setLocation({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
          formattedAddress
        });
        setError(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to retrieve location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        setError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    watchIdRef.current = watchId;
  }, [enableHighAccuracy, timeout, maximumAge, isTracking, reverseGeocode]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Get current location once (without continuous tracking)
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const formattedAddress = await reverseGeocode(latitude, longitude);

          const locationData: LocationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: position.timestamp,
            formattedAddress
          };

          setLocation(locationData);
          setError(null);
          resolve(locationData);
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to retrieve location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, reverseGeocode]);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, startTracking]);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation
  };
};
