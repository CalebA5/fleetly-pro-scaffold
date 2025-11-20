import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LocationContextType {
  location: GeolocationPosition | null;
  locationError: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unavailable" | null;
  requestLocation: () => Promise<void>;
  cityState: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unavailable" | null>(null);
  const [cityState, setCityState] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
    return null;
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
        cityState
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
