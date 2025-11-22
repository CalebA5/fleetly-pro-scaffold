import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, User, Mail, Phone, Briefcase, Star, TrendingUp, Award, 
  DollarSign, CheckCircle, ChevronRight, ChevronDown, Edit, Truck, 
  FileText, Clock, AlertCircle, Shield, Package
} from "lucide-react";
import type { ServiceRequest, Operator, OperatorTierStats, OperatorTierProfile, TierApprovalStatus } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Profile = () => {
  const { user } = useAuth();
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

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

  // Parse tier profiles from operator data
  const tierProfiles = (operatorData?.operatorTierProfiles as OperatorTierProfile[] | undefined) || [];
  const hasAnyTier = operatorData && operatorData.subscribedTiers.length > 0;

  // Get approval status badge
  const getApprovalStatusBadge = (status: TierApprovalStatus | undefined) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "under_review":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Not Submitted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Mobile-Optimized Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-3" data-testid="button-back">
              <ArrowLeft style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-page-title">
              My Profile
            </h1>
            <p className="text-sm text-muted-foreground">Your account overview and statistics</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* User Info Card - Mobile Optimized */}
          <Card className="border-2 border-orange-200 dark:border-orange-900">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl" data-testid="text-user-name">{user.name}</CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">Active Member</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                  🛒 Customer
                </Badge>
                {hasAnyTier && operatorData.subscribedTiers.map((tier) => {
                  const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                  return (
                    <Badge 
                      key={tier}
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs"
                      data-testid={`badge-tier-${tier}`}
                    >
                      {tierInfo.badge} {tierInfo.label}
                    </Badge>
                  );
                })}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-300 truncate" data-testid="text-email">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-300" data-testid="text-phone">{operatorData?.phone || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Activity - Interactive Sections */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} />
                Customer Activity
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Tap any stat to view details</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Requests - Clickable */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button 
                      className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800 text-left transition-all active:scale-98 hover:shadow-md"
                      data-testid="button-total-requests"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                          <Briefcase style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                          <span className="text-xs md:text-sm font-medium">Total Requests</span>
                        </div>
                        <ChevronRight style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-400" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-black dark:text-white" data-testid="text-total-requests">{customerRequests.length}</p>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>All Service Requests</SheetTitle>
                      <SheetDescription>Your complete request history</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(85vh-120px)]">
                      {customerRequests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">No requests yet</p>
                      ) : (
                        customerRequests.map((req) => (
                          <Card key={req.id} className="border" data-testid={`card-request-${req.id}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm">{req.serviceType}</CardTitle>
                                <Badge variant={req.status === "completed" ? "default" : "outline"} className="text-xs">
                                  {req.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">{req.requestId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1 text-xs">
                              <p className="text-muted-foreground">{req.location}</p>
                              {req.estimatedCost && (
                                <p className="text-green-600 dark:text-green-400 font-semibold">${Number(req.estimatedCost).toFixed(2)}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Completed - Clickable */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button 
                      className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800 text-left transition-all active:scale-98 hover:shadow-md"
                      data-testid="button-completed-requests"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                          <CheckCircle style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                          <span className="text-xs md:text-sm font-medium">Completed</span>
                        </div>
                        <ChevronRight style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-green-400" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-black dark:text-white" data-testid="text-completed-requests">{completedRequests.length}</p>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>Completed Requests</SheetTitle>
                      <SheetDescription>All successfully completed services</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(85vh-120px)]">
                      {completedRequests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">No completed requests yet</p>
                      ) : (
                        completedRequests.map((req) => (
                          <Card key={req.id} className="border-green-200 dark:border-green-800" data-testid={`card-completed-${req.id}`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {req.serviceType}
                              </CardTitle>
                              <CardDescription className="text-xs">{req.requestId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1 text-xs">
                              <p className="text-muted-foreground">{req.location}</p>
                              {req.estimatedCost && (
                                <p className="text-green-600 dark:text-green-400 font-semibold">Cost: ${Number(req.estimatedCost).toFixed(2)}</p>
                              )}
                              {req.operatorName && <p className="text-xs">Operator: {req.operatorName}</p>}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Pending - Clickable */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button 
                      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-left transition-all active:scale-98 hover:shadow-md"
                      data-testid="button-pending-requests"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                          <TrendingUp style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
                          <span className="text-xs md:text-sm font-medium">Pending</span>
                        </div>
                        <ChevronRight style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-blue-400" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-black dark:text-white" data-testid="text-pending-requests">{pendingRequests.length}</p>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>Pending Requests</SheetTitle>
                      <SheetDescription>Requests waiting for operator assignment</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(85vh-120px)]">
                      {pendingRequests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">No pending requests</p>
                      ) : (
                        pendingRequests.map((req) => (
                          <Card key={req.id} className="border-blue-200 dark:border-blue-800" data-testid={`card-pending-${req.id}`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                {req.serviceType}
                              </CardTitle>
                              <CardDescription className="text-xs">{req.requestId}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-1 text-xs">
                              <p className="text-muted-foreground">{req.location}</p>
                              {req.estimatedCost && (
                                <p className="text-green-600 dark:text-green-400 font-semibold">${Number(req.estimatedCost).toFixed(2)}</p>
                              )}
                              <p className="text-xs text-blue-600">Waiting for operator</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>

          {/* Operator Performance - Only show if registered for any tier */}
          {hasAnyTier && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} />
                  Operator Performance
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Your earnings and statistics across all tiers</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Tier-Specific Sections - Expandable */}
                <div className="space-y-3">
                  {operatorData.subscribedTiers.map((tier) => {
                    const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                    const stats = tierStats?.find(s => s.tier === tier);
                    const tierProfile = tierProfiles.find(p => p.tier === tier);
                    const isExpanded = expandedTier === tier;
                    
                    const tierColors = {
                      professional: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800",
                      equipped: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800",
                      manual: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800",
                    };

                    return (
                      <div 
                        key={tier}
                        className={`bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]} rounded-lg border overflow-hidden`}
                        data-testid={`tier-section-${tier}`}
                      >
                        {/* Tier Header - Clickable */}
                        <button
                          onClick={() => setExpandedTier(isExpanded ? null : tier)}
                          className="w-full p-4 text-left transition-all active:scale-98"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl md:text-2xl">{tierInfo.badge}</span>
                              <div>
                                <h4 className="font-semibold text-black dark:text-white text-sm md:text-base">{tierInfo.label}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{tierInfo.description}</p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} />
                            ) : (
                              <ChevronRight style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} />
                            )}
                          </div>

                          {/* Approval Status Badge */}
                          <div className="mb-3">
                            {getApprovalStatusBadge(tierProfile?.approvalStatus)}
                          </div>
                          
                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Jobs</p>
                              <p className="text-lg md:text-xl font-bold text-black dark:text-white" data-testid={`text-${tier}-jobs`}>
                                {stats?.jobsCompleted || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Earnings</p>
                              <p className="text-lg md:text-xl font-bold text-black dark:text-white" data-testid={`text-${tier}-earnings`}>
                                ${Number(stats?.totalEarnings || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                              <p className="text-lg md:text-xl font-bold text-black dark:text-white flex items-center gap-1" data-testid={`text-${tier}-rating`}>
                                <Star style={{ width: 'clamp(0.75rem, 2.5vw, 0.875rem)', height: 'clamp(0.75rem, 2.5vw, 0.875rem)' }} className="fill-yellow-400 text-yellow-400" />
                                {stats?.rating ? Number(stats.rating).toFixed(1) : "N/A"}
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Expanded Content - Tier Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            {/* Approval Status Details */}
                            <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                              <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Shield style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600" />
                                Verification Status
                              </h5>
                              {tierProfile?.approvalStatus === "approved" && tierProfile?.canEarn ? (
                                <div className="space-y-1 text-xs">
                                  <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified & Active - You can start earning!
                                  </p>
                                  {tierProfile.approvedAt && (
                                    <p className="text-muted-foreground">Approved on: {new Date(tierProfile.approvedAt).toLocaleDateString()}</p>
                                  )}
                                </div>
                              ) : tierProfile?.approvalStatus === "under_review" ? (
                                <div className="space-y-1 text-xs">
                                  <p className="text-blue-600 dark:text-blue-400 font-semibold">Your documents are being reviewed</p>
                                  <p className="text-muted-foreground">This typically takes 2-3 business days</p>
                                </div>
                              ) : tierProfile?.approvalStatus === "pending" ? (
                                <div className="space-y-1 text-xs">
                                  <p className="text-yellow-600 dark:text-yellow-400 font-semibold">Pending approval</p>
                                  <p className="text-muted-foreground">Submit your documents to start the verification process</p>
                                </div>
                              ) : tierProfile?.approvalStatus === "rejected" ? (
                                <div className="space-y-1 text-xs">
                                  <p className="text-red-600 dark:text-red-400 font-semibold">Verification rejected</p>
                                  {tierProfile.rejectionReason && <p className="text-muted-foreground">Reason: {tierProfile.rejectionReason}</p>}
                                </div>
                              ) : (
                                <div className="space-y-1 text-xs">
                                  <p className="text-muted-foreground">Complete onboarding and submit documents to get verified</p>
                                </div>
                              )}
                            </div>

                            {/* Business Information */}
                            {tierProfile?.businessName && (
                              <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Briefcase style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600" />
                                  Business Details
                                </h5>
                                <div className="space-y-1 text-xs">
                                  <p><span className="font-medium">Business Name:</span> {tierProfile.businessName}</p>
                                  {tierProfile.businessLicense && <p><span className="font-medium">License #:</span> {tierProfile.businessLicense}</p>}
                                </div>
                              </div>
                            )}

                            {/* Vehicle Information */}
                            {tierProfile?.vehicle && (
                              <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Truck style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600" />
                                  Vehicle Details
                                </h5>
                                <div className="space-y-1 text-xs">
                                  <p><span className="font-medium">Vehicle:</span> {tierProfile.vehicle}</p>
                                  {tierProfile.licensePlate && <p><span className="font-medium">License Plate:</span> {tierProfile.licensePlate}</p>}
                                </div>
                              </div>
                            )}

                            {/* Services Offered */}
                            {tierProfile?.services && tierProfile.services.length > 0 && (
                              <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Package style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="text-orange-600" />
                                  Services
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {tierProfile.services.map((service, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{service}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Edit Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                // TODO: Navigate to tier-specific edit/onboarding form
                                console.log('Edit tier:', tier);
                              }}
                              data-testid={`button-edit-${tier}`}
                            >
                              <Edit style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} className="mr-2" />
                              Edit {tierInfo.label} Info
                            </Button>
                          </div>
                        )}
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
  );
};
