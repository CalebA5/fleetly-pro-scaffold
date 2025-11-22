import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface DeclineReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  operatorId: string;
  operatorName: string;
  tier: string;
}

const DECLINE_REASONS = [
  {
    value: "distance",
    label: "Too Far Away",
    description: "The job location is outside my service area"
  },
  {
    value: "budget",
    label: "Budget Too Low",
    description: "The customer's budget doesn't match my rates"
  },
  {
    value: "nature_of_job",
    label: "Nature of Job",
    description: "The job requirements don't match my capabilities"
  },
  {
    value: "other",
    label: "Other Reason",
    description: "Another reason not listed above"
  }
] as const;

export function DeclineReasonModal({
  open,
  onOpenChange,
  request,
  operatorId,
  operatorName,
  tier
}: DeclineReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("distance");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const declineMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/service-requests/${request.requestId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operatorId,
          operatorName,
          tier,
          declineReason: selectedReason,
          declineNotes: notes || null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to decline job");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Declined",
        description: "The customer will be notified and alternative operators will be contacted.",
      });
      
      // Invalidate ALL relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests', 'for-operator', operatorId] });
      queryClient.invalidateQueries({ queryKey: ['/api/accepted-jobs', { operatorId, tier }] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/active-jobs`] });
      
      onOpenChange(false);
      setSelectedReason("distance");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline job. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    declineMutation.mutate();
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Decline Job Request
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Please select a reason for declining this job. This helps us match customers with the right operators.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Decline Reason Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">
              Reason for Declining
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-3"
            >
              {DECLINE_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={reason.value}
                    id={reason.value}
                    className="mt-1"
                    data-testid={`radio-${reason.value}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={reason.value}
                      className="font-medium text-gray-900 dark:text-white cursor-pointer"
                    >
                      {reason.label}
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="decline-notes" className="text-sm font-medium text-gray-900 dark:text-white">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="decline-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context you'd like to provide..."
              className="min-h-[100px] resize-none"
              data-testid="textarea-decline-notes"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              These notes will be shared with the customer
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={declineMutation.isPending}
              data-testid="button-cancel-decline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={declineMutation.isPending}
              data-testid="button-confirm-decline"
            >
              {declineMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                "Confirm Decline"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
