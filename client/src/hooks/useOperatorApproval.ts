import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Operator, OperatorTier } from "@shared/schema";

/**
 * Hook to check if operator is approved for a specific tier
 * Returns approval status WITHOUT redirecting - allows dashboard access while pending
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

  // NO REDIRECT - Operators can access dashboards while pending verification
  // Individual features (like "Go Online") should check approval status
  useEffect(() => {
    // This hook now only fetches data, does not redirect
    // Dashboards will gate features based on isApproved status
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
