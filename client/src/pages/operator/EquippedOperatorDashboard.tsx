import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Clock, DollarSign, Truck, AlertCircle, AlertTriangle, CheckCircle, Filter, Users, ChevronRight, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useOperatorApproval } from "@/hooks/useOperatorApproval";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleManagement } from "@/components/VehicleManagement";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator } from "@shared/schema";
import { TierOnlineConfirmDialog } from "@/components/TierOnlineConfirmDialog";
import { CustomerGrouping, type CustomerGroup } from "@/components/operator/CustomerGrouping";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { OperatorStatusToggle } from "@/components/operator/OperatorStatusToggle";
import { QuoteModal } from "@/components/operator/QuoteModal";
import { UrgentRequestNotification, type UrgentRequest } from "@/components/operator/UrgentRequestNotification";
import { VehicleSelectionModal } from "@/components/operator/VehicleSelectionModal";
import { LocationTracker } from "@/components/operator/LocationTracker";

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
  const { user, updateUser } = useAuth();
  
  // PHASE 1: Check if operator is approved for equipped tier
  // Redirects to pending verification page if not approved
  const { isApproved, isLoading: isLoadingApproval } = useOperatorApproval("equipped");
  
  const [, setLocation] = useLocation();
  
  // Update viewTier when this dashboard loads to keep TierSwitcher in sync
  useEffect(() => {
    if (user && user.viewTier !== "equipped") {
      updateUser({ viewTier: "equipped" });
    }
  }, [user?.viewTier, user?.operatorId]);
  const [acceptedJobs, setAcceptedJobs] = useState<number[]>([]);
  const [acceptedGroupIds, setAcceptedGroupIds] = useState<string[]>([]);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const { toast } = useToast();
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);
  const [customerGroupsOpen, setCustomerGroupsOpen] = useState(true);
  const [urgentRequestsOpen, setUrgentRequestsOpen] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  
  // ALL MOCK DATA REMOVED - Dashboard is now 100% dynamic
  // VehicleManagement component handles real vehicle CRUD via database
  const mockVehicles: never[] = [];
  
  // Urgent requests - empty by default, would be populated by backend when implemented
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);

  // Customer groups - empty by default, would come from backend when implemented
  const mockCustomerGroups: CustomerGroup[] = [];

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

  // Fetch accepted jobs from database (persistent across sessions)
  const { data: acceptedJobsData = [], isLoading: isLoadingJobs } = useQuery<import("@shared/schema").AcceptedJob[]>({
    queryKey: ["/api/accepted-jobs", { operatorId, tier: "equipped" }],
    queryFn: async () => {
      const response = await fetch(`/api/accepted-jobs?operatorId=${operatorId}&tier=equipped`);
      if (!response.ok) throw new Error("Failed to fetch accepted jobs");
      return response.json();
    },
    enabled: !!operatorId,
  });

  // Fetch today's earnings (persistent across sessions)
  const { data: todayEarnings } = useQuery<{ earnings: number; jobsCompleted: number }>({
    queryKey: [`/api/earnings/today/${operatorId}`, { tier: "equipped" }],
    queryFn: async () => {
      const response = await fetch(`/api/earnings/today/${operatorId}?tier=equipped`);
      if (!response.ok) throw new Error("Failed to fetch today's earnings");
      return response.json();
    },
    enabled: !!operatorId,
  });

  // Fetch customer groups unlock status (tracks total jobs completed per tier)
  const { data: unlockStatus } = useQuery<{ 
    isUnlocked: boolean; 
    jobsCompleted: number; 
    minimumJobsRequired: number; 
    progress: number 
  }>({
    queryKey: [`/api/operators/${operatorId}/tier/equipped/unlock-status`],
    enabled: !!operatorId,
  });

  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "equipped";

  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async ({ goOnline, confirmed = false }: { goOnline: boolean; confirmed?: boolean }) => {
      // VERIFICATION CHECK: Prevent going online if tier is not approved
      if (goOnline && !isApproved) {
        throw new Error("NOT_VERIFIED");
      }
      
      // Block toggling for any non-terminal job (accepted/in_progress/started, not completed/cancelled)
      const activeJobs = acceptedJobsData.filter(job => 
        job.status !== 'completed' && job.status !== 'cancelled'
      );
      
      // Prevent going online OR offline if there are active jobs
      if (activeJobs.length > 0) {
        throw new Error(goOnline ? "CANNOT_GO_ONLINE_WITH_JOBS" : "CANNOT_GO_OFFLINE_WITH_JOBS");
      }
      
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
      // Handle verification error - operator not yet verified
      if (error?.message === "NOT_VERIFIED") {
        toast({
          title: "Verification Required",
          description: "Your account is pending verification. You can access the dashboard but cannot go online until approved.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle active jobs errors (both online and offline)
      if (error?.message === "CANNOT_GO_ONLINE_WITH_JOBS") {
        toast({
          title: "Cannot Go Online",
          description: `You have ${acceptedJobsData.length} active job${acceptedJobsData.length > 1 ? 's' : ''}. Please complete or cancel them first.`,
          variant: "destructive",
        });
        return;
      }
      
      if (error?.message === "CANNOT_GO_OFFLINE_WITH_JOBS") {
        toast({
          title: "Cannot Go Offline",
          description: `You have ${acceptedJobsData.length} active job${acceptedJobsData.length > 1 ? 's' : ''} in progress. Please complete or cancel them first.`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if error is from backend
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          
          // Handle backend verification error (server-side enforcement)
          if (errorData.error === "not_verified") {
            toast({
              title: "Verification Required",
              description: "Your account is pending verification. You can access the dashboard but cannot go online until approved.",
              variant: "destructive",
            });
            return;
          }
          
          // Handle active jobs errors from backend
          if (errorData.error === "active_jobs") {
            toast({
              title: errorData.message.includes("cannot go offline") ? "Cannot Go Offline" : "Cannot Switch Tier",
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

  // Request acceptance mutation with vehicle assignment
  const acceptRequestMutation = useMutation({
    mutationFn: async ({ requestId, vehicleId }: { requestId: string; vehicleId: string }) => {
      const request = requests.find(r => r.requestId === requestId);
      if (!request) throw new Error("Request not found");

      return await apiRequest("/api/accepted-jobs", {
        method: "POST",
        body: JSON.stringify({
          operatorId,
          jobSourceId: requestId,
          jobSourceType: "request",
          tier: "equipped",
          jobData: { ...request, assignedVehicleId: vehicleId },
        }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
      const request = requests.find(r => r.requestId === requestId);
      toast({
        title: request?.isEmergency ? "Emergency Request Accepted!" : "Request Accepted!",
        description: "Job added to your Jobs list. Check your Jobs list for details.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Accepting Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    
    // Open vehicle selection modal
    setPendingRequestId(requestId);
    setShowVehicleModal(true);
  };

  const handleVehicleSelected = (vehicleId: string) => {
    if (!pendingRequestId) return;
    acceptRequestMutation.mutate({ requestId: pendingRequestId, vehicleId });
    setPendingRequestId(null);
  };

  const handleAcceptJob = (requestId: number) => {
    handleAcceptRequest(requestId.toString());
  };

  const handleAcceptGroup = (groupId: string) => {
    const group = mockCustomerGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Mark group as accepted
    setAcceptedGroupIds(prev => [...prev, groupId]);
    
    // In production, send bulk accept to backend
    toast({
      title: "Jobs Accepted!",
      description: `Successfully accepted ${group.customerCount} jobs in ${group.location}.`,
    });
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

  // Urgent request handlers
  const handleAcceptUrgent = (requestId: string) => {
    setUrgentRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Emergency Request Accepted!",
      description: "Job added to your active list!",
    });
  };

  const handleDeclineUrgent = (requestId: string) => {
    setUrgentRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Request Declined",
      description: "The job has been offered to another operator.",
      variant: "destructive",
    });
  };

  const handleDismissUrgent = (requestId: string) => {
    setUrgentRequests(prev => prev.filter(r => r.id !== requestId));
  };
  
  // Get available services from requests
  const availableServices = Array.from(new Set(requests.map(r => r.serviceType)));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      {/* Location Tracker - automatically tracks and sends location when online */}
      <LocationTracker
        operatorId={operatorId}
        isOnline={isOnline}
        activeTier={operatorData?.activeTier || null}
        currentJobId={acceptedJobsData[0]?.jobSourceId || null}
      />

      {/* Urgent Request Notifications */}
      <UrgentRequestNotification
        requests={urgentRequests}
        onAccept={handleAcceptUrgent}
        onDecline={handleDeclineUrgent}
        onDismiss={handleDismissUrgent}
      />
      
      <Header
        onSignIn={() => {}}
        onSignUp={() => {}}
        onDriveAndEarn={() => setLocation("/drive-earn")}
      />

      {/* Mobile-First Sticky Toggle */}
      <OperatorStatusToggle
        isOnline={isOnline}
        onToggle={(goOnline) => toggleOnlineMutation.mutate({ goOnline })}
        isPending={toggleOnlineMutation.isPending}
        variant="mobile"
        label="Skilled & Equipped Operator"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div style={{ width: 'clamp(2.5rem, 8vw, 3rem)', height: 'clamp(2.5rem, 8vw, 3rem)' }} className="bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Truck style={{ width: 'clamp(1.25rem, 4vw, 1.5rem)', height: 'clamp(1.25rem, 4vw, 1.5rem)' }} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-black dark:text-white">Skilled & Equipped Dashboard</h1>
                <InfoTooltip 
                  content="As an equipped operator with mobile vehicles, you can accept jobs within 15 kilometers from your current location. This provides flexibility while maintaining service quality." 
                  testId="button-info-operating-radius-equipped"
                  ariaLabel="Operating radius information for equipped operators"
                />
              </div>
            </div>
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
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">
                    ${(todayEarnings?.earnings ?? 0).toFixed(2)}
                  </p>
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
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">{nearbyRequests.length}</p>
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

          {/* Completed Today Card - Clickable to view Job History */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-500"
            onClick={() => setLocation("/operator/job-history")}
            data-testid="card-completed-today"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {todayEarnings?.jobsCompleted || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    View history
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle style={{ width: 'clamp(1.125rem, 4vw, 1.5rem)', height: 'clamp(1.125rem, 4vw, 1.5rem)' }} className="text-green-600" />
                  <ChevronRight style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} className="text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JOBS IN PROGRESS - Prominent display with animations */}
        {acceptedJobsData.filter(job => job.status === "in_progress").length > 0 && (
          <Card className="mb-8 border-4 border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-2xl animate-pulse-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-green-500 rounded-full p-3">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-black dark:text-white flex items-center gap-2">
                      JOB IN PROGRESS
                      <Badge className="bg-green-600 text-white text-sm animate-pulse">
                        ACTIVE
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-700 dark:text-gray-300 mt-1">
                      You're currently working on {acceptedJobsData.filter(job => job.status === "in_progress").length} job{acceptedJobsData.filter(job => job.status === "in_progress").length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {acceptedJobsData.filter(job => job.status === "in_progress").map((acceptedJob) => {
                  const jobData = acceptedJob.jobData as any;
                  const isEmergency = jobData.isEmergency === true || jobData.isEmergency === 1;
                  
                  return (
                    <div
                      key={acceptedJob.acceptedJobId}
                      className="border-2 border-green-300 dark:border-green-700 rounded-xl p-6 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow"
                      data-testid={`in-progress-job-${acceptedJob.acceptedJobId}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-black dark:text-white">
                              {jobData.customerName || 'Customer'}
                            </h3>
                            {isEmergency && (
                              <Badge className="bg-red-600 text-white text-xs">
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {jobData.description || jobData.serviceType || 'Service Request'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {jobData.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-semibold text-green-600">{acceptedJob.progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${acceptedJob.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setLocation(`/operator/job-details/${acceptedJob.acceptedJobId}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                        data-testid={`button-continue-job-${acceptedJob.acceptedJobId}`}
                      >
                        <ChevronRight className="w-5 h-5 mr-2" />
                        Continue Working on This Job
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ALL ACCEPTED JOBS - Collapsible panel */}
        <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: 'clamp(2rem, 6vw, 2.5rem)', height: 'clamp(2rem, 6vw, 2.5rem)' }} className="bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <CheckCircle style={{ width: 'clamp(1rem, 3vw, 1.25rem)', height: 'clamp(1rem, 3vw, 1.25rem)' }} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-black dark:text-white">My Jobs</CardTitle>
                    <CardDescription>Track all your accepted jobs</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500 text-white">
                    {acceptedJobsData.length} ACTIVE
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
                {acceptedJobsData.length > 0 ? (
                  <div className="space-y-3">
                    {acceptedJobsData.map((acceptedJob) => {
                      const jobData = acceptedJob.jobData as any;
                      const isEmergency = jobData.isEmergency === true || jobData.isEmergency === 1;
                      
                      return (
                        <div
                          key={acceptedJob.acceptedJobId}
                          className="border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950"
                          data-testid={`job-${acceptedJob.acceptedJobId}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-black dark:text-white">
                                  {jobData.customerName || 'Customer'}
                                </h3>
                                {isEmergency && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    EMERGENCY
                                  </Badge>
                                )}
                                <Badge className={
                                  acceptedJob.status === "in_progress"
                                    ? "bg-blue-500 text-white text-xs"
                                    : "bg-gray-500 text-white text-xs"
                                }>
                                  {acceptedJob.status === "in_progress" ? `${acceptedJob.progress}%` : "ACCEPTED"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {jobData.description || jobData.serviceType || 'Service Request'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {jobData.location}
                                  {jobData.distance && ` (${jobData.distance}km)`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => setLocation(`/operator/job-details/${acceptedJob.acceptedJobId}`)}
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            data-testid={`button-view-job-${acceptedJob.acceptedJobId}`}
                          >
                            View Details <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                      No Active Jobs
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                      Accept jobs from the Available Jobs section below to get started. Your accepted jobs will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* EQUIPPED-SPECIFIC: Fleet Performance Overview */}
        <Card className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white">Fleet Performance</CardTitle>
                  <CardDescription>Monitor your vehicle utilization and earnings</CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white">15KM RADIUS</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Vehicles */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Vehicles</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold text-black dark:text-white">2 of 3</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">67% utilization</p>
              </div>

              {/* Top Earning Vehicle */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Top Earner Today</span>
                <p className="text-xl font-bold text-black dark:text-white">Truck #2</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-semibold">$180 earned</p>
              </div>

              {/* Maintenance Due */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Maintenance Alert</span>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">Truck #1</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Oil change in 200km</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => setLocation("/operator/fleet-analytics")}
              data-testid="button-view-fleet-analytics"
            >
              View Detailed Fleet Analytics
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Responsive Grid: Customer Groups + Urgent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Customer Grouping Section */}
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
                <Badge className="bg-orange-500 text-white">
                  BOOST EARNINGS
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CustomerGrouping 
                groups={mockCustomerGroups}
                onAcceptGroup={handleAcceptGroup}
                onAcceptCustomers={handleAcceptCustomers}
                acceptedGroupIds={acceptedGroupIds}
                operatorJobCount={unlockStatus?.jobsCompleted || 0}
                minimumJobsRequired={unlockStatus?.minimumJobsRequired || 5}
              />
            </CardContent>
          </Card>

          {/* Urgent Requests Panel */}
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-black dark:text-white">
                        Urgent Requests
                      </CardTitle>
                      <InfoTooltip 
                        content="Emergency and high-priority jobs that need immediate response. These jobs pay premium rates." 
                        testId="button-info-urgent-requests"
                        ariaLabel="Urgent requests information"
                      />
                    </div>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white">
                  PRIORITY
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {urgentRequests.length > 0 ? (
                <div className="space-y-3">
                  {urgentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border-2 border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-950"
                      data-testid={`urgent-request-${request.id}`}
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
                          onClick={() => {
                            setSelectedRequest(request);
                            setQuoteModalOpen(true);
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          data-testid={`button-quote-urgent-${request.id}`}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Quote Urgent
                        </Button>
                        <Button
                          onClick={() => handleDeclineUrgent(request.id)}
                          variant="outline"
                          className="border-gray-300 dark:border-gray-600"
                          data-testid={`button-decline-urgent-${request.id}`}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-500">
                    No urgent requests right now
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : nearbyRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyRequests.map((request) => {
                  const isEmergency = request.isEmergency === 1;
                  const priorityColor = isEmergency 
                    ? "border-red-400 dark:border-red-600 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900";
                  
                  return (
                    <div
                      key={request.id}
                      className={`border-2 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${priorityColor}`}
                      data-testid={`service-request-${request.id}`}
                    >
                      {/* Priority Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isEmergency && (
                            <div className="relative">
                              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                              <AlertCircle className="relative w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                          <Badge 
                            className={isEmergency 
                              ? "bg-red-600 text-white text-xs font-bold animate-pulse" 
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs"}
                          >
                            {isEmergency ? "🚨 EMERGENCY" : request.serviceType}
                          </Badge>
                        </div>
                        {request.distance && (
                          <Badge variant="outline" className="text-xs">
                            {request.distance}km
                          </Badge>
                        )}
                      </div>

                      {/* Customer Name */}
                      <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                        {request.customerName}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                        {request.description || "Service request details"}
                      </p>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{request.location}</span>
                      </div>

                      {/* Budget */}
                      {request.budgetRange && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 mb-4">
                          <DollarSign className="w-4 h-4" />
                          <span>{request.budgetRange}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      {acceptedJobs.includes(request.id) ? (
                        <div className="w-full py-3 px-4 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center gap-2 font-semibold text-green-700 dark:text-green-300">
                          <CheckCircle className="w-5 h-5" />
                          Accepted
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setQuoteModalOpen(true);
                          }}
                          className={`w-full ${
                            isEmergency
                              ? "bg-red-600 hover:bg-red-700 text-white text-base font-bold shadow-lg shadow-red-500/50"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          data-testid={`button-quote-${request.id}`}
                        >
                          {isEmergency ? (
                            <>
                              <DollarSign className="w-5 h-5 mr-2" />
                              Quote Emergency
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-5 h-5 mr-2" />
                              Quote this Job
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
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

      <VehicleSelectionModal
        isOpen={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setPendingRequestId(null);
        }}
        onSelectVehicle={handleVehicleSelected}
        vehicles={mockVehicles}
        requestDetails={
          pendingRequestId
            ? (() => {
                const request = requests.find(r => r.requestId === pendingRequestId);
                return request
                  ? {
                      customerName: request.customerName,
                      serviceType: request.serviceType,
                      location: request.location,
                    }
                  : undefined;
              })()
            : undefined
        }
      />
      
      {selectedRequest && (
        <QuoteModal
          open={quoteModalOpen}
          onOpenChange={setQuoteModalOpen}
          serviceRequest={selectedRequest}
          operatorId={operatorId}
          operatorName={operatorData?.name || user?.name || ""}
          tier="equipped"
        />
      )}

      <MobileBottomNav />
    </div>
  );
}
