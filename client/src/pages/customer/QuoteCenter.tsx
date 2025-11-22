import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, MapPin, Clock, CheckCircle, XCircle, AlertCircle, User, Truck, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Quote {
  id: number;
  serviceRequestId: number;
  operatorId: number;
  operatorName: string;
  operatorTier: string;
  operatorRating: number | null;
  amount: number;
  breakdown: {
    baseRate?: number;
    perKmRate?: number;
    urgencyMultiplier?: number;
    distanceCharge?: number;
    totalBeforeFees?: number;
  };
  message: string | null;
  status: "pending" | "accepted" | "declined" | "countered" | "expired";
  expiresAt: string;
  createdAt: string;
  serviceRequest: {
    id: number;
    serviceType: string;
    location: string;
    description: string;
    isEmergency: boolean;
  };
}

export default function QuoteCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const customerId = user?.id;

  // Fetch all quotes for customer
  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes/customer", customerId],
    enabled: !!customerId,
  });

  // Accept quote mutation
  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      return await apiRequest(`/api/quotes/${quoteId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action: "accept" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/customer", customerId] });
      setDetailsOpen(false);
      toast({
        title: "Quote Accepted!",
        description: "The operator will be notified and will begin work soon.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Decline quote mutation
  const declineQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      return await apiRequest(`/api/quotes/${quoteId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action: "decline" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/customer", customerId] });
      setDetailsOpen(false);
      toast({
        title: "Quote Declined",
        description: "The operator has been notified.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decline quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ quoteId, amount, message }: { quoteId: number; amount: number; message: string }) => {
      return await apiRequest(`/api/quotes/${quoteId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action: "counter", counterAmount: amount, counterMessage: message }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/customer", customerId] });
      setCounterOfferOpen(false);
      setDetailsOpen(false);
      setCounterAmount("");
      setCounterMessage("");
      toast({
        title: "Counter Offer Sent!",
        description: "The operator will be notified of your counter offer.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send counter offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setDetailsOpen(true);
  };

  const handleAcceptQuote = () => {
    if (selectedQuote) {
      acceptQuoteMutation.mutate(selectedQuote.id);
    }
  };

  const handleDeclineQuote = () => {
    if (selectedQuote) {
      declineQuoteMutation.mutate(selectedQuote.id);
    }
  };

  const handleCounterOffer = () => {
    if (selectedQuote && counterAmount) {
      const amount = parseFloat(counterAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid counter offer amount.",
          variant: "destructive",
        });
        return;
      }
      counterOfferMutation.mutate({
        quoteId: selectedQuote.id,
        amount,
        message: counterMessage,
      });
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "professional":
        return "bg-purple-600 text-white";
      case "equipped":
        return "bg-blue-600 text-white";
      case "manual":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-600 text-white">Accepted</Badge>;
      case "declined":
        return <Badge className="bg-red-600 text-white">Declined</Badge>;
      case "countered":
        return <Badge className="bg-blue-600 text-white">Countered</Badge>;
      case "expired":
        return <Badge className="bg-gray-600 text-white">Expired</Badge>;
      default:
        return null;
    }
  };

  const filterQuotesByStatus = (status: string) => {
    if (status === "pending") {
      return quotes.filter(q => q.status === "pending" && new Date(q.expiresAt) > new Date());
    }
    if (status === "responded") {
      return quotes.filter(q => q.status === "accepted" || q.status === "declined" || q.status === "countered");
    }
    if (status === "expired") {
      return quotes.filter(q => q.status === "expired" || new Date(q.expiresAt) <= new Date());
    }
    return [];
  };

  const pendingQuotes = filterQuotesByStatus("pending");
  const respondedQuotes = filterQuotesByStatus("responded");
  const expiredQuotes = filterQuotesByStatus("expired");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading quotes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Quote Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage quotes from operators for your service requests
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending-quotes">
              Pending ({pendingQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="responded" data-testid="tab-responded-quotes">
              Responded ({respondedQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="expired" data-testid="tab-expired-quotes">
              Expired ({expiredQuotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingQuotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    No Pending Quotes
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    You don't have any pending quotes at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-lg transition-shadow" data-testid={`quote-card-${quote.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{quote.operatorName}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTierBadgeColor(quote.operatorTier)}>
                                {quote.operatorTier.toUpperCase()}
                              </Badge>
                              {quote.operatorRating && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {quote.operatorRating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardDescription>
                          {quote.serviceRequest.serviceType} • {quote.serviceRequest.location}
                          {quote.serviceRequest.isEmergency && (
                            <Badge className="ml-2 bg-red-600 text-white">EMERGENCY</Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-black dark:text-white">
                          ${quote.amount}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Expires {formatDistanceToNow(new Date(quote.expiresAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleViewDetails(quote)}
                        variant="outline"
                        className="flex-1"
                        data-testid={`button-view-details-${quote.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedQuote(quote);
                          acceptQuoteMutation.mutate(quote.id);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-accept-quote-${quote.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="responded" className="space-y-4">
            {respondedQuotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    No Responded Quotes
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    You haven't responded to any quotes yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              respondedQuotes.map((quote) => (
                <Card key={quote.id} data-testid={`quote-card-${quote.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{quote.operatorName}</CardTitle>
                            <Badge className={getTierBadgeColor(quote.operatorTier)}>
                              {quote.operatorTier.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {quote.serviceRequest.serviceType} • {quote.serviceRequest.location}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                          ${quote.amount}
                        </div>
                        {getStatusBadge(quote.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleViewDetails(quote)}
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-details-${quote.id}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {expiredQuotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    No Expired Quotes
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    You don't have any expired quotes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              expiredQuotes.map((quote) => (
                <Card key={quote.id} className="opacity-60" data-testid={`quote-card-${quote.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{quote.operatorName}</CardTitle>
                        <CardDescription>
                          {quote.serviceRequest.serviceType} • {quote.serviceRequest.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-500">
                          ${quote.amount}
                        </div>
                        {getStatusBadge(quote.status)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Details Dialog */}
      {selectedQuote && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl" data-testid="quote-details-dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl">Quote Details</DialogTitle>
              <DialogDescription>
                Review the complete pricing breakdown and operator information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Operator Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black dark:text-white">{selectedQuote.operatorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTierBadgeColor(selectedQuote.operatorTier)}>
                      {selectedQuote.operatorTier.toUpperCase()}
                    </Badge>
                    {selectedQuote.operatorRating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {selectedQuote.operatorRating.toFixed(1)} rating
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Request Info */}
              <div>
                <h4 className="font-semibold text-black dark:text-white mb-3">Service Request</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{selectedQuote.serviceRequest.serviceType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{selectedQuote.serviceRequest.location}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedQuote.serviceRequest.description}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h4 className="font-semibold text-black dark:text-white mb-3">Pricing Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {selectedQuote.breakdown.baseRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Base Rate</span>
                      <span className="font-medium text-black dark:text-white">${selectedQuote.breakdown.baseRate}</span>
                    </div>
                  )}
                  {selectedQuote.breakdown.distanceCharge && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Distance Charge</span>
                      <span className="font-medium text-black dark:text-white">${selectedQuote.breakdown.distanceCharge}</span>
                    </div>
                  )}
                  {selectedQuote.breakdown.urgencyMultiplier && selectedQuote.breakdown.urgencyMultiplier > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Urgency Multiplier ({selectedQuote.breakdown.urgencyMultiplier}x)</span>
                      <span className="font-medium text-red-600">Applied</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-black dark:text-white">Total</span>
                      <span className="font-bold text-black dark:text-white">${selectedQuote.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operator Message */}
              {selectedQuote.message && (
                <div>
                  <h4 className="font-semibold text-black dark:text-white mb-2">Message from Operator</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {selectedQuote.message}
                  </p>
                </div>
              )}

              {/* Quote Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedQuote.status === "pending" ? "Expires" : "Submitted"}
                  </p>
                  <p className="text-sm font-medium text-black dark:text-white">
                    {formatDistanceToNow(new Date(selectedQuote.status === "pending" ? selectedQuote.expiresAt : selectedQuote.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            {selectedQuote.status === "pending" && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  onClick={handleDeclineQuote}
                  variant="outline"
                  disabled={declineQuoteMutation.isPending}
                  data-testid="button-decline-quote-modal"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  onClick={() => {
                    setCounterOfferOpen(true);
                    setDetailsOpen(false);
                  }}
                  variant="outline"
                  data-testid="button-counter-offer"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Counter Offer
                </Button>
                <Button
                  onClick={handleAcceptQuote}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={acceptQuoteMutation.isPending}
                  data-testid="button-accept-quote-modal"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Quote
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Counter Offer Dialog */}
      {selectedQuote && (
        <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
          <DialogContent data-testid="counter-offer-dialog">
            <DialogHeader>
              <DialogTitle>Counter Offer</DialogTitle>
              <DialogDescription>
                Propose a different price for this service
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Original Quote</p>
                <p className="text-2xl font-bold text-black dark:text-white">${selectedQuote.amount}</p>
              </div>

              <div>
                <Label htmlFor="counter-amount">Your Counter Offer ($)</Label>
                <Input
                  id="counter-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  data-testid="input-counter-amount"
                />
              </div>

              <div>
                <Label htmlFor="counter-message">Message (Optional)</Label>
                <Textarea
                  id="counter-message"
                  placeholder="Explain your counter offer..."
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  rows={3}
                  data-testid="input-counter-message"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setCounterOfferOpen(false)}
                variant="outline"
                data-testid="button-cancel-counter"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCounterOffer}
                disabled={!counterAmount || counterOfferMutation.isPending}
                data-testid="button-submit-counter"
              >
                Submit Counter Offer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <MobileBottomNav />
    </div>
  );
}
