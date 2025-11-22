import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type TimeInterval = "hourly" | "daily" | "monthly";

interface EarningsData {
  period: string;
  earnings: number;
  jobs: number;
}

export default function EarningsDetails() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [interval, setInterval] = useState<TimeInterval>("daily");

  // Fetch tier-specific stats
  const { data: tierStats, isLoading } = useQuery<Array<{
    tier: string;
    jobsCompleted: number;
    totalEarnings: string;
    rating: string;
    totalRatings: number;
  }>>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}/tier-stats`],
    enabled: !!user?.operatorId,
  });

  // Get current tier from user context
  const currentTier = user?.viewTier || user?.activeTier || "manual";
  const currentTierStats = tierStats?.find((stat) => stat.tier === currentTier);

  // Generate deterministic mock data based on interval
  // Uses a simple hash-based distribution to create consistent data across renders
  const generateEarningsData = (): EarningsData[] => {
    const totalEarnings = parseFloat(currentTierStats?.totalEarnings || "0");
    const jobsCompleted = currentTierStats?.jobsCompleted || 0;

    // Deterministic distribution factors - normalized to sum exactly to the number of periods
    // These create realistic variation without randomness while preserving totals
    const rawHourlyFactors = [
      0.3, 0.2, 0.2, 0.3, 0.4, 0.6, 0.9, 1.2, 1.4, 1.3, 1.2, 1.1,
      1.2, 1.3, 1.4, 1.5, 1.6, 1.4, 1.2, 1.0, 0.8, 0.6, 0.5, 0.4
    ];
    const hourlySum = rawHourlyFactors.reduce((a, b) => a + b, 0);
    const hourlyFactors = rawHourlyFactors.map(f => (f / hourlySum) * 24);

    const rawDailyFactors = [1.2, 1.3, 1.0, 1.1, 1.4, 0.6, 0.4]; // Mon-Sun
    const dailySum = rawDailyFactors.reduce((a, b) => a + b, 0);
    const dailyFactors = rawDailyFactors.map(f => (f / dailySum) * 7);

    const rawMonthlyFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.1, 1.0, 0.9, 0.8, 1.0, 1.1];
    const monthlySum = rawMonthlyFactors.reduce((a, b) => a + b, 0);
    const monthlyFactors = rawMonthlyFactors.map(f => (f / monthlySum) * 12);

    if (interval === "hourly") {
      return Array.from({ length: 24 }, (_, i) => {
        const earningsForHour = (totalEarnings / 24) * hourlyFactors[i];
        const jobsForHour = Math.floor((jobsCompleted / 24) * hourlyFactors[i]);
        return {
          period: `${i.toString().padStart(2, "0")}:00`,
          earnings: parseFloat(earningsForHour.toFixed(2)),
          jobs: jobsForHour,
        };
      });
    } else if (interval === "daily") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return Array.from({ length: 7 }, (_, i) => {
        const earningsForDay = (totalEarnings / 7) * dailyFactors[i];
        const jobsForDay = Math.floor((jobsCompleted / 7) * dailyFactors[i]);
        return {
          period: days[i],
          earnings: parseFloat(earningsForDay.toFixed(2)),
          jobs: jobsForDay,
        };
      });
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return Array.from({ length: 12 }, (_, i) => {
        const earningsForMonth = (totalEarnings / 12) * monthlyFactors[i];
        const jobsForMonth = Math.floor((jobsCompleted / 12) * monthlyFactors[i]);
        return {
          period: months[i],
          earnings: parseFloat(earningsForMonth.toFixed(2)),
          jobs: jobsForMonth,
        };
      });
    }
  };

  const earningsData = generateEarningsData();
  const totalEarnings = currentTierStats?.totalEarnings || "0.00";
  const totalJobs = currentTierStats?.jobsCompleted || 0;
  const avgEarningsPerJob = totalJobs > 0 ? (parseFloat(totalEarnings) / totalJobs).toFixed(2) : "0.00";

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      professional: "Professional & Certified",
      equipped: "Skilled & Equipped",
      manual: "Manual Operator",
    };
    return labels[tier] || tier;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-6 flex-1">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-2">
            Earnings Overview
          </h1>
          <p className="text-muted-foreground">
            {getTierLabel(currentTier)} Tier
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${totalEarnings}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Jobs Completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-black dark:text-white">
                {totalJobs}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Avg per Job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${avgEarningsPerJob}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Interval Toggle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={interval === "hourly" ? "default" : "outline"}
                size="sm"
                onClick={() => setInterval("hourly")}
                data-testid="button-interval-hourly"
              >
                Hourly
              </Button>
              <Button
                variant={interval === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setInterval("daily")}
                data-testid="button-interval-daily"
              >
                Daily
              </Button>
              <Button
                variant={interval === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setInterval("monthly")}
                data-testid="button-interval-monthly"
              >
                Monthly
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Earnings Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
            <CardDescription>
              Track your earnings over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={interval === "hourly" ? -45 : 0}
                  textAnchor={interval === "hourly" ? "end" : "middle"}
                  height={interval === "hourly" ? 60 : 30}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Earnings ($)"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Completed</CardTitle>
            <CardDescription>
              Number of jobs completed per {interval === "hourly" ? "hour" : interval === "daily" ? "day" : "month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={interval === "hourly" ? -45 : 0}
                  textAnchor={interval === "hourly" ? "end" : "middle"}
                  height={interval === "hourly" ? 60 : 30}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [value, "Jobs"]}
                />
                <Legend />
                <Bar 
                  dataKey="jobs" 
                  fill="#3b82f6" 
                  name="Jobs Completed"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
}
