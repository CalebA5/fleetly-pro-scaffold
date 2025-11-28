import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { AlertCircle, MapPin, Phone, Clock, CheckCircle, Loader2, User, Users, Home, ArrowLeft, Navigation, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { EmergencyRequest, DispatchQueue } from "@shared/schema";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface EmergencyWithQueue extends EmergencyRequest {
  queue?: (DispatchQueue & { 
    operatorName?: string; 
    operatorPhone?: string;
    operatorLatitude?: string;
    operatorLongitude?: string;
  })[];
  notifiedCount?: number;
}

export default function EmergencyTracking() {
  const { emergencyId } = useParams<{ emergencyId: string }>();
  const [, setLocation] = useLocation();
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [mapError, setMapError] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const operatorMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const { data: emergency, isLoading } = useQuery<EmergencyWithQueue>({
    queryKey: [`/api/emergency-requests/${emergencyId}`],
    refetchInterval: 3000,
    enabled: !!emergencyId,
  });

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;
    
    try {
      const isDark = document.documentElement.classList.contains('dark');
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isDark 
          ? "mapbox://styles/mapbox/dark-v11" 
          : "mapbox://styles/mapbox/streets-v12",
        center: [-114.0719, 51.0447],
        zoom: 13,
      });
      
      map.on('error', () => {
        setMapError(true);
      });
      
      mapRef.current = map;
      
      return () => {
        operatorMarkersRef.current.forEach(m => m.remove());
        operatorMarkersRef.current = [];
        if (customerMarkerRef.current) {
          customerMarkerRef.current.remove();
          customerMarkerRef.current = null;
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
    if (!mapRef.current || !emergency) return;
    
    const map = mapRef.current;
    const customerLat = parseFloat(emergency.latitude || "0");
    const customerLng = parseFloat(emergency.longitude || "0");
    
    if (customerLat && customerLng) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.remove();
      }
      
      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <div class="emergency-customer-marker">
          <div class="marker-core"></div>
          <div class="marker-pulse"></div>
          <div class="marker-pulse-outer"></div>
        </div>
        <style>
          .emergency-customer-marker {
            position: relative;
            width: 60px;
            height: 60px;
          }
          .emergency-customer-marker .marker-core {
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
          .emergency-customer-marker .marker-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border: 3px solid #ef4444;
            border-radius: 50%;
            opacity: 0.6;
            animation: emergency-pulse-ring 2s infinite;
            z-index: 2;
          }
          .emergency-customer-marker .marker-pulse-outer {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            border: 2px solid #f97316;
            border-radius: 50%;
            opacity: 0.3;
            animation: emergency-pulse-ring 2s infinite 0.5s;
            z-index: 1;
          }
          @keyframes emergency-pulse-ring {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
        </style>
      `;
      
      customerMarkerRef.current = new mapboxgl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([customerLng, customerLat])
        .addTo(map);
      
      map.flyTo({
        center: [customerLng, customerLat],
        zoom: 14,
        duration: 1000,
      });
    }
    
    operatorMarkersRef.current.forEach(m => m.remove());
    operatorMarkersRef.current = [];
    
    if (emergency.queue && emergency.queue.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (customerLat && customerLng) {
        bounds.extend([customerLng, customerLat]);
      }
      
      emergency.queue.forEach((q, index) => {
        const opLat = parseFloat(q.operatorLatitude || "0");
        const opLng = parseFloat(q.operatorLongitude || "0");
        
        if (opLat && opLng) {
          bounds.extend([opLng, opLat]);
          
          const isAccepted = q.status === "accepted";
          const markerColor = isAccepted ? "#22c55e" : "#3b82f6";
          const markerBg = isAccepted ? "bg-green-500" : "bg-blue-500";
          
          const el = document.createElement("div");
          el.innerHTML = `
            <div class="relative">
              <div class="w-10 h-10 ${markerBg} rounded-full flex items-center justify-center shadow-lg border-3 border-white ${isAccepted ? 'ring-4 ring-green-300 animate-pulse' : ''}">
                <span class="text-white font-bold text-sm">${index + 1}</span>
              </div>
              ${isAccepted ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' : ''}
            </div>
          `;
          
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([opLng, opLat])
            .addTo(map);
          
          operatorMarkersRef.current.push(marker);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
      }
    }
  }, [emergency]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400">Loading emergency details...</p>
        </div>
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
            Emergency Request Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to find emergency request #{emergencyId}
          </p>
          <BackButton fallbackPath="/" label="Go Home" />
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "searching":
        return {
          icon: Loader2,
          text: "Finding Nearby Operators",
          subtext: "Notifying operators in your area...",
          color: "text-orange-500",
          bgColor: "bg-orange-500",
          animate: "animate-spin",
        };
      case "operator_assigned":
        return {
          icon: User,
          text: "Operator Assigned",
          subtext: "Help is on the way!",
          color: "text-green-500",
          bgColor: "bg-green-500",
          animate: "",
        };
      case "en_route":
        return {
          icon: Navigation,
          text: "Operator En Route",
          subtext: "Tracking location in real-time",
          color: "text-blue-500",
          bgColor: "bg-blue-500",
          animate: "animate-pulse",
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Emergency Resolved",
          subtext: "Request has been completed",
          color: "text-green-500",
          bgColor: "bg-green-500",
          animate: "",
        };
      default:
        return {
          icon: Clock,
          text: "Processing",
          subtext: "Please wait...",
          color: "text-gray-500",
          bgColor: "bg-gray-500",
          animate: "",
        };
    }
  };

  const statusInfo = getStatusInfo(emergency.status);
  const StatusIcon = statusInfo.icon;
  const acceptedOperator = emergency.queue?.find(q => q.status === "accepted");

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {!mapError ? (
        <div 
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full"
          data-testid="emergency-tracking-map"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-500/30 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-orange-500/30 blur-3xl" />
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                window.history.back();
              } else {
                setLocation("/");
              }
            }}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-lg flex items-center justify-center text-white hover:bg-black/70 transition-all"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/90 backdrop-blur-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-bold text-sm tracking-wide">TRACKING</span>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-lg flex items-center justify-center">
            <span className="text-white/70 text-xs font-mono">#{emergencyId?.slice(-6)}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute top-20 left-4 right-4 z-10">
        <div className={`${statusInfo.bgColor}/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <StatusIcon className={`w-5 h-5 text-white ${statusInfo.animate}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">{statusInfo.text}</h3>
              <p className="text-white/80 text-xs">{statusInfo.subtext}</p>
            </div>
            {emergency.queue && emergency.queue.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{emergency.queue.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {acceptedOperator && (
        <div className="absolute top-40 left-4 right-4 z-10">
          <div className="bg-green-500/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-2 border-green-400">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">{acceptedOperator.operatorName || "Operator"}</h3>
                <p className="text-white/90 text-sm">Accepted your request!</p>
              </div>
              {acceptedOperator.operatorPhone && (
                <a 
                  href={`tel:${acceptedOperator.operatorPhone}`}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                  data-testid="button-call-operator"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                </a>
              )}
            </div>
            {acceptedOperator.distanceKm && (
              <div className="mt-3 flex items-center gap-2 text-white/90 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{parseFloat(acceptedOperator.distanceKm).toFixed(1)} km away</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${
          isSheetExpanded ? 'h-[70vh]' : 'h-auto'
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl h-full flex flex-col safe-area-bottom">
          <button
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
            className="w-full py-4 flex flex-col items-center gap-2"
            data-testid="button-toggle-details"
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              {isSheetExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>View Details</span>
                </>
              )}
            </div>
          </button>
          
          {!isSheetExpanded && (
            <div className="px-4 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {emergency.serviceType?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {emergency.location}
                  </p>
                </div>
              </div>
              
              {emergency.queue && emergency.queue.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {emergency.queue.slice(0, 5).map((q, idx) => {
                    const isAccepted = q.status === "accepted";
                    return (
                      <div 
                        key={q.queueId}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl border-2 ${
                          isAccepted 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' 
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAccepted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="text-left">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-20">
                              {q.operatorName || "Operator"}
                            </p>
                            <p className={`text-xs ${isAccepted ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                              {q.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {isSheetExpanded && (
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white">Emergency Details</h3>
                
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Service Type</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {emergency.serviceType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {emergency.location}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Phone</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {emergency.contactPhone}
                    </p>
                  </div>
                </div>
                
                {emergency.contactName && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Contact Name</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {emergency.contactName}
                      </p>
                    </div>
                  </div>
                )}
                
                {emergency.description && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {emergency.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {emergency.queue && emergency.queue.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Notified Operators ({emergency.queue.length})
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {emergency.queue.map((q, index) => {
                      const isAccepted = q.status === "accepted";
                      return (
                        <div
                          key={q.queueId}
                          className={`p-3 rounded-xl border-2 ${
                            isAccepted 
                              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600" 
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                                isAccepted 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {q.operatorName || "Operator"}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              isAccepted 
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                                : q.status === "declined"
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}>
                              {q.status.toUpperCase()}
                            </span>
                          </div>
                          {q.distanceKm && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-9">
                              {parseFloat(q.distanceKm).toFixed(1)} km away
                            </p>
                          )}
                          {isAccepted && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 ml-9 font-medium">
                              Will contact you at {emergency.contactPhone}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Important:</strong> Keep your phone nearby. An operator will call you shortly to confirm details and provide arrival time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
