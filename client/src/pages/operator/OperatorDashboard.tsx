import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { OperatorDashboardLayout } from "@/components/operator/dashboard";
import type { OperatorTier } from "@shared/schema";

export const OperatorDashboard = () => {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // Parse URL params to get tier - this is the primary source of truth when switching tiers
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const urlTier = urlParams.get("tier") as OperatorTier | null;
  
  // Priority: URL param tier > user viewTier > user activeTier > user operatorTier > first subscribed tier
  // URL param ensures correct tier is shown immediately during navigation, before context updates
  const subscribedTiers = user?.subscribedTiers || [];
  const viewTier = useMemo(() => {
    const validTiers = ["professional", "equipped", "manual"];
    if (urlTier && validTiers.includes(urlTier) && subscribedTiers.includes(urlTier)) {
      return urlTier;
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
