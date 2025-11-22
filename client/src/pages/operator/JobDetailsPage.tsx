import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Play,
  XCircle,
  CheckCircle2,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Phone,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { AcceptedJob } from "@shared/schema";

export default function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const operatorId = user?.operatorId;
  
  const [progress, setProgress] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // Fetch job details with operatorId for authorization
  const { data: job, isLoading } = useQuery<AcceptedJob>({
    queryKey: ["/api/accepted-jobs", jobId, operatorId],
    queryFn: async () => {
      if (!operatorId) throw new Error("Not authenticated");
      const response = await fetch(`/api/accepted-jobs/${jobId}?operatorId=${operatorId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch job");
      }
      return response.json();
    },
    enabled: !!jobId && !!operatorId,
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/accepted-jobs/${jobId}/start`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs", jobId] });
      toast({
        title: "Job Started",
        description: "You can now track your progress on this job.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Starting Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      return await apiRequest(`/api/accepted-jobs/${jobId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ progress: newProgress, operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs", jobId] });
      toast({
        title: "Progress Updated",
        description: `Job progress: ${progress}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/accepted-jobs/${jobId}/complete`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"] });
      toast({
        title: "Job Completed! 🎉",
        description: "Great work! The job has been marked as completed.",
      });
      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/operator/manual");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Completing Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/accepted-jobs/${jobId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancellationReason, operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"] });
      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled and removed from your queue.",
      });
      setShowCancelDialog(false);
      setLocation("/operator/manual");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Cancelling Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateProgress = () => {
    updateProgressMutation.mutate(progress);
  };

  const handleCompleteJob = () => {
    if (progress < 100) {
      toast({
        title: "Cannot Complete Job",
        description: "Progress must be 100% before completing the job.",
        variant: "destructive",
      });
      return;
    }
    completeJobMutation.mutate();
  };

  const handleCancelJob = () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }
    cancelJobMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This job doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/operator/manual")} data-testid="button-back-to-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const jobData = job.jobData as any;
  const isAccepted = job.status === "accepted";
  const isInProgress = job.status === "in_progress";
  const isCompleted = job.status === "completed";
  const isCancelled = job.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/operator/manual")}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Job #{job.acceptedJobId.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {jobData.serviceType || jobData.service || "Service Request"}
              </p>
            </div>
            <Badge
              className={
                isCompleted
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : isCancelled
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : isInProgress
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }
              data-testid={`badge-status-${job.status}`}
            >
              {job.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Emergency Alert */}
        {jobData.isEmergency && (
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>EMERGENCY SERVICE</strong> - This request requires immediate attention!
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Card */}
        {!isCompleted && !isCancelled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Job Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {job.progress}% Complete
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isAccepted ? "Not started" : "In progress"}
                  </span>
                </div>
                <Progress value={job.progress} className="h-3" />
              </div>

              {isInProgress && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Update Progress: {progress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      data-testid="input-progress-slider"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateProgress}
                    disabled={updateProgressMutation.isPending || progress === job.progress}
                    className="w-full"
                    data-testid="button-update-progress"
                  >
                    Save Progress ({progress}%)
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {isAccepted && (
                  <Button
                    onClick={() => startJobMutation.mutate()}
                    disabled={startJobMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-start-job"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Job
                  </Button>
                )}

                {isInProgress && (
                  <Button
                    onClick={handleCompleteJob}
                    disabled={completeJobMutation.isPending || job.progress < 100}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-complete-job"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Job
                  </Button>
                )}

                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelJobMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  data-testid="button-cancel-job"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-gray-900 dark:text-white" data-testid="text-customer-name">
                  {jobData.customerName || jobData.name || "Customer"}
                </p>
              </div>
            </div>
            {jobData.customerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <a
                    href={`tel:${jobData.customerPhone}`}
                    className="font-medium text-orange-600 dark:text-orange-400 hover:underline"
                    data-testid="link-customer-phone"
                  >
                    {jobData.customerPhone}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Service Type</p>
              <p className="font-medium text-gray-900 dark:text-white" data-testid="text-service-type">
                {jobData.serviceType || jobData.service || "N/A"}
              </p>
            </div>

            {jobData.location && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </p>
                <p className="font-medium text-gray-900 dark:text-white" data-testid="text-location">
                  {jobData.location}
                </p>
              </div>
            )}

            {jobData.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white" data-testid="text-description">
                  {jobData.description}
                </p>
              </div>
            )}

            {jobData.estimatedPrice && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Estimated Price
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-price">
                  ${jobData.estimatedPrice}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Tier</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize" data-testid="text-tier">
                  {job.tier}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Accepted</p>
                <p className="font-medium text-gray-900 dark:text-white" data-testid="text-accepted-time">
                  {new Date(job.acceptedAt).toLocaleString()}
                </p>
              </div>
              {job.startedAt && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Started</p>
                  <p className="font-medium text-gray-900 dark:text-white" data-testid="text-started-time">
                    {new Date(job.startedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="font-medium text-gray-900 dark:text-white" data-testid="text-completed-time">
                    {new Date(job.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this job? Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for cancellation (e.g., customer not available, equipment issues, etc.)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-cancellation-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              data-testid="button-cancel-dialog-close"
            >
              Keep Job
            </Button>
            <Button
              onClick={handleCancelJob}
              disabled={cancelJobMutation.isPending || !cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-cancel"
            >
              {cancelJobMutation.isPending ? "Cancelling..." : "Cancel Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
