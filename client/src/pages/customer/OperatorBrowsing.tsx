import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Phone, Star, Truck, Filter, Navigation, Map } from "lucide-react";
import type { Operator, InsertServiceRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CUSTOMER_ID = "CUST-001";
const CUSTOMER_NAME = "John Doe";

export const OperatorBrowsing = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: ["/api/operators", selectedService],
    queryFn: () => {
      const url = selectedService 
        ? `/api/operators?service=${encodeURIComponent(selectedService)}`
        : "/api/operators";
      return fetch(url).then(res => res.json());
    },
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
        service: selectedService || (operator.services as string[])[0],
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
    onSuccess: (data) => {
      toast({
        title: "Service Request Sent!",
        description: `Your request has been sent to ${data.operatorName}`,
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

  const handleRequestService = (operator: Operator, e: React.MouseEvent) => {
    e.stopPropagation();
    createServiceRequestMutation.mutate(operator);
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Default to NYC if location denied
          setUserLocation({ lat: 40.7580, lon: -73.9855 });
        }
      );
    } else {
      // Default to NYC
      setUserLocation({ lat: 40.7580, lon: -73.9855 });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !userLocation || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([userLocation.lat, userLocation.lon], 12);

    // Use CARTO free tiles (no API key needed)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    L.marker([userLocation.lat, userLocation.lon], {
      icon: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    })
      .addTo(map)
      .bindPopup("<b>Your Location</b>")
      .openPopup();

    // Create a layer group for operator markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [userLocation]);

  // Add operator markers
  useEffect(() => {
    if (!mapRef.current || !operators || !markersLayerRef.current) return;

    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    // Clear existing markers
    markersLayer.clearLayers();

    const markerColor = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";

    operators.forEach((operator) => {
      const lat = parseFloat(operator.latitude);
      const lon = parseFloat(operator.longitude);

      const marker = L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: operator.isOnline ? markerColor : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(markersLayer);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${operator.name}</h3>
          <p style="margin: 4px 0;"><strong>Rating:</strong> ⭐ ${operator.rating}</p>
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${operator.vehicle}</p>
          <p style="margin: 4px 0;"><strong>Rate:</strong> $${operator.hourlyRate}/hr</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${operator.isOnline ? '🟢 Online' : '⚫ Offline'}</p>
        </div>
      `);

      marker.on("click", () => {
        setSelectedOperator(operator);
      });
    });
  }, [operators]);

  const services = ["All", "Snow Plowing", "Towing", "Hauling", "Courier"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/customer">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Browse Operators</h1>
              <p className="text-muted-foreground">Find nearby operators in your area</p>
            </div>
          </div>
          <Link to="/customer/operator-map">
            <Button variant="accent" size="sm" data-testid="button-full-map">
              <Map className="w-4 h-4 mr-2" />
              View Full Map
            </Button>
          </Link>
        </div>

        {/* Service Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Filter className="w-5 h-5 text-muted-foreground mt-2" />
          {services.map((service) => (
            <Button
              key={service}
              variant={selectedService === (service === "All" ? "" : service) ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedService(service === "All" ? "" : service)}
              data-testid={`filter-${service.toLowerCase().replace(" ", "-")}`}
            >
              {service}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Operator Locations</span>
                </CardTitle>
                <CardDescription>
                  {operators?.length || 0} operators found {selectedService && `for ${selectedService}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-[500px] rounded-lg"
                  data-testid="map-container"
                />
              </CardContent>
            </Card>
          </div>

          {/* Operator List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Available Operators</h3>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))
            ) : (
              operators?.map((operator) => (
                <Card 
                  key={operator.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedOperator?.id === operator.id ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setSelectedOperator(operator)}
                  data-testid={`operator-card-${operator.id}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base" data-testid={`text-operator-name-${operator.id}`}>
                          {operator.name}
                        </CardTitle>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-medium">{operator.rating}</span>
                          <span className="text-sm text-muted-foreground">({operator.totalJobs} jobs)</span>
                        </div>
                      </div>
                      <Badge variant={operator.isOnline ? "default" : "secondary"} data-testid={`badge-status-${operator.id}`}>
                        {operator.availability}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start space-x-2 text-sm">
                      <Truck className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>{operator.vehicle}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{operator.address}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-accent">${operator.hourlyRate}/hr</span>
                      <Button 
                        size="sm" 
                        variant="accent" 
                        onClick={(e) => handleRequestService(operator, e)}
                        disabled={createServiceRequestMutation.isPending}
                        data-testid={`button-request-${operator.id}`}
                      >
                        {createServiceRequestMutation.isPending ? "Sending..." : "Request Service"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
