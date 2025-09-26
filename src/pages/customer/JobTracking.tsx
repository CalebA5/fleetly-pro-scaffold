import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MapPin, Clock, User, Phone, MessageSquare } from "lucide-react";

const mockJob = {
  id: "JOB-2024-001",
  service: "Snow Plowing",
  operator: {
    name: "Mike's Snow Service",
    rating: 4.8,
    phone: "(555) 123-4567",
    vehicle: "2023 Ford F-350 with V-Plow",
    licensePlate: "SNW-123",
  },
  status: "en_route",
  progress: 65,
  estimatedArrival: "15 minutes",
  jobSteps: [
    { step: "Job Created", completed: true, time: "2:30 PM" },
    { step: "Operator Assigned", completed: true, time: "2:32 PM" },
    { step: "En Route", completed: true, time: "2:45 PM", current: true },
    { step: "Arrived", completed: false, time: "Est. 3:00 PM" },
    { step: "Work Started", completed: false, time: "TBD" },
    { step: "Work Completed", completed: false, time: "TBD" },
  ],
  location: "123 Main Street, Springfield",
  estimatedTotal: "$95.00",
};

export const JobTracking = () => {
  const [job] = useState(mockJob);
  const [progress, setProgress] = useState(job.progress);

  useEffect(() => {
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 2;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/customer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Job Tracking</h1>
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
                    <span>Job #{job.id}</span>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{job.service} at {job.location}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">{job.estimatedTotal}</p>
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {job.status === "en_route" && (
                  <div className="flex items-center space-x-2 text-primary animate-pulse-glow">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">ETA: {job.estimatedArrival}</span>
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
                {job.jobSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      step.completed 
                        ? "bg-success" 
                        : step.current 
                          ? "bg-primary animate-pulse-glow" 
                          : "bg-muted"
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${step.current ? "text-primary" : ""}`}>
                        {step.step}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.time}</p>
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
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Your Operator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">{job.operator.name}</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium">{job.operator.rating}</span>
                  <span className="text-sm text-muted-foreground">rating</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{job.operator.vehicle}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {job.operator.licensePlate}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {job.operator.phone}
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" size="sm">
                Report Issue
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Cancel Job
              </Button>
              <Button variant="ghost" className="w-full" size="sm">
                Customer Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};