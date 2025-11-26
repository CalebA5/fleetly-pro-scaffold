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
  FileText, Clock, AlertCircle, Shield, Package, Wrench, MapPin, Plus
} from "lucide-react";
import type { ServiceRequest, Operator, OperatorTierStats, OperatorTierProfile, TierApprovalStatus } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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

  // Parse tier profiles from operator data - ensure it's an array
  const rawTierProfiles = operatorData?.operatorTierProfiles;
  const tierProfiles: OperatorTierProfile[] = Array.isArray(rawTierProfiles) ? rawTierProfiles : [];
  const hasAnyTier = tierProfiles.length > 0 || (operatorData && Array.isArray(operatorData.subscribedTiers) && operatorData.subscribedTiers.length > 0);

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
        {/* Clean Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              My Profile
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and view your activity</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* User Info Card - Clean Design */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 text-xl font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-user-name">{user.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-medium">
                      Customer
                    </Badge>
                    {hasAnyTier && operatorData && Array.isArray(operatorData.subscribedTiers) && operatorData.subscribedTiers.map((tier) => {
                      const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                      if (!tierInfo) return null;
                      return (
                        <Badge 
                          key={tier}
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs font-medium"
                          data-testid={`badge-tier-${tier}`}
                        >
                          {tierInfo.badge} {tierInfo.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="truncate" data-testid="text-email">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span data-testid="text-phone">{operatorData?.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Activity - Clean Design */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Customer Activity</CardTitle>
                </div>
                <InfoTooltip
                  content="Tap any stat to view detailed information about your service requests, completed jobs, and favorites."
                  testId="button-info-customer-activity"
                  ariaLabel="Customer activity information"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                {/* Total Requests - Clickable */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button 
                      className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-left transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm group"
                      data-testid="button-total-requests"
                    >
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Total</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-total-requests">{customerRequests.length}</p>
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
                      className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-left transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:shadow-sm group"
                      data-testid="button-completed-requests"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Completed</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-completed-requests">{completedRequests.length}</p>
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
                      className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-left transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:shadow-sm group"
                      data-testid="button-pending-requests"
                    >
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Pending</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-pending-requests">{pendingRequests.length}</p>
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

          {/* Operator Tiers Section - Clean Design */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Operator Tiers</CardTitle>
                </div>
                <InfoTooltip
                  content="View your operator tier registrations, verification status, and tier-specific information. Only registered tiers can be expanded to see detailed information. Click 'Add Tier' to register for new tiers."
                  testId="button-info-account-verification"
                  ariaLabel="Account verification and operator tiers information"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* All 3 Tier Cards - Clean Design */}
              <div className="space-y-2">
                {(["professional", "equipped", "manual"] as const).map((tier) => {
                  const tierInfo = OPERATOR_TIER_INFO[tier];
                  const isSubscribed = hasAnyTier && operatorData?.subscribedTiers?.includes(tier);
                  const stats = tierStats?.find(s => s.tier === tier);
                  const tierProfile = tierProfiles.find(p => p.tier === tier);
                  const isExpanded = expandedTier === tier && isSubscribed;

                  // Non-subscribed tier - show as muted with "Add Tier" option
                  if (!isSubscribed) {
                    return (
                      <div 
                        key={tier}
                        className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700"
                        data-testid={`tier-section-${tier}`}
                      >
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg grayscale opacity-60">{tierInfo.badge}</span>
                            <div>
                              <h4 className="font-medium text-gray-400 dark:text-gray-500 text-sm">{tierInfo.label}</h4>
                              <p className="text-xs text-gray-400 dark:text-gray-600">{tierInfo.description}</p>
                            </div>
                          </div>
                          <Link to={`/operator/onboarding?tier=${tier}`}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 text-xs text-gray-500 hover:text-orange-600 dark:hover:text-orange-400"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  // Subscribed tier - clean expandable card
                  return (
                    <div 
                      key={tier}
                      className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                      data-testid={`tier-section-${tier}`}
                    >
                      {/* Tier Header - Clickable */}
                      <button
                        onClick={() => setExpandedTier(isExpanded ? null : tier)}
                        className="w-full p-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{tierInfo.badge}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{tierInfo.label}</h4>
                                {getApprovalStatusBadge(tierProfile?.approvalStatus)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tierInfo.description}</p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        {/* Quick Stats Row */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Jobs:</span>
                            <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-${tier}-jobs`}>
                              {stats?.jobsCompleted || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Earned:</span>
                            <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-${tier}-earnings`}>
                              ${Number(stats?.totalEarnings || 0).toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-${tier}-rating`}>
                              {stats?.rating ? Number(stats.rating).toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content - Tier Details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50/50 dark:bg-gray-800/30">
                          {/* Verification Status */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Shield className="h-4 w-4 text-gray-400" />
                              Verification Status
                            </h5>
                            {tierProfile?.approvalStatus === "approved" && tierProfile?.canEarn ? (
                              <div className="text-xs space-y-1">
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified & Active
                                </p>
                                {tierProfile.approvedAt && (
                                  <p className="text-gray-500">Approved: {new Date(tierProfile.approvedAt).toLocaleDateString()}</p>
                                )}
                              </div>
                            ) : tierProfile?.approvalStatus === "under_review" ? (
                              <div className="text-xs space-y-1">
                                <p className="text-blue-600 dark:text-blue-400 font-medium">Documents under review</p>
                                <p className="text-gray-500">Typically 2-3 business days</p>
                              </div>
                            ) : tierProfile?.approvalStatus === "pending" ? (
                              <div className="text-xs space-y-1">
                                <p className="text-amber-600 dark:text-amber-400 font-medium">Pending approval</p>
                                <p className="text-gray-500">Submit documents to get verified</p>
                              </div>
                            ) : tierProfile?.approvalStatus === "rejected" ? (
                              <div className="text-xs space-y-1">
                                <p className="text-red-600 dark:text-red-400 font-medium">Verification rejected</p>
                                {tierProfile.rejectionReason && <p className="text-gray-500">Reason: {tierProfile.rejectionReason}</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Complete onboarding to get verified</p>
                            )}
                          </div>

                          {/* Business Information */}
                          {tierProfile?.businessName && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                Business Details
                              </h5>
                              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <p><span className="font-medium text-gray-900 dark:text-white">Name:</span> {tierProfile.businessName}</p>
                                {tierProfile.businessLicense && <p><span className="font-medium text-gray-900 dark:text-white">License:</span> {tierProfile.businessLicense}</p>}
                              </div>
                            </div>
                          )}

                          {/* Vehicle Information */}
                          {tierProfile?.vehicle && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-gray-400" />
                                Vehicle Details
                              </h5>
                              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <p><span className="font-medium text-gray-900 dark:text-white">Vehicle:</span> {tierProfile.vehicle}</p>
                                {tierProfile.licensePlate && <p><span className="font-medium text-gray-900 dark:text-white">Plate:</span> {tierProfile.licensePlate}</p>}
                              </div>
                            </div>
                          )}

                          {/* Services Offered */}
                          {tierProfile?.services && tierProfile.services.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                Services
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {tierProfile.services.map((service, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700">{service}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Equipment Inventory - Manual Operators */}
                          {tier === "manual" && operatorData?.equipmentInventory && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-gray-400" />
                                Equipment
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {(operatorData.equipmentInventory as any[]).map((equipment: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                    {equipment.displayName || equipment}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Operating Radius */}
                          {tierInfo.radiusKm && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                              <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                Operating Radius
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Accept jobs within <span className="font-medium text-gray-900 dark:text-white">{tierInfo.radiusKm}km</span> from home
                              </p>
                            </div>
                          )}

                          {/* Edit Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-9"
                            onClick={() => {
                              console.log('Edit tier:', tier);
                            }}
                            data-testid={`button-edit-${tier}`}
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" />
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
        </div>
      </div>
    </div>
  );
};
