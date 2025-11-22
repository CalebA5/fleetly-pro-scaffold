import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  DollarSign,
  User,
  Search,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const STATUS_COLORS = {
  pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  operator_pending: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  operator_accepted: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  operator_declined: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  in_progress: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  completed: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
};

const STATUS_ICONS = {
  pending: Clock,
  operator_pending: Clock,
  operator_accepted: CheckCircle,
  operator_declined: XCircle,
  in_progress: AlertCircle,
  completed: CheckCircle
};

export default function RequestStatus() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("all");

  // CRITICAL: Fetch only THIS customer's requests using server-side filtering
  const { data: requests, isLoading } = useQuery({
    queryKey: ['/api/service-requests', 'customer', user?.customerId],
    queryFn: async () => {
      if (!user?.customerId) {
        throw new Error("No customer ID");
      }
      const response = await fetch(`/api/service-requests?customerId=${user.customerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      return response.json();
    },
    enabled: !!user?.customerId
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your requests.</p>
        </Card>
      </div>
    );
  }

  const groupedRequests = {
    all: requests || [],
    pending: (requests || []).filter((r: any) => 
      r.status === 'pending' || r.status === 'operator_pending'
    ),
    accepted: (requests || []).filter((r: any) => 
      r.status === 'assigned' || r.status === 'in_progress'
    ),
    declined: (requests || []).filter((r: any) => r.status === 'operator_declined'),
    completed: (requests || []).filter((r: any) => r.status === 'completed')
  };

  const RequestCard = ({ request }: { request: any }) => {
    const StatusIcon = STATUS_ICONS[request.status as keyof typeof STATUS_ICONS] || Clock;
    const isDeclined = request.status === 'operator_declined';
    // FIX: Check if job is trackable (assigned/in_progress with OR without selectedQuoteId)
    // Some jobs may be assigned without going through quote flow
    const isAssigned = request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed';
    
    const handleViewDetails = () => {
      // For assigned jobs, navigate to job tracking page
      // No need to check selectedQuoteId - just use requestId
      if (isAssigned) {
        setLocation(`/customer/job-tracking?requestId=${request.requestId}`);
      } else {
        // For other statuses, just show details (could open a modal)
        console.log("View details for", request.requestId);
      }
    };

    return (
      <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {request.serviceType}
                </h3>
                {request.isEmergency === 1 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    EMERGENCY
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Request ID: {request.requestId}
              </p>
            </div>
            <Badge className={`${STATUS_COLORS[request.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {request.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">{request.location}</span>
          </div>

          {/* Budget */}
          {request.budgetRange && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{request.budgetRange}</span>
            </div>
          )}

          {/* Operator Info (if assigned) */}
          {request.operatorName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                Operator: {request.operatorName}
              </span>
            </div>
          )}

          {/* Timeline */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
          </div>

          {/* Declined Info */}
          {isDeclined && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
                This request was declined
              </p>
              {request.declineReason && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  Reason: {request.declineReason.replace(/_/g, ' ')}
                </p>
              )}
              {request.declineNotes && (
                <p className="text-sm text-red-700 dark:text-red-300">
                  "{request.declineNotes}"
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isAssigned ? (
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleViewDetails}
                data-testid={`button-track-job-${request.requestId}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Track Job Progress
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleViewDetails}
                data-testid={`button-view-details-${request.requestId}`}
              >
                View Details
              </Button>
            )}
            {isDeclined && (
              <Button
                size="sm"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                data-testid={`button-find-alternative-${request.requestId}`}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Alternative Operator
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track the status of all your service requests
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({groupedRequests.all.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({groupedRequests.pending.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" data-testid="tab-accepted">
              Accepted ({groupedRequests.accepted.length})
            </TabsTrigger>
            <TabsTrigger value="declined" data-testid="tab-declined">
              Declined ({groupedRequests.declined.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({groupedRequests.completed.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading requests...</span>
            </div>
          ) : (
            Object.entries(groupedRequests).map(([tab, tabRequests]) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {tabRequests.length === 0 ? (
                  <Card className="p-12 text-center bg-white dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                      No {tab !== 'all' ? tab : ''} requests found
                    </p>
                  </Card>
                ) : (
                  tabRequests.map((request: any) => (
                    <RequestCard key={request.requestId} request={request} />
                  ))
                )}
              </TabsContent>
            ))
          )}
        </Tabs>
      </div>
    </div>
  );
}
