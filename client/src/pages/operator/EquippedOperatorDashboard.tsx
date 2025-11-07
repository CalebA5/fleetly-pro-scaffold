import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, DollarSign, Truck, AlertCircle, CheckCircle, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleManagement } from "@/components/VehicleManagement";
import { useLocation } from "wouter";

interface ServiceRequest {
  id: number;
  requestId: string;
  customerName: string;
  serviceType: string;
  location: string;
  description: string;
  isEmergency: number;
  budgetRange: string;
  distance?: number; // Distance from operator in km
}

export default function EquippedOperatorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [acceptedJobs, setAcceptedJobs] = useState<number[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  // Use operator-specific endpoint that filters by tier and radius (15km for equipped operators)
  const operatorId = user?.operatorId || "OP-EQUIPPED-001";

  const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });

  // Filter by service type (backend already filtered by radius and tier)
  const nearbyRequests = requests.filter((req) => {
    const matchesService = serviceFilter === "all" || req.serviceType === serviceFilter;
    return matchesService;
  });

  const emergencyRequests = nearbyRequests.filter(req => req.isEmergency === 1);

  const handleAcceptJob = (requestId: number) => {
    setAcceptedJobs([...acceptedJobs, requestId]);
    // In production, send accept request to backend
  };

  const availableServices = ["Towing", "Hauling", "Courier", "Roadside Assistance"];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      <Header
        onSignIn={() => {}}
        onSignUp={() => {}}
        onDriveAndEarn={() => setLocation("/operator/onboarding")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Equipped Operator Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Skilled & Equipped • 15km Operating Radius
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="jobs" data-testid="tab-jobs">Available Jobs</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">My Vehicles</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
                  <p className="text-2xl font-bold text-black dark:text-white">$0</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Jobs Nearby</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{nearbyRequests.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Requests</p>
                  <p className="text-2xl font-bold text-red-600">{emergencyRequests.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-black dark:text-white">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Requests - Priority Section */}
        {emergencyRequests.length > 0 && (
          <Card className="border-2 border-red-200 dark:border-red-800 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-black dark:text-white">
                      Emergency Requests
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      These customers need immediate assistance
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white">
                  URGENT
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-black dark:text-white">
                          {request.customerName}
                        </h3>
                        <Badge className="bg-red-500 text-white text-xs">
                          {request.serviceType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {request.location}
                          {request.distance && ` (${request.distance}km)`}
                        </span>
                        {request.budgetRange && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {request.budgetRange}
                          </span>
                        )}
                      </div>
                    </div>
                    {acceptedJobs.includes(request.id) ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accepted
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleAcceptJob(request.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        data-testid={`button-accept-emergency-${request.id}`}
                      >
                        Accept Emergency
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Jobs Section with Filtering */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black dark:text-white">
                  Available Jobs
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Service requests within 15km of your location
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-48" data-testid="select-service-filter">
                    <SelectValue placeholder="Filter by service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {availableServices.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : nearbyRequests.length > 0 ? (
              <div className="space-y-3">
                {nearbyRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {request.customerName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.serviceType}
                          </Badge>
                          {request.isEmergency === 1 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.location}
                            {request.distance && ` (${request.distance}km)`}
                          </span>
                          {request.budgetRange && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {request.budgetRange}
                            </span>
                          )}
                        </div>
                      </div>
                      {acceptedJobs.includes(request.id) ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accepted
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleAcceptJob(request.id)}
                          className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                          data-testid={`button-accept-${request.id}`}
                        >
                          Accept Job
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  No Jobs Available
                </h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                  There are no {serviceFilter !== "all" ? serviceFilter.toLowerCase() : ""} jobs within your 15km operating radius right now. Check back soon!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operating Radius Info */}
        <div className="mt-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black dark:text-white mb-1">
                    Operating Radius: 15km
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    As an equipped operator with mobile vehicles, you can accept jobs within 15 kilometers from your current location. This provides flexibility while maintaining service quality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement tierType="equipped" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
