import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthDialog } from "@/components/AuthDialog";
import { ArrowLeft, MapPin, Star, Phone, Truck, Navigation } from "lucide-react";
import type { Operator } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const OperatorMapSimple = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [tileLayer, setTileLayer] = useState<'map' | 'satellite'>('map');
  const [, navigate] = useLocation();

  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([40.7589, -73.9851], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !operators) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    operators.forEach((operator) => {
      const lat = parseFloat(operator.latitude as string);
      const lon = parseFloat(operator.longitude as string);

      const marker = L.marker([lat, lon]).addTo(mapRef.current!);
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${operator.name}</h3>
          <p style="margin: 4px 0;"><strong>Rating:</strong> ⭐ ${operator.rating}</p>
          <p style="margin: 4px 0;"><strong>Rate:</strong> $${operator.hourlyRate}/hr</p>
        </div>
      `);

      marker.on("click", () => {
        setSelectedOperator(operator);
        mapRef.current?.setView([lat, lon], 14);
      });

      markersRef.current.push(marker);
    });
  }, [operators]);

  useEffect(() => {
    if (!mapRef.current) return;

    const currentLayers = mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    const url = tileLayer === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = tileLayer === 'satellite'
      ? 'Tiles &copy; Esri'
      : '&copy; OpenStreetMap contributors';

    L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapRef.current);
  }, [tileLayer]);

  const handleRequestService = () => {
    setShowAuthDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/customer">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-black">Find Operators</h1>
                <p className="text-sm text-gray-600">{operators?.length || 0} operators available</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tileLayer === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTileLayer('map')}
                data-testid="button-map-view"
              >
                Map
              </Button>
              <Button
                variant={tileLayer === 'satellite' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTileLayer('satellite')}
                data-testid="button-satellite-view"
              >
                Satellite
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Map and Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4 space-y-4">
            {operators?.map((operator) => (
              <Card
                key={operator.operatorId}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedOperator?.operatorId === operator.operatorId
                    ? 'ring-2 ring-black'
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
                    <h3 className="font-bold text-black mb-1">{operator.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{operator.rating}</span>
                      </div>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{operator.totalJobs} jobs</span>
                    </div>
                  </div>
                  <Badge variant={operator.isOnline ? "default" : "secondary"} className={operator.isOnline ? "bg-green-500" : ""}>
                    {operator.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(operator.services as string[]).map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span>{operator.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{operator.address}</span>
                  </div>
                  {operator.hourlyRate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-semibold text-black">${operator.hourlyRate}/hr</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestService();
                  }}
                  disabled={!operator.isOnline}
                  data-testid={`button-request-${operator.operatorId}`}
                >
                  Request Service
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};
