import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, Package, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface AcceptedJob {
  id: number;
  acceptedJobId: string;
  operatorId: string;
  tier: string;
  status: string;
  jobData: any;
  actualEarnings: string | null;
  completedAt: string | null;
  acceptedAt: string;
}

interface JobHistoryResponse {
  jobs: AcceptedJob[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const JobHistory = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const operatorId = user?.operatorId;
  
  // Filters
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  
  // Fetch job history from database
  const { data: historyData, isLoading, isError } = useQuery<JobHistoryResponse>({
    queryKey: ["/api/operators", operatorId, "job-history", selectedTier, currentPage],
    queryFn: async () => {
      if (!operatorId) return { jobs: [], pagination: { total: 0, limit, offset: 0, hasMore: false } };
      
      const offset = (currentPage - 1) * limit;
      const tierParam = selectedTier !== "all" ? `&tier=${selectedTier}` : "";
      const response = await fetch(
        `/api/operators/${operatorId}/job-history?limit=${limit}&offset=${offset}${tierParam}`
      );
      if (!response.ok) throw new Error("Failed to fetch job history");
      return response.json();
    },
    enabled: !!operatorId,
  });
  
  const jobs = historyData?.jobs || [];
  const pagination = historyData?.pagination || { total: 0, limit, offset: 0, hasMore: false };
  const totalPages = Math.ceil(pagination.total / limit);
  
  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "professional":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "equipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "manual":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };
  
  const formatEarnings = (earnings: string | number | null) => {
    if (!earnings) return "$0.00";
    const numericValue = typeof earnings === 'string' ? parseFloat(earnings) : earnings;
    return isNaN(numericValue) ? "$0.00" : `$${numericValue.toFixed(2)}`;
  };
  
  const getServiceTypeFromJob = (jobData: any) => {
    return jobData?.serviceType || jobData?.service || "Service";
  };
  
  const getCustomerNameFromJob = (jobData: any) => {
    return jobData?.customerName || "Customer";
  };
  
  const getLocationFromJob = (jobData: any) => {
    return jobData?.location || "N/A";
  };

  if (!user || user.role !== "operator") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in as an operator to view job history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setLocation("/drive-earn")}
            data-testid="button-back-to-dashboard"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Job History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your completed jobs and earnings
          </p>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tier
                </label>
                <Select value={selectedTier} onValueChange={(value) => { setSelectedTier(value); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="equipped">Skilled & Equipped</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Completed
                </label>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pagination.total}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Job List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading job history...</p>
            </div>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">
                Failed to load job history. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No completed jobs yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete jobs to see them appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTierBadgeColor(job.tier)}>
                          {job.tier.charAt(0).toUpperCase() + job.tier.slice(1)}
                        </Badge>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getServiceTypeFromJob(job.jobData)}
                        </h3>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{getLocationFromJob(job.jobData)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {job.completedAt
                              ? format(new Date(job.completedAt), "MMM dd, yyyy 'at' h:mm a")
                              : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Customer: </span>
                          {getCustomerNameFromJob(job.jobData)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        <DollarSign className="h-6 w-6" />
                        {formatEarnings(job.actualEarnings)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Job #{job.id}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
