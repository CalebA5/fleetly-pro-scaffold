import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Constants for localStorage keys
export const LOCATION_STORAGE_KEYS = {
  GRANTED: 'fleetly_location_granted',
  PROMPTED: 'fleetly_location_prompted',
  LOCATION: 'userLocation',
  FORMATTED_ADDRESS: 'userFormattedAddress',
  CITY_STATE: 'userCityState',
} as const;

interface LocationRefreshResult {
  position: GeolocationPosition;
  formattedAddress: string;
}

interface LocationContextType {
  location: GeolocationPosition | null;
  locationError: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unavailable" | null;
  requestLocation: () => Promise<void>;
  refreshLocation: () => Promise<LocationRefreshResult>;
  clearLocation: () => void;
  markPrompted: () => void;
  markPermission: (granted: boolean) => void;
  cityState: string | null;
  formattedAddress: string | null;
  setFormattedAddress: (address: string, lat?: number, lon?: number) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  // Initialize location from localStorage if available
  const [location, setLocation] = useState<GeolocationPosition | null>(() => {
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if coordinates are valid numbers (including 0)
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          // Reconstruct GeolocationPosition object
          return {
            coords: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 0,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: function() { return { latitude: data.latitude, longitude: data.longitude }; },
            } as GeolocationCoordinates,
            timestamp: data.timestamp || Date.now(),
            toJSON: function() {
              return {
                coords: { latitude: data.latitude, longitude: data.longitude },
                timestamp: data.timestamp || Date.now()
              };
            }
          };
        }
      } catch (e) {
        console.error("Failed to parse stored location:", e);
      }
    }
    return null;
  });
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unavailable" | null>(null);
  const [cityState, setCityState] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddressState] = useState<string | null>(() => {
    return localStorage.getItem("userFormattedAddress") || null;
  });

  // Check permission status on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermissionStatus("unavailable");
      return;
    }

    // Check if we have permission already
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" })
        .then((result) => {
          setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          
          // If already granted, get location
          if (result.state === "granted") {
            getCurrentLocation();
          }

          // Listen for permission changes
          result.onchange = () => {
            setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          };
        })
        .catch(() => {
          setPermissionStatus("prompt");
        });
    } else {
      setPermissionStatus("prompt");
    }
  }, []);

  // Reverse geocode to get formatted address with street, city, state
  const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
      // Using Nominatim (OpenStreetMap) free reverse geocoding API
      // zoom=16 for street-level details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Fleetly-Location-App'
          }
        }
      );
      const data = await response.json();
      
      if (data.address) {
        // Build full formatted address: street, city, state
        const address = data.address;
        const formattedAddr = [
          address.road,
          address.city || address.town || address.village,
          address.state
        ].filter(Boolean).join(", ");
        
        const finalAddress = formattedAddr || data.display_name;
        
        // Also update city/state separately for weather features
        const city = address.city || address.town || address.village || address.county;
        const state = address.state;
        if (city && state) {
          const cityStateStr = `${city}, ${state}`;
          setCityState(cityStateStr);
          localStorage.setItem(LOCATION_STORAGE_KEYS.CITY_STATE, cityStateStr);
        }
        
        return finalAddress;
      }
      
      // Fallback to display_name if address parsing fails
      if (data.display_name) {
        return data.display_name;
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
    return null;
  };

  const setFormattedAddress = (address: string, lat?: number, lon?: number) => {
    setFormattedAddressState(address);
    localStorage.setItem("userFormattedAddress", address);
    
    // If lat/lon provided, update location
    if (lat !== undefined && lon !== undefined) {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: lat,
          longitude: lon,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: function() { return { latitude: lat, longitude: lon }; },
        } as GeolocationCoordinates,
        timestamp: Date.now(),
        toJSON: function() {
          return {
            coords: { latitude: lat, longitude: lon },
            timestamp: Date.now()
          };
        }
      };
      setLocation(mockPosition);
      localStorage.setItem("userLocation", JSON.stringify({
        latitude: lat,
        longitude: lon,
        timestamp: Date.now()
      }));
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocation(position);
        setLocationError(null);
        localStorage.setItem(LOCATION_STORAGE_KEYS.LOCATION, JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        }));
        
        // Get formatted address via reverse geocoding
        try {
          const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (address) {
            setFormattedAddressState(address);
            localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, address);
          } else {
            // Fallback to coordinates if reverseGeocode returns null
            const coordAddr = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            setFormattedAddressState(coordAddr);
            localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, coordAddr);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          // Fallback to coordinates
          const coordAddr = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setFormattedAddressState(coordAddr);
          localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, coordAddr);
        }
      },
      (error) => {
        console.error("Error getting location:", error.code, error.message);
        
        // Only mark as denied if permission was actually denied
        // Other errors (timeout, position unavailable) should not change permission status
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied");
          setPermissionStatus("denied");
          localStorage.setItem(LOCATION_STORAGE_KEYS.GRANTED, 'false');
        } else if (error.code === error.TIMEOUT) {
          setLocationError("Location request timed out");
          // Keep existing permission status - don't change it
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Location is currently unavailable");
          // Keep existing permission status - don't change it
        } else {
          setLocationError(error.message);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  };

  const requestLocation = async () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser");
      setPermissionStatus("unavailable");
      return;
    }

    setLocationError(null);
    getCurrentLocation();
  };

  // New centralized method to refresh location - called by icon and modal
  // Returns the fresh position and formatted address
  const refreshLocation = async (): Promise<LocationRefreshResult> => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser");
      setPermissionStatus("unavailable");
      throw new Error("Geolocation not supported");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocation(position);
          setLocationError(null);
          setPermissionStatus("granted");
          
          // Store in localStorage
          localStorage.setItem(LOCATION_STORAGE_KEYS.LOCATION, JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp
          }));
          
          // Get formatted address via reverse geocoding
          let finalAddress: string;
          try {
            const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            if (address) {
              finalAddress = address;
              // Update formatted address in state and localStorage
              setFormattedAddressState(address);
              localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, address);
            } else {
              // Fallback to coordinates
              finalAddress = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
              setFormattedAddressState(finalAddress);
              localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, finalAddress);
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            // Use coordinates as fallback
            finalAddress = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            setFormattedAddressState(finalAddress);
            localStorage.setItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS, finalAddress);
          }
          
          // Mark permission as granted and prompted on success
          localStorage.setItem(LOCATION_STORAGE_KEYS.GRANTED, 'true');
          localStorage.setItem(LOCATION_STORAGE_KEYS.PROMPTED, 'true');
          
          // Return the fresh data
          resolve({ position, formattedAddress: finalAddress });
        },
        (error) => {
          console.error("Location error:", error.code, error.message);
          
          // Only mark as denied if permission was actually denied
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Location access denied");
            setPermissionStatus("denied");
            localStorage.setItem(LOCATION_STORAGE_KEYS.GRANTED, 'false');
            reject(new Error("PERMISSION_DENIED"));
          } else if (error.code === error.TIMEOUT) {
            setLocationError("Location request timed out");
            reject(new Error("TIMEOUT"));
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError("Location is currently unavailable");
            reject(new Error("POSITION_UNAVAILABLE"));
          } else {
            setLocationError(error.message);
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Mark that user has been prompted
  const markPrompted = () => {
    localStorage.setItem(LOCATION_STORAGE_KEYS.PROMPTED, 'true');
  };

  // Mark permission status
  const markPermission = (granted: boolean) => {
    localStorage.setItem(LOCATION_STORAGE_KEYS.GRANTED, granted ? 'true' : 'false');
  };

  // Clear saved location data
  const clearLocation = () => {
    setLocation(null);
    setFormattedAddressState(null);
    setCityState(null);
    setLocationError(null);
    localStorage.removeItem(LOCATION_STORAGE_KEYS.LOCATION);
    localStorage.removeItem(LOCATION_STORAGE_KEYS.FORMATTED_ADDRESS);
    localStorage.removeItem(LOCATION_STORAGE_KEYS.CITY_STATE);
  };

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        locationError, 
        permissionStatus, 
        requestLocation,
        refreshLocation,
        clearLocation,
        markPrompted,
        markPermission,
        cityState,
        formattedAddress,
        setFormattedAddress
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useUserLocation must be used within a LocationProvider");
  }
  return context;
}
