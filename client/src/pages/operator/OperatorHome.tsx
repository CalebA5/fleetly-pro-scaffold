import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const mockOperatorData = {
  name: "Mike's Snow Service",
  isOnline: true,
  todayEarnings: 425.50,
  weeklyEarnings: 1247.75,
  completedJobs: 23,
  rating: 4.8,
  activeJobs: 2,
  pendingJobs: 5,
};

const pendingJobs = [
  {
    id: "JOB-2024-005",
    service: "Snow Plowing",
    location: "456 Oak Street",
    customerRating: 4.9,
    estimatedEarnings: 85.00,
    distance: "3.2 miles",
    urgency: "high",
    timeAgo: "2 min ago",
  },
  {
    id: "JOB-2024-006",
    service: "Towing",
    location: "Highway 15 Exit 42",
    customerRating: 4.5,
    estimatedEarnings: 165.00,
    distance: "7.8 miles",
    urgency: "urgent",
    timeAgo: "5 min ago",
  },
  {
    id: "JOB-2024-007",
    service: "Courier",
    location: "Downtown Plaza",
    customerRating: 4.7,
    estimatedEarnings: 35.00,
    distance: "1.5 miles",
    urgency: "normal",
    timeAgo: "8 min ago",
  },
];

export const OperatorHome = () => {
  const [isOnline, setIsOnline] = useState(mockOperatorData.isOnline);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "bg-destructive";
      case "high": return "bg-warning";
      case "normal": return "bg-success";
      default: return "bg-muted";
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "URGENT";
      case "high": return "High Priority";
      case "normal": return "Standard";
      default: return "Unknown";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Operator Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {mockOperatorData.name}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {isOnline ? "Online" : "Offline"}
            </span>
            <Switch 
              checked={isOnline} 
              onCheckedChange={setIsOnline}
            />
            {isOnline && (
              <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow" />
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Today's Earnings</span>
            </div>
            <p className="text-2xl font-bold text-success">
              ${mockOperatorData.todayEarnings.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Weekly Total</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              ${mockOperatorData.weeklyEarnings.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">7 days</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">Jobs Completed</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {mockOperatorData.completedJobs}
            </p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">Rating</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {mockOperatorData.rating}★
            </p>
            <p className="text-sm text-muted-foreground">Based on 156 reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Jobs */}
        <div className="lg:col-span-2">
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    <span>Pending Job Requests</span>
                  </CardTitle>
                  <CardDescription>
                    {mockOperatorData.pendingJobs} jobs waiting for your response
                  </CardDescription>
                </div>
                <Link to="/operator/jobs">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingJobs.map((job, index) => (
                  <Card key={job.id} className="bg-accent/5 border-accent/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{job.service}</h4>
                            <Badge className={getUrgencyColor(job.urgency)}>
                              {getUrgencyText(job.urgency)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span>★ {job.customerRating} customer</span>
                              <span>{job.distance} away</span>
                              <span>{job.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-success">
                            ${job.estimatedEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Estimated</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="success" size="sm" className="flex-1">
                          Accept
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Decline
                        </Button>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          {/* Active Jobs */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-primary" />
                <span>Active Jobs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-primary mb-2">
                  {mockOperatorData.activeJobs}
                </p>
                <p className="text-muted-foreground">Jobs in progress</p>
                <Link to="/operator/jobs">
                  <Button variant="outline" className="mt-4 w-full">
                    Manage Active Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/operator/onboarding">
                <Button variant="outline" className="w-full">
                  Update Profile
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Customer Reviews
              </Button>
              <Button variant="ghost" className="w-full">
                Help & Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};