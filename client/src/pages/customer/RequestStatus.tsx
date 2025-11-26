import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  DollarSign,
  User,
  Search,
  Eye,
  Truck,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { JobDetailModal } from "@/components/customer/JobDetailModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_COLORS = {
  pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  quoted: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  operator_pending: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  operator_accepted: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  operator_declined: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  in_progress: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  completed: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
  searching: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  operator_assigned: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  en_route: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  cancelled: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
};

const STATUS_ICONS = {
  pending: Clock,
  quoted: DollarSign,
  operator_pending: Clock,
  operator_accepted: CheckCircle,
  operator_declined: XCircle,
  in_progress: AlertCircle,
  completed: CheckCircle,
  searching: Clock,
  operator_assigned: Truck,
  en_route: MapPin,
  cancelled: XCircle
};

export default function RequestStatus() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declinedRequestId, setDeclinedRequestId] = useState<string | null>(null);

  // CRITICAL: Fetch only THIS customer's requests using server-side filtering
  // Use default queryFn which properly handles credentials and auth
  const { data: requests, isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/service-requests?customerId=${user?.id || ''}`, 'customer', user?.id],
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 500,
  });

  // Also fetch emergency requests for this customer
  const { data: emergencyRequests, isLoading: isLoadingEmergencies } = useQuery<any[]>({
    queryKey: [`/api/customers/${user?.id}/emergency-requests`],
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 500,
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your requests.</p>
        </Card>
      </div>
    );
  }

  // Combine service requests and emergency requests
  const allRequests = [
    ...(requests || []),
    ...(emergencyRequests || []).map((er: any) => ({
      ...er,
      id: er.emergencyId, // Use emergencyId as id for consistency
      requestId: er.emergencyId,
      isEmergency: true,
      status: er.status || 'searching',
      serviceType: er.serviceType,
      location: er.location,
      createdAt: er.createdAt,
      operatorName: er.assignedOperator?.name || null,
      operatorId: er.assignedOperator?.operatorId || null,
    }))
  ];

  const groupedRequests = {
    pending: allRequests.filter((r: any) => 
      r.status === 'pending' || r.status === 'quoted' || r.status === 'operator_pending' || r.status === 'operator_declined' ||
      r.status === 'searching' // Emergency requests in searching state
    ),
    active: allRequests.filter((r: any) => 
      r.status === 'assigned' || r.status === 'in_progress' ||
      r.status === 'operator_assigned' || r.status === 'en_route' // Emergency request active states
    ),
    completed: allRequests.filter((r: any) => r.status === 'completed')
  };

  const RequestCard = ({ request }: { request: any }) => {
    const { toast } = useToast();
    const [showQuotes, setShowQuotes] = useState(false);
    const StatusIcon = STATUS_ICONS[request.status as keyof typeof STATUS_ICONS] || Clock;
    const isDeclined = request.status === 'operator_declined';
    // FIX: Check if job is trackable (assigned/in_progress with OR without selectedQuoteId)
    // Some jobs may be assigned without going through quote flow
    const isAssigned = request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed';
    
    // Fetch quotes for this request
    const { data: quotes = [], isLoading: quotesLoading } = useQuery<any[]>({
      queryKey: [`/api/service-requests/${request.id}/quotes`],
      enabled: request.quoteCount > 0,
    });

    // Accept quote mutation
    const acceptQuoteMutation = useMutation({
      mutationFn: async (quoteId: string) => {
        return apiRequest(`/api/quotes/${quoteId}/accept`, {
          method: "POST",
        });
      },
      onSuccess: () => {
        toast({
          title: "Quote Accepted!",
          description: "The operator has been notified and will start your job soon.",
        });
        // Invalidate with exact query key including customerId
        queryClient.invalidateQueries({ queryKey: [`/api/service-requests?customerId=${user?.id}`, 'customer', user?.id] });
        queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${request.id}/quotes`] });
      },
      onError: () => {
        toast({
          title: "Failed to Accept Quote",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    });

    // Decline quote mutation
    const declineQuoteMutation = useMutation({
      mutationFn: async (quoteId: string) => {
        return apiRequest(`/api/quotes/${quoteId}/decline`, {
          method: "POST",
        });
      },
      onSuccess: () => {
        // Show success message with options dialog
        toast({
          title: "Quote Declined",
          description: "The operator has been notified. We'll help you find another operator.",
        });
        
        // Show dialog with options to find other operators
        setDeclinedRequestId(request.requestId);
        setShowDeclineDialog(true);
        
        // Invalidate with exact query key including customerId
        queryClient.invalidateQueries({ queryKey: [`/api/service-requests?customerId=${user?.id}`, 'customer', user?.id] });
        queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${request.id}/quotes`] });
      },
      onError: () => {
        toast({
          title: "Failed to Decline Quote",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    });
    
    const handleViewDetails = () => {
      // For emergency requests, navigate to emergency tracking page
      if (request.isEmergency === true) {
        setLocation(`/emergency/tracking/${request.emergencyId || request.requestId}`);
        return;
      }
      
      // For assigned jobs, navigate to job tracking page
      // No need to check selectedQuoteId - just use requestId
      if (isAssigned) {
        setLocation(`/customer/job-tracking?requestId=${request.requestId}`);
      } else {
        // For other statuses, open detail modal
        setSelectedRequest(request);
        setShowDetailModal(true);
      }
    };

    return (
      <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white break-words">
                  {request.serviceType}
                </h3>
                {(request.isEmergency === 1 || request.isEmergency === true) && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    EMERGENCY
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                Request ID: {request.requestId}
              </p>
            </div>
            <Badge className={`${STATUS_COLORS[request.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending} flex items-center gap-1 shrink-0 whitespace-nowrap text-xs`}>
              <StatusIcon className="w-3 h-3" />
              {request.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-xs md:text-sm">
            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 break-words">{request.location}</span>
          </div>

          {/* Budget */}
          {request.budgetRange && (
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{request.budgetRange}</span>
            </div>
          )}

          {/* Operator Info (if assigned) */}
          {request.operatorName && (
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 break-words">
                Operator: {request.operatorName}
              </span>
            </div>
          )}

          {/* Timeline */}
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
          </div>

          {/* Quote Info */}
          {request.status === 'quoted' && request.quoteCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {request.quoteCount} {request.quoteCount === 1 ? 'Quote' : 'Quotes'} Received
              </p>
              {request.lastQuoteAt && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Latest quote: {formatDistanceToNow(new Date(request.lastQuoteAt), { addSuffix: true })}
                </p>
              )}
            </div>
          )}

          {/* Declined Info */}
          {isDeclined && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                This request was declined
              </p>
              {request.declineReason && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  Reason: {request.declineReason.replace(/_/g, ' ')}
                </p>
              )}
              {request.declineNotes && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  "{request.declineNotes}"
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isAssigned ? (
              <Button
                size="sm"
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
                onClick={handleViewDetails}
                data-testid={`button-track-job-${request.requestId}`}
              >
                <Eye className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">Track Job Progress</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:flex-1 text-xs md:text-sm"
                onClick={handleViewDetails}
                data-testid={`button-view-details-${request.requestId}`}
              >
                View Details
              </Button>
            )}
            {isDeclined && (
              <Button
                size="sm"
                className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm"
                data-testid={`button-find-alternative-${request.requestId}`}
              >
                <Search className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">Find Alternative Operator</span>
              </Button>
            )}
          </div>

          {/* Quotes Section */}
          {request.quoteCount > 0 && (
            <div className="mt-4">
              <Separator className="mb-3" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuotes(!showQuotes)}
                className="w-full justify-between hover:bg-gray-100 dark:hover:bg-gray-700"
                data-testid={`button-toggle-quotes-${request.requestId}`}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {request.quoteCount} Quote{request.quoteCount !== 1 ? 's' : ''} Received
                  </span>
                </span>
                {showQuotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showQuotes && (
                <div className="mt-3 space-y-2">
                  {quotesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Clock className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading quotes...</span>
                    </div>
                  ) : (
                    quotes
                      .filter((q: any) => q.status !== 'customer_declined' && q.status !== 'operator_withdrawn')
                      .map((quote: any) => (
                        <Card key={quote.quoteId} className="p-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          <div className="space-y-3">
                            {/* Quote Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {quote.operatorName}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {quote.tier.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Submitted {formatDistanceToNow(new Date(quote.submittedAt), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-500">
                                  ${parseFloat(quote.amount).toFixed(2)}
                                </div>
                                {quote.expiresAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Expires {formatDistanceToNow(new Date(quote.expiresAt), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quote Notes */}
                            {quote.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {quote.notes}
                              </p>
                            )}

                            {/* Actions */}
                            {quote.status === 'sent' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => acceptQuoteMutation.mutate(quote.quoteId)}
                                  disabled={acceptQuoteMutation.isPending}
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-accept-quote-${quote.quoteId}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {acceptQuoteMutation.isPending ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button
                                  onClick={() => declineQuoteMutation.mutate(quote.quoteId)}
                                  disabled={declineQuoteMutation.isPending}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  data-testid={`button-decline-quote-${quote.quoteId}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {declineQuoteMutation.isPending ? 'Declining...' : 'Decline'}
                                </Button>
                              </div>
                            )}
                            {quote.status === 'customer_accepted' && (
                              <Badge className="bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accepted
                              </Badge>
                            )}
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="max-w-4xl mx-auto p-6 pt-20">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-3 -ml-2 md:hidden" 
              data-testid="button-back-mobile"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track the status of all your service requests
            </p>
          </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full gap-1 md:gap-2">
            <TabsTrigger value="pending" data-testid="tab-pending" className="text-xs md:text-sm px-2 md:px-4">
              <Clock className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">{groupedRequests.pending.length}</span>
              <span className="hidden sm:inline ml-1">({groupedRequests.pending.length})</span>
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active" className="text-xs md:text-sm px-2 md:px-4">
              <Truck className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden sm:inline">Active</span>
              <span className="sm:hidden">{groupedRequests.active.length}</span>
              <span className="hidden sm:inline ml-1">({groupedRequests.active.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed" className="text-xs md:text-sm px-2 md:px-4">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden sm:inline">Done</span>
              <span className="sm:hidden">{groupedRequests.completed.length}</span>
              <span className="hidden sm:inline ml-1">({groupedRequests.completed.length})</span>
            </TabsTrigger>
          </TabsList>

          {(isLoading || isLoadingEmergencies) ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading requests...</span>
            </div>
          ) : (
            Object.entries(groupedRequests).map(([tab, tabRequests]) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {tabRequests.length === 0 ? (
                  <Card className="p-12 text-center bg-white dark:bg-gray-800">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {tab === 'pending' && <Clock className="w-8 h-8 text-gray-400" />}
                        {tab === 'active' && <Truck className="w-8 h-8 text-gray-400" />}
                        {tab === 'completed' && <CheckCircle className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-black dark:text-white mb-1">
                          No {tab === 'pending' ? 'Pending Requests' : tab === 'active' ? 'Active Jobs' : 'Completed Jobs'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tab === 'pending' && "Create a new service request to get started"}
                          {tab === 'active' && "Accept a quote to start tracking your jobs"}
                          {tab === 'completed' && "Completed jobs will appear here"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  tabRequests.map((request: any) => (
                    <RequestCard key={request.requestId} request={request} />
                  ))
                )}
              </TabsContent>
            ))
          )}
        </Tabs>
      </div>

      {/* Job Detail Modal */}
      <JobDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        request={selectedRequest}
      />

      {/* Quote Declined - Options Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-orange-600" />
              Find Another Operator
            </DialogTitle>
            <DialogDescription>
              The quote has been declined. Would you like to find other operators for this request?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                setShowDeclineDialog(false);
                setLocation('/customer/operator-map');
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              data-testid="button-search-operators"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Nearby Operators
            </Button>
            <Button
              onClick={() => {
                setShowDeclineDialog(false);
                setLocation('/customer/operator-map');
              }}
              variant="outline"
              className="w-full"
              data-testid="button-browse-operators"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Browse All Operators
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeclineDialog(false)}
              data-testid="button-close-dialog"
            >
              Stay on This Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      <MobileBottomNav />
    </>
  );
}
