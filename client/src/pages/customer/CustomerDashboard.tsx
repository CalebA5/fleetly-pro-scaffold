import { Route, Switch } from "wouter";
import { CustomerHome } from "./CustomerHome";
import { ServiceSelection } from "./ServiceSelection";
import { JobTracking } from "./JobTracking";
import { JobHistory } from "./JobHistory";

export const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/customer" component={CustomerHome} />
        <Route path="/customer/services" component={ServiceSelection} />
        <Route path="/customer/tracking" component={JobTracking} />
        <Route path="/customer/history" component={JobHistory} />
      </Switch>
    </div>
  );
};
