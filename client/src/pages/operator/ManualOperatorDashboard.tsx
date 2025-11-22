import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Users, Snowflake, AlertCircle, CheckCircle, ChevronRight, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator } from "@shared/schema";
import { TierOnlineConfirmDialog } from "@/components/TierOnlineConfirmDialog";
import { CustomerGrouping, type CustomerGroup } from "@/components/operator/CustomerGrouping";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ServiceRequest {
  id: number;
  requestId: string;
  customerName: string;
  serviceType: string;
  location: string;
  description: string;
  isEmergency: number;
  budgetRange: string;
  distance?: number; // Distance from operator's home in km
}

export default function ManualOperatorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [acceptedJobs, setAcceptedJobs] = useState<number[]>([]);
  const [acceptedGroupIds, setAcceptedGroupIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);

  // Customer grouping - in production, this would come from backend
  const mockCustomerGroups: CustomerGroup[] = [
    {
      id: "CG-001",
      location: "Downtown Snow District",
      customerCount: 4,
      totalValue: "$240-360",
      customers: [
        { name: "Main Street Bistro", address: "100 Main St", service: "Parking Lot" },
        { name: "Corner Pharmacy", address: "102 Main St", service: "Sidewalk" },
        { name: "City Bank", address: "104 Main St", service: "Parking & Entrance" },
        { name: "Elm Apartments", address: "106 Main St", service: "Driveway" },
      ],
      distance: 2.3,
      expiresIn: 18,
    },
    {
      id: "CG-002",
      location: "Riverside Homes",
      customerCount: 3,
      totalValue: "$180-270",
      customers: [
        { name: "Johnson Residence", address: "15 River Rd", service: "Driveway" },
        { name: "Williams Home", address: "17 River Rd", service: "Driveway" },
        { name: "Davis Family", address: "19 River Rd", service: "Driveway & Walkway" },
      ],
      distance: 3.8,
      expiresIn: 32,
    },
  ];

  // Use operator-specific endpoint that filters by tier and radius
  const operatorId = user?.operatorId || "OP-MANUAL-001";
  
  // Fetch operator data to get current online status
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });
  
  const { data: nearbySnowRequests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });
  
  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "manual";
  
  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async ({ goOnline, confirmed = false }: { goOnline: boolean; confirmed?: boolean }) => {
      return apiRequest(`/api/operators/${operatorId}/toggle-online`, {
        method: "POST",
        body: JSON.stringify({ 
          isOnline: goOnline ? 1 : 0,
          activeTier: goOnline ? "manual" : null,
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
          ? "You can now receive job requests as a Manual Operator" 
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

  const handleAcceptJob = (requestId: number) => {
    setAcceptedJobs([...acceptedJobs, requestId]);
    // In production, send accept request to backend
  };

  const handleAcceptGroup = (groupId: string) => {
    const group = mockCustomerGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Mark group as accepted
    setAcceptedGroupIds(prev => [...prev, groupId]);
    
    // In production, send bulk accept to backend and add to active jobs
    toast({
      title: "Jobs Accepted!",
      description: `Successfully accepted ${group.customerCount} jobs in ${group.location}. Added to your active jobs.`,
    });
    
    // In production, this would invalidate queries and refetch
  };

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
              <div style={{ width: 'clamp(2.5rem, 8vw, 3rem)', height: 'clamp(2.5rem, 8vw, 3rem)' }} className="bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Snowflake style={{ width: 'clamp(1.25rem, 4vw, 1.5rem)', height: 'clamp(1.25rem, 4vw, 1.5rem)' }} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-black dark:text-white">Manual Operator Dashboard</h1>
                  <InfoTooltip content="Manual operators can only accept jobs within 5 kilometers of their registered home address. This ensures efficient service delivery and prevents operator clashing in neighborhoods." />
                </div>
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
                <div className="flex flex-col items-center gap-1">
                  <DollarSign style={{ width: 'clamp(1.125rem, 4vw, 1.5rem)', height: 'clamp(1.125rem, 4vw, 1.5rem)' }} className="text-green-600" />
                  <ChevronRight style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} className="text-gray-400" />
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
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">{nearbySnowRequests.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    View on map
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <MapPin style={{ width: 'clamp(1.125rem, 4vw, 1.5rem)', height: 'clamp(1.125rem, 4vw, 1.5rem)' }} className="text-blue-600" />
                  <ChevronRight style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} className="text-gray-400" />
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
                <Users style={{ width: 'clamp(1.125rem, 4vw, 1.5rem)', height: 'clamp(1.125rem, 4vw, 1.5rem)' }} className="text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* Completed Today Card */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Today</p>
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">0</p>
                </div>
                <CheckCircle style={{ width: 'clamp(1.125rem, 4vw, 1.5rem)', height: 'clamp(1.125rem, 4vw, 1.5rem)' }} className="text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Grouping Section - Mobile-First with Bottom Sheets */}
        <div className="mb-8">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: 'clamp(2rem, 6vw, 2.5rem)', height: 'clamp(2rem, 6vw, 2.5rem)' }} className="bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Users style={{ width: 'clamp(1rem, 3vw, 1.25rem)', height: 'clamp(1rem, 3vw, 1.25rem)' }} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-black dark:text-white">
                        Nearby Customer Groups
                      </CardTitle>
                      <InfoTooltip content="Accept multiple customers in the same area for maximum efficiency. Customer groups expire when slots fill or after the time limit." />
                    </div>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white">
                  BOOST EARNINGS
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CustomerGrouping 
                groups={mockCustomerGroups}
                onAcceptGroup={handleAcceptGroup}
                acceptedGroupIds={acceptedGroupIds}
              />
            </CardContent>
          </Card>
        </div>

        {/* Individual Jobs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Individual Jobs Nearby
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Snow plowing requests within 5km of your home
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : nearbySnowRequests.length > 0 ? (
              <div className="space-y-3">
                {nearbySnowRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {request.customerName}
                          </h3>
                          {request.isEmergency === 1 && (
                            <Badge className="bg-red-500 text-white">
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
                <Snowflake className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  No Jobs Available
                </h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                  There are no snow plowing jobs within 5km of your home right now. Check back after the next snowfall!
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
                    Operating Radius: 5km
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    As a manual operator, you can only accept jobs within 5 kilometers of your registered home address. This ensures efficient service delivery and prevents operator clashing in neighborhoods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TierOnlineConfirmDialog
        open={showTierSwitchDialog}
        onOpenChange={setShowTierSwitchDialog}
        currentTier={tierSwitchInfo?.currentTier || ""}
        newTier={tierSwitchInfo?.newTier || ""}
        onConfirm={handleConfirmTierSwitch}
      />
      <MobileBottomNav />
    </div>
  );
}
