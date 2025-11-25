import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, AlertCircle, Home, Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { Operator, TierApprovalStatus } from "@shared/schema";

export const PendingVerification = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch operator data to get tier approval statuses
  const { data: operatorData, isLoading } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
    refetchInterval: 10000 // Poll every 10 seconds to check for approval status changes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Get tier profiles from operator data
  const tierProfiles = (operatorData?.operatorTierProfiles as Record<string, any>) || {};
  const tiers = Object.keys(tierProfiles);

  // Check if any tier is approved
  const hasApprovedTier = tiers.some(tier => tierProfiles[tier]?.approvalStatus === "approved");

  // If user has approved tier, redirect them to unified dashboard
  if (hasApprovedTier && user?.viewTier) {
    setLocation("/operator");
    return null;
  }

  const getStatusIcon = (status: TierApprovalStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "under_review":
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      case "pending":
      default:
        return <Clock className="w-6 h-6 text-orange-500" />;
    }
  };

  const getStatusText = (status: TierApprovalStatus) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "under_review":
        return "Under Review";
      case "pending":
      default:
        return "Pending Verification";
    }
  };

  const getStatusColor = (status: TierApprovalStatus) => {
    switch (status) {
      case "approved":
        return "text-green-600 dark:text-green-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      case "under_review":
        return "text-blue-600 dark:text-blue-400";
      case "pending":
      default:
        return "text-orange-600 dark:text-orange-400";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Account Verification</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Status Card */}
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <CardTitle className="text-black dark:text-white">Verification in Progress</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Your operator profile is being reviewed by our team
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Thank you for completing your operator onboarding! Your documents and credentials are currently under review. 
                You'll receive an email notification once your account has been verified and you'll gain full access to start accepting jobs.
              </p>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-black dark:text-white mb-2">What happens next?</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">1.</span>
                    <span>Our verification team reviews your submitted documents and credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">2.</span>
                    <span>You'll receive an email notification with the verification result</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">3.</span>
                    <span>Once approved, you'll have full access to your dashboard and can start accepting jobs</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Estimated verification time:</strong> 24-48 hours (business days)
              </p>
            </CardContent>
          </Card>

          {/* Tier Status Cards */}
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Tier Verification Status</h2>
            <div className="grid gap-4">
              {tiers.map(tier => {
                const profile = tierProfiles[tier];
                const status = profile?.approvalStatus || "pending";
                const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

                return (
                  <Card key={tier}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(status)}
                          <div>
                            <h3 className="font-semibold text-black dark:text-white">{tierLabel} Tier</h3>
                            <p className={`text-sm ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </p>
                          </div>
                        </div>
                        
                        {status === "rejected" && profile?.rejectionReason && (
                          <div className="text-right max-w-md">
                            <p className="text-sm text-red-600 dark:text-red-400">
                              <strong>Reason:</strong> {profile.rejectionReason}
                            </p>
                          </div>
                        )}
                        
                        {status === "pending" && profile?.approvalSubmittedAt && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Submitted: {new Date(profile.approvalSubmittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Need Help?</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                If you have questions or need assistance with the verification process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Mail className="w-5 h-5 text-orange-500" />
                <span>support@fleetly.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Phone className="w-5 h-5 text-orange-500" />
                <span>1-800-FLEETLY</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="gap-2"
              data-testid="button-home"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};
