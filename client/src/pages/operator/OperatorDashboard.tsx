import { Route, Switch } from "wouter";
import { OperatorHome } from "./OperatorHome";
import { JobManagement } from "./JobManagement";
import ManualOperatorDashboard from "./ManualOperatorDashboard";
import EquippedOperatorDashboard from "./EquippedOperatorDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

// Component to route to the correct dashboard based on operator tier
const OperatorHomeRouter = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to Operator Onboarding page if profile not complete
    if (user?.role === "operator" && !user.operatorProfileComplete) {
      setLocation("/operator/onboarding");
    }
  }, [user, setLocation]);

  // Route to appropriate dashboard based on viewing tier (not online tier)
  // viewTier = which dashboard to show (persists across reloads)
  // activeTier = which tier is online (for online badge only)
  const viewTier = user?.viewTier || user?.activeTier || user?.operatorTier || "professional";
  
  if (viewTier === "manual") {
    return <ManualOperatorDashboard />;
  } else if (viewTier === "equipped") {
    return <EquippedOperatorDashboard />;
  } else {
    // Default to professional (OperatorHome)
    return <OperatorHome />;
  }
};

export const OperatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/operator" component={OperatorHomeRouter} />
        <Route path="/operator/jobs" component={JobManagement} />
      </Switch>
    </div>
  );
};
