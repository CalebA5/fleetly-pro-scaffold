import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
  Camera,
  Eye,
  Navigation,
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
        body: JSON.stringify({ operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      // Fix: Invalidate all accepted jobs queries to update dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"], exact: false });
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
      // Fix: Invalidate all accepted jobs queries and earnings to update dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/earnings/today/${operatorId}`], exact: false });
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
        body: JSON.stringify({ operatorId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      // FIXED: Invalidate ALL queries - accepted jobs, earnings, AND service requests
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/earnings/today/${operatorId}`], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/earnings/month/${operatorId}`], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`], exact: false });
      toast({
        title: "Job Completed! 🎉",
        description: "Great work! The job has been marked as completed.",
      });
      // Navigate back to dashboard after showing toast
      setTimeout(() => {
        setLocation(dashboardPath);
      }, 1500);
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
      // FIXED: Invalidate ALL queries - accepted jobs AND service requests
      queryClient.invalidateQueries({ queryKey: ["/api/accepted-jobs"], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/for-operator/${operatorId}`], exact: false });
      queryClient.invalidateQueries({ queryKey: [`/api/earnings/today/${operatorId}`], exact: false });
      
      // UX FIX: Close dialog first, then navigate to prevent stuck overlay
      setShowCancelDialog(false);
      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled and removed from your queue.",
      });
      
      // Navigate back to dashboard after dialog closes
      setTimeout(() => {
        setLocation(dashboardPath);
      }, 100);
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
          <Button onClick={() => setLocation("/manual-operator")} data-testid="button-back-to-dashboard">
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
  
  // Determine dashboard path based on tier
  const getDashboardPath = (tier: string) => {
    const tierMap: Record<string, string> = {
      'manual': '/manual-operator',
      'equipped': '/equipped-operator',
      'professional': '/operator'
    };
    return tierMap[tier.toLowerCase()] || '/manual-operator';
  };
  
  const dashboardPath = getDashboardPath(job.tier);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header with Gradient */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(dashboardPath)}
            className="mb-3 text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {jobData.serviceType || jobData.service || "Service Request"}
                  </h1>
                  <p className="text-orange-100 text-sm">
                    Job #{job.acceptedJobId.slice(0, 12)}
                  </p>
                </div>
              </div>
              {jobData.isEmergency && (
                <Badge className="bg-red-600 text-white border-0">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  EMERGENCY
                </Badge>
              )}
            </div>
            <Badge
              className={`text-sm px-4 py-2 ${
                isCompleted
                  ? "bg-green-500 text-white border-0"
                  : isCancelled
                  ? "bg-gray-700 text-white border-0"
                  : isInProgress
                  ? "bg-blue-500 text-white border-0"
                  : "bg-white/20 text-white border-white/30"
              }`}
              data-testid={`badge-status-${job.status}`}
            >
              {isInProgress ? `${job.progress}% COMPLETE` : job.status.toUpperCase().replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Emergency Alert */}
        {jobData.isEmergency && (
          <Alert className="border-l-4 border-l-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-md">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium ml-2">
              <strong>EMERGENCY SERVICE</strong> - This request requires immediate attention!
            </AlertDescription>
          </Alert>
        )}

        {/* Timeline Tracker */}
        {!isCancelled && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Job Timeline
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>
                
                {/* Timeline Steps */}
                <div className="space-y-6 relative">
                  {/* Accepted */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isAccepted || isInProgress || isCompleted ? 'bg-blue-500 border-blue-500' : 'bg-gray-200 border-gray-300'} z-10`}>
                      <CheckCircle2 className={`w-5 h-5 ${isAccepted || isInProgress || isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Job Accepted</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(job.acceptedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* In Progress */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isInProgress || isCompleted ? 'bg-purple-500 border-purple-500' : 'bg-gray-200 border-gray-300'} z-10`}>
                      <Play className={`w-5 h-5 ${isInProgress || isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Job Started</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started yet'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Completed */}
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'} z-10`}>
                      <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Job Completed</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        {!isCompleted && !isCancelled && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Job Progress
              </h3>
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Progress Bar with Percentage */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {job.progress}% Complete
                  </span>
                  <Badge
                    variant={isInProgress ? "default" : "secondary"}
                    className={isInProgress ? "bg-blue-600 text-white" : ""}
                  >
                    {isAccepted ? "READY TO START" : "IN PROGRESS"}
                  </Badge>
                </div>
                <div className="relative">
                  <Progress value={job.progress} className="h-4 bg-gray-200 dark:bg-gray-700" />
                  {job.progress > 10 && (
                    <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {job.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isInProgress && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        Update Progress
                      </span>
                      <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                      data-testid="input-progress-slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateProgress}
                    disabled={updateProgressMutation.isPending || progress === job.progress}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    data-testid="button-update-progress"
                  >
                    {updateProgressMutation.isPending ? "Saving..." : `Save Progress (${progress}%)`}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                {isAccepted && (
                  <Button
                    onClick={() => startJobMutation.mutate()}
                    disabled={startJobMutation.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 shadow-lg"
                    data-testid="button-start-job"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {startJobMutation.isPending ? "Starting..." : "Start Job"}
                  </Button>
                )}

                {isInProgress && (
                  <Button
                    onClick={handleCompleteJob}
                    disabled={completeJobMutation.isPending || job.progress < 100}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 shadow-lg disabled:opacity-50"
                    data-testid="button-complete-job"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {job.progress < 100 ? `Complete at 100% (Currently ${job.progress}%)` : completeJobMutation.isPending ? "Completing..." : "Complete Job"}
                  </Button>
                )}

                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelJobMutation.isPending}
                  variant="outline"
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold py-6"
                  data-testid="button-cancel-job"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Cancel Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Customer Information
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Customer Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg" data-testid="text-customer-name">
                      {jobData.customerName || jobData.name || "Customer"}
                    </p>
                  </div>
                </div>
              </div>
              
              {jobData.customerPhone && (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="font-semibold text-gray-900 dark:text-white" data-testid="link-customer-phone">
                        {jobData.customerPhone}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${jobData.customerPhone}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Service Details
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Type */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Service Type
                </p>
                <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-service-type">
                  {jobData.serviceType || jobData.service || "N/A"}
                </p>
              </div>

              {/* Price */}
              {jobData.estimatedPrice && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Estimated Price
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-price">
                    ${jobData.estimatedPrice}
                  </p>
                </div>
              )}
            </div>

            {/* Location */}
            {jobData.location && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Service Location</p>
                    <p className="font-medium text-gray-900 dark:text-white" data-testid="text-location">
                      {jobData.location}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobData.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {jobData.description && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Job Description</p>
                <p className="text-gray-900 dark:text-white leading-relaxed" data-testid="text-description">
                  {jobData.description}
                </p>
              </div>
            )}

            <Separator className="my-4" />

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

        {/* Mini Map - Customer Location */}
        {(jobData.latitude && jobData.longitude && Number(jobData.latitude) !== 0 && Number(jobData.longitude) !== 0) ? (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Customer Location
              </h3>
            </div>
            <CardContent className="p-0">
              <MiniMap 
                latitude={Number(jobData.latitude)} 
                longitude={Number(jobData.longitude)}
                location={jobData.location}
              />
            </CardContent>
          </Card>
        ) : jobData.location && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Customer Location
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Map unavailable - coordinates not provided
                </p>
                <p className="font-medium text-gray-900 dark:text-white mb-4">{jobData.location}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Photos */}
        {jobData.photos && jobData.photos.length > 0 ? (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-600" />
                Photos from Customer ({jobData.photos.length})
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {jobData.photos.map((photo: string, index: number) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => window.open(photo, '_blank')}
                  >
                    <img
                      src={photo}
                      alt={`Customer photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-2">
                          <Eye className="w-5 h-5 text-gray-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-800 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-600" />
                Photos from Customer
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No photos provided by customer
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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

// Mini Map Component
function MiniMap({ latitude, longitude, location }: { latitude: number, longitude: number, location: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize Mapbox
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
      interactive: true,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add custom marker at customer location
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f97316" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>')`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';

    new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="p-2"><p class="font-semibold text-gray-900">Customer Location</p><p class="text-sm text-gray-600">${location}</p></div>`)
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude, location]);

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-[300px] md:h-[400px] w-full" />
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-orange-600" />
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Navigate to</p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
