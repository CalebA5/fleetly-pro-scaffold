import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, XCircle, Phone, MapPin, DollarSign, Truck } from "lucide-react";
import type { ServiceRequest as ServiceRequestType } from "@shared/schema";

export const ServiceRequest = () => {
  const [location] = useLocation();
  const requestId = new URLSearchParams(location.split("?")[1]).get("requestId");

  const { data: request, isLoading, refetch } = useQuery<ServiceRequestType>({
    queryKey: ["/api/service-requests/request", requestId],
    enabled: !!requestId,
  });

  // Poll for updates every 5 seconds if status is still pending
  useEffect(() => {
    if (request?.status === "pending") {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [request?.status, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link to="/customer/operators">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Operators
            </Button>
          </Link>
          <Card className="mt-8">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground" data-testid="text-error">
                Service request not found
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusDetails = () => {
    switch (request.status) {
      case "pending":
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "Request Pending",
          description: "Waiting for operator to respond...",
          color: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700",
          badgeVariant: "secondary" as const,
        };
      case "confirmed":
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
          title: "Request Confirmed!",
          description: "The operator has accepted your service request.",
          color: "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700",
          badgeVariant: "default" as const,
        };
      case "declined":
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "Request Declined",
          description: "The operator is unable to accept this request at this time.",
          color: "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700",
          badgeVariant: "destructive" as const,
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-500" />,
          title: "Request Status Unknown",
          description: "Unable to determine request status.",
          color: "bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700",
          badgeVariant: "outline" as const,
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/customer/operators">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Operators
            </Button>
          </Link>
        </div>

        {/* Status Card */}
        <Card className={`border-2 ${statusDetails.color} mb-6`}>
          <CardHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              {statusDetails.icon}
              <div>
                <CardTitle className="text-2xl mb-2" data-testid="text-status-title">
                  {statusDetails.title}
                </CardTitle>
                <CardDescription className="text-base" data-testid="text-status-description">
                  {statusDetails.description}
                </CardDescription>
              </div>
              <Badge variant={statusDetails.badgeVariant} className="text-sm px-3 py-1" data-testid="badge-status">
                {request.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Request Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-semibold" data-testid="text-service-type">{request.service}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested At</p>
                <p data-testid="text-requested-at">
                  {new Date(request.requestedAt).toLocaleString()}
                </p>
              </div>
              {request.respondedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Responded At</p>
                  <p data-testid="text-responded-at">
                    {new Date(request.respondedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Operator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Operator Name</p>
                <p className="font-semibold" data-testid="text-operator-name">{request.operatorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="flex items-center gap-1" data-testid="text-location">
                  <MapPin className="w-4 h-4" />
                  {request.location}
                </p>
              </div>
              {request.estimatedCost && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="flex items-center gap-1 font-semibold text-lg" data-testid="text-estimated-cost">
                    <DollarSign className="w-5 h-5" />
                    {parseFloat(request.estimatedCost).toFixed(2)}
                  </p>
                </div>
              )}
              {request.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm" data-testid="text-notes">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          {request.status === "confirmed" && (
            <Link to="/customer/tracking">
              <Button variant="hero" size="lg" data-testid="button-track-job">
                Track My Service
              </Button>
            </Link>
          )}
          {request.status === "declined" && (
            <Link to="/customer/operators">
              <Button variant="accent" size="lg" data-testid="button-find-another">
                Find Another Operator
              </Button>
            </Link>
          )}
          {request.status === "pending" && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4" data-testid="text-waiting">
                We'll notify you when the operator responds...
              </p>
              <div className="flex gap-4">
                <Link to="/customer">
                  <Button variant="outline" data-testid="button-go-home">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/customer/operators">
                  <Button variant="outline" data-testid="button-browse-more">
                    Browse More Operators
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
