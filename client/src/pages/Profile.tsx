import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Star, TrendingUp, Award, DollarSign, CheckCircle } from "lucide-react";
import type { ServiceRequest, Operator, OperatorTierStats } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";

export const Profile = () => {
  const { user } = useAuth();

  // Fetch operator data if user has operatorId
  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<Operator>({
    queryKey: user?.operatorId ? [`/api/operators/by-id/${user.operatorId}`] : [],
    enabled: !!user?.operatorId,
  });

  // Fetch all service requests for customer stats
  const { data: serviceRequests, isLoading: isLoadingRequests } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });

  // Fetch tier stats if operator
  const { data: tierStats, isLoading: isLoadingTierStats } = useQuery<OperatorTierStats[]>({
    queryKey: user?.operatorId ? [`/api/operators/by-id/${user.operatorId}/tier-stats`] : [],
    enabled: !!user?.operatorId,
  });

  // Calculate customer stats
  const customerRequests = serviceRequests?.filter(req => req.customerId === user?.id) || [];
  const completedRequests = customerRequests.filter(req => req.status === "completed");
  const pendingRequests = customerRequests.filter(req => req.status === "pending");

  const isLoading = isLoadingOperator || isLoadingRequests || isLoadingTierStats;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please sign in to view your profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-page-title">
                My Profile
              </h1>
              <p className="text-muted-foreground">Your account overview and statistics</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <Card className="border-2 border-orange-200 dark:border-orange-900">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl" data-testid="text-user-name">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Active Member</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-700 dark:text-gray-300" data-testid="text-email">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-700 dark:text-gray-300" data-testid="text-phone">{operatorData?.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-700 dark:text-gray-300 font-mono text-xs" data-testid="text-user-id">ID: {user.id}</span>
                  </div>
                </div>

                {user.operatorId && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-xs" data-testid="text-operator-id">Operator ID: {user.operatorId}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Role Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-600" />
                  Your Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm py-1 px-3">
                  🛒 Customer
                </Badge>
                {operatorData && operatorData.subscribedTiers.map((tier) => {
                  const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                  return (
                    <Badge 
                      key={tier}
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-sm py-1 px-3"
                      data-testid={`badge-tier-${tier}`}
                    >
                      {tierInfo.badge} {tierInfo.label}
                    </Badge>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Statistics */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Activity
                </CardTitle>
                <CardDescription>Your service request history and statistics</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-sm font-medium">Total Requests</span>
                    </div>
                    <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-total-requests">{customerRequests.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-completed-requests">{completedRequests.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-pending-requests">{pendingRequests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operator Statistics - Show if user is an operator */}
            {operatorData && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Operator Performance
                  </CardTitle>
                  <CardDescription>Your earnings and statistics across all tiers</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                        <Star className="w-5 h-5" />
                        <span className="text-sm font-medium">Overall Rating</span>
                      </div>
                      <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-operator-rating">
                        {operatorData.rating ? Number(operatorData.rating).toFixed(1) : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Total Jobs</span>
                      </div>
                      <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-operator-jobs">{operatorData.totalJobs}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Total Earnings</span>
                      </div>
                      <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-operator-earnings">
                        ${tierStats?.reduce((sum, stat) => sum + Number(stat.totalEarnings), 0).toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Tier-Specific Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Performance by Tier</h3>
                    {operatorData.subscribedTiers.map((tier) => {
                      const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                      const stats = tierStats?.find(s => s.tier === tier);
                      
                      const tierColors = {
                        professional: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800",
                        equipped: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800",
                        manual: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800",
                      };

                      return (
                        <div 
                          key={tier}
                          className={`bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]} p-4 rounded-lg border`}
                          data-testid={`tier-stats-${tier}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{tierInfo.badge}</span>
                              <div>
                                <h4 className="font-semibold text-black dark:text-white">{tierInfo.label}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{tierInfo.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {tierInfo.pricingMultiplier}x pricing
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Jobs</p>
                              <p className="text-lg font-bold text-black dark:text-white" data-testid={`text-${tier}-jobs`}>
                                {stats?.jobsCompleted || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Earnings</p>
                              <p className="text-lg font-bold text-black dark:text-white" data-testid={`text-${tier}-earnings`}>
                                ${Number(stats?.totalEarnings || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                              <p className="text-lg font-bold text-black dark:text-white flex items-center gap-1" data-testid={`text-${tier}-rating`}>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {stats?.rating ? Number(stats.rating).toFixed(1) : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
