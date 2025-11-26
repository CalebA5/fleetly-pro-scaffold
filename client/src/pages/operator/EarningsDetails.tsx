import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, TrendingUp, DollarSign, Calendar, CheckCircle,
  Clock, MapPin, Star, Camera, MessageSquare, User, Loader2,
  ChevronRight, Briefcase, ArrowUpRight
} from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { format, differenceInHours } from "date-fns";
import type { ServiceRequest } from "@shared/schema";

type TimeInterval = "hourly" | "daily" | "monthly";
type ViewTab = "overview" | "completed";

interface EarningsData {
  period: string;
  earnings: number;
  jobs: number;
}

export default function EarningsDetails() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [interval, setInterval] = useState<TimeInterval>("daily");
  const [viewTab, setViewTab] = useState<ViewTab>("overview");
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const operatorId = user?.operatorId;
  const currentTier = user?.viewTier || user?.activeTier || "manual";

  const { data: tierStats, isLoading: isLoadingStats } = useQuery<Array<{
    tier: string;
    jobsCompleted: number;
    totalEarnings: string;
    rating: string;
    totalRatings: number;
  }>>({
    queryKey: [`/api/operators/by-id/${operatorId}/tier-stats`],
    enabled: !!operatorId,
  });

  const { data: completedJobs = [], isLoading: isLoadingJobs } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/completed-today/${operatorId}`],
    enabled: !!operatorId,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { jobId: number; review: string; rating: number }) => {
      return apiRequest(`/api/service-requests/${data.jobId}/operator-review`, {
        method: "POST",
        body: JSON.stringify({ review: data.review, rating: data.rating }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/completed-today/${operatorId}`] });
      setShowReviewDialog(false);
      setReviewText("");
      setRating(5);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentTierStats = tierStats?.find((stat) => stat.tier === currentTier);
  const totalEarnings = currentTierStats?.totalEarnings || "0.00";
  const totalJobs = currentTierStats?.jobsCompleted || 0;
  const avgEarningsPerJob = totalJobs > 0 ? (parseFloat(totalEarnings) / totalJobs).toFixed(2) : "0.00";

  const todayEarnings = completedJobs.reduce((sum, job) => {
    const price = typeof job.details === 'object' && job.details && 'quotedPrice' in job.details
      ? parseFloat(String(job.details.quotedPrice) || "0")
      : 0;
    return sum + price;
  }, 0);

  const generateEarningsData = (): EarningsData[] => {
    const earnings = parseFloat(currentTierStats?.totalEarnings || "0");
    const jobs = currentTierStats?.jobsCompleted || 0;

    const rawHourlyFactors = [0.3, 0.2, 0.2, 0.3, 0.4, 0.6, 0.9, 1.2, 1.4, 1.3, 1.2, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.4, 1.2, 1.0, 0.8, 0.6, 0.5, 0.4];
    const hourlySum = rawHourlyFactors.reduce((a, b) => a + b, 0);
    const hourlyFactors = rawHourlyFactors.map(f => (f / hourlySum) * 24);

    const rawDailyFactors = [1.2, 1.3, 1.0, 1.1, 1.4, 0.6, 0.4];
    const dailySum = rawDailyFactors.reduce((a, b) => a + b, 0);
    const dailyFactors = rawDailyFactors.map(f => (f / dailySum) * 7);

    const rawMonthlyFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.1, 1.0, 0.9, 0.8, 1.0, 1.1];
    const monthlySum = rawMonthlyFactors.reduce((a, b) => a + b, 0);
    const monthlyFactors = rawMonthlyFactors.map(f => (f / monthlySum) * 12);

    if (interval === "hourly") {
      return Array.from({ length: 24 }, (_, i) => ({
        period: `${i.toString().padStart(2, "0")}:00`,
        earnings: parseFloat(((earnings / 24) * hourlyFactors[i]).toFixed(2)),
        jobs: Math.floor((jobs / 24) * hourlyFactors[i]),
      }));
    } else if (interval === "daily") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return Array.from({ length: 7 }, (_, i) => ({
        period: days[i],
        earnings: parseFloat(((earnings / 7) * dailyFactors[i]).toFixed(2)),
        jobs: Math.floor((jobs / 7) * dailyFactors[i]),
      }));
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return Array.from({ length: 12 }, (_, i) => ({
        period: months[i],
        earnings: parseFloat(((earnings / 12) * monthlyFactors[i]).toFixed(2)),
        jobs: Math.floor((jobs / 12) * monthlyFactors[i]),
      }));
    }
  };

  const canAddReview = (job: ServiceRequest): boolean => {
    if (!job.completedAt) return false;
    const hoursElapsed = differenceInHours(new Date(), new Date(job.completedAt));
    return hoursElapsed <= 8;
  };

  const handleSubmitReview = () => {
    if (!selectedJob) return;
    reviewMutation.mutate({
      jobId: selectedJob.id,
      review: reviewText,
      rating,
    });
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      professional: "Professional",
      equipped: "Skilled & Equipped",
      manual: "Manual Operator",
    };
    return labels[tier] || tier;
  };

  const earningsData = generateEarningsData();
  const isLoading = isLoadingStats || isLoadingJobs;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/operator")}
            className="h-9 w-9"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg text-gray-900 dark:text-white">Earnings</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getTierLabel(currentTier)} Tier</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <p className="text-emerald-100 text-sm mb-1">Today's Earnings</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">${todayEarnings.toFixed(2)}</span>
              {todayEarnings > 0 && (
                <span className="flex items-center text-emerald-200 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{completedJobs.length} jobs
                </span>
              )}
            </div>
            <button
              onClick={() => setViewTab("completed")}
              className="flex items-center gap-2 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg transition-colors text-sm font-medium"
              data-testid="button-view-completed-jobs"
            >
              <Briefcase className="h-4 w-4" />
              <span>{completedJobs.length} Jobs Completed</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              Completed Today
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Total</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${totalEarnings}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Jobs</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{totalJobs}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Avg/Job</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${avgEarningsPerJob}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Earnings Trend</CardTitle>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
                    {(["hourly", "daily", "monthly"] as const).map((i) => (
                      <button
                        key={i}
                        onClick={() => setInterval(i)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          interval === i
                            ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        data-testid={`button-interval-${i}`}
                      >
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={earningsData}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#earningsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jobs Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                      }}
                      formatter={(value: number) => [value, "Jobs"]}
                    />
                    <Bar
                      dataKey="jobs"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completedJobs.length === 0 ? (
              <Card className="border-dashed border-2 bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">No Jobs Completed Today</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Complete some jobs to see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedJobs.map((job) => {
                const canReview = canAddReview(job);
                const jobPrice = typeof job.details === 'object' && job.details && 'quotedPrice' in job.details
                  ? parseFloat(String(job.details.quotedPrice) || "0")
                  : 0;

                return (
                  <Card
                    key={job.id}
                    className="border-0 shadow-sm bg-white dark:bg-gray-800 overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`completed-job-${job.id}`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs">
                              {job.serviceType}
                            </Badge>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.completedAt && format(new Date(job.completedAt), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {job.description}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                          ${jobPrice.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location?.substring(0, 30)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Customer #{job.customerId}
                        </span>
                      </div>

                      {canReview && (
                        <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowReviewDialog(true);
                            }}
                            data-testid={`button-review-${job.id}`}
                          >
                            <MessageSquare className="h-3 w-3 mr-1.5" />
                            Leave Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => toast({ title: "Coming Soon", description: "Photo upload will be available soon." })}
                            data-testid={`button-photo-${job.id}`}
                          >
                            <Camera className="h-3 w-3 mr-1.5" />
                            Add Photos
                          </Button>
                        </div>
                      )}

                      {!canReview && job.completedAt && (
                        <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
                          Review window expired (8 hours after completion)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience working with this customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Your Review</p>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was your experience with this customer?"
                rows={4}
                className="resize-none"
                data-testid="input-review"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
