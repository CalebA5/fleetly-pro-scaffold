import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  AlertTriangle,
  Eye,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ServiceRequest } from "@shared/schema";

interface NewRequestZoneProps {
  operatorId: string;
  isOnline: boolean;
  onViewRequest: (requestId: string) => void;
}

export function NewRequestZone({ operatorId, isOnline, onViewRequest }: NewRequestZoneProps) {
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: nearbyJobs = [] } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId && isOnline,
    refetchInterval: 30000,
  });

  const newRequestsCount = nearbyJobs.filter(
    (job) => job.status === "pending" && !job.operatorViewedAt
  ).length;

  const recentRequests = nearbyJobs
    .filter((job) => job.status === "pending")
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .slice(0, 3);

  if (!isOnline || recentRequests.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  {newRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                      {newRequestsCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    {newRequestsCount > 0
                      ? `${newRequestsCount} New Request${newRequestsCount !== 1 ? "s" : ""}`
                      : "Recent Requests"}
                  </h3>
                  <p className="text-xs text-orange-600 dark:text-orange-300">
                    {recentRequests.length} request{recentRequests.length !== 1 ? "s" : ""} in your area
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-gray-800 border-orange-300 text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/operator/nearby-jobs");
                  }}
                  data-testid="button-view-all-requests"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-orange-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-orange-600" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {recentRequests.map((request, index) => {
              const isEmergency = request.isEmergency === 1;
              const isNew = !request.operatorViewedAt;
              
              return (
                <Card
                  key={request.requestId || `request-${index}`}
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isEmergency
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30"
                      : isNew
                        ? "border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                  onClick={() => onViewRequest(request.requestId)}
                  data-testid={`new-request-card-${request.requestId}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isEmergency && (
                            <Badge variant="destructive" className="text-xs h-5 animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                          {isNew && !isEmergency && (
                            <Badge className="bg-orange-500 text-white text-xs h-5">NEW</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs h-5">
                            {request.serviceType}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-1 text-gray-900 dark:text-white">
                          {request.description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{request.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {request.budgetRange && (
                          <span className="flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                            <DollarSign className="h-3 w-3" />
                            {request.budgetRange}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRequest(request.requestId);
                          }}
                          data-testid={`button-quick-view-${request.requestId}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
