import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { OperatorDashboardLayout } from "@/components/operator/dashboard";
import type { OperatorTier, Operator } from "@shared/schema";

export const OperatorDashboard = () => {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // Parse URL params to get tier - this is the primary source of truth when switching tiers
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlTier = urlParams.get("tier") as OperatorTier | null;
  
  // Fetch operator data to get authoritative subscribedTiers from the API
  // This prevents race conditions where context subscribedTiers might be stale
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
  });
  
  // Use API data as source of truth, falling back to context during loading
  const subscribedTiers = operatorData?.subscribedTiers || user?.subscribedTiers || [];
  
  // Priority: URL param tier > user viewTier > user activeTier > user operatorTier > first subscribed tier
  // URL param ensures correct tier is shown immediately during navigation, before context updates
  // IMPORTANT: Accept urlTier if it's valid, even if subscribedTiers is still loading (empty)
  // This prevents the "flash to wrong dashboard" issue during navigation
  const viewTier = useMemo(() => {
    const validTiers = ["professional", "equipped", "manual"];
    
    // If we have a valid urlTier, trust it immediately (it was set by tier switching logic)
    // Only validate against subscribedTiers if we have data loaded
    if (urlTier && validTiers.includes(urlTier)) {
      // If subscribedTiers is loaded and includes the tier, use it
      if (subscribedTiers.length > 0 && subscribedTiers.includes(urlTier)) {
        return urlTier;
      }
      // If subscribedTiers is still loading (empty), trust the URL tier temporarily
      if (subscribedTiers.length === 0) {
        return urlTier;
      }
    }
    
    if (user?.viewTier && validTiers.includes(user.viewTier) && subscribedTiers.includes(user.viewTier)) {
      return user.viewTier;
    }
    if (user?.activeTier && validTiers.includes(user.activeTier) && subscribedTiers.includes(user.activeTier)) {
      return user.activeTier;
    }
    if (user?.operatorTier && validTiers.includes(user.operatorTier) && subscribedTiers.includes(user.operatorTier)) {
      return user.operatorTier;
    }
    // Fall back to first subscribed tier, or manual as a last resort for new operators
    return (subscribedTiers[0] || "manual") as OperatorTier;
  }, [urlTier, user?.viewTier, user?.activeTier, user?.operatorTier, subscribedTiers]);

  // Sync URL tier to user context for consistency across the app
  useEffect(() => {
    if (urlTier && urlTier !== user?.viewTier && subscribedTiers.includes(urlTier)) {
      updateUser({ viewTier: urlTier });
    }
  }, [urlTier, user?.viewTier, subscribedTiers, updateUser]);

  useEffect(() => {
    if (user?.role === "operator" && !user.operatorProfileComplete) {
      setLocation("/drive-earn");
    }
  }, [user, setLocation]);
  
  return <OperatorDashboardLayout tier={viewTier} />;
};
