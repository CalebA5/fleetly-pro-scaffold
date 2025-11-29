import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Car, Wrench, Trash2, MapPin, Phone, User, ArrowLeft, Loader2, Snowflake, Package, Truck, Navigation, Clock, X, ChevronUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

type ServiceType = "towing" | "roadside" | "debris" | "snow_plowing" | "hauling" | "equipment_transport";

interface ServiceOption {
  type: ServiceType;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof Car;
  priority: "high" | "medium";
}

const EMERGENCY_SERVICES: ServiceOption[] = [
  {
    type: "towing",
    title: "Tow My Car",
    shortTitle: "Towing",
    description: "Vehicle breakdown or accident",
    icon: Car,
    priority: "high",
  },
  {
    type: "roadside",
    title: "Roadside Assistance",
    shortTitle: "Roadside",
    description: "Flat tire, battery, lockout",
    icon: Wrench,
    priority: "high",
  },
  {
    type: "snow_plowing",
    title: "Snow Plowing",
    shortTitle: "Snow",
    description: "Snow blocking access",
    icon: Snowflake,
    priority: "high",
  },
  {
    type: "debris",
    title: "Debris Removal",
    shortTitle: "Debris",
    description: "Urgent debris blocking",
    icon: Trash2,
    priority: "medium",
  },
  {
    type: "hauling",
    title: "Urgent Hauling",
    shortTitle: "Hauling",
    description: "Emergency material removal",
    icon: Package,
    priority: "medium",
  },
  {
    type: "equipment_transport",
    title: "Equipment Transport",
    shortTitle: "Transport",
    description: "Urgent delivery needed",
    icon: Truck,
    priority: "medium",
  },
];

export default function EmergencySOS() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<"location" | "service" | "details" | "finding">("location");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasInitialLocationFetched, setHasInitialLocationFetched] = useState(false);
  const [userIsEditingAddress, setUserIsEditingAddress] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState(false);
  
  const handleGoHome = () => {
    navigate("/");
  };
  
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name && !contactName) setContactName(user.name);
      if (user.email && !contactEmail) setContactEmail(user.email);
    }
  }, [isAuthenticated, user]);
  
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current) return;
    
    try {
      const isDark = document.documentElement.classList.contains('dark');
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isDark 
          ? "mapbox://styles/mapbox/dark-v11" 
          : "mapbox://styles/mapbox/streets-v12",
        center: [-73.935242, 40.730610],
        zoom: 12,
      });
      
      map.on('error', () => {
        setMapError(true);
      });
      
      mapRef.current = map;
      
      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (e) {
      console.warn("Map initialization failed:", e);
      setMapError(true);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    
    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      duration: 1500,
    });
    
    if (markerRef.current) {
      markerRef.current.remove();
    }
    
    const markerEl = document.createElement("div");
    markerEl.innerHTML = `
      <div class="emergency-marker">
        <div class="marker-core"></div>
        <div class="marker-pulse"></div>
        <div class="marker-pulse-outer"></div>
      </div>
      <style>
        .emergency-marker {
          position: relative;
          width: 60px;
          height: 60px;
        }
        .marker-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6);
          z-index: 3;
        }
        .marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border: 3px solid #ef4444;
          border-radius: 50%;
          opacity: 0.6;
          animation: pulse-ring 2s infinite;
          z-index: 2;
        }
        .marker-pulse-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 2px solid #f97316;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse-ring 2s infinite 0.5s;
          z-index: 1;
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
      </style>
    `;
    
    const marker = new mapboxgl.Marker({
      element: markerEl,
      anchor: "center",
    })
      .setLngLat([longitude, latitude])
      .addTo(mapRef.current);
    
    markerRef.current = marker;
  }, [latitude, longitude]);

  const getLocation = (showPromptOnDeny: boolean = false, fromStep?: string, isUserTriggered: boolean = false) => {
    setIsGettingLocation(true);
    setShowLocationPrompt(false);
    
    // If user triggered, reset the editing flag so we can update the address
    if (isUserTriggered) {
      setUserIsEditingAddress(false);
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat);
          setLongitude(lng);
          setLocationPermissionDenied(false);
          setHasInitialLocationFetched(true);
          
          // Only update address text if user hasn't manually edited it (or if user explicitly requested location)
          if (isUserTriggered || !userIsEditingAddress) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
              );
              const data = await response.json();
              setLocation(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            } catch (error) {
              setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          }
          
          setIsGettingLocation(false);
          
          // Only advance step if we're on the initial location step
          if (fromStep === "location" || step === "location") {
            setStep("service");
          }
          
          if (isUserTriggered) {
            toast({
              title: "Location Updated",
              description: "Your location has been updated on the map.",
            });
          }
        },
        (error) => {
          console.error("Location error:", error);
          setLocationPermissionDenied(true);
          setHasInitialLocationFetched(true);
          
          if (showPromptOnDeny) {
            setShowLocationPrompt(true);
            toast({
              title: "Location Permission Required",
              description: "Please enable location access in your browser settings, or enter your address manually.",
              variant: "destructive",
            });
          } else if (isUserTriggered) {
            toast({
              title: "Location Access Needed",
              description: "Please enter your address manually to continue.",
            });
          }
          setIsGettingLocation(false);
          
          // Only advance step if we're on the initial location step - don't clear service selection
          if (fromStep === "location" || step === "location") {
            setStep("service");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      if (isUserTriggered) {
        toast({
          title: "Location Not Supported",
          description: "Please enter your address manually to continue.",
        });
      }
      setLocationPermissionDenied(true);
      setHasInitialLocationFetched(true);
      setIsGettingLocation(false);
      
      // Only advance step if we're on the initial location step
      if (fromStep === "location" || step === "location") {
        setStep("service");
      }
    }
  };

  // Handle "Use Current Location" button click - user explicitly requested location
  const handleUseCurrentLocation = () => {
    if (locationPermissionDenied) {
      setShowLocationPrompt(true);
      toast({
        title: "Location Permission Required",
        description: "Please enable location access in your browser settings to use this feature.",
        variant: "destructive",
      });
      // Still try to get location in case user has enabled it
      getLocation(true, undefined, true);
    } else {
      getLocation(true, undefined, true);
    }
  };

  // Geocode manual address and update map
  const geocodeManualAddress = async () => {
    if (!location || location.trim().length < 5) {
      toast({
        title: "Address Required",
        description: "Please enter a valid address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeocodingAddress(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lng);
        setLocation(data[0].display_name || location);
        
        toast({
          title: "Address Found",
          description: "Your location has been updated on the map.",
        });
      } else {
        toast({
          title: "Address Not Found",
          description: "We couldn't find that address. Please try a more specific address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Error Finding Address",
        description: "Please try again or use a different address.",
        variant: "destructive",
      });
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  useEffect(() => {
    // On mount, attempt to get location (starting from "location" step)
    getLocation(false, "location");
  }, []);

  const handleServiceSelect = (type: ServiceType) => {
    setSelectedService(type);
    const service = EMERGENCY_SERVICES.find(s => s.type === type);
    if (service) {
      setDescription(`Emergency: ${service.title} - `);
    }
    setStep("details");
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) {
      toast({
        title: "Service Type Required",
        description: "Please select an emergency service type.",
        variant: "destructive",
      });
      return;
    }
    
    if (!contactPhone || contactPhone.length < 10) {
      toast({
        title: "Phone Number Required",
        description: "We need your phone number to coordinate response.",
        variant: "destructive",
      });
      return;
    }
    
    let finalLat = latitude;
    let finalLng = longitude;
    
    if (!finalLat || !finalLng) {
      if (!location || location.trim().length < 5) {
        toast({
          title: "Location Required",
          description: "Please enable location or enter your address.",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      const coords = await geocodeAddress(location);
      if (!coords) {
        toast({
          title: "Address Not Found",
          description: "Unable to find your address.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      finalLat = coords.lat;
      finalLng = coords.lng;
      setLatitude(finalLat);
      setLongitude(finalLng);
    }
    
    setIsSubmitting(true);
    setStep("finding");
    
    try {
      const emergencyId = `EMRG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await apiRequest("/api/emergency-requests", {
        method: "POST",
        body: JSON.stringify({
          emergencyId,
          contactName: contactName || "Emergency Caller",
          contactPhone,
          contactEmail: contactEmail || "",
          serviceType: selectedService,
          description,
          location,
          latitude: finalLat,
          longitude: finalLng,
          customerId: isAuthenticated && user?.id ? user.id : undefined,
        }),
      });
      
      toast({
        title: "Emergency Request Sent!",
        description: "Finding nearby operators now...",
      });
      
      setTimeout(() => {
        navigate(`/emergency-tracking/${emergencyId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error("Emergency request error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Unable to submit. Call 911 if life-threatening.",
        variant: "destructive",
      });
      setStep("details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const highPriorityServices = EMERGENCY_SERVICES.filter(s => s.priority === "high");
  const mediumPriorityServices = EMERGENCY_SERVICES.filter(s => s.priority === "medium");

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* Full Screen Map or Fallback */}
      {!mapError ? (
        <div 
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full"
          data-testid="emergency-fullscreen-map"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-500/30 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-orange-500/30 blur-3xl" />
          </div>
        </div>
      )}
      
      {/* Map Overlay Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleGoHome}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-lg flex items-center justify-center text-white hover:bg-black/70 transition-all"
            data-testid="button-close-emergency"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/90 backdrop-blur-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-bold text-sm tracking-wide">SOS ACTIVE</span>
          </div>
          
          <div className="w-10" />
        </div>
      </div>
      
      {/* 911 Banner - Floating */}
      <div className="absolute top-20 left-4 right-4 z-10">
        <div className="bg-yellow-500/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-yellow-900 flex-shrink-0" />
          <p className="text-yellow-900 text-sm font-semibold">
            Life-threatening? Call 911 immediately
          </p>
        </div>
      </div>
      
      {/* Location Status Card - Floating on map */}
      {step !== "finding" && step !== "location" && (
        <div className="absolute top-36 left-4 right-4 z-10">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
            {/* Location header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                latitude && longitude 
                  ? "bg-green-100 dark:bg-green-900/50" 
                  : "bg-orange-100 dark:bg-orange-900/50"
              }`}>
                <MapPin className={`w-5 h-5 ${
                  latitude && longitude 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-orange-600 dark:text-orange-400"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  latitude && longitude 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-orange-600 dark:text-orange-400"
                }`}>
                  {latitude && longitude ? "Your Location" : "Enter Your Location"}
                </p>
              </div>
              <button
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                data-testid="button-use-current-location"
              >
                <Navigation className="w-3.5 h-3.5" />
                {isGettingLocation ? "Detecting..." : "Use My Location"}
              </button>
            </div>
            
            {/* Address input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    // Mark that user is manually editing the address - prevents auto-population
                    setUserIsEditingAddress(true);
                  }}
                  placeholder="Enter address or use current location..."
                  className="h-10 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      geocodeManualAddress();
                    }
                  }}
                  data-testid="input-custom-address"
                />
                <Button
                  type="button"
                  onClick={geocodeManualAddress}
                  disabled={isGeocodingAddress || !location || location.trim().length < 5}
                  variant="outline"
                  className="h-10 px-3"
                  data-testid="button-confirm-address"
                >
                  {isGeocodingAddress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
              
              {latitude && longitude && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Location confirmed on map
                </p>
              )}
              
              {!latitude && !longitude && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Type an address and click Confirm, or use your current location
                </p>
              )}
            </div>
            
            {/* Location Permission Prompt */}
            {showLocationPrompt && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                  Location access was denied. To use your current location:
                </p>
                <ol className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-4 list-decimal">
                  <li>Click the lock/location icon in your browser's address bar</li>
                  <li>Allow location access for this site</li>
                  <li>Click "Use My Location" again</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Finding Operator Overlay */}
      {step === "finding" && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center px-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-ping" />
              <div className="absolute inset-4 rounded-full border-4 border-orange-500/50 animate-ping" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Navigation className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Finding Nearby Operators</h2>
            <p className="text-gray-400">Connecting you with the closest help...</p>
          </div>
        </div>
      )}
      
      {/* Bottom Sheet - Service Selection or Details */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ${
        step === "finding" ? "translate-y-full" : "translate-y-0"
      }`}>
        {step === "location" && (
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10 shadow-2xl safe-area-bottom">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Emergency Assistance</h2>
              <p className="text-gray-500 dark:text-gray-400">We need your location to send help</p>
            </div>
            
            <Button
              onClick={() => getLocation(false, "location", true)}
              disabled={isGettingLocation}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600"
              data-testid="button-enable-location"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5 mr-2" />
                  Enable Location
                </>
              )}
            </Button>
          </div>
        )}
        
        {step === "service" && (
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl safe-area-bottom max-h-[55vh] overflow-hidden flex flex-col mt-auto">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">What do you need help with?</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* High Priority Services */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Priority Response</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {highPriorityServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.type}
                        onClick={() => handleServiceSelect(service.type)}
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                          selectedService === service.type
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        data-testid={`button-service-${service.type}`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedService === service.type
                              ? "bg-orange-500 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{service.shortTitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Medium Priority Services */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Other Services</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {mediumPriorityServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.type}
                        onClick={() => handleServiceSelect(service.type)}
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                          selectedService === service.type
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        data-testid={`button-service-${service.type}`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedService === service.type
                              ? "bg-orange-500 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{service.shortTitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === "details" && (
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl safe-area-bottom max-h-[75vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <button
                onClick={() => setStep("service")}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                data-testid="button-back-to-services"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact Details</h2>
                <p className="text-xs text-gray-500">
                  {EMERGENCY_SERVICES.find(s => s.type === selectedService)?.title}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Phone - Most Important */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                  className="h-12 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid="input-contact-phone"
                />
              </div>
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Your Name
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className="h-12 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid="input-contact-name"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Describe the Situation
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what happened..."
                  rows={3}
                  className="text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid="input-description"
                />
              </div>
              
              {/* Submit */}
              <div className="pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !contactPhone || contactPhone.length < 10}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-lg"
                  data-testid="button-submit-emergency"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Send Emergency Request
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-gray-500 mt-3">
                  Nearby operators will be notified immediately
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
