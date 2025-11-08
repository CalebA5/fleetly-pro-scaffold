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
    // Redirect to onboarding if profile not complete
    if (user?.role === "operator" && !user.operatorProfileComplete) {
      setLocation("/operator/onboarding");
    }
  }, [user, setLocation]);

  // Route to appropriate dashboard based on active tier
  const activeTier = user?.activeTier || user?.operatorTier || "professional";
  
  if (activeTier === "manual") {
    return <ManualOperatorDashboard />;
  } else if (activeTier === "equipped") {
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
