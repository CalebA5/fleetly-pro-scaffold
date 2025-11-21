import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { ServiceSelection } from "./pages/customer/ServiceSelection";
import { JobTracking } from "./pages/customer/JobTracking";
import { JobHistory } from "./pages/customer/JobHistory";
import { ServiceRequest } from "./pages/customer/ServiceRequest";
import { CreateServiceRequest } from "./pages/customer/CreateServiceRequest";
import { CustomerProfile } from "./pages/customer/CustomerProfile";
import { OperatorMap } from "./pages/customer/OperatorMap";
import { OperatorProfile } from "./pages/customer/OperatorProfile";
import { AIAssist } from "./pages/customer/AIAssist";
import { Favorites } from "./pages/customer/Favorites";
import { Requests } from "./pages/customer/Requests";
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
import TestOperatorTiles from "./pages/TestOperatorTiles";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { SeasonalThemeProvider } from "@/contexts/SeasonalThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const App = () => (
  <SeasonalThemeProvider>
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
              <Route path="/test-operator-tiles" component={TestOperatorTiles} />
              <Route path="/help" component={HelpSupport} />
              <Route path="/profile" component={Profile} />
              <Route path="/notifications" component={Notifications} />
              
              {/* Customer routes */}
              <Route path="/customer/services" component={ServiceSelection} />
              <Route path="/customer/operators" component={OperatorMap} />
              <Route path="/customer/operator-map" component={OperatorMap} />
              <Route path="/customer/operator-profile/:operatorId" component={OperatorProfile} />
              <Route path="/customer/favorites" component={Favorites} />
              <Route path="/customer/requests" component={Requests} />
              <Route path="/customer/ai-assist" component={AIAssist} />
              <Route path="/customer/create-request" component={CreateServiceRequest} />
              <Route path="/customer/service-request" component={ServiceRequest} />
              <Route path="/customer/tracking" component={JobTracking} />
              <Route path="/customer/history" component={JobHistory} />
              <Route path="/customer/profile" component={CustomerProfile} />
              
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
  </SeasonalThemeProvider>
);

export default App;
