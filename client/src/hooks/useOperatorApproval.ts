import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Operator, OperatorTier } from "@shared/schema";

/**
 * Hook to check if operator is approved for a specific tier
 * Redirects to pending verification page if not approved
 * @param requiredTier - The tier to check approval for
 * @returns Object with approval status and loading state
 */
export const useOperatorApproval = (requiredTier: OperatorTier) => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch operator data to check tier approval status
  const { data: operatorData, isLoading } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
  });

  useEffect(() => {
    if (!isLoading && operatorData) {
      const tierProfiles = (operatorData.operatorTierProfiles as Record<string, any>) || {};
      const tierProfile = tierProfiles[requiredTier];

      // Check if tier exists and is approved
      const isApproved = tierProfile?.approvalStatus === "approved";

      // If tier is not approved, redirect to pending verification page
      if (!isApproved) {
        setLocation("/operator/pending-verification");
      }
    }
  }, [isLoading, operatorData, requiredTier, setLocation]);

  // Extract tier profile info
  const tierProfiles = (operatorData?.operatorTierProfiles as Record<string, any>) || {};
  const tierProfile = tierProfiles[requiredTier];
  const isApproved = tierProfile?.approvalStatus === "approved";
  const approvalStatus = tierProfile?.approvalStatus || "not_submitted";

  return {
    isApproved,
    approvalStatus,
    isLoading,
    tierProfile,
  };
};
