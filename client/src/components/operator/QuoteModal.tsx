import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Calculator, AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: any;
  operatorId: string;
  operatorName: string;
  tier: string;
}

export function QuoteModal({ 
  open, 
  onOpenChange, 
  serviceRequest, 
  operatorId, 
  operatorName,
  tier 
}: QuoteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [breakdown, setBreakdown] = useState<any>(null);

  // Fetch operator's pricing config for this tier and service type
  const { data: pricingConfigs } = useQuery({
    queryKey: [`/api/operators/${operatorId}/pricing-config`, { tier }],
    enabled: open,
  });

  // Calculate auto-quote when modal opens or pricing changes
  useEffect(() => {
    if (open && serviceRequest && pricingConfigs) {
      calculateAutoQuote();
    }
  }, [open, serviceRequest, pricingConfigs]);

  const calculateAutoQuote = () => {
    // Find pricing config for this service type
    const config = pricingConfigs?.find(
      (c: any) => c.tier === tier && c.serviceType === serviceRequest.serviceType
    );

    if (!config) {
      // No pricing config - use customer's budget midpoint as default
      const budgetRange = serviceRequest.budgetRange || "$0-$0";
      const match = budgetRange.match(/\$(\d+)-\$?(\d+)/);
      if (match) {
        const midpoint = (parseInt(match[1]) + parseInt(match[2])) / 2;
        setQuoteAmount(midpoint);
        setBreakdown({
          method: "customer_budget",
          budgetRange,
          estimatedAmount: midpoint
        });
      }
      return;
    }

    // Parse pricing config
    const baseRate = parseFloat(config.baseRate) || 0;
    const perKmRate = parseFloat(config.perKmRate) || 0;
    const minimumFee = parseFloat(config.minimumFee) || 0;
    const urgencyMultipliers = config.urgencyMultipliers || { emergency: 1.5, scheduled: 1.0 };

    // Estimate distance (rough calculation based on service type)
    let estimatedDistance = 0;
    const details = serviceRequest.details || {};
    
    if (serviceRequest.serviceType === "Snow Plowing") {
      // Estimate based on area size
      const areaSize = details.areaSize || "small";
      estimatedDistance = areaSize === "large" ? 5 : areaSize === "medium" ? 3 : 1;
    } else if (serviceRequest.serviceType === "Towing") {
      // Estimate based on destination
      estimatedDistance = 10; // Default 10km
    } else if (serviceRequest.serviceType === "Hauling") {
      // Estimate based on load size
      const loadSize = details.loadSize || "small";
      estimatedDistance = loadSize === "large" ? 8 : loadSize === "medium" ? 5 : 2;
    } else {
      estimatedDistance = 5; // Default 5km
    }

    // Calculate distance cost
    const distanceCost = estimatedDistance * perKmRate;

    // Calculate urgency multiplier
    const isEmergency = serviceRequest.isEmergency || serviceRequest.urgencyLevel === "emergency";
    const urgencyMultiplier = isEmergency ? urgencyMultipliers.emergency || 1.5 : urgencyMultipliers.scheduled || 1.0;

    // Calculate total
    let total = (baseRate + distanceCost) * urgencyMultiplier;
    
    // Apply minimum fee
    if (total < minimumFee) {
      total = minimumFee;
    }

    // Round to 2 decimals
    total = Math.round(total * 100) / 100;

    setQuoteAmount(total);
    setBreakdown({
      baseRate,
      estimatedDistance,
      distanceCost,
      urgencyMultiplier,
      minimumFee,
      total,
      method: "pricing_config"
    });
  };

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/service-requests/${serviceRequest.requestId}/quotes`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Quote Sent!",
        description: "Your quote has been sent to the customer for review."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/quotes`] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Quote",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitQuote = () => {
    if (quoteAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Quote amount must be greater than $0",
        variant: "destructive"
      });
      return;
    }

    createQuoteMutation.mutate({
      operatorId,
      operatorName,
      tier,
      amount: quoteAmount.toString(),
      breakdown,
      notes,
      autoCalcSnapshot: breakdown
    });
  };

  // Parse customer's budget range for comparison
  const customerBudget = serviceRequest?.budgetRange || "$0-$0";
  const budgetMatch = customerBudget.match(/\$(\d+)-\$?(\d+)/);
  const budgetMin = budgetMatch ? parseInt(budgetMatch[1]) : 0;
  const budgetMax = budgetMatch ? parseInt(budgetMatch[2]) : 0;
  const budgetMid = (budgetMin + budgetMax) / 2;

  const isAboveBudget = quoteAmount > budgetMax;
  const isBelowBudget = quoteAmount < budgetMin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Quote this Job
          </DialogTitle>
          <DialogDescription>
            Send a competitive quote to the customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Budget Reference */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Customer's Budget</p>
            <p className="text-2xl font-bold">{customerBudget}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Midpoint: ${budgetMid.toFixed(2)}
            </p>
          </div>

          {/* Auto-calculated breakdown */}
          {breakdown && breakdown.method === "pricing_config" && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg space-y-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Auto-Calculation</p>
              <div className="flex justify-between text-blue-700 dark:text-blue-300">
                <span>Base Rate:</span>
                <span>${breakdown.baseRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-700 dark:text-blue-300">
                <span>Distance ({breakdown.estimatedDistance}km):</span>
                <span>${breakdown.distanceCost.toFixed(2)}</span>
              </div>
              {breakdown.urgencyMultiplier !== 1 && (
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                  <span>Urgency Multiplier:</span>
                  <span>{breakdown.urgencyMultiplier}x</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-100 pt-1 border-t border-blue-200 dark:border-blue-800">
                <span>Suggested Total:</span>
                <span>${breakdown.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Editable Quote Amount */}
          <div>
            <Label htmlFor="quote-amount">Your Quote Amount</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="quote-amount"
                type="number"
                step="0.01"
                min="0"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(parseFloat(e.target.value) || 0)}
                className="pl-9"
                data-testid="input-quote-amount"
              />
            </div>
          </div>

          {/* Budget comparison warning */}
          {isAboveBudget && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Your quote is ${(quoteAmount - budgetMax).toFixed(2)} above the customer's max budget. 
                They may decline this quote.
              </AlertDescription>
            </Alert>
          )}

          {isBelowBudget && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Great! Your quote is competitive and within the customer's budget.
              </AlertDescription>
            </Alert>
          )}

          {/* Optional notes */}
          <div>
            <Label htmlFor="quote-notes">Notes to Customer (Optional)</Label>
            <Textarea
              id="quote-notes"
              placeholder="Explain your pricing, availability, or any special considerations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
              data-testid="input-quote-notes"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-quote"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuote}
              disabled={createQuoteMutation.isPending || quoteAmount <= 0}
              className="flex-1"
              data-testid="button-submit-quote"
            >
              {createQuoteMutation.isPending ? "Sending..." : "Send Quote"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
