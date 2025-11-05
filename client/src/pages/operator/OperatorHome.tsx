import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
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
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-black dark:text-white" />
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">Operator Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {mockOperatorData.name}</p>
              </div>
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Earnings</span>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">
                ${mockOperatorData.todayEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-black dark:text-white" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Total</span>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">
                ${mockOperatorData.weeklyEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">7 days</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-black dark:text-white" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Jobs Completed</span>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">
                {mockOperatorData.completedJobs}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</span>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">
                {mockOperatorData.rating}
                <Star className="w-6 h-6 inline fill-yellow-500 text-yellow-500 ml-1" />
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Based on 156 reviews</p>
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
                  {mockOperatorData.pendingJobs} jobs waiting for your response
                </p>
              </div>
              <Link to="/operator/jobs">
                <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {pendingJobs.map((job) => (
                <Card key={job.id} className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-bold text-lg text-black dark:text-white">{job.service}</h4>
                          <Badge className={`${getUrgencyColor(job.urgency)} text-white`}>
                            {getUrgencyText(job.urgency)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {job.customerRating} customer
                            </span>
                            <span>{job.distance} away</span>
                            <span>{job.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${job.estimatedEarnings.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Estimated</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        data-testid={`button-accept-${job.id}`}
                      >
                        Accept
                      </Button>
                      <Button variant="outline" className="flex-1" data-testid={`button-decline-${job.id}`}>
                        Decline
                      </Button>
                      <Button variant="ghost" data-testid={`button-details-${job.id}`}>
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
};
