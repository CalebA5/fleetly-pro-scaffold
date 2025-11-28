import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { WeatherAlertToast } from "@/components/WeatherAlertToast";
import { EmergencySOSButton } from "@/components/EmergencySOSButton";
import { AutocompleteLocation } from "@/components/AutocompleteLocation";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { ServiceSelector } from "@/components/ServiceSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { useI18n } from "@/i18n";
import { MapPin, ArrowRight, Truck, Clock, Shield, Star, Search, Loader2, X, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeocodingResult } from "@/lib/geocoding";
import { TIER_SERVICES } from "@shared/tierCapabilities";

const Index = () => {
  const [, setLocation] = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [signupRole, setSignupRole] = useState<"customer" | "operator">("customer");
  const [pickup, setPickup] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { setFormattedAddress, formattedAddress, location, permissionStatus, refreshLocation } = useUserLocation();

  // Fetch nearby operators when location is available
  type NearbyOperator = {
    cardId: string;
    operatorId: string;
    name: string;
    photo: string | null;
    rating: string;
    totalJobs: number;
    hourlyRate: string;
    services: string[];
    isOnline: number;
    latitude: string;
    longitude: string;
  };

  const { data: nearbyOperators = [] } = useQuery<NearbyOperator[]>({
    queryKey: ['/api/operator-cards'],
    enabled: !!(currentLat && currentLon),
  });

  // Calculate distance and filter nearby operators
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get top 3 nearby online operators based on selected services
  const getFilteredOperators = () => {
    if (!currentLat || !currentLon || nearbyOperators.length === 0) return [];
    
    return nearbyOperators
      .filter(op => {
        // Only show online operators
        if (op.isOnline !== 1) return false;
        // If services selected, filter by service match
        if (selectedServices.length > 0) {
          const opServices = (op.services || []).map(s => 
            typeof s === 'string' ? s.toLowerCase() : ''
          );
          return selectedServices.some(selectedId => {
            const serviceName = TIER_SERVICES.find(s => s.id === selectedId)?.name.toLowerCase() || '';
            return opServices.some(os => os.includes(serviceName) || serviceName.includes(os));
          });
        }
        return true;
      })
      .map(op => ({
        ...op,
        distance: calculateDistance(
          currentLat,
          currentLon,
          parseFloat(op.latitude),
          parseFloat(op.longitude)
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  const proximityOperators = getFilteredOperators();

  // Check if user should see location permission prompt
  useEffect(() => {
    const hasBeenPrompted = localStorage.getItem('fleetly_location_prompted');
    if (!hasBeenPrompted && !isAuthLoading) {
      // Delay prompt by 1 second for better UX
      const timer = setTimeout(() => {
        setShowLocationPermission(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  // Track if user has manually cleared the location field
  const [userHasCleared, setUserHasCleared] = useState(false);
  
  // On initial mount, populate with stored location from localStorage
  useEffect(() => {
    const storedAddress = localStorage.getItem("userFormattedAddress");
    const storedLocation = localStorage.getItem("userLocation");
    
    if (storedAddress && !pickup && !userHasCleared) {
      setPickup(storedAddress);
      
      // Also restore coordinates if available
      if (storedLocation) {
        try {
          const locationData = JSON.parse(storedLocation);
          if (locationData.latitude && locationData.longitude) {
            setCurrentLat(locationData.latitude);
            setCurrentLon(locationData.longitude);
          }
        } catch (e) {
          console.error("Failed to parse stored location:", e);
        }
      }
    }
  }, []); // Only run once on mount
  
  // Auto-fill pickup with user's location address when available
  // But ONLY if user hasn't manually cleared the field
  useEffect(() => {
    if (formattedAddress && !pickup && !userHasCleared) {
      setPickup(formattedAddress);
      if (location) {
        setCurrentLat(location.coords.latitude);
        setCurrentLon(location.coords.longitude);
      }
    }
  }, [formattedAddress, location, pickup, userHasCleared]);

  // Clear location handler - mark that user has manually cleared
  const handleClearLocation = () => {
    setPickup("");
    setCurrentLat(null);
    setCurrentLon(null);
    setUserHasCleared(true); // Prevent auto-refill after manual clear
  };

  const handleAuthClick = (tab: "signin" | "signup", role: "customer" | "operator" = "customer") => {
    setAuthTab(tab);
    setSignupRole(role);
    setShowAuthDialog(true);
  };

  const handleDriveAndEarn = () => {
    if (isAuthenticated) {
      // Always go to Drive & Earn page (tier selection/management)
      setLocation("/drive-earn");
    } else {
      // Show signup dialog for operator role
      handleAuthClick("signup", "operator");
    }
  };

  // Handle location selection from autocomplete
  const handleLocationSelect = (result: GeocodingResult) => {
    setCurrentLat(result.lat);
    setCurrentLon(result.lon);
    // Store in LocationContext
    setFormattedAddress(result.fullAddress, result.lat, result.lon);
    // Allow auto-fill again since user has EXPLICITLY selected a location
    setUserHasCleared(false);
  };

  const handleSearchService = async () => {
    // Build services parameter if any are selected
    const servicesParam = selectedServices.length > 0 
      ? `&services=${encodeURIComponent(selectedServices.join(','))}`
      : '';
    
    // Priority 1: If there's a location in the pickup field with coordinates, use that
    if (pickup.trim() && currentLat !== null && currentLon !== null) {
      // Navigate with 50km radius filter and selected services
      setLocation(`/customer/operators?lat=${currentLat}&lon=${currentLon}&address=${encodeURIComponent(pickup)}&radius=50${servicesParam}`);
      return;
    }
    
    // Priority 2: If pickup has text but no coordinates, geocode it first
    if (pickup.trim()) {
      await geocodeAndNavigate(pickup, true, servicesParam); // Pass services param
      return;
    }
    
    // Priority 3: Use shared GPS location if available (from LocationContext)
    if (location && location.coords) {
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      const address = formattedAddress || "Current Location";
      setLocation(`/customer/operators?lat=${lat}&lon=${lon}&address=${encodeURIComponent(address)}&radius=50${servicesParam}`);
      return;
    }
    
    // Priority 4: No location data - prompt for location
    toast({
      title: "Location needed",
      description: "Please share your location or enter a pickup address to see available operators.",
      variant: "default",
    });
    
    // Show location permission modal
    setShowLocationPermission(true);
  };

  // Navigate to operators map with smart centering logic
  const handleBrowseOperators = async () => {
    // Build services parameter if any are selected
    const servicesParam = selectedServices.length > 0 
      ? `&services=${encodeURIComponent(selectedServices.join(','))}`
      : '';
    
    // Priority 1: If there's a location in the pickup field with coordinates, use that
    if (pickup.trim() && currentLat !== null && currentLon !== null) {
      setLocation(`/customer/operators?lat=${currentLat}&lon=${currentLon}&address=${encodeURIComponent(pickup)}${servicesParam}`);
      return;
    }
    
    // Priority 2: If pickup has text but no coordinates, geocode it first
    if (pickup.trim()) {
      await geocodeAndNavigate(pickup, false, servicesParam);
      return;
    }
    
    // Priority 3: Use current GPS location if available (from LocationContext)
    if (location && location.coords) {
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      const address = formattedAddress || "Current Location";
      setLocation(`/customer/operators?lat=${lat}&lon=${lon}&address=${encodeURIComponent(address)}${servicesParam}`);
      return;
    }
    
    // Priority 4: No location data - prompt for location access
    toast({
      title: "Location needed",
      description: "Please share your location or enter a pickup address to browse operators.",
      variant: "default",
    });
    
    // Show location permission modal
    setShowLocationPermission(true);
  };

  // Geocode address/city to coordinates
  const geocodeAndNavigate = async (address: string, includeRadius: boolean = false, servicesParam: string = '') => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        // Store in context
        setFormattedAddress(display_name, latitude, longitude);
        
        // Navigate with coordinates, optional radius filter, and selected services
        const radiusParam = includeRadius ? '&radius=50' : '';
        setLocation(`/customer/operators?lat=${latitude}&lon=${longitude}&address=${encodeURIComponent(display_name)}${radiusParam}${servicesParam}`);
      } else {
        toast({
          title: "Location not found",
          description: "Could not find that location. Please try a different search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      toast({
        title: "Search failed",
        description: "Could not search for that location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRequestService = (service: string) => {
    if (!isAuthenticated) {
      // Show auth dialog before allowing service request
      setShowAuthDialog(true);
    } else {
      // Redirect to service request page
      setLocation("/customer/service-request");
    }
  };

  // Manual location detection (triggered by location icon button)
  // PRIMARY FUNCTION: Display/update current location
  const handleUseCurrentLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    // If permission already granted, refresh location (no modal)
    if (permissionStatus === "granted") {
      setLoadingLocation(true);
      try {
        // Get fresh location data
        const { position, formattedAddress: freshAddress } = await refreshLocation();
        
        // Update pickup field with fresh location (always override)
        setCurrentLat(position.coords.latitude);
        setCurrentLon(position.coords.longitude);
        setPickup(freshAddress);
        setUserHasCleared(false);
      } catch (error: any) {
        console.error("Location refresh error:", error);
        
        // Only show modal if permission was denied
        if (error?.message === "PERMISSION_DENIED") {
          setShowLocationPermission(true);
        } else {
          // For other errors (timeout, unavailable), just show a toast
          toast({
            title: "Location error",
            description: error?.message === "TIMEOUT" 
              ? "Location request timed out. Please try again."
              : "Could not get your location. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoadingLocation(false);
      }
      return;
    }

    // If permission not granted or status unknown, show modal
    setShowLocationPermission(true);
  };

  // REMOVED: This duplicate useEffect was causing auto-refill even after manual clear
  // The first useEffect (with userHasCleared flag) now handles all auto-fill logic properly

  // Show loading skeleton while auth is initializing to prevent flash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Weather Alert Toast Notifications */}
      <WeatherAlertToast />
      
      {/* Modern Header */}
      <Header 
        onSignIn={() => handleAuthClick("signin")}
        onSignUp={() => handleAuthClick("signup")}
        onDriveAndEarn={handleDriveAndEarn}
      />

      {/* Emergency SOS Section - Prominent placement */}
      <section className="relative bg-white dark:bg-gray-900 pt-8 pb-4 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <EmergencySOSButton />
        </div>
      </section>

      {/* Hero Section with Location Search */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-950 dark:to-orange-950 py-12 md:py-20 overflow-hidden border-b border-gray-200 dark:border-gray-800 w-full">
        {/* Modern Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-blue-50/40 to-orange-50/40 dark:from-black/70 dark:via-blue-950/50 dark:to-orange-950/50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          {/* Heading - Above the grid */}
          <div className="mb-8 lg:mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight mb-4">
              {t.home.welcome}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
              {t.home.tagline}
            </p>
          </div>

          {/* Two-column grid - Location search and Services aligned */}
          {/* On mobile: Services first, then location picker. On desktop: location picker left, services right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-4 order-2 lg:order-1 relative z-50">
              {/* Interactive Location Search - Uber Style with Glassmorphism */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 relative z-50">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-black dark:bg-white flex-shrink-0"></div>
                    <div className="flex-1 relative">
                      <AutocompleteLocation
                        value={pickup}
                        onChange={setPickup}
                        onSelectLocation={handleLocationSelect}
                        onClear={handleClearLocation}
                        onIconClick={handleUseCurrentLocation}
                        placeholder={loadingLocation ? "Detecting your location..." : "Enter pickup location"}
                        disabled={loadingLocation}
                        testId="input-pickup-location"
                        icon={!loadingLocation}
                      />
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 ml-6"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-black dark:bg-white flex-shrink-0"></div>
                    <div className="flex-1">
                      <ServiceSelector
                        selectedServices={selectedServices}
                        onServicesChange={setSelectedServices}
                        placeholder="Select services you need"
                        disabled={!pickup.trim()}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleSearchService}
                  className="w-full mt-4 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold"
                  data-testid="button-search-services"
                >
                  <Search className="mr-2 w-5 h-5" />
                  {t.home.viewOperators}
                </Button>
              </div>
            </div>

            {/* Dynamic Operators or Services Section */}
            <div className="relative order-1 lg:order-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-6">
                  {selectedServices.length > 0 && proximityOperators.length > 0 ? t.operators.nearbyOperators : t.home.quickServices}
                </h3>
                <div className="space-y-3">
                  {selectedServices.length > 0 && proximityOperators.length > 0 ? (
                    <>
                      {proximityOperators.map((operator, index) => (
                        <div 
                          key={operator.cardId}
                          onClick={() => setLocation(`/customer/operators?lat=${currentLat}&lon=${currentLon}&operator=${operator.operatorId}`)}
                          className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md transition-all cursor-pointer" 
                          data-testid={`card-operator-${operator.operatorId}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Mysterious operator icon with online indicator */}
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-inner">
                                <Truck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              {/* Green online indicator */}
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-black dark:text-white">Operator #{index + 1}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{operator.rating}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>{operator.distance?.toFixed(1)} km away</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-300 dark:border-gray-600 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/customer/operators?lat=${currentLat}&lon=${currentLon}&operator=${operator.operatorId}`);
                            }}
                            data-testid={`button-see-prices-${operator.operatorId}`}
                          >
                            See Prices
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                        Select operators to compare quotes
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg">
                            <Truck className="w-6 h-6 text-white dark:text-black" />
                          </div>
                          <div>
                            <p className="font-semibold text-black dark:text-white">Snow Plowing</p>
                            <p className="text-sm text-gray-500">Professional clearing</p>
                          </div>
                        </div>
                      </div>
                      <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg">
                            <Wrench className="w-6 h-6 text-white dark:text-black" />
                          </div>
                          <div>
                            <p className="font-semibold text-black dark:text-white">Handyman</p>
                            <p className="text-sm text-gray-500">Home repairs & odd jobs</p>
                          </div>
                        </div>
                      </div>
                      <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg">
                            <Truck className="w-6 h-6 text-white dark:text-black" />
                          </div>
                          <div>
                            <p className="font-semibold text-black dark:text-white">Hauling</p>
                            <p className="text-sm text-gray-500">Junk & debris removal</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Features Section */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-3">
              Why choose Fleetly
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Professional service you can trust
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                <Clock className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">Fast Response</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Operators arrive quickly when you need them most. Real-time tracking included.
              </p>
            </Card>
            <Card className="group p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                <Shield className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">Verified Operators</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All operators are background-checked and professionally licensed for your safety.
              </p>
            </Card>
            <Card className="group p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                <Star className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">Top-Rated Service</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from highly-rated professionals with verified customer reviews.
              </p>
            </Card>
          </div>

          {/* Trust Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed Services</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Verified Operators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">4.9★</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Always Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-black dark:bg-white border-b border-gray-800 dark:border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-black mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 dark:text-gray-700 mb-8">
            Join thousands of customers who trust Fleetly for their service needs.
          </p>
          <Button 
            size="lg" 
            onClick={handleBrowseOperators}
            className="bg-white text-black hover:bg-gray-200 dark:bg-black dark:text-white dark:hover:bg-gray-800 font-semibold text-lg px-8 h-12 transition-colors"
            data-testid="button-cta-find-operators"
          >
            Find operators near you
            <MapPin className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
        signupRole={signupRole}
      />

      <LocationPermissionModal
        open={showLocationPermission}
        onOpenChange={setShowLocationPermission}
      />

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && user?.role === "customer" && <MobileBottomNav />}
    </div>
  );
};

export default Index;
