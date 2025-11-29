import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  Send,
  XCircle,
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
  Star,
  Navigation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Quotes",
  quoted: "Quotes Submitted",
  operator_pending: "Awaiting Response",
  operator_accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  snow_plowing: "Snow Plowing",
  towing: "Towing",
  hauling: "Hauling",
  courier: "Courier",
  handyman: "Handyman",
};

export default function OperatorRequestDetails() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/operator/request/:requestId");
  const requestId = params?.requestId ?? "";
  const operatorId = user?.operatorId;
  const { toast } = useToast();

  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes] = useState("");

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const { data: request, isLoading } = useQuery<any>({
    queryKey: ["/api/service-requests/request", requestId],
    enabled: !!requestId,
  });

  const { data: existingQuote } = useQuery<any>({
    queryKey: [`/api/service-requests/${requestId}/my-quote`, operatorId],
    queryFn: async () => {
      const response = await fetch(`/api/service-requests/${requestId}/quotes`);
      if (!response.ok) return null;
      const quotes = await response.json();
      return quotes.find((q: any) => q.operatorId === operatorId);
    },
    enabled: !!requestId && !!operatorId,
  });

  useEffect(() => {
    if (operatorId && requestId) {
      apiRequest(`/api/service-requests/${requestId}/operator-viewed`, {
        method: "POST",
        body: JSON.stringify({ operatorId }),
      }).catch(() => {});
    }
  }, [operatorId, requestId]);

  useEffect(() => {
    if (!mapContainer.current || !request?.latitude || !request?.longitude) return;

    const lat = parseFloat(request.latitude);
    const lng = parseFloat(request.longitude);

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
        accessToken: import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xjdGVzdCJ9.test",
      });

      marker.current = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      map.current.setCenter([lng, lat]);
      marker.current?.setLngLat([lng, lat]);
    }

    return () => {
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [request?.latitude, request?.longitude]);

  const submitQuoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/service-requests/${requestId}/quotes`, {
        method: "POST",
        body: JSON.stringify({
          operatorId,
          amount: parseFloat(quoteAmount),
          notes: quoteNotes,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Quote Submitted",
        description: "Your quote has been sent to the customer.",
      });
      setShowQuoteDialog(false);
      setQuoteAmount("");
      setQuoteNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/request", requestId] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${requestId}/my-quote`] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Quote",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/service-requests/${requestId}/decline`, {
        method: "POST",
        body: JSON.stringify({
          operatorId,
          reason: declineReason,
          notes: declineNotes,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Declined",
        description: "The customer will be notified.",
      });
      setShowDeclineDialog(false);
      setLocation("/operator");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Decline",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNavigate = () => {
    if (!request?.latitude || !request?.longitude) return;
    const lat = parseFloat(request.latitude);
    const lng = parseFloat(request.longitude);
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${lat},${lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  };

  if (!user?.operatorId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
          <div className="max-w-3xl mx-auto p-6 pt-20">
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Not Authorized</h2>
              <p className="text-gray-600 dark:text-gray-400">You need to be logged in as an operator.</p>
            </Card>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  if (isLoading) {
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
              <p className="text-gray-600 dark:text-gray-400 mb-4">This request may have been cancelled or completed.</p>
              <Button onClick={() => setLocation("/operator")} data-testid="button-back-to-dashboard">
                Back to Dashboard
              </Button>
            </Card>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  const isEmergency = request.isEmergency === 1 || request.isEmergency === true;
  const hasSubmittedQuote = !!existingQuote;
  const canSubmitQuote = request.status === "pending" && !hasSubmittedQuote;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="max-w-3xl mx-auto p-4 md:p-6 pt-20">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => setLocation("/operator")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="space-y-4">
            <Card className="p-4 md:p-6 bg-white dark:bg-gray-800">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {SERVICE_TYPE_LABELS[request.serviceType] || request.serviceType}
                    </h1>
                    {isEmergency && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        EMERGENCY
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Request ID: {request.requestId}
                  </p>
                </div>
                <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm px-3 py-1">
                  {STATUS_LABELS[request.status] || request.status}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-gray-900 dark:text-white font-medium">{request.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-gray-900 dark:text-white">{request.location}</p>
                    {request.latitude && request.longitude && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-orange-600 hover:text-orange-700"
                        onClick={handleNavigate}
                        data-testid="button-get-directions"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Get Directions
                      </Button>
                    )}
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Customer's Budget</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{request.budgetRange}</p>
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
              </div>
            </Card>

            {request.latitude && request.longitude && (
              <Card className="overflow-hidden">
                <div
                  ref={mapContainer}
                  className="h-48 w-full"
                  data-testid="request-location-map"
                />
              </Card>
            )}

            {hasSubmittedQuote && (
              <Card className="p-4 md:p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-200">Quote Submitted</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 my-1">
                      ${parseFloat(existingQuote.amount).toFixed(2)}
                    </p>
                    {existingQuote.notes && (
                      <p className="text-sm text-green-700 dark:text-green-300">"{existingQuote.notes}"</p>
                    )}
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Submitted {formatDistanceToNow(new Date(existingQuote.submittedAt), { addSuffix: true })}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Status: {existingQuote.status?.replace(/_/g, " ") || "pending"}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {canSubmitQuote && (
              <Card className="p-4 md:p-6 bg-white dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Submit Your Quote</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setShowQuoteDialog(true)}
                    data-testid="button-submit-quote"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Quote
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setShowDeclineDialog(true)}
                    data-testid="button-decline-request"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </Card>
            )}

            {isEmergency && (
              <Card className="p-4 md:p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">Emergency Request</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      This customer needs urgent assistance. Please respond quickly if you're available.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav />

      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              Submit Quote
            </DialogTitle>
            <DialogDescription>
              Provide your price for this {SERVICE_TYPE_LABELS[request.serviceType] || request.serviceType} job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quote-amount">Your Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="quote-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="pl-9"
                  data-testid="input-quote-amount"
                />
              </div>
              {request.budgetRange && (
                <p className="text-xs text-gray-500">
                  Customer's budget: {request.budgetRange}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-notes">Notes (Optional)</Label>
              <Textarea
                id="quote-notes"
                placeholder="Include any additional information about your quote..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
                data-testid="input-quote-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuoteDialog(false)}
              data-testid="button-cancel-quote"
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitQuoteMutation.mutate()}
              disabled={!quoteAmount || parseFloat(quoteAmount) <= 0 || submitQuoteMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              data-testid="button-confirm-quote"
            >
              {submitQuoteMutation.isPending ? "Submitting..." : "Submit Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Decline This Request?
            </DialogTitle>
            <DialogDescription>
              Let the customer know why you can't take this job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Reason</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger data-testid="select-decline-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too_far">Too far from my location</SelectItem>
                  <SelectItem value="unavailable">Not available at requested time</SelectItem>
                  <SelectItem value="equipment">Don't have required equipment</SelectItem>
                  <SelectItem value="busy">Currently busy with other jobs</SelectItem>
                  <SelectItem value="other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decline-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="decline-notes"
                placeholder="Any additional details..."
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                rows={2}
                data-testid="input-decline-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
              data-testid="button-cancel-decline"
            >
              Go Back
            </Button>
            <Button
              onClick={() => declineMutation.mutate()}
              disabled={!declineReason || declineMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-decline"
            >
              {declineMutation.isPending ? "Declining..." : "Decline Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
