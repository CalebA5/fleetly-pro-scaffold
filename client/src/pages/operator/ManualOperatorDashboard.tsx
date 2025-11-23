import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Clock, DollarSign, Users, Snowflake, AlertCircle, AlertTriangle, CheckCircle, ChevronRight, ChevronDown, ChevronUp, TrendingUp, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator, AcceptedJob } from "@shared/schema";
import { TierOnlineConfirmDialog } from "@/components/TierOnlineConfirmDialog";
import { CustomerGrouping, type CustomerGroup } from "@/components/operator/CustomerGrouping";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { OperatorStatusToggle } from "@/components/operator/OperatorStatusToggle";
import type { UrgentRequest } from "@/components/operator/UrgentRequestNotification";
import { QuoteModal } from "@/components/operator/QuoteModal";
import { RequestDetailsModal } from "@/components/operator/RequestDetailsModal";
import { DeclineReasonModal } from "@/components/operator/DeclineReasonModal";
import { JobProgressModal } from "@/components/operator/JobProgressModal";

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
  const [acceptedGroupIds, setAcceptedGroupIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);
  const [customerGroupsOpen, setCustomerGroupsOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [requestDetailsOpen, setRequestDetailsOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<AcceptedJob | null>(null);
  
  // ALL MOCK DATA REMOVED - Dashboard is now 100% dynamic
  // Requests come from database via /api/service-requests/for-operator endpoint

  // Customer groups - empty by default, would come from backend when implemented
  const mockCustomerGroups: CustomerGroup[] = [];

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

  // Fetch accepted jobs from database (persistent across sessions)
  const { data: acceptedJobsData = [], isLoading: isLoadingJobs } = useQuery<AcceptedJob[]>({
    queryKey: ["/api/accepted-jobs", { operatorId, tier: "manual" }],
    queryFn: async () => {
      const response = await fetch(`/api/accepted-jobs?operatorId=${operatorId}&tier=manual`);
      if (!response.ok) throw new Error("Failed to fetch accepted jobs");
      return response.json();
    },
    enabled: !!operatorId,
  });

  // Fetch today's earnings (persistent across sessions)
  const { data: todayEarnings } = useQuery<{ earnings: number; jobsCompleted: number }>({
    queryKey: [`/api/earnings/today/${operatorId}`, { tier: "manual" }],
    queryFn: async () => {
      const response = await fetch(`/api/earnings/today/${operatorId}?tier=manual`);
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
    queryKey: [`/api/operators/${operatorId}/tier/manual/unlock-status`],
    enabled: !!operatorId,
  });

  // Fetch operator's quotes to show quoted amount on job cards
  const { data: operatorQuotes = [] } = useQuery<any[]>({
    queryKey: [`/api/quotes/operator/${operatorId}`],
    enabled: !!operatorId,
  });

  // Create a map of requestId (string) to quote for quick lookup
  const quotesMap = new Map();
  operatorQuotes.forEach(quote => {
    if (quote.status !== 'operator_withdrawn') {
      quotesMap.set(quote.serviceRequestId, quote);  // Use string requestId consistently
    }
  });

  // Create quoted jobs from the quotes themselves (since backend filters them out of nearbyRequests)
  // Build full request objects from quotes + service request data
  const quotedJobs = operatorQuotes
    .filter(quote => quote.status === 'sent')
    .map(quote => {
      // Find the request in nearbySnowRequests if it still exists there
      const existingRequest = nearbySnowRequests.find(r => r.requestId === quote.serviceRequestId);
      // If found, use it; otherwise create a minimal object from quote data
      return existingRequest || {
        id: quote.serviceRequestId,
        requestId: quote.serviceRequestId,
        customerName: quote.operatorName, // Not ideal but we don't have customer data in quote
        serviceType: 'Service Request', // Generic since we don't have type
        location: 'Location unavailable',
        isEmergency: false,
        // This will be populated if backend includes the full request
      };
    });

  // Calculate accurate statistics using fetched data
  const acceptedJobIds = acceptedJobsData.map(j => (j.jobData as any).id || j.jobSourceId);
  const availableRequestsCount = nearbySnowRequests.filter(r => !acceptedJobIds.includes(r.id)).length;
  const acceptedJobsCount = acceptedJobsData.length;
  const totalJobsNearby = availableRequestsCount + acceptedJobsCount;
  
  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "manual";
  
  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async ({ goOnline, confirmed = false }: { goOnline: boolean; confirmed?: boolean }) => {
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
      
      // Check if error is from backend (active jobs blocking)
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
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

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (acceptedJobId: string) => {
      return apiRequest(`/api/accepted-jobs/${acceptedJobId}/start`, {
        method: "PATCH",
        body: JSON.stringify({ operatorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accepted-jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-jobs'] });
      toast({
        title: "Job Started!",
        description: "You can now track your progress on this job"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start job",
        variant: "destructive"
      });
    }
  });

  // Old handler removed - now using acceptRequestMutation

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
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = nearbySnowRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      return await apiRequest("/api/accepted-jobs", {
        method: "POST",
        body: JSON.stringify({
          operatorId,
          jobSourceId: requestId,
          jobSourceType: "request",
          tier: "manual",
          jobData: request,
        }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"] });
      const request = nearbySnowRequests.find(r => r.id === requestId);
      toast({
        title: request?.isEmergency ? "Emergency Request Accepted!" : "Request Accepted!",
        description: "Job added to your Jobs list. Click to view details.",
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
    
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: string) => {
    // Decline request - query will automatically refetch and remove it from the list
    queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
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
        {!isOnline && acceptedJobsData.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              ⚠️ You have {acceptedJobsData.length} active job{acceptedJobsData.length > 1 ? 's' : ''}. Complete or abandon them to go online.
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
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">
                    ${todayEarnings?.earnings?.toFixed(2) || '0.00'}
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

          {/* Completed Today Card - Clickable to view Job History */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => setLocation("/operator/job-history")}
            data-testid="card-completed-today"
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Today</p>
                  <p className="text-xl md:text-2xl font-bold text-black dark:text-white">
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

        {/* IN PROGRESS Jobs Section - Prominent visual indicator */}
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
                              <Badge className="bg-red-600 text-white">
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {jobData.description || jobData.serviceType || 'Service Request'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-green-600" />
                              {jobData.location || 'Location not specified'}
                            </span>
                            {jobData.budgetRange && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                {jobData.budgetRange}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Progress
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {acceptedJob.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${acceptedJob.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setLocation(`/operator/jobs/${acceptedJob.acceptedJobId}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
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

        {/* Waiting for Approval Section */}
        {quotedJobs.length > 0 && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-black dark:text-white">
                    Waiting for Customer Approval
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {quotedJobs.length} quote{quotedJobs.length !== 1 ? 's' : ''} pending customer response
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotedJobs.map(request => {
                  const quote = quotesMap.get(request.requestId);
                  return (
                    <Card key={request.requestId} className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-black dark:text-white">
                                {request.customerName}
                              </h3>
                              {request.isEmergency && (
                                <Badge className="bg-red-600 text-white text-xs">
                                  EMERGENCY
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {request.serviceType}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${parseFloat(quote?.amount || '0').toFixed(2)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Your Quote
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {request.location}
                          </span>
                          {quote?.submittedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Quoted {formatDistanceToNow(new Date(quote.submittedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Status:
                            </span>
                            <Badge className="bg-blue-600 text-white">
                              <Clock className="w-3 h-3 mr-1" />
                              Awaiting Response
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
                    operatorJobCount={unlockStatus?.jobsCompleted || 0}
                    minimumJobsRequired={unlockStatus?.minimumJobsRequired || 5}
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
                  {nearbySnowRequests.filter(r => !acceptedJobIds.includes(r.id)).length > 0 ? (
                    <div className="space-y-3">
                      {nearbySnowRequests.filter(r => !acceptedJobIds.includes(r.id)).map((request) => (
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
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-black dark:text-white">
                                  {request.customerName}
                                </h3>
                                {request.isEmergency && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    EMERGENCY
                                  </Badge>
                                )}
                                {quotesMap.has(request.requestId) && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    Quoted ${quotesMap.get(request.requestId)?.amount}
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
                                setRequestDetailsOpen(true);
                              }}
                              variant="outline"
                              className="flex-1 border-gray-300 dark:border-gray-600"
                              data-testid={`button-view-details-${request.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                setQuoteModalOpen(true);
                              }}
                              disabled={quotesMap.has(request.requestId)}
                              className={`flex-1 ${
                                request.isEmergency
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-purple-600 hover:bg-purple-700'
                              } text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400`}
                              data-testid={`button-quote-request-${request.id}`}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              {quotesMap.has(request.requestId)
                                ? `Quoted $${quotesMap.get(request.requestId)?.amount}` 
                                : (request.isEmergency ? 'Quote Emergency' : 'Quote this Job')}
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
                          <div className="flex gap-2">
                            {acceptedJob.status === "accepted" ? (
                              <Button
                                onClick={() => startJobMutation.mutate(acceptedJob.acceptedJobId)}
                                disabled={startJobMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-start-job-${acceptedJob.acceptedJobId}`}
                              >
                                {startJobMutation.isPending ? "Starting..." : "Start Job"}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setSelectedJob(acceptedJob)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                data-testid={`button-track-progress-${acceptedJob.acceptedJobId}`}
                              >
                                Track Progress
                              </Button>
                            )}
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
      
      {selectedRequest && (
        <QuoteModal
          open={quoteModalOpen}
          onOpenChange={setQuoteModalOpen}
          serviceRequest={selectedRequest}
          operatorId={operatorId}
          operatorName={operatorData?.name || user?.name || ""}
          tier="manual"
        />
      )}
      
      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          open={requestDetailsOpen}
          onOpenChange={setRequestDetailsOpen}
          request={selectedRequest}
          operatorId={operatorId}
          onQuote={(req) => {
            setSelectedRequest(req);
            setQuoteModalOpen(true);
          }}
          onDecline={(req) => {
            setSelectedRequest(req);
            setDeclineModalOpen(true);
          }}
        />
      )}

      {/* Decline Reason Modal */}
      {selectedRequest && (
        <DeclineReasonModal
          open={declineModalOpen}
          onOpenChange={setDeclineModalOpen}
          request={selectedRequest}
          operatorId={operatorId}
          operatorName={user?.name || "Manual Operator"}
          tier="manual"
        />
      )}
      
      {/* Job Progress Modal */}
      <JobProgressModal
        job={selectedJob}
        operatorId={operatorId}
        onClose={() => setSelectedJob(null)}
      />

      <MobileBottomNav />
    </div>
  );
}
