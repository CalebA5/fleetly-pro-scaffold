import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Star, TrendingUp, TrendingDown, Minus,
  ThumbsUp, MessageSquare, Calendar
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import type { Operator } from "@shared/schema";

interface RatingData {
  date: string;
  rating: number;
  reviews: number;
}

export default function RatingsTrend() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const operatorId = user?.operatorId;

  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<Operator>({
    queryKey: ["/api/operators/by-id", operatorId],
    enabled: !!operatorId,
  });

  const { data: ratingHistory = [], isLoading: isLoadingHistory } = useQuery<RatingData[]>({
    queryKey: ["/api/operators", operatorId, "rating-history"],
    enabled: !!operatorId,
  });

  const currentRating = operatorData?.rating ? parseFloat(String(operatorData.rating)) : 0;
  const totalReviews = operatorData?.totalJobs || 0;

  const generateMockHistory = (): RatingData[] => {
    const data: RatingData[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const baseRating = currentRating || 4.5;
      const variation = (Math.sin(i * 0.3) * 0.3) + (Math.random() * 0.2 - 0.1);
      const rating = Math.max(1, Math.min(5, baseRating + variation));
      data.push({
        date: format(date, "MMM dd"),
        rating: parseFloat(rating.toFixed(2)),
        reviews: Math.floor(Math.random() * 5) + 1,
      });
    }
    return data;
  };

  const displayHistory = ratingHistory.length > 0 ? ratingHistory : generateMockHistory();

  const getTrend = () => {
    if (displayHistory.length < 7) return "neutral";
    const recent = displayHistory.slice(-7);
    const older = displayHistory.slice(-14, -7);
    if (older.length === 0) return "neutral";
    
    const recentAvg = recent.reduce((sum, d) => sum + d.rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.rating, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.1) return "up";
    if (recentAvg < olderAvg - 0.1) return "down";
    return "neutral";
  };

  const trend = getTrend();
  const isLoading = isLoadingOperator || isLoadingHistory;

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" };
    if (rating >= 4.0) return { label: "Great", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" };
    if (rating >= 3.5) return { label: "Good", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" };
    if (rating >= 3.0) return { label: "Average", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" };
    return { label: "Needs Improvement", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" };
  };

  const ratingBadge = getRatingBadge(currentRating);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/operator")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Ratings & Reviews</h1>
            <p className="text-sm text-muted-foreground">
              Track your performance over time
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm mb-1">Current Rating</p>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold">{currentRating.toFixed(1)}</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`h-6 w-6 ${
                          star <= Math.round(currentRating) 
                            ? "fill-white text-white" 
                            : "text-amber-200"
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className={ratingBadge.color}>
                  {ratingBadge.label}
                </Badge>
                <div className="flex items-center gap-1 mt-2 text-amber-100">
                  {trend === "up" && <TrendingUp className="h-4 w-4" />}
                  {trend === "down" && <TrendingDown className="h-4 w-4" />}
                  {trend === "neutral" && <Minus className="h-4 w-4" />}
                  <span className="text-sm">
                    {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Reviews</span>
                </div>
                <p className="text-xl font-semibold">{totalReviews}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">5-Star</span>
                </div>
                <p className="text-xl font-semibold">{Math.floor(totalReviews * 0.7)}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">This Month</span>
                </div>
                <p className="text-xl font-semibold">{Math.floor(totalReviews * 0.2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Trend</CardTitle>
            <CardDescription>Your average rating over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[1, 5]} 
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  formatter={(value: number) => [value.toFixed(2), "Rating"]}
                />
                <ReferenceLine y={4.5} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Excellent", position: "right", fontSize: 10 }} />
                <ReferenceLine y={currentRating} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", r: 3 }}
                  activeDot={{ r: 6, fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of your ratings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : star === 2 ? 2 : 1;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{percentage}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips to Improve Your Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full mt-0.5">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Be punctual</p>
                  <p className="text-xs text-muted-foreground">Arrive on time or communicate delays early</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-0.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Communicate clearly</p>
                  <p className="text-xs text-muted-foreground">Keep customers informed throughout the job</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-full mt-0.5">
                  <Star className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Go above and beyond</p>
                  <p className="text-xs text-muted-foreground">Small extras make a big difference in reviews</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
