import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, CheckCircle, Clock, MapPin, DollarSign, 
  Star, Camera, MessageSquare, User, Loader2 
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import type { ServiceRequest } from "@shared/schema";

export default function CompletedToday() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const operatorId = user?.operatorId;

  const { data: completedJobs = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/completed-today", operatorId],
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
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/completed-today"] });
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

  const totalEarnings = completedJobs.reduce((sum, job) => {
    const price = typeof job.details === 'object' && job.details && 'quotedPrice' in job.details 
      ? parseFloat(String(job.details.quotedPrice) || "0") 
      : 0;
    return sum + price;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
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
            <h1 className="font-semibold text-lg">Completed Today</h1>
            <p className="text-sm text-muted-foreground">
              {completedJobs.length} jobs completed
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">Total Earned</p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    ${totalEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Jobs Done</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {completedJobs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Today's Jobs</h2>
          
          {completedJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No Completed Jobs Today</h3>
                <p className="text-sm text-muted-foreground">
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
                  className="overflow-hidden hover:shadow-md transition-shadow"
                  data-testid={`completed-job-${job.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            {job.serviceType}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.completedAt && format(new Date(job.completedAt), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {job.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                          ${jobPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <User className="h-4 w-4" />
                      <span>Customer #{job.customerId}</span>
                    </div>

                    {canReview && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowReviewDialog(true);
                          }}
                          data-testid={`button-review-${job.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Leave Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Photo upload will be available soon.",
                            });
                          }}
                          data-testid={`button-photo-${job.id}`}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Add Photos
                        </Button>
                      </div>
                    )}

                    {!canReview && job.completedAt && (
                      <p className="text-xs text-muted-foreground pt-3 border-t text-center">
                        Review window expired (8 hours after completion)
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience working with this customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Rating</p>
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
                          : "text-gray-300"
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Your Review</p>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was your experience with this customer?"
                rows={4}
                data-testid="input-review"
              />
            </div>
          </div>
          
          <DialogFooter>
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
