import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Clock, DollarSign, Users, Snowflake, AlertCircle, AlertTriangle, CheckCircle, ChevronRight, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
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
import { OperatorStatusToggle } from "@/components/operator/OperatorStatusToggle";
import type { UrgentRequest } from "@/components/operator/UrgentRequestNotification";

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
  const [acceptedJobs, setAcceptedJobs] = useState<Array<number | string>>([]);
  const [acceptedGroupIds, setAcceptedGroupIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);
  const [customerGroupsOpen, setCustomerGroupsOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(true);
  
  // All incoming requests - prioritized by urgency, distance, and pay
  // In production, this would come from WebSocket/polling and be auto-sorted
  const [allRequests, setAllRequests] = useState<UrgentRequest[]>([
    {
      id: "URG-001",
      type: "emergency",
      customerName: "City Hospital",
      serviceType: "Snow Plowing",
      location: "123 Emergency Lane",
      distance: 1.2,
      estimatedValue: "$120-180",
      description: "Emergency access needed - ambulance route blocked",
      expiresIn: 5,
      isEmergency: true,
    },
    {
      id: "REQ-002",
      type: "new_job",
      customerName: "Main Street Bistro",
      serviceType: "Snow Plowing",
      location: "100 Main St",
      distance: 2.3,
      estimatedValue: "$60-90",
      description: "Parking lot clearing needed",
      expiresIn: 45,
      isEmergency: false,
    },
    {
      id: "REQ-003",
      type: "new_job",
      customerName: "Johnson Residence",
      serviceType: "Snow Plowing",
      location: "15 River Rd",
      distance: 3.8,
      estimatedValue: "$40-60",
      description: "Driveway and walkway clearing",
      expiresIn: 32,
      isEmergency: false,
    },
  ]);

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

  // Calculate accurate statistics
  const availableRequestsCount = allRequests.filter(r => !acceptedJobs.includes(r.id)).length;
  const acceptedJobsCount = acceptedJobs.length;
  const totalJobsNearby = availableRequestsCount + acceptedJobsCount;
  
  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "manual";
  
  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async ({ goOnline, confirmed = false }: { goOnline: boolean; confirmed?: boolean }) => {
      // Prevent going online if there are active jobs
      if (goOnline && acceptedJobs.length > 0) {
        throw new Error("ACTIVE_JOBS_EXIST");
      }
      
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
      // Handle active jobs error
      if (error?.message === "ACTIVE_JOBS_EXIST") {
        toast({
          title: "Cannot Go Online",
          description: `You have ${acceptedJobs.length} active job${acceptedJobs.length > 1 ? 's' : ''}. Please complete or abandon them before going online.`,
          variant: "destructive",
        });
        return;
      }
      
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
    // Check if operator is online before accepting
    if (!isOnline) {
      toast({
        title: "Cannot Accept Job",
        description: "You must be online to accept jobs. Toggle your status above to go online.",
        variant: "destructive",
      });
      return;
    }
    
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

  const handleAcceptCustomers = (groupId: string, customerIndices: number[]) => {
    const group = mockCustomerGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Mark group as accepted (partial acceptance still removes the group from view)
    setAcceptedGroupIds(prev => [...prev, groupId]);
    
    // In production, send selective accept to backend with customer indices
    toast({
      title: "Customers Accepted!",
      description: `Accepted ${customerIndices.length} of ${group.customerCount} jobs in ${group.location}`,
    });
  };

  // Request handlers - for both urgent and regular requests
  const handleAcceptRequest = (requestId: string) => {
    // Check if operator is online before accepting
    if (!isOnline) {
      toast({
        title: "Cannot Accept Job",
        description: "You must be online to accept jobs. Toggle your status above to go online.",
        variant: "destructive",
      });
      return;
    }
    
    setAcceptedJobs(prev => [...prev, requestId]);
    // Keep request in list (moved to Jobs section visually via filtering)
    const request = allRequests.find(r => r.id === requestId);
    toast({
      title: request?.isEmergency ? "Emergency Request Accepted!" : "Request Accepted!",
      description: "Job added to your Jobs list.",
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    setAllRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Request Declined",
      description: "The job has been offered to another operator.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      <Header
        onSignIn={() => {}}
        onSignUp={() => {}}
        onDriveAndEarn={() => setLocation("/drive-earn")}
      />

      {/* Mobile-First Sticky Toggle */}
      <div>
        <OperatorStatusToggle
          isOnline={isOnline}
          onToggle={(goOnline) => toggleOnlineMutation.mutate({ goOnline })}
          isPending={toggleOnlineMutation.isPending}
          variant="mobile"
          label="Manual Operator"
        />
        {!isOnline && acceptedJobs.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              ⚠️ You have {acceptedJobs.length} active job{acceptedJobs.length > 1 ? 's' : ''}. Complete or abandon them to go online.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section with Info */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-green-600 dark:text-green-400" />
            <InfoTooltip 
              content="Manual operators can only accept jobs within 5 kilometers of their registered home address. This ensures efficient service delivery and prevents operator clashing in neighborhoods." 
              testId="button-info-operating-radius"
              ariaLabel="Operating radius information"
            />
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
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">{totalJobsNearby}</p>
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

        {/* Responsive Grid: Customer Groups + Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Customer Grouping Section */}
          <Collapsible open={customerGroupsOpen} onOpenChange={setCustomerGroupsOpen}>
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
                        <InfoTooltip 
                          content="Accept multiple customers in the same area for maximum efficiency. Customer groups expire when slots fill or after the time limit." 
                          testId="button-info-customer-groups"
                          ariaLabel="Customer grouping information"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500 text-white">
                      BOOST EARNINGS
                    </Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-toggle-customer-groups">
                        {customerGroupsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <CustomerGrouping 
                    groups={mockCustomerGroups}
                    onAcceptGroup={handleAcceptGroup}
                    onAcceptCustomers={handleAcceptCustomers}
                    acceptedGroupIds={acceptedGroupIds}
                    operatorJobCount={3}
                    minimumJobsRequired={5}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Requests Panel - All incoming customer requests, prioritized by urgency/distance/pay */}
          <Collapsible open={requestsOpen} onOpenChange={setRequestsOpen}>
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 'clamp(2rem, 6vw, 2.5rem)', height: 'clamp(2rem, 6vw, 2.5rem)' }} className="bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <AlertCircle style={{ width: 'clamp(1rem, 3vw, 1.25rem)', height: 'clamp(1rem, 3vw, 1.25rem)' }} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-black dark:text-white">
                          Requests
                        </CardTitle>
                        <InfoTooltip 
                          content="Customer requests prioritized by urgency, distance, and pay. Emergency jobs appear first, followed by highest-paying jobs closest to you." 
                          testId="button-info-requests"
                          ariaLabel="Requests information"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500 text-white">
                      {availableRequestsCount} AVAILABLE
                    </Badge>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-toggle-urgent-requests">
                        {requestsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  {allRequests.filter(r => !acceptedJobs.includes(r.id)).length > 0 ? (
                    <div className="space-y-3">
                      {allRequests.filter(r => !acceptedJobs.includes(r.id)).map((request) => (
                        <div
                          key={request.id}
                          className={`border-2 rounded-lg p-4 ${
                            request.isEmergency
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
                              : 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950'
                          }`}
                          data-testid={`request-${request.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-black dark:text-white">
                                  {request.customerName}
                                </h3>
                                {request.isEmergency && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    EMERGENCY
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {request.location}
                                  {request.distance && ` (${request.distance}km)`}
                                </span>
                                {request.estimatedValue && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {request.estimatedValue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={!isOnline}
                              className={`flex-1 ${
                                request.isEmergency
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-purple-600 hover:bg-purple-700'
                              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                              data-testid={`button-accept-request-${request.id}`}
                              title={!isOnline ? "You must be online to accept jobs" : ""}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {request.isEmergency ? 'Accept Emergency' : 'Accept Request'}
                            </Button>
                            <Button
                              onClick={() => handleDeclineRequest(request.id)}
                              variant="outline"
                              className="border-gray-300 dark:border-gray-600"
                              data-testid={`button-decline-request-${request.id}`}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-500">
                        No requests available right now
                      </p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Jobs Section - Accepted jobs that operator is working on */}
        <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: 'clamp(2rem, 6vw, 2.5rem)', height: 'clamp(2rem, 6vw, 2.5rem)' }} className="bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <CheckCircle style={{ width: 'clamp(1rem, 3vw, 1.25rem)', height: 'clamp(1rem, 3vw, 1.25rem)' }} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-black dark:text-white">
                        Jobs
                      </CardTitle>
                      <InfoTooltip 
                        content="Jobs you've accepted and are currently working on. This data populates the map on the 'Jobs Nearby' page. Complete these to earn and maintain your rating." 
                        testId="button-info-jobs"
                        ariaLabel="Jobs information"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500 text-white">
                    {acceptedJobsCount} ACTIVE
                  </Badge>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-toggle-jobs">
                      {jobsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {acceptedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {acceptedJobs.map((jobId) => {
                      const regularJob = typeof jobId === 'number' ? nearbySnowRequests.find(r => r.id === jobId) : undefined;
                      const requestJob = typeof jobId === 'string' ? allRequests.find(r => r.id === jobId) : undefined;
                      const job = requestJob || regularJob;
                      
                      if (!job) return null;
                      
                      return (
                        <div
                          key={jobId}
                          className="border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950"
                          data-testid={`job-${jobId}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-black dark:text-white">
                                  {'customerName' in job ? job.customerName : 'Customer'}
                                </h3>
                                {((requestJob && requestJob.isEmergency) || (regularJob && regularJob.isEmergency === 1)) && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    EMERGENCY
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {requestJob && 'description' in requestJob ? requestJob.description : regularJob && 'serviceType' in regularJob ? regularJob.serviceType : ''}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.location}
                                  {job.distance && ` (${job.distance}km)`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setLocation(`/operator/jobs/${jobId}`)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              data-testid={`button-view-job-${jobId}`}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              data-testid={`button-complete-job-${jobId}`}
                            >
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                      No Active Jobs
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                      Accept jobs from the Requests panel above to get started. Your accepted jobs will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
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
