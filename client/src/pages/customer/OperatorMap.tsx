import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Star, Truck, Filter, Heart } from "lucide-react";
import type { Operator, InsertServiceRequest, Favorite } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icon for moving operators (pulsing red marker)
const movingIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="position: relative; width: 25px; height: 41px;">
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.8 12.5 28.5 12.5 28.5s12.5-19.7 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
        <circle cx="12.5" cy="12.5" r="4" fill="white"/>
      </svg>
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 25px;
        height: 41px;
        background: radial-gradient(circle, rgba(255,68,68,0.4) 0%, transparent 70%);
        animation: pulse 1.5s ease-in-out infinite;
      "></div>
    </div>
  `,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Regular icon for stationary operators
const stationaryIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const CUSTOMER_ID = "CUST-001";
const CUSTOMER_NAME = "John Doe";

// Track operator locations for real-time updates
interface OperatorLocation {
  operatorId: string;
  lat: number;
  lng: number;
  targetLat?: number;
  targetLng?: number;
  isMoving: boolean;
}

export const OperatorMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [tileLayer, setTileLayer] = useState<'map' | 'satellite'>('map');
  const [selectedService, setSelectedService] = useState<string>("");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOperator, setRatingOperator] = useState<Operator | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [operatorLocations, setOperatorLocations] = useState<Map<string, OperatorLocation>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: allOperators, isLoading } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
  });

  // Fetch customer's favorites
  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${CUSTOMER_ID}`],
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (operator: Operator) => {
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const requestData: InsertServiceRequest = {
        requestId,
        customerId: CUSTOMER_ID,
        customerName: CUSTOMER_NAME,
        operatorId: operator.operatorId,
        operatorName: operator.name,
        service: (operator.services as string[])[0], // Use operator's first service
        status: "pending",
        location: operator.address,
        estimatedCost: operator.hourlyRate,
      };

      const response = await apiRequest("/api/service-requests", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: { "Content-Type": "application/json" },
      });
      
      return response;
    },
    onSuccess: (data, operator) => {
      // Start tracking this operator as moving
      const operatorLat = parseFloat(operator.latitude as string);
      const operatorLng = parseFloat(operator.longitude as string);
      
      // Simulate a destination (offset from current position)
      const targetLat = operatorLat + (Math.random() - 0.5) * 0.05;
      const targetLng = operatorLng + (Math.random() - 0.5) * 0.05;
      
      setOperatorLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(operator.operatorId, {
          operatorId: operator.operatorId,
          lat: operatorLat,
          lng: operatorLng,
          targetLat,
          targetLng,
          isMoving: true,
        });
        return newMap;
      });
      
      toast({
        title: "Service Request Sent!",
        description: `Your request has been sent to ${data.operatorName}. Tracking en route...`,
      });
      navigate(`/customer/service-request?requestId=${data.requestId}`);
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Failed to send service request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (operatorId: string) => {
      return await apiRequest("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ customerId: CUSTOMER_ID, operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${CUSTOMER_ID}`] });
      toast({
        title: "Added to Favorites",
        description: "Operator added to your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Favorite",
        description: "Could not add operator to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (operatorId: string) => {
      return await apiRequest(`/api/favorites/${CUSTOMER_ID}/${operatorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${CUSTOMER_ID}`] });
      toast({
        title: "Removed from Favorites",
        description: "Operator removed from your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove Favorite",
        description: "Could not remove operator from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!ratingOperator) throw new Error("No operator selected");
      return await apiRequest("/api/ratings", {
        method: "POST",
        body: JSON.stringify({
          customerId: CUSTOMER_ID,
          operatorId: ratingOperator.operatorId,
          rating,
          comment: ratingComment.trim() || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: `Thank you for rating ${ratingOperator?.name}!`,
      });
      setShowRatingDialog(false);
      setRating(5);
      setRatingComment("");
      setRatingOperator(null);
    },
    onError: () => {
      toast({
        title: "Failed to Submit Rating",
        description: "Could not submit your rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper to check if operator is favorited
  const isFavorite = (operatorId: string) => {
    return favorites.some(f => f.operatorId === operatorId);
  };

  // Open rating dialog
  const handleOpenRatingDialog = (operator: Operator, e: React.MouseEvent) => {
    e.stopPropagation();
    setRatingOperator(operator);
    setShowRatingDialog(true);
  };

  // Toggle favorite
  const toggleFavorite = (operatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(operatorId)) {
      removeFavoriteMutation.mutate(operatorId);
    } else {
      addFavoriteMutation.mutate(operatorId);
    }
  };

  const operators = selectedService 
    ? allOperators?.filter(op => (op.services as string[]).includes(selectedService))
    : allOperators;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([40.7589, -73.9851], 12);

    const tileLayerInstance = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    });

    tileLayerInstance.on('load', () => {
      setMapLoaded(true);
    });

    tileLayerInstance.addTo(map);

    // Set loaded after a short timeout as fallback
    const timeoutId = setTimeout(() => setMapLoaded(true), 1000);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      clearTimeout(timeoutId);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Real-time location updates for moving operators
  useEffect(() => {
    if (operatorLocations.size === 0) return;
    
    const interval = setInterval(() => {
      setOperatorLocations(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        prev.forEach((location, operatorId) => {
          if (!location.isMoving || !location.targetLat || !location.targetLng) return;
          
          // Calculate distance to target
          const latDiff = location.targetLat - location.lat;
          const lngDiff = location.targetLng - location.lng;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          // If very close to target, stop moving
          if (distance < 0.0005) {
            newMap.set(operatorId, { ...location, isMoving: false });
            hasChanges = true;
            return;
          }
          
          // Move 5% of the way toward target each update
          const newLat = location.lat + latDiff * 0.05;
          const newLng = location.lng + lngDiff * 0.05;
          
          newMap.set(operatorId, {
            ...location,
            lat: newLat,
            lng: newLng,
          });
          
          // Update marker position
          const marker = markersRef.current.get(operatorId);
          if (marker) {
            marker.setLatLng([newLat, newLng]);
            marker.setIcon(movingIcon);
          }
          
          hasChanges = true;
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [operatorLocations]);

  useEffect(() => {
    if (!mapRef.current || !operators) return;

    // Remove all existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    operators.forEach((operator) => {
      // Check if operator has custom location (is moving)
      const location = operatorLocations.get(operator.operatorId);
      const lat = location ? location.lat : parseFloat(operator.latitude as string);
      const lon = location ? location.lng : parseFloat(operator.longitude as string);
      
      // Use moving icon if operator is en route
      const icon = location?.isMoving ? movingIcon : stationaryIcon;

      const marker = L.marker([lat, lon], { icon }).addTo(mapRef.current!);
      
      // Determine status message
      let statusHtml = '';
      if (location) {
        if (location.isMoving) {
          statusHtml = '<p style="margin: 4px 0; color: #ff4444;"><strong>Status:</strong> En Route 🚗</p>';
        } else {
          statusHtml = '<p style="margin: 4px 0; color: #22c55e;"><strong>Status:</strong> Arrived ✓</p>';
        }
      }
      
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${operator.name}</h3>
          <p style="margin: 4px 0;"><strong>Rating:</strong> ⭐ ${operator.rating}</p>
          <p style="margin: 4px 0;"><strong>Rate:</strong> $${operator.hourlyRate}/hr</p>
          ${statusHtml}
        </div>
      `);

      marker.on("click", () => {
        setSelectedOperator(operator);
        mapRef.current?.setView([lat, lon], 14);
      });

      markersRef.current.set(operator.operatorId, marker);
    });
  }, [operators, operatorLocations]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    const url = tileLayer === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const attribution = tileLayer === 'satellite'
      ? 'Tiles &copy; Esri'
      : '&copy; OpenStreetMap contributors &copy; CARTO';

    const options = tileLayer === 'satellite'
      ? { attribution, maxZoom: 19 }
      : { attribution, subdomains: 'abcd', maxZoom: 20 };

    L.tileLayer(url, options).addTo(mapRef.current);
  }, [tileLayer]);

  const handleRequestService = (operator: Operator, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to detailed service request form
    // Pre-fill service type if operator has services
    const service = operator.services && (operator.services as string[]).length > 0 
      ? (operator.services as string[])[0] 
      : "";
    navigate(`/customer/create-request?service=${encodeURIComponent(service)}`);
  };

  const services = ["All", "Snow Plowing", "Towing", "Hauling", "Courier", "Ice Removal", "Roadside Assistance"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading operators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <Header 
        onSignIn={() => {
          setAuthTab("signin");
          setShowAuthDialog(true);
        }}
        onSignUp={() => {
          setAuthTab("signup");
          setShowAuthDialog(true);
        }}
      />
      
      {/* Page Title & Controls */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Find Operators</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{operators?.length || 0} operators available</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={tileLayer === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTileLayer('map')}
              className={tileLayer === 'map' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' : ''}
              data-testid="button-map-view"
            >
              Map
            </Button>
            <Button
              variant={tileLayer === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTileLayer('satellite')}
              className={tileLayer === 'satellite' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' : ''}
              data-testid="button-satellite-view"
            >
              Satellite
            </Button>
          </div>
        </div>
      </div>

      {/* Service Filters */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          {services.map((service) => (
            <Button
              key={service}
              variant={selectedService === (service === "All" ? "" : service) ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedService(service === "All" ? "" : service)}
              className={selectedService === (service === "All" ? "" : service) 
                ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black flex-shrink-0' 
                : 'flex-shrink-0'}
              data-testid={`filter-${service.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {service}
            </Button>
          ))}
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {!mapLoaded && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} className="leaflet-container" />
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <div className="p-4 space-y-4">
            {/* Favorite Operators Section */}
            {favorites.length > 0 && allOperators && (
              <>
                {(() => {
                  const favoriteOperators = allOperators.filter(op => 
                    isFavorite(op.operatorId) && op.isOnline
                  );
                  
                  return favoriteOperators.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 fill-red-500 text-red-500 icon-warm-glow" />
                        <h3 className="font-bold text-black dark:text-white">Your Favorites Online</h3>
                      </div>
                      <div className="space-y-2">
                        {favoriteOperators.map(operator => (
                          <div
                            key={operator.operatorId}
                            className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-warm cursor-pointer hover:shadow-warm-glow transition-all"
                            onClick={() => {
                              setSelectedOperator(operator);
                              const lat = parseFloat(operator.latitude as string);
                              const lon = parseFloat(operator.longitude as string);
                              mapRef.current?.setView([lat, lon], 14);
                            }}
                            data-testid={`favorite-${operator.operatorId}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-black dark:text-white text-sm">{operator.name}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{operator.rating}</span>
                                  <span className="mx-1">•</span>
                                  <span>${operator.hourlyRate}/hr</span>
                                </div>
                              </div>
                              <Badge className="bg-green-500 dark:bg-green-600 text-white text-xs">Online</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-b border-gray-300 dark:border-gray-600 my-4"></div>
                    </div>
                  ) : null;
                })()}
              </>
            )}
            
            {operators?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No operators found for this service</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setSelectedService("")}
                  data-testid="button-clear-filter"
                >
                  Clear Filter
                </Button>
              </div>
            ) : (
              operators?.map((operator) => (
                <Card
                  key={operator.operatorId}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg border dark:border-gray-700 dark:bg-gray-900 ${
                    selectedOperator?.operatorId === operator.operatorId
                      ? 'ring-2 ring-black dark:ring-white'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedOperator(operator);
                    const lat = parseFloat(operator.latitude as string);
                    const lon = parseFloat(operator.longitude as string);
                    mapRef.current?.setView([lat, lon], 14);
                  }}
                  data-testid={`card-operator-${operator.operatorId}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-black dark:text-white">{operator.name}</h3>
                        <button
                          onClick={(e) => toggleFavorite(operator.operatorId, e)}
                          className="hover:scale-110 transition-transform"
                          data-testid={`button-favorite-${operator.operatorId}`}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-colors ${
                              isFavorite(operator.operatorId) 
                                ? 'fill-red-500 text-red-500 icon-warm-glow' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-black dark:text-white">{operator.rating}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-400">{operator.totalJobs} jobs</span>
                      </div>
                    </div>
                    <Badge variant={operator.isOnline ? "default" : "secondary"} className={operator.isOnline ? "bg-green-500 dark:bg-green-600" : ""}>
                      {operator.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(operator.services as string[]).map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs dark:border-gray-600">
                        {service}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Truck className="w-4 h-4" />
                      <span>{operator.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{operator.address}</span>
                    </div>
                    {operator.hourlyRate && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black dark:text-white">${operator.hourlyRate}/hr</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                      size="sm"
                      onClick={(e) => handleRequestService(operator, e)}
                      data-testid={`button-request-${operator.operatorId}`}
                    >
                      Request Service
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenRatingDialog(operator, e)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                      data-testid={`button-rate-${operator.operatorId}`}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {ratingOperator?.name}</DialogTitle>
            <DialogDescription>
              Share your experience with this operator
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black dark:text-white">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                    data-testid={`button-star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black dark:text-white">
                Comment (optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={4}
                data-testid="textarea-rating-comment"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              data-testid="button-cancel-rating"
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitRatingMutation.mutate()}
              disabled={submitRatingMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black"
              data-testid="button-submit-rating"
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};
