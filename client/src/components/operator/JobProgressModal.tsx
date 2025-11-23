import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MapPin, User, DollarSign, Loader2 } from "lucide-react";
import type { AcceptedJob } from "@shared/schema";

interface JobProgressModalProps {
  job: AcceptedJob | null;
  operatorId: string;
  onClose: () => void;
}

export function JobProgressModal({ job, operatorId, onClose }: JobProgressModalProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(job?.progress || 0);

  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      return apiRequest(`/api/accepted-jobs/${job?.acceptedJobId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ progress: newProgress, operatorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accepted-jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-jobs'] });
      // Also invalidate customer-specific query
      const jobData = job?.jobData as any;
      if (jobData?.customerId) {
        queryClient.invalidateQueries({ queryKey: ['/api/customer-jobs', jobData.customerId] });
      }
      toast({
        title: "Progress Updated",
        description: `Job progress set to ${progress}%`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  });

  const completeJobMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/accepted-jobs/${job?.acceptedJobId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ operatorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accepted-jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/operators'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-jobs'] });
      // Also invalidate customer-specific query
      const jobData = job?.jobData as any;
      if (jobData?.customerId) {
        queryClient.invalidateQueries({ queryKey: ['/api/customer-jobs', jobData.customerId] });
      }
      toast({
        title: "Job Completed!",
        description: "Great work! Job marked as completed."
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive"
      });
    }
  });

  if (!job) return null;

  const jobData = job.jobData as any;
  const customerName = jobData?.customerName || "Customer";
  const serviceType = jobData?.serviceType || "Service";
  const location = jobData?.location || "Unknown location";
  const earnings = job.actualEarnings ? parseFloat(job.actualEarnings) : 0;

  const handleUpdateProgress = () => {
    updateProgressMutation.mutate(progress);
  };

  const handleCompleteJob = () => {
    completeJobMutation.mutate();
  };

  return (
    <Dialog open={!!job} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg" data-testid="dialog-job-progress">
        <DialogHeader>
          <DialogTitle className="text-xl">Job in Progress</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Customer Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold" data-testid="text-customer-name">{customerName}</p>
            </div>
          </div>

          {/* Service Type & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Service</p>
              <p className="font-medium" data-testid="text-service-type">{serviceType}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Earnings</p>
              <p className="font-medium" data-testid="text-earnings">${earnings.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm" data-testid="text-location">{location}</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Job Progress</p>
                <p className="text-2xl font-bold text-orange-500" data-testid="text-progress-percentage">{progress}%</p>
              </div>
              <Progress value={progress} className="h-3" data-testid="progress-bar" />
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Update Progress</p>
              <Slider
                value={[progress]}
                onValueChange={(value) => setProgress(value[0])}
                max={100}
                step={5}
                className="w-full"
                data-testid="slider-progress"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpdateProgress}
                disabled={updateProgressMutation.isPending || progress === job.progress}
                className="flex-1"
                data-testid="button-update-progress"
              >
                {updateProgressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Progress"
                )}
              </Button>

              {progress >= 100 && (
                <Button
                  onClick={handleCompleteJob}
                  disabled={completeJobMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-complete-job"
                >
                  {completeJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Job
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
