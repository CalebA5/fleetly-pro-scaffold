import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, DollarSign, Truck, AlertCircle, CheckCircle, Filter, Users, ChevronRight, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleManagement } from "@/components/VehicleManagement";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator } from "@shared/schema";
import { TierOnlineConfirmDialog } from "@/components/TierOnlineConfirmDialog";

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

interface CustomerGroup {
  id: string;
  location: string;
  customerCount: number;
  totalValue: string;
  customers: Array<{
    name: string;
    address: string;
    service: string;
  }>;
  distance: number;
  expiresIn: number; // minutes
}

export default function EquippedOperatorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [acceptedJobs, setAcceptedJobs] = useState<number[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const { toast } = useToast();
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);

  // Mock data for customer grouping - in production, this would come from backend
  const mockCustomerGroups: CustomerGroup[] = [
    {
      id: "CG-001",
      location: "Downtown District",
      customerCount: 3,
      totalValue: "$240-320",
      customers: [
        { name: "ABC Corp", address: "100 Main St", service: "Towing" },
        { name: "XYZ Logistics", address: "102 Main St", service: "Hauling" },
        { name: "Quick Delivery", address: "104 Main St", service: "Courier" },
      ],
      distance: 3.5,
      expiresIn: 25,
    },
    {
      id: "CG-002",
      location: "Industrial Park",
      customerCount: 2,
      totalValue: "$180-240",
      customers: [
        { name: "Factory Direct", address: "50 Industrial Ave", service: "Equipment Transport" },
        { name: "Warehouse Plus", address: "52 Industrial Ave", service: "Hauling" },
      ],
      distance: 8.2,
      expiresIn: 40,
    },
  ];

  // Use operator-specific endpoint that filters by tier and radius (15km for equipped operators)
  const operatorId = user?.operatorId || "OP-EQUIPPED-001";

  // Fetch operator data to get current online status
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });

  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "equipped";

  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async ({ goOnline, confirmed = false }: { goOnline: boolean; confirmed?: boolean }) => {
      return apiRequest(`/api/operators/${operatorId}/toggle-online`, {
        method: "POST",
        body: JSON.stringify({ 
          isOnline: goOnline ? 1 : 0,
          activeTier: goOnline ? "equipped" : null,
          confirmed
        }),
      });
    },
    onSuccess: (data, variables) => {
      const goOnline = variables.goOnline;
      
      // Check if response requires confirmation (tier switch warning)
      if (data?.requiresConfirmation) {
        setTierSwitchInfo({ currentTier: data.currentTier, newTier: data.newTier });
        setShowTierSwitchDialog(true);
        return;
      }
      
      // Success - update was applied
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      toast({
        title: goOnline ? "You're Online" : "You're Offline",
        description: goOnline 
          ? "You can now receive job requests as a Skilled & Equipped Operator" 
          : "You won't receive any new job requests",
      });
    },
    onError: (error: any) => {
      // Check if error is due to active jobs blocking
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error === "active_jobs") {
            toast({
              title: "Cannot Go Online",
              description: errorData.message,
              variant: "destructive",
            });
            return;
          }
        } catch {}
      }
      
      toast({
        title: "Error",
        description: "Failed to update online status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmTierSwitch = () => {
    setShowTierSwitchDialog(false);
    toggleOnlineMutation.mutate({ goOnline: true, confirmed: true });
    setTierSwitchInfo(null);
  };

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

  const handleAcceptGroup = (groupId: string) => {
    // In production, send bulk accept to backend
    alert(`Accepted all ${mockCustomerGroups.find(g => g.id === groupId)?.customerCount} customers in group!`);
  };

  const availableServices = ["Towing", "Hauling", "Courier", "Roadside Assistance"];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      <Header
        onSignIn={() => {}}
        onSignUp={() => {}}
        onDriveAndEarn={() => setLocation("/drive-earn")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">Skilled & Equipped Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  15km Operating Radius
                </p>
              </div>
            </div>
            
            {/* Online Toggle Button */}
            <Button
              variant={isOnline ? "default" : "outline"}
              size="lg"
              onClick={() => toggleOnlineMutation.mutate({ goOnline: !isOnline })}
              disabled={toggleOnlineMutation.isPending}
              className={`px-8 py-6 rounded-lg font-semibold transition-all ${
                isOnline 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="button-toggle-online"
            >
              {toggleOnlineMutation.isPending ? "Updating..." : isOnline ? "Online" : "Offline"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="jobs" data-testid="tab-jobs">Available Jobs</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">My Vehicles</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-8">

        {/* Stats Cards - Clickable for Mobile Optimization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Earnings Card - Clickable */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-500"
            onClick={() => setLocation("/operator/earnings")}
            data-testid="card-earnings"
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Earnings</p>
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">$0</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    View details
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Nearby Card - Clickable */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-500"
            onClick={() => setLocation("/operator/nearby-jobs")}
            data-testid="card-nearby-jobs"
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Jobs Nearby</p>
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">{nearbyRequests.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    View on map
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Groups Card */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Groups</p>
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">{mockCustomerGroups.length}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
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

        {/* Customer Grouping Section */}
        <div className="mb-8">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-black dark:text-white">
                      Nearby Customer Groups
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Accept multiple customers in the same area for maximum efficiency
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white">
                  BOOST EARNINGS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCustomerGroups.length > 0 ? (
                mockCustomerGroups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {group.location}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {group.customerCount} customers
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {group.distance}km away
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {group.totalValue}
                          </span>
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <Clock className="w-4 h-4" />
                            Expires in {group.expiresIn}min
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAcceptGroup(group.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        data-testid={`button-accept-group-${group.id}`}
                      >
                        Accept All ({group.customerCount})
                      </Button>
                    </div>

                    {/* Customer List */}
                    <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-800 space-y-2">
                      {group.customers.map((customer, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-black dark:text-white">{customer.name}</p>
                            <p className="text-gray-500 dark:text-gray-500">{customer.address}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {customer.service}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-500">No customer groups available</p>
                </div>
              )}
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

      <TierOnlineConfirmDialog
        open={showTierSwitchDialog}
        onOpenChange={setShowTierSwitchDialog}
        onConfirm={handleConfirmTierSwitch}
        currentTier={tierSwitchInfo?.currentTier || ""}
        newTier={tierSwitchInfo?.newTier || ""}
      />
      <MobileBottomNav />
    </div>
  );
}
