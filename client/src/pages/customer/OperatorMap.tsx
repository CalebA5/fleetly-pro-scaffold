import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapProvider, MapView, useMap } from "@/features/map";
import type { Operator } from "@shared/schema";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star, Truck, Phone, Mail, DollarSign, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const OperatorMapContent = () => {
  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
  });
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const { addMarker, clearMarkers, flyTo } = useMap();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!operators) return;

    clearMarkers();

    operators.forEach((operator) => {
      if (operator.latitude && operator.longitude) {
        addMarker({
          id: operator.operatorId,
          position: {
            lat: parseFloat(operator.latitude as string),
            lng: parseFloat(operator.longitude as string),
          },
          type: 'operator',
          data: operator,
          onClick: () => setSelectedOperator(operator),
        });
      }
    });

    if (operators.length > 0 && operators[0].latitude && operators[0].longitude) {
      flyTo({
        lat: parseFloat(operators[0].latitude as string),
        lng: parseFloat(operators[0].longitude as string),
      }, 12);
    }
  }, [operators, addMarker, clearMarkers, flyTo]);

  const handleRequestService = (operator: Operator) => {
    navigate(`/customer/service-request?operatorId=${operator.operatorId}`);
  };

  const handleCenterOnOperator = (operator: Operator) => {
    if (operator.latitude && operator.longitude) {
      flyTo({
        lat: parseFloat(operator.latitude as string),
        lng: parseFloat(operator.longitude as string),
      }, 15);
      setSelectedOperator(operator);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <div className="lg:w-2/3 h-[500px] lg:h-full">
        <MapView height="100%" showLayerControl={true} />
      </div>

      <div className="lg:w-1/3 space-y-4 overflow-y-auto max-h-[600px] lg:max-h-full">
        <div className="sticky top-0 bg-background z-10 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Nearby Operators
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {operators?.length || 0} operators available
          </p>
        </div>

        {operators && operators.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No operators available in your area
              </p>
            </CardContent>
          </Card>
        )}

        {operators?.map((operator) => (
          <Card 
            key={operator.operatorId}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedOperator?.operatorId === operator.operatorId 
                ? 'ring-2 ring-primary shadow-lg' 
                : ''
            }`}
            onClick={() => setSelectedOperator(operator)}
            data-testid={`card-operator-${operator.operatorId}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{operator.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{operator.rating}</span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {operator.totalJobs} jobs
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={operator.isOnline ? "default" : "secondary"}
                  className={operator.isOnline ? "bg-green-500" : ""}
                >
                  {operator.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {(operator.services as string[]).map((service, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Truck className="w-4 h-4" />
                  <span>{operator.vehicle}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{operator.address}</span>
                </div>
                {operator.hourlyRate && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-primary">
                      ${operator.hourlyRate}/hr
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCenterOnOperator(operator);
                  }}
                  className="flex-1"
                  data-testid={`button-center-${operator.operatorId}`}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Center
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestService(operator);
                  }}
                  disabled={!operator.isOnline}
                  className="flex-1"
                  data-testid={`button-request-${operator.operatorId}`}
                >
                  Request Service
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const OperatorMap = () => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/customer">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Find Operators
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View available operators on the map
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto h-full">
          <MapProvider defaultCenter={{ lat: 40.7589, lng: -73.9851 }} defaultZoom={12}>
            <OperatorMapContent />
          </MapProvider>
        </div>
      </div>
    </div>
  );
};
