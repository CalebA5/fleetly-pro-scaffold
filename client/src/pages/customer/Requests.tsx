import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ArrowLeft, Calendar, MapPin, Clock, User, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { ServiceRequest } from "@shared/schema";

export const Requests = () => {
  const { user } = useAuth();
  const customerId = user?.id || "CUST-001";

  const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });

  const myRequests = requests.filter(req => req.customerId === customerId);
  const activeRequests = myRequests.filter(req => ['pending', 'accepted', 'in_progress'].includes(req.status));
  const completedRequests = myRequests.filter(req => req.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'accepted': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'pending': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white" data-testid="text-page-title">
              My Requests
            </h1>
            <p className="text-muted-foreground mt-1">Track all your service requests</p>
          </div>
          <Link href="/customer/create-request">
            <Button variant="hero" data-testid="button-new-request">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-black dark:text-white">{myRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{activeRequests.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {myRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first service request to get started
                </p>
                <Link href="/customer/create-request">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Request
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow" data-testid={`request-card-${request.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1" data-testid={`text-service-${request.id}`}>
                            {request.serviceType}
                          </h3>
                          {request.isEmergency && (
                            <Badge variant="destructive" className="text-xs mb-1">
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {request.operatorName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{request.operatorName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{format(new Date(request.requestedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                      </div>

                      {request.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};
