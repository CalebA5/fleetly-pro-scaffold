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
import QuoteCenter from "./pages/customer/QuoteCenter";
import RequestStatus from "./pages/customer/RequestStatus";
import { OperatorOnboarding } from "./pages/operator/OperatorOnboarding";
import { PendingVerification } from "./pages/operator/PendingVerification";
import { OperatorDashboard } from "./pages/operator/OperatorDashboard";
import EarningsDetails from "./pages/operator/EarningsDetails";
import NearbyJobsMap from "./pages/operator/NearbyJobsMap";
import JobDetailsPage from "./pages/operator/JobDetailsPage";
import { JobHistory as OperatorJobHistory } from "./pages/operator/JobHistory";
import FleetAnalytics from "./pages/operator/FleetAnalytics";
import TeamAnalytics from "./pages/operator/TeamAnalytics";
import CompletedToday from "./pages/operator/CompletedToday";
import RatingsTrend from "./pages/operator/RatingsTrend";
import ActiveOperators from "./pages/operator/ActiveOperators";
import { DriveEarn } from "./pages/DriveEarn";
import { AdminPortal } from "./pages/admin/AdminPortal";
import Help from "./pages/Help";
import { UserGuide } from "./pages/UserGuide";
import { OperatorGuide } from "./pages/OperatorGuide";
import { CommunityForum } from "./pages/CommunityForum";
import { BlogUpdates } from "./pages/BlogUpdates";
import { Profile } from "./pages/Profile";
import { EditPersonalInfo } from "./pages/profile/EditPersonalInfo";
import { EditTierInfo } from "./pages/profile/EditTierInfo";
import { default as Notifications } from "./pages/Notifications";
import Wallet from "./pages/Wallet";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Legal from "./pages/Legal";
import LiveChat from "./pages/LiveChat";
import EmergencySOS from "./pages/EmergencySOS";
import EmergencyTracking from "./pages/EmergencyTracking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
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
              <Route path="/signin" component={SignIn} />
              <Route path="/signup" component={SignUp} />
              <Route path="/emergency-sos" component={EmergencySOS} />
              <Route path="/emergency-tracking/:emergencyId" component={EmergencyTracking} />
              <Route path="/help" component={Help} />
              <Route path="/user-guide" component={UserGuide} />
              <Route path="/operator-guide" component={OperatorGuide} />
              <Route path="/community-forum" component={CommunityForum} />
              <Route path="/blog" component={BlogUpdates} />
              <Route path="/profile" component={Profile} />
              <Route path="/profile/edit-personal" component={EditPersonalInfo} />
              <Route path="/profile/tier/:tier" component={EditTierInfo} />
              <Route path="/wallet" component={Wallet} />
              <Route path="/payments" component={Payments} />
              <Route path="/settings" component={Settings} />
              <Route path="/legal" component={Legal} />
              <Route path="/live-chat" component={LiveChat} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/weather-alerts" component={Notifications} />
              
              {/* Customer routes */}
              <Route path="/customer/services" component={ServiceSelection} />
              <Route path="/customer/operators" component={OperatorMap} />
              <Route path="/customer/operator-map" component={OperatorMap} />
              <Route path="/customer/operator-profile/:operatorId" component={OperatorProfile} />
              <Route path="/customer/favorites" component={Favorites} />
              <Route path="/customer/requests" component={RequestStatus} />
              <Route path="/customer/ai-assist" component={AIAssist} />
              <Route path="/customer/create-request" component={CreateServiceRequest} />
              <Route path="/customer/service-request" component={ServiceRequest} />
              <Route path="/customer/tracking" component={JobTracking} />
              <Route path="/customer/history" component={JobHistory} />
              <Route path="/customer/profile" component={CustomerProfile} />
              <Route path="/customer/quotes" component={QuoteCenter} />
              <Route path="/customer/request-status" component={RequestStatus} />
              
              {/* Public tier selection/onboarding - no auth required */}
              <Route path="/drive-earn" component={DriveEarn} />
              <Route path="/operator/onboarding" component={OperatorOnboarding} />
              
              {/* Admin routes */}
              <Route path="/admin" component={AdminPortal} />
              
              {/* Operator verification status page */}
              <Route path="/operator/pending-verification">
                <ProtectedRoute requireOperator>
                  <PendingVerification />
                </ProtectedRoute>
              </Route>
              
              {/* Protected operator dashboards - require operator auth */}
              <Route path="/operator">
                <ProtectedRoute requireOperator>
                  <OperatorDashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/earnings">
                <ProtectedRoute requireOperator>
                  <EarningsDetails />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/jobs-map">
                <ProtectedRoute requireOperator>
                  <NearbyJobsMap />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/nearby-jobs">
                <ProtectedRoute requireOperator>
                  <NearbyJobsMap />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/completed-today">
                <ProtectedRoute requireOperator>
                  <CompletedToday />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/ratings">
                <ProtectedRoute requireOperator>
                  <RatingsTrend />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/active-operators">
                <ProtectedRoute requireOperator>
                  <ActiveOperators />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/jobs/:jobId">
                <ProtectedRoute requireOperator>
                  <JobDetailsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/job-history">
                <ProtectedRoute requireOperator>
                  <OperatorJobHistory />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/fleet-analytics">
                <ProtectedRoute requireOperator>
                  <FleetAnalytics />
                </ProtectedRoute>
              </Route>
              <Route path="/operator/team-analytics">
                <ProtectedRoute requireOperator>
                  <TeamAnalytics />
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
