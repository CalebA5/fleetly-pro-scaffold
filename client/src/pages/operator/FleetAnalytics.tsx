import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Truck, DollarSign, Wrench, TrendingUp, ArrowLeft, Fuel, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// Mock vehicle data
const vehicles = [
  {
    id: "VEH-001",
    name: "Truck #1",
    type: "Pickup Truck",
    status: "active",
    todayEarnings: 220,
    todayJobs: 8,
    utilization: 85,
    mileage: 12500,
    lastMaintenance: "2024-10-15",
    nextMaintenance: "Oil change in 200km",
    fuelEfficiency: "12.5 L/100km",
    avgRating: 4.8
  },
  {
    id: "VEH-002",
    name: "Truck #2",
    type: "Box Truck",
    status: "active",
    todayEarnings: 280,
    todayJobs: 10,
    utilization: 92,
    mileage: 8200,
    lastMaintenance: "2024-11-01",
    nextMaintenance: "All clear",
    fuelEfficiency: "15.2 L/100km",
    avgRating: 4.9
  },
  {
    id: "VEH-003",
    name: "Truck #3",
    type: "Flatbed Truck",
    status: "maintenance",
    todayEarnings: 0,
    todayJobs: 0,
    utilization: 0,
    mileage: 15800,
    lastMaintenance: "2024-11-20",
    nextMaintenance: "Under service",
    fuelEfficiency: "14.1 L/100km",
    avgRating: 4.7
  }
];

export default function FleetAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");

  const totalEarnings = vehicles.reduce((sum, v) => sum + v.todayEarnings, 0);
  const totalJobs = vehicles.reduce((sum, v) => sum + v.todayJobs, 0);
  const avgUtilization = Math.round(vehicles.reduce((sum, v) => sum + v.utilization, 0) / vehicles.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      <Header onSignIn={() => {}} onSignUp={() => {}} onDriveAndEarn={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/operator")}
            className="mb-4"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white">Fleet Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Detailed performance tracking for all your vehicles</p>
            </div>
            <Badge className="bg-blue-600 text-white text-lg px-4 py-2">15KM RADIUS</Badge>
          </div>
        </div>

        {/* Fleet Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fleet Earnings</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">${totalEarnings}</p>
              <p className="text-xs text-green-600 mt-1">Today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{totalJobs}</p>
              <p className="text-xs text-blue-600 mt-1">Across all vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{avgUtilization}%</p>
              <p className="text-xs text-purple-600 mt-1">Fleet efficiency</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Vehicles</p>
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">2/3</p>
              <p className="text-xs text-orange-600 mt-1">1 in maintenance</p>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Breakdown */}
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 ${
                vehicle.status === "active"
                  ? "border-green-200 dark:border-green-800"
                  : "border-orange-200 dark:border-orange-800"
              }`}
              data-testid={`vehicle-card-${vehicle.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      vehicle.status === "active" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : "bg-orange-100 dark:bg-orange-900"
                    }`}>
                      <Truck className={`w-6 h-6 ${
                        vehicle.status === "active"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-black dark:text-white">{vehicle.name}</CardTitle>
                      <CardDescription>{vehicle.type}</CardDescription>
                    </div>
                  </div>
                  <Badge className={
                    vehicle.status === "active" 
                      ? "bg-green-600 text-white" 
                      : "bg-orange-600 text-white"
                  }>
                    {vehicle.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Earnings */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Today's Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white">${vehicle.todayEarnings}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{vehicle.todayJobs} jobs</p>
                  </div>

                  {/* Utilization */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Utilization</span>
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white">{vehicle.utilization}%</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${vehicle.utilization}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Maintenance</span>
                    </div>
                    <p className="text-sm font-semibold text-black dark:text-white">{vehicle.nextMaintenance}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last: {vehicle.lastMaintenance}</p>
                  </div>

                  {/* Fuel Efficiency */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Fuel className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Fuel Efficiency</span>
                    </div>
                    <p className="text-sm font-semibold text-black dark:text-white">{vehicle.fuelEfficiency}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rating: {vehicle.avgRating}⭐</p>
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
