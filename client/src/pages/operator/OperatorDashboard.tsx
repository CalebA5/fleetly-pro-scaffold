import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { OperatorDashboardLayout } from "@/components/operator/dashboard";
import type { OperatorTier } from "@shared/schema";

export const OperatorDashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "operator" && !user.operatorProfileComplete) {
      setLocation("/drive-earn");
    }
  }, [user, setLocation]);

  const viewTier = (user?.viewTier || user?.activeTier || user?.operatorTier || "professional") as OperatorTier;
  
  return <OperatorDashboardLayout tier={viewTier} />;
};
