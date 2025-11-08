import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { OperatorDashboard } from "./pages/operator/OperatorDashboard";
import { BusinessDashboard } from "./pages/operator/BusinessDashboard";
import ManualOperatorDashboard from "./pages/operator/ManualOperatorDashboard";
import EquippedOperatorDashboard from "./pages/operator/EquippedOperatorDashboard";
import { HelpSupport } from "./pages/HelpSupport";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/help" component={HelpSupport} />
          <Route path="/customer" component={CustomerDashboard} />
          <Route path="/customer/:rest+" component={CustomerDashboard} />
          <Route path="/business" component={BusinessDashboard} />
          <Route path="/manual-operator" component={ManualOperatorDashboard} />
          <Route path="/equipped-operator" component={EquippedOperatorDashboard} />
          <Route path="/operator" component={OperatorDashboard} />
          <Route path="/operator/:rest+" component={OperatorDashboard} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
