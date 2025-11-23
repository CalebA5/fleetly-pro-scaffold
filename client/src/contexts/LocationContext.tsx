import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LocationContextType {
  location: GeolocationPosition | null;
  locationError: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unavailable" | null;
  requestLocation: () => Promise<void>;
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

  // Reverse geocode to get city and state
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      // Using Nominatim (OpenStreetMap) free reverse geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Fleetly-Weather-App'
          }
        }
      );
      const data = await response.json();
      
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const state = data.address.state;
        if (city && state) {
          const cityStateStr = `${city}, ${state}`;
          setCityState(cityStateStr);
          localStorage.setItem("userCityState", cityStateStr);
          return cityStateStr;
        }
      }
      
      // Also set formatted address
      if (data.display_name) {
        const address = data.address;
        const formattedAddr = [
          address.road,
          address.city || address.town || address.village,
          address.state
        ].filter(Boolean).join(", ");
        setFormattedAddressState(formattedAddr || data.display_name);
        localStorage.setItem("userFormattedAddress", formattedAddr || data.display_name);
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
        localStorage.setItem("userLocation", JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        }));
        
        // Get city and state
        await reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationError(error.message);
        setPermissionStatus("denied");
        console.error("Error getting location:", error);
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

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        locationError, 
        permissionStatus, 
        requestLocation,
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
