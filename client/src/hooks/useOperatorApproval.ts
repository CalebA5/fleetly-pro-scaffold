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

  // Extract tier profile info - normalize both array and object formats
  const tierProfilesRaw = operatorData?.operatorTierProfiles as any;
  let tierProfile;
  
  if (Array.isArray(tierProfilesRaw)) {
    // Array format: [{ tier: "manual", ... }, { tier: "equipped", ... }]
    tierProfile = tierProfilesRaw.find((p: any) => p.tier === requiredTier);
  } else if (tierProfilesRaw && typeof tierProfilesRaw === 'object') {
    // Object format: { "manual": { tier: "manual", ... }, "equipped": { ... } }
    tierProfile = tierProfilesRaw[requiredTier];
  }
  
  // BACKWARD COMPATIBILITY: Only auto-approve legacy operators with explicit historical signals
  // Check for operator.activeTier or operator.operatorTier matching the required tier
  // This prevents newly created operators (with missing profiles) from bypassing verification
  if (!tierProfile && operatorData?.subscribedTiers?.includes(requiredTier)) {
    // Only trust explicit historical approval signals
    const hasLegacyApproval = (operatorData.activeTier === requiredTier) || 
                             (operatorData.operatorTier === requiredTier);
    
    if (hasLegacyApproval) {
      // Legacy operator with historical tier usage - treat as approved
      tierProfile = { approvalStatus: "approved" };
    }
  }
  
  const isApproved = tierProfile?.approvalStatus === "approved";
  const approvalStatus = tierProfile?.approvalStatus || "not_submitted";

  return {
    isApproved,
    approvalStatus,
    isLoading,
    tierProfile,
  };
};
