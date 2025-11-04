import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { OperatorDashboard } from "./pages/operator/OperatorDashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/customer/:rest*" component={CustomerDashboard} />
        <Route path="/operator/:rest*" component={OperatorDashboard} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
