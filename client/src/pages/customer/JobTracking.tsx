import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Clock, User, Phone, MessageSquare, TrendingUp, Navigation } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { JobMessaging } from "@/components/JobMessaging";
import { LiveTrackingMap } from "@/components/LiveTrackingMap";

export const JobTracking = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const requestId = new URLSearchParams(window.location.search).get("requestId");
  
  // Fetch accepted job for this request
  const customerId = user?.customerId || user?.id;
  const { data: jobs, isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/customer-jobs", customerId],
    enabled: !!customerId,
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  });
  
  // Find the job matching this requestId
  const job = jobs?.find((j: any) => j.jobSourceId === requestId);
  const isLoading = jobsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-blue-500";
      case "in_progress": return "bg-orange-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted": return "Accepted - Waiting to Start";
      case "in_progress": return "Work in Progress";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {requestId ? "No active job found for this request." : "No request ID provided."}
          </p>
          <Link to="/customer/request-status">
            <Button data-testid="button-back-requests">View My Requests</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract job data from the jobData field
  const jobData = job.jobData as any || {};
  const progress = job.progress || 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/customer/request-status">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Job Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your service in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Status Card */}
          <Card className="animate-fade-in bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2 flex-wrap gap-2">
                    <span data-testid="text-job-id" className="text-gray-900 dark:text-white">Job #{job.acceptedJobId}</span>
                    <Badge className={`${getStatusColor(job.status)} text-white`} data-testid="badge-status">
                      {getStatusText(job.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 dark:text-gray-400" data-testid="text-job-details">
                    {jobData.serviceType || "Service"} • {jobData.location || "Location not specified"}
                  </CardDescription>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Accepted {formatDistanceToNow(new Date(job.acceptedAt), { addSuffix: true })}
                  </p>
                </div>
                {jobData.estimatedCost && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-estimated-total">
                      ${parseFloat(jobData.estimatedCost).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Cost</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Overall Progress</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-progress">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" data-testid="progress-bar" />
                </div>
                
                {job.status === "accepted" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Waiting for operator to start the job
                    </p>
                  </div>
                )}
                
                {job.status === "in_progress" && job.startedAt && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm" data-testid="text-started-at">
                      Started {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
                
                {job.status === "completed" && job.completedAt && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ Job completed {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Tracking Map - Shows when job is accepted or in progress */}
          {(job.status === "accepted" || job.status === "in_progress") && (
            <LiveTrackingMap 
              jobId={job.acceptedJobId} 
              operatorName={job.operatorName}
            />
          )}

          {/* Job Description */}
          <Card className="animate-slide-up bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {jobData.description || "No description provided"}
              </p>
              {jobData.details && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Additional details: {JSON.stringify(jobData.details)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operator Info & Actions */}
        <div className="space-y-6">
          {/* Operator Card */}
          {job.operatorName && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Your Operator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold" data-testid="text-operator-name">{job.operatorName}</h4>
                  {job.operatorRating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium" data-testid="text-operator-rating">{job.operatorRating}</span>
                      <span className="text-sm text-muted-foreground">rating</span>
                    </div>
                  )}
                </div>
                
                {(job.operatorVehicle || job.operatorLicensePlate) && (
                  <div className="space-y-2 text-sm">
                    {job.operatorVehicle && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span data-testid="text-operator-vehicle">{job.operatorVehicle}</span>
                      </div>
                    )}
                    {job.operatorLicensePlate && (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded" data-testid="text-operator-plate">
                          {job.operatorLicensePlate}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {job.operatorPhone && (
                    <Button variant="outline" className="w-full" size="sm" data-testid="button-call-operator">
                      <Phone className="w-4 h-4 mr-2" />
                      Call {job.operatorPhone}
                    </Button>
                  )}
                  <JobMessaging
                    jobId={job.acceptedJobId}
                    currentUserId={customerId || ""}
                    currentUserType="customer"
                    currentUserName={user?.name || "Customer"}
                    recipientName={job.operatorName}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" size="sm" data-testid="button-report-issue">
                Report Issue
              </Button>
              <Button variant="outline" className="w-full" size="sm" data-testid="button-cancel-job">
                Cancel Job
              </Button>
              <Button variant="ghost" className="w-full" size="sm" data-testid="button-support">
                Customer Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};