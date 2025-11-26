import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Star, Truck, Filter, Heart, ChevronLeft, ChevronRight, List, Map as MapIcon, Target, GripHorizontal, ChevronUp, ChevronDown, Layers, PanelLeftClose, PanelLeft, Building2, User } from "lucide-react";
import type { Operator, InsertServiceRequest, Favorite } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { OperatorTile } from "@/components/OperatorTile";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Calgary, AB as default location
const DEFAULT_LOCATION: [number, number] = [-114.0719, 51.0447];

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
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [selectedOperator, setSelectedOperator] = useState<{cardId: string; operatorId: string; name: string; [key: string]: any} | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedService, setSelectedService] = useState<string>("");
  const { activeTheme } = useSeasonalTheme();
  const isDarkMode = activeTheme.mode === 'dark';
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingOperator, setRatingOperator] = useState<{operatorId: string; name: string; [key: string]: any} | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [operatorLocations, setOperatorLocations] = useState<Map<string, OperatorLocation>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  
  // Mobile bottom sheet state (for half-map/half-list design)
  const [sheetPosition, setSheetPosition] = useState<'collapsed' | 'half' | 'full'>('half');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const sheetStartHeight = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get base height in pixels for each position (accounts for bottom nav)
  const getBaseHeight = useCallback(() => {
    const vh = window.innerHeight;
    const bottomNavHeight = 64; // Bottom nav height
    const headerHeight = 56; // Page header height
    switch (sheetPosition) {
      case 'collapsed': return 56; // Minimal - just drag handle
      case 'half': return (vh - bottomNavHeight - headerHeight) * 0.5; // Half available space
      case 'full': return vh - headerHeight - bottomNavHeight; // Full available space
      default: return (vh - bottomNavHeight) * 0.5;
    }
  }, [sheetPosition]);

  // Sheet touch handlers for mobile dragging
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    sheetStartHeight.current = getBaseHeight();
    setIsDragging(true);
    setDragOffset(0);
  }, [getBaseHeight]);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = dragStartY.current - currentY; // Positive = dragged up
    setDragOffset(diff);
  }, [isDragging]);

  const handleSheetTouchEnd = useCallback(() => {
    setIsDragging(false);
    const vh = window.innerHeight;
    const finalHeight = sheetStartHeight.current + dragOffset;
    
    // Heights: collapsed=60px, half=45vh, full=vh-120
    const collapsedH = 60;
    const halfH = vh * 0.45;
    const fullH = vh - 120;
    
    // Use velocity/direction for better UX - if dragged up significantly, go to next state
    const dragThreshold = 50; // 50px drag triggers state change
    
    if (dragOffset > dragThreshold) {
      // Dragged up - go to next larger state
      if (sheetPosition === 'collapsed') setSheetPosition('half');
      else if (sheetPosition === 'half') setSheetPosition('full');
      else setSheetPosition('full');
    } else if (dragOffset < -dragThreshold) {
      // Dragged down - go to next smaller state
      if (sheetPosition === 'full') setSheetPosition('half');
      else if (sheetPosition === 'half') setSheetPosition('collapsed');
      else setSheetPosition('collapsed');
    }
    // Otherwise stay at current position
    
    setDragOffset(0);
  }, [dragOffset, sheetPosition]);

  // Get sheet height with drag offset
  const getSheetStyle = useCallback(() => {
    const baseHeight = getBaseHeight();
    const currentHeight = isDragging ? Math.max(80, Math.min(window.innerHeight * 0.9, baseHeight + dragOffset)) : baseHeight;
    return {
      height: `${currentHeight}px`,
      transition: isDragging ? 'none' : 'height 0.3s ease-out',
      touchAction: 'none'
    };
  }, [getBaseHeight, isDragging, dragOffset]);
  
  // Get location from context (persisted user location)
  const { location: contextLocation, formattedAddress: contextAddress } = useUserLocation();
  const contextLat = contextLocation?.coords.latitude ?? null;
  const contextLon = contextLocation?.coords.longitude ?? null;
  
  // Parse URL parameters for location, radius, and pre-selected services
  const searchParams = new URLSearchParams(window.location.search);
  const urlLat = searchParams.get('lat');
  const urlLon = searchParams.get('lon');
  const urlAddress = searchParams.get('address');
  const urlRadius = searchParams.get('radius'); // in kilometers
  const urlServices = searchParams.get('services'); // comma-separated service names
  
  // Use URL params if available, otherwise fall back to LocationContext
  const userLat = urlLat ? parseFloat(urlLat) : (contextLat !== null ? contextLat : null);
  const userLon = urlLon ? parseFloat(urlLon) : (contextLon !== null ? contextLon : null);
  const effectiveAddress = urlAddress || contextAddress;
  
  // Pre-selected services from home page
  const [preSelectedServices, setPreSelectedServices] = useState<string[]>([]);
  
  // Initialize pre-selected services from URL on mount
  useEffect(() => {
    if (urlServices) {
      const servicesArray = urlServices.split(',').map(s => s.trim()).filter(Boolean);
      setPreSelectedServices(servicesArray);
      // Set the first service as the active filter
      if (servicesArray.length > 0) {
        setSelectedService(servicesArray[0]);
      }
    }
  }, []);
  
  // Dynamic proximity radius slider (default: 50km, range: 1-100km)
  const [proximityRadius, setProximityRadius] = useState<number>(
    urlRadius ? parseFloat(urlRadius) : 50
  );
  const radiusFilter = proximityRadius; // Use dynamic slider value

  // Haversine distance calculation (returns distance in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const customerId = user?.id || "CUST-001";
  const customerName = user?.name || "Guest";

  // Fetch tier cards (separate cards per tier) - matches OperatorCard type from OperatorTile
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
    activeTier: "professional" | "equipped" | "manual";  // Match OperatorTier type
    subscribedTiers: ("professional" | "equipped" | "manual")[];
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

  const { data: allOperators, isLoading, error, isError } = useQuery<TierCard[]>({
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
        estimatedCost: "Pending quote", // Hide rate until after acceptance
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

  // State for favorites filter
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Helper to check if operator is the current user
  const isSelf = (operatorId: string) => {
    return user?.operatorId && operatorId === user.operatorId;
  };

  // Filter operators by selected service AND favorites AND radius (show self but disable service requests)
  const operators = allOperators?.filter(op => {
    // Filter by service if selected
    const matchesService = !selectedService || op.services?.includes(selectedService);
    
    // Filter by favorites if enabled
    const matchesFavorites = !showFavoritesOnly || isFavorite(op.operatorId);
    
    // NO self-exclusion: allow user's own operator to appear on map
    // They will see themselves but cannot request services from themselves
    
    // Filter by distance radius if specified
    let withinRadius = true;
    if (radiusFilter !== null && userLat !== null && userLon !== null) {
      // Check if operator has valid coordinates
      if (op.latitude && op.longitude) {
        const opLat = parseFloat(op.latitude);
        const opLon = parseFloat(op.longitude);
        
        // Only filter by distance if coordinates are valid numbers
        if (!isNaN(opLat) && !isNaN(opLon)) {
          const distance = calculateDistance(userLat, userLon, opLat, opLon);
          withinRadius = distance <= radiusFilter;
        }
        // If coordinates are invalid, still show the operator (withinRadius remains true)
      }
      // If operator has no location set, still show them (withinRadius remains true)
    }
    
    return matchesService && matchesFavorites && withinRadius;
  });

  // Get map style URL based on selection and theme
  const getMapStyle = useCallback(() => {
    if (mapStyle === 'satellite') {
      return 'mapbox://styles/mapbox/satellite-streets-v12';
    }
    // Use dark style for dark mode (like Uber/Lyft)
    return isDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12';
  }, [mapStyle, isDarkMode]);

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
      // Use user's location if provided via URL params, otherwise default to Calgary, AB
      const initialCenter: [number, number] = (userLat !== null && userLon !== null) 
        ? [userLon, userLat] 
        : DEFAULT_LOCATION;
      
      const initialZoom = (userLat !== null && userLon !== null) ? 13 : 11;
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: getMapStyle(),
        center: initialCenter,
        zoom: initialZoom,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setMapLoaded(true);
        // Note: User location marker is now handled by separate useEffect
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

  // Handle map style changes (including dark mode toggle)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(getMapStyle());
  }, [mapStyle, mapLoaded, isDarkMode, getMapStyle]);

  // Update map center and user location marker when coordinates change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (userLat === null || userLon === null) return;

    // Fly to user's location
    mapRef.current.flyTo({
      center: [userLon, userLat],
      zoom: 13,
      essential: true
    });

    // Remove old user location marker if exists
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    // Create new user location marker
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3B82F6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    const userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([userLon, userLat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="p-2"><strong>Your Location</strong>${effectiveAddress ? `<br/><span class="text-sm text-gray-600">${effectiveAddress}</span>` : ''}</div>`)
      )
      .addTo(mapRef.current);

    userLocationMarkerRef.current = userMarker;
  }, [userLat, userLon, effectiveAddress, mapLoaded]);

  // Handle sidebar toggle - resize map to fill available space
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    // Small delay to allow CSS transition to complete before resizing
    const resizeTimer = setTimeout(() => {
      mapRef.current?.resize();
    }, 350); // Slightly longer than the 300ms transition duration
    
    return () => clearTimeout(resizeTimer);
  }, [isSidebarMinimized, mapLoaded]);


  // Create and update markers for operators
  useEffect(() => {
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
          
          // Center map on clicked operator with smooth animation
          map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 13), // Zoom in to at least level 13
            duration: 1000, // 1 second animation
            essential: true // This animation is essential and won't be interrupted
          });
          
          // Remove existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create popup content (mysterious: hide rate)
          const popupContent = document.createElement('div');
          popupContent.className = 'p-2 min-w-[200px]';
          const trackingStatus = operatorLocations.get(operator.operatorId);
          const rating = operator.rating || 0;
          popupContent.innerHTML = `
            <h3 class="font-bold text-black mb-2">${operator.name}</h3>
            <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${rating}</p>
            <p class="text-sm text-orange-600 italic">📞 Rates revealed after request</p>
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
      // Check if map is still valid before showing popup
      if (!mapRef.current) return;
      
      if (popupRef.current) {
        popupRef.current.remove();
      }

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 min-w-[200px]';
      const trackingStatus = operatorLocations.get(operatorCard.operatorId);
      const rating = operatorCard.avgRating || operatorCard.rating || 0;
      popupContent.innerHTML = `
        <h3 class="font-bold text-black mb-2">${operatorCard.name}</h3>
        <p class="text-sm text-gray-700"><strong>Rating:</strong> ⭐ ${rating}</p>
        <p class="text-sm text-orange-600 italic">📞 Rates revealed after request</p>
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
        .addTo(mapRef.current);

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
    
    // Prevent self-service requests
    if (isSelf(operatorCard.operatorId)) {
      toast({
        title: "Cannot Request Service from Yourself",
        description: "You cannot create service requests for your own operator profile.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to detailed service request form
    // Pre-fill service type and operator info
    const services = operatorCard.activeTiers?.[0]?.services || operatorCard.services || [];
    const firstService = services.length > 0 ? services[0] : "";
    const serviceName = typeof firstService === 'string' ? firstService : firstService?.name || '';
    const params = new URLSearchParams({
      service: serviceName,
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
          {isError && <p className="text-red-500 mt-4 text-sm">Error: {String(error)}</p>}
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 text-lg mb-4">Failed to load operators</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{String(error)}</p>
          <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
            Retry
          </Button>
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
      
      {/* Mobile-First Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        {/* Top Row: Title, Count, Filter Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-black dark:text-white">Find Operators</h1>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              {operators?.length || 0}
            </span>
          </div>
          
          {/* Filter Dropdown Button */}
          <Select
            value={`${selectedService || 'all'}_${proximityRadius}`}
            onValueChange={(value) => {
              // Parse combined value
              const parts = value.split('_');
              if (parts.length >= 2) {
                const svc = parts.slice(0, -1).join('_');
                const rad = parseInt(parts[parts.length - 1]);
                setSelectedService(svc === 'all' ? '' : svc);
                if (!isNaN(rad)) setProximityRadius(rad);
              }
            }}
          >
            <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto" data-testid="button-filter-menu">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service Type</p>
              </div>
              {services.map((service) => (
                <SelectItem 
                  key={service} 
                  value={`${service === "All" ? "all" : service}_${proximityRadius}`}
                  className="cursor-pointer"
                >
                  {service}
                </SelectItem>
              ))}
              {userLat !== null && userLon !== null && (
                <>
                  <div className="px-3 py-2 border-t border-b border-gray-100 dark:border-gray-700 mt-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</p>
                  </div>
                  {[10, 25, 50, 75, 100].map((distance) => (
                    <SelectItem 
                      key={`dist-${distance}`} 
                      value={`${selectedService || 'all'}_${distance}`}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-teal-600" />
                        Within {distance} km
                        {proximityRadius === distance && <span className="ml-auto text-teal-600">✓</span>}
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Map Style Toggle - Map vs Satellite */}
        <div className="hidden md:flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setMapStyle('streets')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mapStyle === 'streets' 
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-testid="button-map-style-streets"
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mapStyle === 'satellite' 
                ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
            data-testid="button-map-style-satellite"
          >
            <Layers className="w-4 h-4" />
            Satellite
          </button>
        </div>
        
        {/* Active Filters Display */}
        {(selectedService || showFavoritesOnly || (userLat && proximityRadius !== 50)) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedService && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-xs font-medium">
                {selectedService}
                <button onClick={() => setSelectedService('')} className="hover:text-teal-900">×</button>
              </span>
            )}
            {userLat && proximityRadius !== 50 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                <Target className="w-3 h-3" />
                {proximityRadius} km
                <button onClick={() => setProximityRadius(50)} className="hover:text-orange-900">×</button>
              </span>
            )}
            {showFavoritesOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                <Heart className="w-3 h-3 fill-current" />
                Favorites
                <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-red-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Map and List Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Desktop Sidebar - Collapsible */}
        {!isMobile && (
          <div 
            className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
              isSidebarMinimized ? 'w-0' : 'md:w-96 lg:w-[400px]'
            }`}
          >
            {!isSidebarMinimized && (
              <>
                {/* Sidebar Header with minimize button */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-black dark:text-white">
                      {operators?.length || 0} Operators
                    </h2>
                    <button 
                      onClick={() => setIsSidebarMinimized(true)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      data-testid="button-minimize-sidebar"
                    >
                      <PanelLeftClose className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                {/* Operator List */}
                <div className="flex-1 overflow-y-auto">
                  {operators?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-2">No operators found</p>
                      <p className="text-xs text-gray-400 text-center mb-4">Try adjusting filters or expanding search</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedService("");
                          setProximityRadius(100);
                        }}
                      >
                        Expand Search
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      {operators?.map((operatorCard) => (
                        <div 
                          key={operatorCard.cardId}
                          className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all relative ${
                            isSelf(operatorCard.operatorId)
                              ? 'ring-2 ring-blue-300 dark:ring-blue-700 bg-blue-50 dark:bg-blue-900/20'
                              : selectedOperator?.cardId === operatorCard.cardId 
                                ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                                : ''
                          }`}
                          onClick={() => {
                            setSelectedOperator(operatorCard);
                            panToOperator(operatorCard);
                          }}
                          data-testid={`desktop-operator-${operatorCard.cardId}`}
                        >
                          {/* Self-indicator badge */}
                          {isSelf(operatorCard.operatorId) && (
                            <div className="absolute top-2 right-2 z-10">
                              <span className="text-[10px] font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                Your Operator
                              </span>
                            </div>
                          )}
                          
                          {/* Top Row: Photo + Name + Online Status */}
                          <div className="flex items-center gap-3 mb-3">
                            {/* Profile Photo / Business Logo */}
                            <div className="relative flex-shrink-0">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center overflow-hidden shadow-sm">
                                {operatorCard.photo ? (
                                  <img src={operatorCard.photo} alt={operatorCard.name} className="w-full h-full object-cover" />
                                ) : (operatorCard as any).businessLicense ? (
                                  <Building2 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                ) : (
                                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                )}
                              </div>
                              {/* Online indicator */}
                              {operatorCard.isOnline === 1 && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                              )}
                            </div>
                            
                            {/* Name and Type */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-black dark:text-white truncate">{operatorCard.name}</h4>
                                {!isSelf(operatorCard.operatorId) && isFavorite(operatorCard.operatorId) && (
                                  <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(operatorCard as any).businessLicense ? 'Business' : 'Individual'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stats Row */}
                          <div className="flex items-center gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-black dark:text-white">{operatorCard.rating}</span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {operatorCard.totalJobs} jobs
                            </div>
                            {userLat && userLon && (
                              <div className="text-teal-600 dark:text-teal-400 font-medium ml-auto">
                                {calculateDistance(userLat, userLon, parseFloat(operatorCard.latitude), parseFloat(operatorCard.longitude)).toFixed(1)} km away
                              </div>
                            )}
                          </div>
                          
                          {/* Services Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {operatorCard.services?.slice(0, 3).map((service: any, idx: number) => {
                              const serviceName = typeof service === 'string' ? service : service?.name || 'Service';
                              return (
                                <span key={idx} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600">
                                  {serviceName}
                                </span>
                              );
                            })}
                            {operatorCard.services?.length > 3 && (
                              <span className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                                +{operatorCard.services.length - 3} more
                              </span>
                            )}
                          </div>
                          
                          {/* Action Button - Disabled for own operator */}
                          {isSelf(operatorCard.operatorId) ? (
                            <div className="relative w-full">
                              <Button 
                                className="w-full bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60 blur-[1px]"
                                size="sm"
                                disabled
                                data-testid={`button-request-${operatorCard.cardId}-disabled`}
                              >
                                Request Service
                              </Button>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm">
                                  Your Operator
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              className="w-full"
                              size="sm"
                              onClick={(e) => handleRequestService(operatorCard, e)}
                              data-testid={`button-request-${operatorCard.cardId}`}
                            >
                              Request Service
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Sidebar expand button (shown when minimized) */}
        {!isMobile && isSidebarMinimized && (
          <button 
            onClick={() => setIsSidebarMinimized(false)}
            className="absolute left-0 top-4 z-20 bg-white dark:bg-gray-800 p-2 rounded-r-lg shadow-lg border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            data-testid="button-expand-sidebar"
          >
            <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Map View - Always visible */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
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

        {/* Mobile Bottom Sheet - Seamlessly integrated sliding panel over map */}
        {isMobile && (
          <div 
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-30"
            style={{
              ...getSheetStyle(),
              paddingBottom: '64px', // Space for bottom nav
            }}
          >
            {/* Drag Handle - Larger touch target for better UX */}
            <div 
              className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="w-10 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mb-1" />
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 py-1">
                {sheetPosition === 'collapsed' && (
                  <>
                    <ChevronUp className="w-4 h-4 animate-bounce" />
                    <span>Swipe up to see operators</span>
                  </>
                )}
                {sheetPosition === 'half' && (
                  <span className="font-medium">{operators?.length || 0} operators nearby</span>
                )}
                {sheetPosition === 'full' && (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Swipe down for map</span>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Sheet Content - Scrollable operator list */}
            <div 
              className={`overflow-y-auto px-4 ${sheetPosition === 'collapsed' && !isDragging ? 'hidden' : ''}`} 
              style={{ height: 'calc(100% - 60px)', opacity: sheetPosition === 'collapsed' && !isDragging ? 0 : 1 }}
            >
              {/* Quick filters as horizontal scroll chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                <button
                  onClick={() => setSelectedService('')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !selectedService ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                  data-testid="filter-chip-all"
                >
                  All
                </button>
                {services.slice(1).map(service => (
                  <button
                    key={service}
                    onClick={() => setSelectedService(service)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedService === service ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    data-testid={`filter-chip-${service.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {service}
                  </button>
                ))}
              </div>

              {/* Operator Cards - Mobile optimized */}
              <div className="space-y-3 pb-4">
                {operators?.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No operators found nearby</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => {
                        setSelectedService('');
                        setProximityRadius(100);
                      }}
                    >
                      Expand search
                    </Button>
                  </div>
                ) : (
                  operators?.map((operatorCard) => (
                    <div
                      key={operatorCard.cardId}
                      className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm relative ${
                        isSelf(operatorCard.operatorId)
                          ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-200/50 dark:ring-blue-800/50'
                          : selectedOperator?.cardId === operatorCard.cardId 
                            ? 'ring-2 ring-teal-500 border-gray-200 dark:border-gray-700' 
                            : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedOperator(operatorCard);
                        setSheetPosition('collapsed');
                        setTimeout(() => panToOperator(operatorCard), 100);
                      }}
                      data-testid={`mobile-operator-card-${operatorCard.cardId}`}
                    >
                      {/* Self-indicator badge for mobile */}
                      {isSelf(operatorCard.operatorId) && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="text-[10px] font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                            Your Operator
                          </span>
                        </div>
                      )}
                      
                      <div className="flex gap-3 p-3">
                        {/* Operator Photo */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                          {operatorCard.photo ? (
                            <img src={operatorCard.photo} alt={operatorCard.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">{operatorCard.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>

                        {/* Operator Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-semibold text-black dark:text-white truncate">{operatorCard.name}</h4>
                                {!isSelf(operatorCard.operatorId) && isFavorite(operatorCard.operatorId) && (
                                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                              {/* Services */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {operatorCard.services?.slice(0, 2).map((service: any, idx: number) => {
                                  const serviceName = typeof service === 'string' ? service : service?.name || 'Service';
                                  return (
                                    <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                      {serviceName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Map icon to view on map */}
                            <button 
                              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetPosition('collapsed');
                                setTimeout(() => panToOperator(operatorCard), 100);
                              }}
                              data-testid={`button-map-pin-${operatorCard.cardId}`}
                            >
                              <MapIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>

                          {/* Rating, jobs, distance row */}
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{operatorCard.rating}</span>
                            </div>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-gray-500 dark:text-gray-400">{operatorCard.totalJobs} jobs</span>
                            {userLat && userLon && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span className="text-teal-600 dark:text-teal-400 font-medium">
                                  {calculateDistance(userLat, userLon, parseFloat(operatorCard.latitude), parseFloat(operatorCard.longitude)).toFixed(1)} km
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - Disabled for own operator */}
                      <div className="flex border-t border-gray-100 dark:border-gray-700">
                        {isSelf(operatorCard.operatorId) ? (
                          <>
                            <div className="flex-1 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50">
                              <Heart className="w-4 h-4" />
                              Your Operator
                            </div>
                            <div className="flex-1 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1.5 border-l border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-50">
                              <Truck className="w-4 h-4" />
                              N/A
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              className="flex-1 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-center gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isFavorite(operatorCard.operatorId)) {
                                  removeFavoriteMutation.mutate(operatorCard.operatorId);
                                } else {
                                  addFavoriteMutation.mutate(operatorCard.operatorId);
                                }
                              }}
                            >
                              <Heart className={`w-4 h-4 ${isFavorite(operatorCard.operatorId) ? 'fill-red-500 text-red-500' : ''}`} />
                              {isFavorite(operatorCard.operatorId) ? 'Saved' : 'Save'}
                            </button>
                            <button
                              className="flex-1 py-2.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-center gap-1.5 border-l border-gray-100 dark:border-gray-700"
                              onClick={(e) => handleRequestService(operatorCard, e)}
                            >
                              <Truck className="w-4 h-4" />
                              Request
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
