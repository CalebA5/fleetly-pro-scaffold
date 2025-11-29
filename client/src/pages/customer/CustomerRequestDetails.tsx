import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  DollarSign,
  User,
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Timer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  Star,
  Truck,
  FileText,
  Info
} from "lucide-react";
import { formatDistanceToNow, format, differenceInMinutes } from "date-fns";
import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  quoted: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  operator_pending: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  operator_accepted: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  operator_declined: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  in_progress: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  completed: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
  searching: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  assigned: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  cancelled: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for Quotes",
  quoted: "Quotes Received",
  operator_pending: "Waiting for Response",
  operator_accepted: "Operator Accepted",
  operator_declined: "Declined by Operator",
  in_progress: "Job in Progress",
  completed: "Completed",
  searching: "Finding Operators",
  assigned: "Operator Assigned",
  cancelled: "Cancelled"
};

export default function CustomerRequestDetails() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/customer/request/:requestId");
  const requestId = params?.requestId ?? "";
  const { toast } = useToast();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPreferredDate, setEditPreferredDate] = useState("");
  const [editPreferredTime, setEditPreferredTime] = useState("");
  const [showQuotes, setShowQuotes] = useState(false);
  const [freeWindowRemaining, setFreeWindowRemaining] = useState<number | null>(null);

  const { data: request, isLoading: requestLoading } = useQuery<any>({
    queryKey: ['/api/service-requests', requestId],
    enabled: !!requestId,
  });

  const { data: cancelPreview } = useQuery<{
    canCancel: boolean;
    isFreeWindow: boolean;
    freeWindowMinutesRemaining: number;
    cancellationFeeCents: number;
    feeMessage: string;
    warnings: string[];
  }>({
    queryKey: [`/api/service-requests/${requestId}/cancel-preview`],
    enabled: !!requestId && !!user,
    refetchInterval: 30000,
  });

  const { data: editRestrictions } = useQuery<{
    canEdit: boolean;
    isFreeWindow: boolean;
    freeWindowMinutesRemaining: number;
    editFeeCents: number;
    editCount: number;
    hasOperatorAssigned: boolean;
    status: string;
    feeMessage: string;
  }>({
    queryKey: [`/api/service-requests/${requestId}/edit-restrictions`],
    enabled: !!requestId && !!user,
    refetchInterval: 30000,
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<any[]>({
    queryKey: [`/api/service-requests/${requestId}/quotes`],
    enabled: !!requestId && request?.quoteCount > 0,
  });

  const { data: statusEvents = [] } = useQuery<any[]>({
    queryKey: [`/api/service-requests/${requestId}/status-events`],
    enabled: !!requestId,
  });

  useEffect(() => {
    if (cancelPreview?.freeWindowMinutesRemaining && cancelPreview.freeWindowMinutesRemaining > 0) {
      const interval = setInterval(() => {
        setFreeWindowRemaining(prev => {
          const newVal = (prev ?? cancelPreview.freeWindowMinutesRemaining) - (1/60);
          return newVal > 0 ? newVal : 0;
        });
      }, 1000);
      setFreeWindowRemaining(cancelPreview.freeWindowMinutesRemaining);
      return () => clearInterval(interval);
    }
  }, [cancelPreview?.freeWindowMinutesRemaining]);

  useEffect(() => {
    if (request) {
      setEditDescription(request.description || "");
      setEditPreferredDate(request.preferredDate || "");
      setEditPreferredTime(request.preferredTime || "");
    }
  }, [request]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/service-requests/${requestId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Request Cancelled",
        description: data.message,
      });
      setShowCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests?customerId=${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Cancel",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/service-requests/${requestId}/edit`, {
        method: "PATCH",
        body: JSON.stringify({
          description: editDescription,
          preferredDate: editPreferredDate,
          preferredTime: editPreferredTime,
        }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Request Updated",
        description: data.feeMessage,
      });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests?customerId=${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return apiRequest(`/api/quotes/${quoteId}/accept`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Quote Accepted!",
        description: "The operator has been notified and will start your job soon.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${requestId}/quotes`] });
    },
    onError: () => {
      toast({
        title: "Failed to Accept Quote",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return apiRequest(`/api/quotes/${quoteId}/decline`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Quote Declined",
        description: "The operator has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${requestId}/quotes`] });
    },
    onError: () => {
      toast({
        title: "Failed to Decline Quote",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return "Expired";
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view this request.</p>
        </Card>
      </div>
    );
  }

  if (requestLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
          <div className="max-w-3xl mx-auto p-6 pt-20">
            <div className="flex items-center justify-center py-12">
              <Clock className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading request...</span>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
          <div className="max-w-3xl mx-auto p-6 pt-20">
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Request Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">This request may have been deleted or you don't have access.</p>
              <Button onClick={() => setLocation("/customer/request-status")} data-testid="button-back-to-requests">
                Back to My Requests
              </Button>
            </Card>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  const isAssigned = request.status === "assigned" || request.status === "in_progress";
  const isCompleted = request.status === "completed";
  const isCancelled = request.status === "cancelled";
  const canModify = !isCompleted && !isCancelled && request.status !== "in_progress";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="max-w-3xl mx-auto p-4 md:p-6 pt-20">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 -ml-2" 
            onClick={() => setLocation("/customer/request-status")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>

          <div className="space-y-4">
            <Card className="p-4 md:p-6 bg-white dark:bg-gray-800">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {request.serviceType}
                    </h1>
                    {request.isEmergency && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        EMERGENCY
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Request ID: {request.requestId}
                  </p>
                </div>
                <Badge className={`${STATUS_COLORS[request.status] || STATUS_COLORS.pending} text-sm px-3 py-1`}>
                  {STATUS_LABELS[request.status] || request.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>

              <Separator className="my-4" />

              {cancelPreview?.isFreeWindow && freeWindowRemaining !== null && freeWindowRemaining > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Free Cancellation Window</p>
                      <p className="text-xs text-green-600 dark:text-green-300">Cancel or edit for free</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                    {formatTimeRemaining(freeWindowRemaining)}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-gray-900 dark:text-white">{request.location}</p>
                  </div>
                </div>

                {request.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-white">{request.description}</p>
                    </div>
                  </div>
                )}

                {request.preferredDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Preferred Date & Time</p>
                      <p className="text-gray-900 dark:text-white">
                        {request.preferredDate} {request.preferredTime && `at ${request.preferredTime}`}
                      </p>
                    </div>
                  </div>
                )}

                {request.budgetRange && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Budget Range</p>
                      <p className="text-gray-900 dark:text-white">{request.budgetRange}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Requested</p>
                    <p className="text-gray-900 dark:text-white">
                      {format(new Date(request.requestedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })})
                    </p>
                  </div>
                </div>

                {request.assignedOperatorId && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Operator</p>
                      <p className="text-gray-900 dark:text-white">{request.operatorName || "Assigned"}</p>
                    </div>
                  </div>
                )}
              </div>

              {canModify && (
                <>
                  <Separator className="my-4" />
                  <div className="flex flex-wrap gap-2">
                    {editRestrictions?.canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                        data-testid="button-edit-request"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Request
                        {!editRestrictions.isFreeWindow && editRestrictions.editFeeCents > 0 && (
                          <span className="ml-1 text-xs text-orange-600">
                            (${(editRestrictions.editFeeCents / 100).toFixed(2)} fee)
                          </span>
                        )}
                      </Button>
                    )}
                    {cancelPreview?.canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setShowCancelDialog(true)}
                        data-testid="button-cancel-request"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel Request
                        {!cancelPreview.isFreeWindow && cancelPreview.cancellationFeeCents > 0 && (
                          <span className="ml-1 text-xs">
                            (${(cancelPreview.cancellationFeeCents / 100).toFixed(2)} fee)
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {isAssigned && (
                <>
                  <Separator className="my-4" />
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setLocation(`/customer/job-tracking?requestId=${request.requestId}`)}
                    data-testid="button-track-job"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Track Job Progress
                  </Button>
                </>
              )}
            </Card>

            {request.quoteCount > 0 && (
              <Card className="bg-white dark:bg-gray-800 overflow-hidden">
                <button
                  className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowQuotes(!showQuotes)}
                  data-testid="button-toggle-quotes"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {request.quoteCount} Quote{request.quoteCount !== 1 ? 's' : ''} Received
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {showQuotes ? 'Click to hide' : 'Click to view and respond'}
                      </p>
                    </div>
                  </div>
                  {showQuotes ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showQuotes && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {quotesLoading ? (
                      <div className="p-6 flex items-center justify-center">
                        <Clock className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                        <span className="text-gray-500">Loading quotes...</span>
                      </div>
                    ) : quotes.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No quotes available
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {quotes.filter((q: any) => q.status !== 'customer_declined').map((quote: any) => (
                          <div key={quote.quoteId} className="p-4 md:p-6 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {quote.operatorName}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {quote.tier?.toUpperCase()}
                                  </Badge>
                                  {quote.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-xs text-gray-500">{quote.rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Submitted {formatDistanceToNow(new Date(quote.submittedAt), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-500">
                                  ${parseFloat(quote.amount).toFixed(2)}
                                </div>
                                {quote.expiresAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Expires {formatDistanceToNow(new Date(quote.expiresAt), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {quote.notes && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  "{quote.notes}"
                                </p>
                              </div>
                            )}

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
                                  {acceptQuoteMutation.isPending ? 'Accepting...' : 'Accept Quote'}
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {isCancelled && (
              <Card className="p-4 md:p-6 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Request Cancelled</h3>
                    {request.cancellationReason && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Reason: {request.cancellationReason}
                      </p>
                    )}
                    {request.cancellationFeeCents > 0 && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        Cancellation fee: ${(request.cancellationFeeCents / 100).toFixed(2)}
                      </p>
                    )}
                    {request.cancelledAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Cancelled {formatDistanceToNow(new Date(request.cancelledAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav />

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel This Request?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {cancelPreview?.isFreeWindow ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                      Free cancellation - no fee will be charged
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                      {cancelPreview?.feeMessage}
                    </p>
                    {cancelPreview?.warnings?.map((warning, i) => (
                      <p key={i} className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
                  <Textarea
                    id="cancel-reason"
                    placeholder="Tell us why you're cancelling..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    data-testid="input-cancel-reason"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-close">Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-500" />
              Edit Request Details
            </DialogTitle>
            <DialogDescription>
              Make changes to your service request.
              {!editRestrictions?.isFreeWindow && editRestrictions?.editFeeCents && editRestrictions.editFeeCents > 0 && (
                <span className="block text-orange-600 dark:text-orange-400 mt-1">
                  A ${(editRestrictions.editFeeCents / 100).toFixed(2)} edit fee will apply.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Preferred Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editPreferredDate}
                  onChange={(e) => setEditPreferredDate(e.target.value)}
                  data-testid="input-edit-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Preferred Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editPreferredTime}
                  onChange={(e) => setEditPreferredTime(e.target.value)}
                  data-testid="input-edit-time"
                />
              </div>
            </div>
            {editRestrictions?.editCount && editRestrictions.editCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" />
                <span>This request has been edited {editRestrictions.editCount} time{editRestrictions.editCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              data-testid="button-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              data-testid="button-save-edit"
            >
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
