import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { OperatorDashboard } from "./pages/operator/OperatorDashboard";
import { OperatorOnboarding } from "./pages/operator/OperatorOnboarding";
import { BusinessDashboard } from "./pages/operator/BusinessDashboard";
import ManualOperatorDashboard from "./pages/operator/ManualOperatorDashboard";
import EquippedOperatorDashboard from "./pages/operator/EquippedOperatorDashboard";
import { HelpSupport } from "./pages/HelpSupport";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import EmergencySOS from "./pages/EmergencySOS";
import EmergencyTracking from "./pages/EmergencyTracking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LocationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Switch>
          <Route path="/" component={Index} />
          <Route path="/emergency-sos" component={EmergencySOS} />
          <Route path="/emergency-tracking/:emergencyId" component={EmergencyTracking} />
          <Route path="/help" component={HelpSupport} />
          <Route path="/profile" component={Profile} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/customer" component={CustomerDashboard} />
          <Route path="/customer/:rest+" component={CustomerDashboard} />
          
          {/* Public tier selection/onboarding - no auth required */}
          <Route path="/operator/onboarding" component={OperatorOnboarding} />
          
          {/* Protected operator dashboards - require operator auth */}
          <Route path="/business">
            <ProtectedRoute requireOperator>
              <BusinessDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/manual-operator">
            <ProtectedRoute requireOperator>
              <ManualOperatorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/equipped-operator">
            <ProtectedRoute requireOperator>
              <EquippedOperatorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/operator">
            <ProtectedRoute requireOperator>
              <OperatorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/operator/:rest+">
            <ProtectedRoute requireOperator>
              <OperatorDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route component={NotFound} />
        </Switch>
        <MobileBottomNav />
        </TooltipProvider>
      </LocationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
