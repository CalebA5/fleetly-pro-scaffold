import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, Calendar as CalendarIcon, Filter, Clock, DollarSign,
  MapPin, Star, CheckCircle, XCircle, ChevronRight
} from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import type { OperatorTier, ServiceRequest } from "@shared/schema";

interface CompletedJob {
  requestId: string;
  serviceType: string;
  description?: string;
  location: string;
  status: string;
  completedAt?: string;
  earnings: number;
  customerRating?: number;
  customerReview?: string;
}

interface HistoryPanelProps {
  tier: OperatorTier;
  operatorId: string;
  onViewJob?: (jobId: string) => void;
}

export function HistoryPanel({ tier, operatorId, onViewJob }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: jobHistory = [], isLoading } = useQuery<CompletedJob[]>({
    queryKey: ["/api/operators", operatorId, "job-history"],
  });

  const filteredJobs = jobHistory.filter(job => {
    if (searchQuery && 
        !job.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.location?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (serviceFilter !== "all" && job.serviceType !== serviceFilter) {
      return false;
    }
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }
    if (job.completedAt) {
      const jobDate = new Date(job.completedAt);
      if (!isWithinInterval(jobDate, { start: dateRange.from, end: dateRange.to })) {
        return false;
      }
    }
    return true;
  });

  const totalEarnings = filteredJobs.reduce((sum, job) => sum + (job.earnings || 0), 0);
  const completedCount = filteredJobs.filter(j => j.status === "completed").length;
  const cancelledCount = filteredJobs.filter(j => j.status === "cancelled").length;
  const avgRating = filteredJobs.reduce((sum, job) => 
    sum + (job.customerRating || 0), 0) / (filteredJobs.filter(j => j.customerRating).length || 1);

  return (
    <div className="space-y-4" data-testid="history-panel">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="history-search-input"
          />
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" data-testid="history-date-filter">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[130px]" data-testid="history-service-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="snow_plowing">Snow Plowing</SelectItem>
              <SelectItem value="towing">Towing</SelectItem>
              <SelectItem value="hauling">Hauling</SelectItem>
              <SelectItem value="courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Period Earnings</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              ${totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
            <p className="text-xl font-bold text-red-600">{cancelledCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Rating</p>
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              {avgRating.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Job History</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || serviceFilter !== "all" 
                ? "No jobs found matching your filters. Try adjusting your search."
                : "You haven't completed any jobs yet. Accept a job to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredJobs.map((job) => (
              <HistoryJobCard
                key={job.requestId}
                job={job}
                onView={() => onViewJob?.(job.requestId)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function HistoryJobCard({ 
  job, 
  onView 
}: { 
  job: CompletedJob;
  onView: () => void;
}) {
  const isCompleted = job.status === "completed";
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-sm transition-all"
      onClick={onView}
      data-testid={`history-job-${job.requestId}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${
              isCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{job.serviceType}</h4>
                <Badge variant="outline" className="text-xs shrink-0">
                  {job.completedAt ? format(new Date(job.completedAt), "MMM d") : ""}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {job.location}
                </span>
                {job.customerRating && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {job.customerRating}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-semibold ${isCompleted ? "text-green-600" : "text-red-600"}`}>
              {isCompleted ? `+$${job.earnings?.toFixed(2) || "0.00"}` : "Cancelled"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
