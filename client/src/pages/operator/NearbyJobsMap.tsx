import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MapPin, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { OPERATOR_TIER_INFO } from "@shared/schema";

interface ServiceRequest {
  id: number;
  requestId: string;
  customerName: string;
  serviceType: string;
  location: string;
  description: string;
  isEmergency: number;
  budgetRange: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export default function NearbyJobsMap() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);

  const operatorId = user?.operatorId;
  const currentTier = user?.viewTier || user?.activeTier || "manual";

  // Fetch nearby service requests
  const { data: nearbyJobs = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });

  // Fetch operator data to get home location
  const { data: operatorData } = useQuery<{
    homeLatitude?: number;
    homeLongitude?: number;
  }>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

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

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([job.longitude, job.latitude])
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-2">
            Nearby Job Requests
          </h1>
          <p className="text-muted-foreground">
            {getTierLabel(currentTier)} - {nearbyJobs.length} jobs available
          </p>
        </div>

        {/* Map and Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Job Locations
              </CardTitle>
              <CardDescription>
                <span className="flex items-center gap-4 flex-wrap mt-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    Your Location
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Regular Jobs
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    Emergency Jobs
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapContainer} 
                className="w-full h-[400px] md:h-[600px] rounded-lg overflow-hidden"
                data-testid="map-container"
              />
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Jobs</CardTitle>
                <CardDescription>
                  {getTierServices(currentTier).join(", ")}
                </CardDescription>
              </CardHeader>
            </Card>

            {nearbyJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No jobs available</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new opportunities
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {nearbyJobs.map((job) => (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id ? "ring-2 ring-orange-500" : ""
                    }`}
                    onClick={() => setSelectedJob(job)}
                    data-testid={`card-job-${job.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{job.serviceType}</CardTitle>
                        {job.isEmergency === 1 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
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
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-2">{job.location}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {job.budgetRange}
                        </span>
                        {job.distance && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {job.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {job.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
