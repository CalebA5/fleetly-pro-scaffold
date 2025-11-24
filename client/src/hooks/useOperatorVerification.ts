import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

export function useOperatorVerification(tier: "manual" | "equipped" | "professional") {
  // Fetch verification status
  const { data: verificationStatus, isLoading: loadingVerification } = useQuery({
    queryKey: ["/api/verification/status"],
  });

  // Fetch application status for the tier
  const { data: applications, isLoading: loadingApplications } = useQuery<any[]>({
    queryKey: ["/api/operator/applications"],
  });

  // Auto-create application mutation
  const autoCreateMutation = useMutation({
    mutationFn: (tier: string) =>
      apiRequest("/api/operator/applications/auto-create", {
        method: "POST",
        body: JSON.stringify({ tier }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator/applications"] });
    },
  });

  // Auto-create application on mount if it doesn't exist
  useEffect(() => {
    if (!loadingApplications && applications) {
      const tierApp = applications.find((app) => app.tier === tier);
      if (!tierApp && !autoCreateMutation.isPending) {
        autoCreateMutation.mutate(tier);
      }
    }
  }, [tier, applications, loadingApplications]);

  const tierApplication = applications?.find((app) => app.tier === tier);
  const isEmailVerified = verificationStatus?.emailVerified;
  const isApplicationApproved = tierApplication?.status === "approved";
  const isApplicationPending = tierApplication && !["approved", "rejected"].includes(tierApplication.status);
  
  // Operator can accept jobs if:
  // 1. Email is verified
  // 2. Either no application exists, or application is approved
  const canAcceptJobs = isEmailVerified && (!tierApplication || isApplicationApproved);

  const verificationMessage = !isEmailVerified 
    ? "Please verify your email to start accepting jobs."
    : isApplicationPending 
    ? `Your ${tier} tier application is pending review.`
    : tierApplication?.status === "rejected"
    ? `Your ${tier} tier application was rejected. ${tierApplication.rejectionReason || ''}`
    : null;

  return {
    isEmailVerified,
    isApplicationApproved,
    isApplicationPending,
    canAcceptJobs,
    verificationMessage,
    isLoading: loadingVerification || loadingApplications,
    tierApplication,
  };
}
