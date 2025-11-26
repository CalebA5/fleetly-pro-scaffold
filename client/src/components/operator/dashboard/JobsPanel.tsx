import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, Clock, DollarSign, Filter, Search, Briefcase,
  CheckCircle, AlertCircle, Truck, Users, ChevronRight,
  Calendar, Wrench
} from "lucide-react";
import type { OperatorTier, ServiceRequest } from "@shared/schema";
import { TIER_CAPABILITIES, canAccessFeature } from "@shared/tierCapabilities";

interface JobsPanelProps {
  tier: OperatorTier;
  operatorId: string;
  isOnline: boolean;
  onViewJob?: (jobId: string) => void;
  onAcceptJob?: (jobId: string) => void;
  onDeclineJob?: (jobId: string, reason: string) => void;
  onSubmitQuote?: (jobId: string) => void;
}

interface CustomerGroup {
  id: string;
  name: string;
  location: string;
  distance: number;
  jobCount: number;
  isLocked: boolean;
}

export function JobsPanel({ 
  tier, 
  operatorId,
  isOnline,
  onViewJob,
  onAcceptJob,
  onDeclineJob,
  onSubmitQuote
}: JobsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");

  const tierInfo = TIER_CAPABILITIES[tier];
  const hasScheduledJobs = canAccessFeature(tier, "scheduledJobs");
  const hasJobFiltering = canAccessFeature(tier, "jobFiltering");
  const hasJobAssignment = canAccessFeature(tier, "jobAssignment");

  const { data: nearbyJobs = [], isLoading: isLoadingNearby } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/nearby", operatorId, tier],
    enabled: isOnline,
  });

  const { data: activeJobs = [], isLoading: isLoadingActive } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/operators", operatorId, "active-jobs"],
  });

  const { data: customerGroups = [], isLoading: isLoadingGroups } = useQuery<CustomerGroup[]>({
    queryKey: ["/api/operators", operatorId, "customer-groups"],
    enabled: canAccessFeature(tier, "customerGroups"),
  });

  const filteredNearbyJobs = nearbyJobs.filter(job => {
    if (searchQuery && !job.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (serviceFilter !== "all" && job.serviceType !== serviceFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4" data-testid="jobs-panel">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted/50">
            <TabsTrigger value="nearby" className="text-xs sm:text-sm" data-testid="jobs-subtab-nearby">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nearby</span>
              <span className="sm:hidden">Near</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm" data-testid="jobs-subtab-active">
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs sm:text-sm" data-testid="jobs-subtab-groups">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Groups
            </TabsTrigger>
          </TabsList>

          {hasJobFiltering && activeSubTab === "nearby" && (
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="jobs-search-input"
                />
              </div>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-[140px] h-9" data-testid="jobs-service-filter">
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
          )}
        </div>

        <TabsContent value="nearby" className="mt-0">
          {!isOnline ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">You're Currently Offline</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Go online to see job requests in your area. Jobs within {tierInfo.radiusKm || "unlimited"}km will appear here.
                </p>
              </CardContent>
            </Card>
          ) : isLoadingNearby ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredNearbyJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">No Jobs Available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  There are no job requests in your area right now. Stay online and we'll notify you when new jobs come in.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredNearbyJobs.map((job, index) => (
                  <JobCard
                    key={job.requestId || `nearby-job-${index}`}
                    job={job}
                    tier={tier}
                    onView={() => onViewJob?.(job.requestId)}
                    onAccept={() => onAcceptJob?.(job.requestId)}
                    onDecline={(reason) => onDeclineJob?.(job.requestId, reason)}
                    onQuote={() => onSubmitQuote?.(job.requestId)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {isLoadingActive ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : activeJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Active Jobs</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You don't have any active jobs at the moment. Accept a job from the Nearby tab to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {activeJobs.map((job, index) => (
                  <ActiveJobCard
                    key={job.requestId || `active-job-${index}`}
                    job={job}
                    onView={() => onViewJob?.(job.requestId)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          {isLoadingGroups ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : customerGroups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Unlock Customer Groups</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Complete 5 jobs in this tier to unlock access to nearby customer groups for more efficient job routing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customerGroups.map((group) => (
                <CustomerGroupCard
                  key={group.id}
                  group={group}
                  isLocked={group.isLocked}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {hasScheduledJobs && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Scheduled Jobs
              </CardTitle>
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage your scheduled jobs for upcoming days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JobCard({ 
  job, 
  tier,
  onView, 
  onAccept, 
  onDecline,
  onQuote 
}: { 
  job: ServiceRequest;
  tier: OperatorTier;
  onView: () => void;
  onAccept: () => void;
  onDecline: (reason: string) => void;
  onQuote: () => void;
}) {
  const isEmergency = job.isEmergency === 1;
  
  return (
    <Card 
      className={`overflow-hidden transition-all hover:shadow-md ${
        isEmergency ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" : ""
      }`}
      data-testid={`job-card-${job.requestId}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isEmergency && (
                <Badge variant="destructive" className="text-xs">
                  Emergency
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {job.serviceType}
              </Badge>
            </div>
            <p className="text-sm font-medium line-clamp-2 mb-2">
              {job.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
              {job.estimatedCost && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${Number(job.estimatedCost).toFixed(0)}
                </span>
              )}
              {job.preferredTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.preferredTime}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              onClick={onQuote}
              data-testid={`job-quote-btn-${job.requestId}`}
            >
              Quote
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onView}
              data-testid={`job-view-btn-${job.requestId}`}
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveJobCard({ 
  job, 
  onView 
}: { 
  job: ServiceRequest;
  onView: () => void;
}) {
  const status = job.status || "pending";
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-500";
      case "assigned": return "bg-green-500";
      case "operator_accepted": return "bg-yellow-500";
      case "pending": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
      onClick={onView}
      data-testid={`active-job-card-${job.requestId}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
            <div>
              <p className="font-medium text-sm">{job.serviceType || "Service"}</p>
              <p className="text-xs text-muted-foreground">{job.location || "Location pending"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {status.replace(/_/g, " ")}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerGroupCard({ 
  group, 
  isLocked 
}: { 
  group: CustomerGroup;
  isLocked: boolean;
}) {
  return (
    <Card 
      className={`overflow-hidden transition-all ${
        isLocked ? "opacity-60" : "cursor-pointer hover:shadow-md"
      }`}
      data-testid={`customer-group-${group.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{group.name}</p>
            <p className="text-xs text-muted-foreground">{group.distance}km away</p>
          </div>
          <div className="text-right">
            <Badge variant={isLocked ? "outline" : "default"} className="text-xs">
              {isLocked ? "🔒 Locked" : `${group.jobCount} jobs`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
