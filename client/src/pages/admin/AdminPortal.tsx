import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, AlertCircle, User, Mail, Phone, MapPin, Truck, FileText, Shield } from "lucide-react";
import type { Operator, OperatorTier } from "@shared/schema";

export const AdminPortal = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedTier, setSelectedTier] = useState<OperatorTier | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Redirect non-admin users
  if (user && !user.isAdmin) {
    setLocation("/");
    return null;
  }

  // Fetch pending operators
  const { data: pendingOperators = [], isLoading, refetch } = useQuery<Operator[]>({
    queryKey: ['/api/admin/operators/pending'],
    enabled: !!user?.isAdmin,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ operatorId, tier }: { operatorId: string; tier: OperatorTier }) => {
      return await apiRequest(`/api/admin/operators/${operatorId}/approve/${tier}`, {
        method: "POST",
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Operator Approved",
        description: `${variables.tier} tier approved successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/operators/pending'] });
      setSelectedOperator(null);
      setSelectedTier(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve operator",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ operatorId, tier, reason }: { operatorId: string; tier: OperatorTier; reason: string }) => {
      return await apiRequest(`/api/admin/operators/${operatorId}/reject/${tier}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Operator Rejected",
        description: `${variables.tier} tier rejected`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/operators/pending'] });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedOperator(null);
      setSelectedTier(null);
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject operator",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (operator: Operator, tier: OperatorTier) => {
    setSelectedOperator(operator);
    setSelectedTier(tier);
    approveMutation.mutate({ operatorId: operator.operatorId, tier });
  };

  const handleReject = (operator: Operator, tier: OperatorTier) => {
    setSelectedOperator(operator);
    setSelectedTier(tier);
    setShowRejectDialog(true);
  };

  const submitRejection = () => {
    if (!selectedOperator || !selectedTier) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    rejectMutation.mutate({
      operatorId: selectedOperator.operatorId,
      tier: selectedTier,
      reason: rejectionReason.trim(),
    });
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "professional":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "equipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "manual":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading pending operators...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-black dark:text-white">Admin Portal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Review and verify operator applications</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingOperators.length}</div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Awaiting verification</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black dark:text-white">
                  {pendingOperators.reduce((total, op) => {
                    const profiles = (op.operatorTierProfiles as Record<string, any>) || {};
                    return total + Object.keys(profiles).filter(tier => {
                      const profile = profiles[tier];
                      return profile?.approvalStatus === "pending" || profile?.approvalStatus === "under_review";
                    }).length;
                  }, 0)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Across all operators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Action Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {pendingOperators.filter(op => {
                    const profiles = (op.operatorTierProfiles as Record<string, any>) || {};
                    return Object.keys(profiles).some(tier => profiles[tier]?.approvalStatus === "pending");
                  }).length}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">New submissions</p>
              </CardContent>
            </Card>
          </div>

          {/* Operators List */}
          {pendingOperators.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">All Caught Up!</h3>
                <p className="text-gray-600 dark:text-gray-400">No operators pending verification at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingOperators.map((operator) => {
                const tierProfiles = (operator.operatorTierProfiles as Record<string, any>) || {};
                const pendingTiers = Object.keys(tierProfiles).filter(tier => {
                  const profile = tierProfiles[tier];
                  return profile?.approvalStatus === "pending" || profile?.approvalStatus === "under_review";
                });

                return (
                  <Card key={operator.operatorId} className="border-2 border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-black dark:text-white mb-2">{operator.name}</CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4" />
                              <span>{operator.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4" />
                              <span>{operator.phone || "Not provided"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4" />
                              <span>ID: {operator.operatorId}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pendingTiers.map(tier => (
                            <Badge key={tier} className={getTierBadgeColor(tier)}>
                              {getTierLabel(tier)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue={pendingTiers[0]} className="w-full">
                        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${pendingTiers.length}, 1fr)` }}>
                          {pendingTiers.map(tier => (
                            <TabsTrigger key={tier} value={tier}>
                              {getTierLabel(tier)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {pendingTiers.map(tier => {
                          const profile = tierProfiles[tier];
                          return (
                            <TabsContent key={tier} value={tier} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Truck className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">Vehicle:</span>
                                    <span className="text-gray-600 dark:text-gray-400">{profile?.vehicle || "Not specified"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">License Plate:</span>
                                    <span className="text-gray-600 dark:text-gray-400">{profile?.licensePlate || "N/A"}</span>
                                  </div>
                                  {profile?.businessLicense && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Shield className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">Business License:</span>
                                      <span className="text-gray-600 dark:text-gray-400">{profile.businessLicense}</span>
                                    </div>
                                  )}
                                  {profile?.businessName && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">Business Name:</span>
                                      <span className="text-gray-600 dark:text-gray-400">{profile.businessName}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Services:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {profile?.services && profile.services.length > 0 ? (
                                        profile.services.map((service: string, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {service}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-gray-500">No services listed</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Status:</span>
                                    <div className="mt-1">
                                      <Badge variant="outline" className="gap-1">
                                        <Clock className="w-3 h-3" />
                                        {profile?.approvalStatus === "pending" ? "Pending" : "Under Review"}
                                      </Badge>
                                    </div>
                                  </div>
                                  {profile?.approvalSubmittedAt && (
                                    <div className="text-xs text-gray-500">
                                      Submitted: {new Date(profile.approvalSubmittedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={() => handleApprove(operator, tier as OperatorTier)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-approve-${tier}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve {getTierLabel(tier)}
                                </Button>
                                <Button
                                  onClick={() => handleReject(operator, tier as OperatorTier)}
                                  variant="destructive"
                                  className="flex-1"
                                  disabled={rejectMutation.isPending}
                                  data-testid={`button-reject-${tier}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedTier && getTierLabel(selectedTier)} Tier</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this operator's application. This will be sent to the operator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Incomplete documentation, Invalid business license..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
              data-testid="input-rejection-reason"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};
