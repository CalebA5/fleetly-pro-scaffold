import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { ServiceRequestDetailsDialog } from "@/components/ServiceRequestDetailsDialog";
import type { ServiceRequest } from "@shared/schema";
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Target,
  Timer
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


// Mock nearby opportunities - customers in the same area who used the service recently
const nearbyOpportunities = [
  {
    id: "OPP-001",
    customerName: "Sarah Johnson",
    location: "442 Oak Street",
    service: "Snow Plowing",
    lastService: "3 days ago",
    distance: "0.2 miles",
    rating: 4.8,
    estimatedEarnings: 90.00,
  },
  {
    id: "OPP-002",
    customerName: "David Chen",
    location: "458 Oak Street",
    service: "Snow Plowing",
    lastService: "5 days ago",
    distance: "0.3 miles",
    rating: 4.9,
    estimatedEarnings: 95.00,
  },
  {
    id: "OPP-003",
    customerName: "Maria Garcia",
    location: "465 Oak Street",
    service: "Ice Removal",
    lastService: "2 days ago",
    distance: "0.4 miles",
    rating: 4.7,
    estimatedEarnings: 65.00,
  },
];

export const OperatorHome = () => {
  const [isOnline, setIsOnline] = useState(mockOperatorData.isOnline);
  const [showNearbyPrompt, setShowNearbyPrompt] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes in seconds
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch service requests
  const { data: serviceRequests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  // Countdown timer for nearby opportunities prompt
  useEffect(() => {
    if (!showNearbyPrompt) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setShowNearbyPrompt(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showNearbyPrompt]);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "normal": return "bg-green-500";
      default: return "bg-gray-500";
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header 
        onSignIn={() => {
          setAuthTab("signin");
          setShowAuthDialog(true);
        }}
        onSignUp={() => {
          setAuthTab("signup");
          setShowAuthDialog(true);
        }}
      />
      
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Operator Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {mockOperatorData.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-sm font-semibold text-black dark:text-white">
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch 
                  checked={isOnline} 
                  onCheckedChange={setIsOnline}
                  data-testid="switch-online-status"
                />
                {isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nearby Opportunities Prompt */}
        {showNearbyPrompt && (
          <Card className="mb-8 border-2 border-orange-500 dark:border-orange-600 shadow-warm-glow animate-pulse-glow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <Target className="w-6 h-6 text-orange-600 dark:text-orange-400 icon-warm-glow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                      Nearby Opportunities in Your Area!
                      <Badge className="bg-orange-500 dark:bg-orange-600 text-white">
                        Hot Lead
                      </Badge>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {nearbyOpportunities.length} customers in the same area need service
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-2xl">
                      <Timer className="w-6 h-6 animate-pulse" />
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Time remaining</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNearbyPrompt(false)}
                    data-testid="button-dismiss-nearby"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {nearbyOpportunities.map((opp) => (
                  <Card key={opp.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-black dark:text-white">{opp.customerName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{opp.service}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {opp.distance}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{opp.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {opp.rating}
                          </span>
                          <span className="text-xs">Last: {opp.lastService}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          ${opp.estimatedEarnings.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
                          data-testid={`button-contact-${opp.id}`}
                        >
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-8"
                  data-testid="button-contact-all"
                >
                  Contact All Customers
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowNearbyPrompt(false)}
                  data-testid="button-snooze"
                >
                  Snooze for Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Today</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                ${mockOperatorData.todayEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />
                <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Week</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                ${mockOperatorData.weeklyEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />
                <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                {mockOperatorData.completedJobs}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Rating</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                {mockOperatorData.rating}★
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Jobs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Pending Job Requests
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLoading ? "..." : serviceRequests.length} {serviceRequests.length === 1 ? "job" : "jobs"} waiting for your response
                </p>
              </div>
              <Link to="/operator/jobs">
                <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {/* Skeleton loader */}
                  {[1, 2].map((i) => (
                    <Card key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                          <div className="flex gap-3">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : serviceRequests.length === 0 ? (
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No pending requests at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                serviceRequests.map((request) => (
                  <Card key={request.id} className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-3">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h4 className="font-bold text-lg md:text-xl text-black dark:text-white">{request.serviceType}</h4>
                            {request.isEmergency === 1 && (
                              <Badge className="bg-red-600 text-white font-semibold">
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span>{request.customerName}</span>
                              {request.preferredDate && (
                                <span className="text-xs">📅 {request.preferredDate}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {request.budgetRange && (
                          <div className="text-left md:text-right">
                            <p className="text-xl md:text-2xl font-bold text-green-600">
                              {request.budgetRange}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Budget</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button 
                          className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold h-11"
                          data-testid={`button-accept-${request.id}`}
                        >
                          Accept Job
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-2 h-11" 
                          data-testid={`button-decline-${request.id}`}
                        >
                          Decline
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-2 h-11"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsDialog(true);
                          }}
                          data-testid={`button-details-${request.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="space-y-6">
            {/* Active Jobs */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-black dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Active Jobs
                </h3>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-black dark:text-white mb-2">
                    {mockOperatorData.activeJobs}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Jobs in progress</p>
                  <Link to="/operator/jobs">
                    <Button variant="outline" className="w-full" data-testid="button-manage-active-jobs">
                      Manage Active Jobs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-black dark:text-white">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/operator/onboarding">
                    <Button variant="outline" className="w-full" data-testid="button-update-profile">
                      Update Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" data-testid="button-set-availability">
                    <Clock className="w-4 h-4 mr-2" />
                    Set Availability
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-customer-reviews">
                    <Users className="w-4 h-4 mr-2" />
                    Customer Reviews
                  </Button>
                  <Button variant="ghost" className="w-full" data-testid="button-help-support">
                    Help & Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
      />

      <ServiceRequestDetailsDialog
        request={selectedRequest}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
};
