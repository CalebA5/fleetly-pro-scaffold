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
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedService, setSelectedService] = useState<string>("");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOperator, setRatingOperator] = useState<Operator | null>(null);
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

  const { data: allOperators, isLoading } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
  });

  // Fetch customer's favorites
  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${customerId}`],
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (operator: Operator) => {
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const requestData: InsertServiceRequest = {
        requestId,
        customerId: customerId,
        customerName: customerName,
        operatorId: operator.operatorId,
        operatorName: operator.name,
        serviceType: (operator.services as string[])[0], // Use operator's first service
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
          popupContent.innerHTML = `
            <h3 class="font-bold text-black mb-2">${operator.name}</h3>
            <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${operator.rating}</p>
            <p class="text-sm text-gray-700"><strong>Rate:</strong> $${operator.hourlyRate}/hr</p>
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
  const panToOperator = (operator: Operator) => {
    if (!mapRef.current) return;
    
    const location = operatorLocations.get(operator.operatorId);
    const lat = location ? location.lat : parseFloat(operator.latitude as string);
    const lng = location ? location.lng : parseFloat(operator.longitude as string);
    
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1000,
    });

    setSelectedOperator(operator);

    // Show popup
    setTimeout(() => {
      if (popupRef.current) {
        popupRef.current.remove();
      }

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 min-w-[200px]';
      const trackingStatus = operatorLocations.get(operator.operatorId);
      popupContent.innerHTML = `
        <h3 class="font-bold text-black mb-2">${operator.name}</h3>
        <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${operator.rating}</p>
        <p class="text-sm text-gray-700"><strong>Rate:</strong> $${operator.hourlyRate}/hr</p>
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
      
      {/* Modern Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black dark:text-white">Find Operators</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <strong className="text-black dark:text-white">{operators?.length || 0}</strong> available nearby
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
          </div>
        </div>
      </div>

      {/* Modern Service Filters & View Toggle */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Service Filter Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <Select
              value={selectedService || "all"}
              onValueChange={(value) => setSelectedService(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-service-filter">
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
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {operators?.length || 0} available
            </span>
          </div>

          {/* View Mode Toggle - Mobile Only */}
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
              className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-black dark:bg-white text-white dark:text-black rounded-full p-3 shadow-2xl hover:shadow-orange-500/50 hover:scale-110 transition-all ring-2 ring-white dark:ring-black"
              style={{ marginLeft: isSidebarMinimized ? 'calc(100vw - 3rem - 1.5rem)' : 'calc(100vw - 24rem - 1.5rem)' }}
              aria-label={isSidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
              data-testid="button-toggle-sidebar"
            >
              {isSidebarMinimized ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
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
              operators?.map((operator) => (
                <Card
                  key={operator.operatorId}
                  className={`p-4 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border rounded-xl dark:border-gray-700 dark:bg-gray-900 ${
                    selectedOperator?.operatorId === operator.operatorId
                      ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02] border-orange-500'
                      : 'hover:border-orange-300'
                  }`}
                  onClick={() => panToOperator(operator)}
                  data-testid={`card-operator-${operator.operatorId}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-black dark:text-white">{operator.name}</h3>
                        {(() => {
                          const tier = operator.operatorTier || "professional";
                          const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                          const tierColors = {
                            professional: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700",
                            equipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
                            manual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700",
                          };
                          return (
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium border ${tierColors[tier as keyof typeof tierColors]}`}
                            >
                              {tierInfo.badge} {tier === "professional" ? "Pro" : tier === "equipped" ? "Equipped" : "Manual"}
                            </Badge>
                          );
                        })()}
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
                        {(() => {
                          const tier = operator.operatorTier || "professional";
                          const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                          const multiplier = tierInfo.pricingMultiplier;
                          if (multiplier !== 1.0) {
                            return (
                              <>
                                <span className="text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                  {multiplier > 1 ? `${multiplier}x` : `${multiplier}x`} price
                                </span>
                              </>
                            );
                          }
                          return null;
                        })()}
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

                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all"
                      size="sm"
                      onClick={(e) => handleRequestService(operator, e)}
                      data-testid={`button-request-${operator.operatorId}`}
                    >
                      <Truck className="w-4 h-4 mr-1" />
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
