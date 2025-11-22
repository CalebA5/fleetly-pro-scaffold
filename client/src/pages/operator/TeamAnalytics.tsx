import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Star, TrendingUp, ArrowLeft, Award, Clock, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// Mock driver data
const drivers = [
  {
    id: "DRV-001",
    name: "Sarah Martinez",
    status: "active",
    todayEarnings: 420,
    todayJobs: 12,
    weeklyEarnings: 1240,
    weeklyJobs: 38,
    avgRating: 4.9,
    completionRate: 98,
    responseTime: "3 min",
    preferredServices: ["Snow Plowing", "Towing"],
    rank: 1
  },
  {
    id: "DRV-002",
    name: "James Wilson",
    status: "active",
    todayEarnings: 310,
    todayJobs: 9,
    weeklyEarnings: 890,
    weeklyJobs: 28,
    avgRating: 4.7,
    completionRate: 95,
    responseTime: "5 min",
    preferredServices: ["Hauling", "Courier"],
    rank: 2
  },
  {
    id: "DRV-003",
    name: "Mike Chen",
    status: "active",
    todayEarnings: 280,
    todayJobs: 8,
    weeklyEarnings: 760,
    weeklyJobs: 25,
    avgRating: 4.8,
    completionRate: 96,
    responseTime: "4 min",
    preferredServices: ["Towing", "Hauling"],
    rank: 3
  },
  {
    id: "DRV-004",
    name: "Lisa Anderson",
    status: "offline",
    todayEarnings: 0,
    todayJobs: 0,
    weeklyEarnings: 650,
    weeklyJobs: 22,
    avgRating: 4.6,
    completionRate: 94,
    responseTime: "6 min",
    preferredServices: ["Snow Plowing", "Courier"],
    rank: 4
  },
  {
    id: "DRV-005",
    name: "David Brown",
    status: "busy",
    todayEarnings: 190,
    todayJobs: 5,
    weeklyEarnings: 580,
    weeklyJobs: 19,
    avgRating: 4.5,
    completionRate: 92,
    responseTime: "7 min",
    preferredServices: ["Hauling", "Towing"],
    rank: 5
  }
];

export default function TeamAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("week");

  const totalEarnings = drivers.reduce((sum, d) => sum + d.weeklyEarnings, 0);
  const totalJobs = drivers.reduce((sum, d) => sum + d.weeklyJobs, 0);
  const avgRating = (drivers.reduce((sum, d) => sum + d.avgRating, 0) / drivers.length).toFixed(1);
  const activeDrivers = drivers.filter(d => d.status === "active").length;

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-black";
    if (rank === 2) return "bg-gray-300 text-black";
    if (rank === 3) return "bg-orange-300 text-black";
    return "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600 text-white";
      case "busy":
        return "bg-orange-600 text-white";
      case "offline":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <Header onSignIn={() => {}} onSignUp={() => {}} onDriveAndEarn={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/business")}
            className="mb-4"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white">Team Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive performance tracking for your driver team</p>
            </div>
            <Badge className="bg-purple-600 text-white text-lg px-4 py-2">UNLIMITED RADIUS</Badge>
          </div>
        </div>

        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Team Earnings</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">${totalEarnings}</p>
              <p className="text-xs text-green-600 mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{totalJobs}</p>
              <p className="text-xs text-blue-600 mt-1">Completed this week</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Team Rating</p>
                <Star className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{avgRating}⭐</p>
              <p className="text-xs text-orange-600 mt-1">Average rating</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{activeDrivers}/{drivers.length}</p>
              <p className="text-xs text-purple-600 mt-1">Drivers online</p>
            </CardContent>
          </Card>
        </div>

        {/* Driver Performance Breakdown */}
        <div className="space-y-4">
          {drivers.map((driver, index) => (
            <Card
              key={driver.id}
              className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 ${
                driver.rank <= 3
                  ? "border-yellow-200 dark:border-yellow-800"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              data-testid={`driver-card-${driver.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(driver.rank)}`}>
                      <span className="text-xl font-bold">{driver.rank}</span>
                    </div>
                    <div>
                      <CardTitle className="text-black dark:text-white flex items-center gap-2">
                        {driver.name}
                        {driver.rank === 1 && <Award className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                      </CardTitle>
                      <CardDescription>{driver.preferredServices.join(", ")}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(driver.status)}>
                    {driver.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Weekly Earnings */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Week Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white">${driver.weeklyEarnings}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{driver.weeklyJobs} jobs</p>
                  </div>

                  {/* Today's Performance */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Today</span>
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white">${driver.todayEarnings}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{driver.todayJobs} jobs</p>
                  </div>

                  {/* Rating */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white">{driver.avgRating}⭐</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{driver.completionRate}% complete</p>
                  </div>

                  {/* Response Time */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Response</span>
                    </div>
                    <p className="text-xl font-bold text-black dark:text-white">{driver.responseTime}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg response</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {/* Navigate to driver details */}}
                      data-testid={`button-view-driver-${driver.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
