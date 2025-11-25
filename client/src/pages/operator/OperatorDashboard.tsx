import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import ManualOperatorDashboard from "./ManualOperatorDashboard";
import EquippedOperatorDashboard from "./EquippedOperatorDashboard";
import { BusinessDashboard } from "./BusinessDashboard";

export const OperatorDashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "operator" && !user.operatorProfileComplete) {
      setLocation("/drive-earn");
    }
  }, [user, setLocation]);

  const viewTier = user?.viewTier || user?.activeTier || user?.operatorTier || "professional";
  
  if (viewTier === "manual") {
    return <ManualOperatorDashboard />;
  } else if (viewTier === "equipped") {
    return <EquippedOperatorDashboard />;
  } else {
    return <BusinessDashboard />;
  }
};
