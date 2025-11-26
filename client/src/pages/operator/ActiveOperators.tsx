import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Users, MapPin, Star, Phone, 
  Truck, Clock, CheckCircle, Circle
} from "lucide-react";
import type { Operator } from "@shared/schema";

export default function ActiveOperators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const operatorId = user?.operatorId;
  const businessId = user?.businessId;

  const { data: activeOperators = [], isLoading } = useQuery<Operator[]>({
    queryKey: ["/api/operators/active", businessId],
    enabled: !!businessId,
  });

  const { data: allBusinessOperators = [] } = useQuery<Operator[]>({
    queryKey: ["/api/businesses", businessId, "operators"],
    enabled: !!businessId,
  });

  const onlineCount = activeOperators.length;
  const totalCount = allBusinessOperators.length || onlineCount;

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
            <h1 className="font-semibold text-lg">Active Operators</h1>
            <p className="text-sm text-muted-foreground">
              {onlineCount} of {totalCount} operators online
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300">Online Now</p>
                  <p className="text-2xl font-bold text-cyan-800 dark:text-cyan-200">
                    {onlineCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Total Team</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {totalCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            Currently Online
          </h2>
          
          {activeOperators.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No Operators Online</h3>
                <p className="text-sm text-muted-foreground">
                  Your team operators will appear here when they go online
                </p>
              </CardContent>
            </Card>
          ) : (
            activeOperators.map((operator) => (
              <Card 
                key={operator.id} 
                className="overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`operator-card-${operator.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={operator.photo || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg">
                          {operator.name?.charAt(0) || "O"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{operator.name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Online
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {operator.rating ? parseFloat(String(operator.rating)).toFixed(1) : "New"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {operator.totalJobs || 0} jobs
                        </span>
                      </div>

                      {operator.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{operator.address}</span>
                        </div>
                      )}

                      {operator.vehicle && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Truck className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{operator.vehicle}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (operator.phone) {
                          window.location.href = `tel:${operator.phone}`;
                        }
                      }}
                      disabled={!operator.phone}
                      data-testid={`button-call-${operator.id}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/operator/assign-job/${operator.operatorId}`)}
                      data-testid={`button-assign-${operator.id}`}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {allBusinessOperators.length > activeOperators.length && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
              Offline
            </h2>
            
            {allBusinessOperators
              .filter(op => !activeOperators.some(ao => ao.id === op.id))
              .map((operator) => (
                <Card 
                  key={operator.id} 
                  className="overflow-hidden opacity-60"
                  data-testid={`operator-card-offline-${operator.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={operator.photo || undefined} />
                        <AvatarFallback className="bg-gray-300 text-gray-600">
                          {operator.name?.charAt(0) || "O"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{operator.name}</h3>
                          <Badge variant="outline" className="text-gray-500">
                            Offline
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last seen recently</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
