import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Clock, User, Phone, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Job, JobStep } from "@shared/schema";

export const JobTracking = () => {
  const [, setLocation] = useLocation();
  const jobId = new URLSearchParams(window.location.search).get("id") || "1";
  
  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then(res => {
      if (!res.ok) throw new Error("Job not found");
      return res.json();
    }),
    refetchInterval: 5000,
  });

  const [progress, setProgress] = useState(job?.progress || 0);

  useEffect(() => {
    if (job) {
      setProgress(job.progress);
    }
  }, [job]);

  useEffect(() => {
    if (!job || job.status === "completed") return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 2;
        if (newProgress >= 100) return 100;
        return newProgress;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [job]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_route": return "bg-blue-500";
      case "arrived": return "bg-yellow-500";
      case "in_progress": return "bg-orange-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "en_route": return "En Route";
      case "arrived": return "Arrived";
      case "in_progress": return "Work in Progress";
      case "completed": return "Completed";
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <p className="text-muted-foreground mb-6">The job you're looking for doesn't exist.</p>
          <Link to="/customer">
            <Button data-testid="button-back-dashboard">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const jobSteps = (job.jobSteps as JobStep[]) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/customer">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Job Tracking</h1>
          <p className="text-muted-foreground">Track your service in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Status Card */}
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span data-testid="text-job-number">Job #{job.jobNumber}</span>
                    <Badge className={getStatusColor(job.status)} data-testid="badge-status">
                      {getStatusText(job.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription data-testid="text-job-details">{job.service} at {job.location}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent" data-testid="text-estimated-total">${job.estimatedTotal}</p>
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground" data-testid="text-progress">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" data-testid="progress-bar" />
                </div>
                
                {job.status === "en_route" && job.estimatedArrival && (
                  <div className="flex items-center space-x-2 text-primary animate-pulse-glow">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium" data-testid="text-eta">ETA: {job.estimatedArrival}</span>
                  </div>
                )}
                
                {job.estimatedCompletion && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm" data-testid="text-estimated-completion">Estimated Completion: {job.estimatedCompletion}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Job Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4" data-testid={`step-${index}`}>
                    <div className={`w-3 h-3 rounded-full ${
                      step.completed 
                        ? "bg-success" 
                        : step.current 
                          ? "bg-primary animate-pulse-glow" 
                          : "bg-muted"
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${step.current ? "text-primary" : ""}`} data-testid={`text-step-name-${index}`}>
                        {step.step}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-step-time-${index}`}>{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
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

                {job.operatorPhone && (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" size="sm" data-testid="button-call-operator">
                      <Phone className="w-4 h-4 mr-2" />
                      Call {job.operatorPhone}
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" data-testid="button-message-operator">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                )}
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