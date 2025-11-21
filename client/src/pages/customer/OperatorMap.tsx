import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Star, Truck, Filter, Heart, ChevronLeft, ChevronRight, List, Map as MapIcon } from "lucide-react";
import type { Operator, InsertServiceRequest, Favorite } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { OperatorTile } from "@/components/OperatorTile";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [selectedOperator, setSelectedOperator] = useState<{cardId: string; operatorId: string; name: string; [key: string]: any} | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedService, setSelectedService] = useState<string>("");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOperator, setRatingOperator] = useState<{operatorId: string; name: string; [key: string]: any} | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [operatorLocations, setOperatorLocations] = useState<Map<string, OperatorLocation>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  // Reset sidebar minimize state when switching to list view and disable map interactions
  useEffect(() => {
    if (viewMode === 'list') {
      setIsSidebarMinimized(false);
      // Disable map interactions in list view
      if (mapRef.current) {
        mapRef.current.scrollZoom.disable();
        mapRef.current.boxZoom.disable();
        mapRef.current.dragRotate.disable();
        mapRef.current.dragPan.disable();
        mapRef.current.keyboard.disable();
        mapRef.current.doubleClickZoom.disable();
        mapRef.current.touchZoomRotate.disable();
      }
    } else if (viewMode === 'map' && mapRef.current) {
      // Re-enable map interactions in map view
      mapRef.current.scrollZoom.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.dragRotate.enable();
      mapRef.current.dragPan.enable();
      mapRef.current.keyboard.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.touchZoomRotate.enable();
    }
  }, [viewMode]);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const customerId = user?.id || "CUST-001";
  const customerName = user?.name || "Guest";

  // Fetch tier cards (separate cards per tier)
  type TierCard = {
    cardId: string;
    tierType: "professional" | "equipped_manual";
    includedTiers: string[];
    isActive: boolean;
    operatorId: string;
    name: string;
    email: string;
    phone: string;
    photo: string | null;
    latitude: string;
    longitude: string;
    address: string;
    isOnline: number;
    hourlyRate: string;
    availability: string;
    activeTier: string;
    subscribedTiers: string[];
    services: string[];
    vehicle: string;
    licensePlate: string;
    equipmentInventory: any[];
    primaryVehicleImage: string | null;
    totalJobs: number;
    rating: string;
    recentReviews: any[];
    reviewCount: number;
  };

  const { data: allOperators, isLoading } = useQuery<TierCard[]>({
    queryKey: ['/api/operator-cards'],
  });

  // Fetch customer's favorites
  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${customerId}`],
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (operatorCard: any) => {
      // Use tier card's services (already merged for this tier)
      const services = operatorCard.services || [];
      const requestData: InsertServiceRequest = {
        customerId: customerId,
        customerName: customerName,
        operatorId: operatorCard.operatorId,
        operatorName: operatorCard.name,
        serviceType: services[0] || "General Service",
        status: "pending",
        location: operatorCard.address,
        estimatedCost: operatorCard.hourlyRate || "0.00",
      };

      const response = await apiRequest("/api/service-requests", {
        method: "POST",
        body: JSON.stringify(requestData),
        headers: { "Content-Type": "application/json" },
      });
      
      return response;
    },
    onSuccess: (data, operatorCard) => {
      // Start tracking this operator as moving
      const operatorLat = parseFloat(operatorCard.latitude as string);
      const operatorLng = parseFloat(operatorCard.longitude as string);
      
      // Simulate a destination (offset from current position)
      const targetLat = operatorLat + (Math.random() - 0.5) * 0.05;
      const targetLng = operatorLng + (Math.random() - 0.5) * 0.05;
      
      setOperatorLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(operatorCard.operatorId, {
          operatorId: operatorCard.operatorId,
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
        body: JSON.stringify({ customerId: customerId, operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${customerId}`] });
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
      return await apiRequest(`/api/favorites/${customerId}/${operatorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${customerId}`] });
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
          customerId: customerId,
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
  const handleOpenRatingDialog = (operatorCard: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRatingOperator(operatorCard);
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

  // Filter operators by selected service
  const operators = selectedService 
    ? allOperators?.filter(op => {
        // Check if any active tier provides this service
        return op.activeTiers?.some((tier: any) => 
          tier.services?.includes(selectedService)
        ) || op.services?.includes(selectedService);
      })
    : allOperators;

  // Get map style URL based on selection
  const getMapStyle = () => {
    return mapStyle === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/streets-v12';
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token is missing!');
      toast({
        title: "Map Configuration Error",
        description: "Mapbox access token is not configured",
        variant: "destructive",
      });
      setMapLoaded(true);
      return;
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: [-73.9851, 40.7589],
        zoom: 12,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapLoaded(true);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(true);
    }
  }, []);

  // Handle map style changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(getMapStyle());
  }, [mapStyle, mapLoaded]);

  // Handle sidebar toggle - resize map to fill available space
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    // Small delay to allow CSS transition to complete before resizing
    const resizeTimer = setTimeout(() => {
      mapRef.current?.resize();
    }, 350); // Slightly longer than the 300ms transition duration
    
    return () => clearTimeout(resizeTimer);
  }, [isSidebarMinimized, mapLoaded]);

  // Pause marker updates when in list view on mobile to improve performance
  useEffect(() => {
    if (viewMode === 'list' && window.innerWidth < 768) {
      // Don't update markers when in mobile list view
      return;
    }
  }, [viewMode]);

  // Create and update markers for operators
  useEffect(() => {
    // Skip marker updates in mobile list view
    if (viewMode === 'list' && window.innerWidth < 768) return;
    if (!mapRef.current || !mapLoaded || !operators) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Remove markers that are no longer in the operators list
    const currentOperatorIds = new Set(operators.map(op => op.operatorId));
    currentMarkers.forEach((marker, operatorId) => {
      if (!currentOperatorIds.has(operatorId)) {
        marker.remove();
        currentMarkers.delete(operatorId);
      }
    });

    // Add or update markers for each operator
    operators.forEach((operator) => {
      const location = operatorLocations.get(operator.operatorId);
      const lat = location ? location.lat : parseFloat(operator.latitude as string);
      const lng = location ? location.lng : parseFloat(operator.longitude as string);
      const isMoving = location?.isMoving || false;

      let marker = currentMarkers.get(operator.operatorId);

      if (!marker) {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'cursor-pointer relative';
        el.innerHTML = isMoving
          ? `<div class="relative">
              <svg width="30" height="45" viewBox="0 0 30 45" class="animate-pulse">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 30 15 30s15-19.5 15-30C30 6.7 23.3 0 15 0z" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
                <circle cx="15" cy="15" r="5" fill="white"/>
              </svg>
            </div>`
          : `<svg width="30" height="45" viewBox="0 0 30 45">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 30 15 30s15-19.5 15-30C30 6.7 23.3 0 15 0z" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
              <circle cx="15" cy="15" r="5" fill="white"/>
            </svg>`;

        marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map);

        // Add click handler
        el.addEventListener('click', () => {
          setSelectedOperator(operator);
          
          // Remove existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'p-2 min-w-[200px]';
          const trackingStatus = operatorLocations.get(operator.operatorId);
          const rating = operator.avgRating || operator.rating || 0;
          const hourlyRate = operator.hourlyRate || 0;
          popupContent.innerHTML = `
            <h3 class="font-bold text-black mb-2">${operator.name}</h3>
            <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${rating}</p>
            <p class="text-sm text-gray-700"><strong>Rate:</strong> $${hourlyRate}/hr</p>
            ${trackingStatus ? `
              <p class="text-sm mt-1">
                <strong>Status:</strong>
                <span class="${trackingStatus.isMoving ? 'text-red-600' : 'text-green-600'}">
                  ${trackingStatus.isMoving ? 'En Route 🚗' : 'Arrived ✓'}
                </span>
              </p>
            ` : ''}
          `;

          const popup = new mapboxgl.Popup({ offset: 25 })
            .setLngLat([lng, lat])
            .setDOMContent(popupContent)
            .addTo(map);

          popupRef.current = popup;
        });

        currentMarkers.set(operator.operatorId, marker);
      } else {
        // Update existing marker position and appearance
        marker.setLngLat([lng, lat]);
        
        // Update marker appearance based on moving status
        const el = marker.getElement();
        el.innerHTML = isMoving
          ? `<div class="relative">
              <svg width="30" height="45" viewBox="0 0 30 45" class="animate-pulse">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 30 15 30s15-19.5 15-30C30 6.7 23.3 0 15 0z" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
                <circle cx="15" cy="15" r="5" fill="white"/>
              </svg>
            </div>`
          : `<svg width="30" height="45" viewBox="0 0 30 45">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 30 15 30s15-19.5 15-30C30 6.7 23.3 0 15 0z" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
              <circle cx="15" cy="15" r="5" fill="white"/>
            </svg>`;
      }
    });
  }, [operators, operatorLocations, mapLoaded]);

  // Pan map to operator location
  const panToOperator = (operatorCard: any) => {
    if (!mapRef.current) return;
    
    const location = operatorLocations.get(operatorCard.operatorId);
    const lat = location ? location.lat : parseFloat(operatorCard.latitude as string);
    const lng = location ? location.lng : parseFloat(operatorCard.longitude as string);
    
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1000,
    });

    setSelectedOperator(operatorCard);

    // Show popup
    setTimeout(() => {
      if (popupRef.current) {
        popupRef.current.remove();
      }

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 min-w-[200px]';
      const trackingStatus = operatorLocations.get(operatorCard.operatorId);
      const rating = operatorCard.avgRating || operatorCard.rating || 0;
      const hourlyRate = operatorCard.hourlyRate || 0;
      popupContent.innerHTML = `
        <h3 class="font-bold text-black mb-2">${operatorCard.name}</h3>
        <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${rating}</p>
        <p class="text-sm text-gray-700"><strong>Rate:</strong> $${hourlyRate}/hr</p>
        ${trackingStatus ? `
          <p class="text-sm mt-1">
            <strong>Status:</strong>
            <span class="${trackingStatus.isMoving ? 'text-red-600' : 'text-green-600'}">
              ${trackingStatus.isMoving ? 'En Route 🚗' : 'Arrived ✓'}
            </span>
          </p>
        ` : ''}
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setLngLat([lng, lat])
        .setDOMContent(popupContent)
        .addTo(mapRef.current!);

      popupRef.current = popup;
    }, 1000);
  };

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
          
          hasChanges = true;
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [operatorLocations]);


  const handleRequestService = (operatorCard: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to detailed service request form
    // Pre-fill service type and operator info
    const services = operatorCard.activeTiers?.[0]?.services || operatorCard.services || [];
    const service = services.length > 0 ? services[0] : "";
    const params = new URLSearchParams({
      service: service,
      operatorId: operatorCard.operatorId,
      operatorName: operatorCard.name
    });
    navigate(`/customer/create-request?${params.toString()}`);
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 pb-16 md:pb-0">
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
      
      {/* Unified Page Header with All Controls */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-white via-gray-50 to-orange-50 dark:from-gray-900 dark:via-gray-850 dark:to-orange-900/10 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Title + Count + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-black dark:text-white">Find Operators</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <strong className="text-black dark:text-white">{operators?.length || 0}</strong> available
                  </p>
                </div>
              </div>
              
              {/* Service Filter */}
              <div className="flex items-center gap-2 sm:ml-4">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <Select
                  value={selectedService || "all"}
                  onValueChange={(value) => setSelectedService(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-[160px]" data-testid="select-service-filter">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem 
                        key={service} 
                        value={service === "All" ? "all" : service}
                      >
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: View Controls */}
            <div className="flex items-center gap-2">
              {/* Map/Satellite Toggle - Desktop */}
              <div className="hidden md:flex gap-2">
                <Button
                  variant={mapStyle === 'streets' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMapStyle('streets')}
                  className={`transition-all ${mapStyle === 'streets' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black shadow-md' : 'hover:border-gray-400'}`}
                  data-testid="button-map-view"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant={mapStyle === 'satellite' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMapStyle('satellite')}
                  className={`transition-all ${mapStyle === 'satellite' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black shadow-md' : 'hover:border-gray-400'}`}
                  data-testid="button-satellite-view"
                >
                  <Truck className="w-4 h-4 mr-1" />
                  Satellite
                </Button>
              </div>

              {/* Map/List View Toggle - Mobile */}
              <div className="flex gap-2 md:hidden">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={`transition-all ${viewMode === 'map' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' : ''}`}
                  data-testid="button-map-view-toggle"
                >
                  <MapIcon className="w-4 h-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`transition-all ${viewMode === 'list' ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' : ''}`}
                  data-testid="button-list-view-toggle"
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map - Disabled on mobile when in list view */}
        <div className={`flex-1 relative bg-gray-100 dark:bg-gray-900 ${
          viewMode === 'list' ? 'hidden md:flex' : 'flex'
        } ${viewMode === 'list' ? 'pointer-events-none' : ''}`}>
          <div ref={mapContainerRef} className="absolute inset-0" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with minimize toggle - Full width on mobile in list view */}
        <div className={`relative border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-all duration-300 ${
          viewMode === 'list' 
            ? 'w-full md:w-96' 
            : isSidebarMinimized 
              ? 'hidden md:block md:w-12' 
              : 'hidden md:block md:w-96'
        }`}>
          {/* Toggle Button - Only visible and functional on desktop in map view - STICKY/FIXED */}
          {viewMode === 'map' && (
            <button
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
              className="hidden md:flex items-center justify-center fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-r-lg px-2 py-6 shadow-lg border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:pr-3 transition-all duration-200 group"
              style={{ marginLeft: isSidebarMinimized ? 'calc(100vw - 3rem)' : 'calc(100vw - 24rem)' }}
              aria-label={isSidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
              data-testid="button-toggle-sidebar"
            >
              {isSidebarMinimized ? (
                <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          )}

          {!isSidebarMinimized && (
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
                            onClick={() => panToOperator(operator)}
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
              operators?.map((operatorCard) => (
                <div 
                  key={operatorCard.cardId}
                  onClick={() => panToOperator(operatorCard)}
                  className={selectedOperator?.cardId === operatorCard.cardId ? 'ring-2 ring-orange-500 rounded-xl' : ''}
                >
                  <OperatorTile
                    operator={operatorCard}
                    isFavorite={isFavorite(operatorCard.operatorId)}
                    onFavoriteToggle={(operatorId, isFav) => {
                      if (isFav) {
                        addFavoriteMutation.mutate(operatorId);
                      } else {
                        removeFavoriteMutation.mutate(operatorId);
                      }
                    }}
                  />
                </div>
              ))
            )}
            </div>
          )}

          {/* Minimized State - Show compact vertical icons */}
          {isSidebarMinimized && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 writing-mode-vertical-rl rotate-180">
                Operators ({operators?.length || 0})
              </div>
              {favorites.length > 0 && (
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              )}
            </div>
          )}
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
