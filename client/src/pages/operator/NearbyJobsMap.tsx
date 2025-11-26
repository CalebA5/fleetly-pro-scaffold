import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MapPin, DollarSign, Clock, AlertTriangle, Maximize2, Minimize2, List, Eye, ShieldAlert, X } from "lucide-react";
import { useLocation } from "wouter";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { OPERATOR_TIER_INFO, type Operator } from "@shared/schema";
import { RequestDetailsModal } from "@/components/operator/RequestDetailsModal";
import { QuoteModal } from "@/components/operator/QuoteModal";
import { useToast } from "@/hooks/use-toast";

interface ServiceRequest {
  id: number;
  requestId: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  location: string;
  description: string;
  isEmergency: number;
  budgetRange?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distance?: number;
  status?: string;
  requestedAt: string;
  respondedAt?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  timeFlexibility?: string | null;
  urgencyLevel?: string | null;
  imageCount?: number;
  estimatedCost?: string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  details?: any;
  quoteWindowExpiresAt?: string | null;
}

export default function NearbyJobsMap() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showJobSheet, setShowJobSheet] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [requestForDetails, setRequestForDetails] = useState<ServiceRequest | null>(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  const operatorId = user?.operatorId;
  const currentTier = user?.viewTier || user?.activeTier || "manual";

  const handleViewDetails = (job: ServiceRequest, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setRequestForDetails(job);
    setShowDetailsModal(true);
  };

  const handleQuote = (request: any) => {
    setShowDetailsModal(false);
    setRequestForDetails(request);
    setShowQuoteModal(true);
  };

  const handleDecline = (request: any) => {
    setShowDetailsModal(false);
    toast({
      title: "Request Declined",
      description: "You've declined this service request.",
    });
  };

  // Fetch nearby service requests
  const { data: nearbyJobs = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });

  // Fetch operator data to get home location and tier profiles
  const { data: operatorData } = useQuery<{
    homeLatitude?: number;
    homeLongitude?: number;
    operatorTierProfiles?: Record<string, { approvalStatus?: string; submittedAt?: string }>;
  }>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  // Check if current tier is verified
  const currentTierProfile = operatorData?.operatorTierProfiles?.[currentTier];
  const isCurrentTierVerified = currentTierProfile?.approvalStatus === "approved";

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    // Initialize map
    const operatorLat = operatorData?.homeLatitude || 40.7128;
    const operatorLng = operatorData?.homeLongitude || -74.006;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [operatorLng, operatorLat],
      zoom: 11,
      accessToken: mapboxToken,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add operator's home location marker
    new mapboxgl.Marker({ color: "#f97316" })
      .setLngLat([operatorLng, operatorLat])
      .setPopup(
        new mapboxgl.Popup().setHTML(
          `<div class="p-2">
            <p class="font-semibold">Your Location</p>
            <p class="text-sm text-gray-600">Home Base</p>
          </div>`
        )
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, operatorData]);

  // Add job markers when data loads
  useEffect(() => {
    if (!map.current || nearbyJobs.length === 0) return;

    // Clear existing markers (except home)
    const markers = document.querySelectorAll('.mapboxgl-marker:not([style*="rgb(249, 115, 22)"])');
    markers.forEach(marker => marker.remove());

    // Add job markers
    nearbyJobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return;

      const markerColor = job.isEmergency ? "#dc2626" : "#3b82f6";
      const lng = typeof job.longitude === 'string' ? parseFloat(job.longitude) : job.longitude;
      const lat = typeof job.latitude === 'string' ? parseFloat(job.latitude) : job.latitude;

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<div class="p-2">
              <p class="font-semibold">${job.serviceType}</p>
              <p class="text-sm text-gray-600">${job.location}</p>
              <p class="text-sm font-semibold text-green-600">${job.budgetRange}</p>
              ${job.distance ? `<p class="text-xs text-gray-500">${job.distance.toFixed(1)} km away</p>` : ""}
            </div>`
          )
        )
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener("click", () => {
        setSelectedJob(job);
      });
    });
  }, [nearbyJobs]);

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      professional: "Professional & Certified",
      equipped: "Skilled & Equipped",
      manual: "Manual Operator",
    };
    return labels[tier] || tier;
  };

  const getTierServices = (tier: string): string[] => {
    const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
    return (tierInfo && 'services' in tierInfo ? tierInfo.services : []) as string[];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-6 flex-1">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 flex flex-col ${!isFullscreen ? 'pb-20 md:pb-0' : ''}`}>
      {!isFullscreen && <Header />}
      
      {/* Verification Status Banner */}
      {!isFullscreen && showVerificationBanner && !isCurrentTierVerified && operatorData && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {currentTierProfile?.approvalStatus === "pending" ? "Verification Pending" : 
                   currentTierProfile?.approvalStatus === "under_review" ? "Under Review" :
                   currentTierProfile?.approvalStatus === "rejected" ? "Verification Rejected" :
                   "Not Verified"}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {currentTierProfile?.approvalStatus === "pending" ? "Your tier application is awaiting review" :
                   currentTierProfile?.approvalStatus === "under_review" ? "Our team is reviewing your application" :
                   currentTierProfile?.approvalStatus === "rejected" ? "Please update your application" :
                   `Complete verification to receive ${getTierLabel(currentTier)} jobs`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVerificationBanner(false)}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/50 p-1 h-auto"
              data-testid="button-dismiss-verification-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Floating Controls - Always Visible on Mobile */}
      {!isFullscreen && (
        <div className="md:hidden absolute top-20 left-4 right-4 z-20 flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
            data-testid="button-back"
          >
            <ArrowLeft style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-1" />
            Back
          </Button>
          
          <div className="flex gap-2">
            {/* View Mode Toggle - Mobile Only */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const newMode = viewMode === 'map' ? 'list' : 'map';
                setViewMode(newMode);
                if (newMode === 'map') {
                  setTimeout(() => map.current?.resize(), 100);
                }
              }}
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
              data-testid="button-toggle-view"
            >
              {viewMode === 'map' ? (
                <><List style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-1" /> List</>
              ) : (
                <><MapPin style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-1" /> Map</>
              )}
            </Button>
            
            {/* Fullscreen Toggle - Map view only */}
            {viewMode === 'map' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  setTimeout(() => map.current?.resize(), 100);
                }}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
                data-testid="button-fullscreen"
              >
                <Maximize2 style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Map-First Layout | Desktop: Side-by-side */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* MOBILE: Full-screen map with floating controls */}
        <div className={`${isFullscreen ? 'w-full h-full' : viewMode === 'list' ? 'hidden md:block md:w-2/3 md:h-[calc(100vh-80px)]' : 'w-full md:w-2/3 h-[calc(100vh-200px)] md:h-[calc(100vh-80px)]'} relative`}>
          {/* Desktop Back Button + Fullscreen Controls */}
          {!isFullscreen && (
            <div className="hidden md:flex absolute top-4 left-4 right-4 z-10 items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.history.back()}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
                data-testid="button-back-desktop"
              >
                <ArrowLeft style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-1" />
                Back
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsFullscreen(true);
                  setTimeout(() => map.current?.resize(), 100);
                }}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
                data-testid="button-fullscreen-desktop"
              >
                <Maximize2 style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
              </Button>
            </div>
          )}

          {/* Fullscreen Exit Button */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsFullscreen(false);
                  setTimeout(() => map.current?.resize(), 100);
                }}
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg"
                data-testid="button-exit-fullscreen"
              >
                <Minimize2 style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-1" />
                Exit
              </Button>
            </div>
          )}

          {/* Map Legend - Bottom Left */}
          {!isFullscreen && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-lg p-2 shadow-lg">
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-gray-700 dark:text-gray-300">You</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-700 dark:text-gray-300">Jobs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span className="text-gray-700 dark:text-gray-300">SOS</span>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div 
            ref={mapContainer} 
            className="w-full h-full"
            data-testid="map-container"
          />

          {/* Mobile: Floating Job Count Badge (Map view only) */}
          {viewMode === 'map' && (
            <Button
              onClick={() => setShowJobSheet(true)}
              className="md:hidden absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white shadow-lg rounded-full h-14 px-6"
              data-testid="button-show-jobs"
            >
              <MapPin style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} className="mr-2" />
              <span className="font-semibold">{nearbyJobs.length} Jobs</span>
            </Button>
          )}
        </div>

        {/* MOBILE: List View (when toggled) */}
        {viewMode === 'list' && (
          <div className="md:hidden w-full h-[calc(100vh-200px)] bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="p-4 sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
              <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                Available Jobs
              </h2>
              <p className="text-sm text-muted-foreground">
                {getTierLabel(currentTier)} • {nearbyJobs.length} nearby
              </p>
            </div>
            
            <div className="p-4 space-y-3">
              {nearbyJobs.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No jobs available</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new opportunities
                  </p>
                </div>
              ) : (
                nearbyJobs.map((job) => (
                  <Card 
                    key={job.id}
                    className="cursor-pointer transition-all active:scale-98"
                    onClick={() => {
                      setSelectedJob(job);
                      setViewMode('map');
                      // Resize map after switching from list mode
                      setTimeout(() => {
                        map.current?.resize();
                        if (job.latitude && job.longitude && map.current) {
                          const lng = typeof job.longitude === 'string' ? parseFloat(job.longitude) : job.longitude;
                          const lat = typeof job.latitude === 'string' ? parseFloat(job.latitude) : job.latitude;
                          map.current.flyTo({ center: [lng, lat], zoom: 15 });
                        }
                      }, 100);
                    }}
                    data-testid={`card-job-list-${job.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{job.serviceType}</CardTitle>
                        {job.isEmergency === 1 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle style={{ width: 'clamp(0.75rem, 2.5vw, 0.875rem)', height: 'clamp(0.75rem, 2.5vw, 0.875rem)' }} />
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {job.requestId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-2">{job.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <DollarSign style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                          {job.budgetRange}
                        </span>
                        {job.distance && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                            {job.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {job.description}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleViewDetails(job, e)}
                        className="w-full mt-3"
                        data-testid={`button-view-details-list-${job.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Full Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* DESKTOP: Side Panel | MOBILE: Bottom Sheet */}
        <div className="hidden md:block md:w-1/3 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="p-4 sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
            <h2 className="text-xl font-bold text-black dark:text-white mb-1">
              Available Jobs
            </h2>
            <p className="text-sm text-muted-foreground">
              {getTierLabel(currentTier)} • {nearbyJobs.length} nearby
            </p>
          </div>
          
          <div className="p-4 space-y-3">
            {nearbyJobs.length === 0 ? (
              <div className="py-12 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No jobs available</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for new opportunities
                </p>
              </div>
            ) : (
              nearbyJobs.map((job) => (
                <Card 
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id ? "ring-2 ring-orange-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedJob(job);
                    if (job.latitude && job.longitude && map.current) {
                      const lng = typeof job.longitude === 'string' ? parseFloat(job.longitude) : job.longitude;
                      const lat = typeof job.latitude === 'string' ? parseFloat(job.latitude) : job.latitude;
                      map.current.flyTo({ center: [lng, lat], zoom: 14 });
                    }
                  }}
                  data-testid={`card-job-${job.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">{job.serviceType}</CardTitle>
                      {job.isEmergency === 1 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          <AlertTriangle style={{ width: 'clamp(0.625rem, 2vw, 0.75rem)', height: 'clamp(0.625rem, 2vw, 0.75rem)' }} className="mr-0.5" />
                          SOS
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex items-start gap-1.5">
                      <MapPin style={{ width: 'clamp(0.75rem, 2.5vw, 0.875rem)', height: 'clamp(0.75rem, 2.5vw, 0.875rem)' }} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">{job.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                        <DollarSign style={{ width: 'clamp(0.75rem, 2.5vw, 0.875rem)', height: 'clamp(0.75rem, 2.5vw, 0.875rem)' }} />
                        {job.budgetRange}
                      </span>
                      {job.distance && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {job.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleViewDetails(job, e)}
                      className="w-full mt-2"
                      data-testid={`button-view-details-${job.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* MOBILE: Bottom Sheet for Jobs */}
        <Sheet open={showJobSheet} onOpenChange={setShowJobSheet}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <div className="h-full flex flex-col">
              <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3"></div>
                <SheetTitle>{nearbyJobs.length} Jobs Nearby</SheetTitle>
                <SheetDescription>{getTierLabel(currentTier)}</SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {nearbyJobs.length === 0 ? (
                  <div className="py-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No jobs available</p>
                    <p className="text-sm text-muted-foreground">
                      Check back later for new opportunities
                    </p>
                  </div>
                ) : (
                  nearbyJobs.map((job) => (
                    <Card 
                      key={job.id}
                      className="cursor-pointer transition-all active:scale-98"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobSheet(false);
                        if (job.latitude && job.longitude && map.current) {
                          const lng = typeof job.longitude === 'string' ? parseFloat(job.longitude) : job.longitude;
                          const lat = typeof job.latitude === 'string' ? parseFloat(job.latitude) : job.latitude;
                          map.current.flyTo({ center: [lng, lat], zoom: 15 });
                        }
                      }}
                      data-testid={`card-job-mobile-${job.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{job.serviceType}</CardTitle>
                          {job.isEmergency === 1 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle style={{ width: 'clamp(0.75rem, 2.5vw, 0.875rem)', height: 'clamp(0.75rem, 2.5vw, 0.875rem)' }} />
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {job.requestId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground line-clamp-2">{job.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                            <DollarSign style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                            {job.budgetRange}
                          </span>
                          {job.distance && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                              {job.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {job.description}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleViewDetails(job, e)}
                          className="w-full mt-3"
                          data-testid={`button-view-details-mobile-${job.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Full Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {!isFullscreen && <MobileBottomNav />}

      {/* Request Details Modal */}
      {requestForDetails && (
        <RequestDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          request={requestForDetails}
          operatorId={operatorId || ''}
          onQuote={handleQuote}
          onDecline={handleDecline}
        />
      )}

      {/* Quote Modal */}
      {requestForDetails && operatorId && (
        <QuoteModal
          open={showQuoteModal}
          onOpenChange={setShowQuoteModal}
          serviceRequest={requestForDetails}
          operatorId={operatorId}
          operatorName={user?.name || ""}
          tier={currentTier}
        />
      )}
    </div>
  );
}
