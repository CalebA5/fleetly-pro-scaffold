import { Route, Switch, Redirect } from "wouter";
import { ServiceSelection } from "./ServiceSelection";
import { JobTracking } from "./JobTracking";
import { JobHistory } from "./JobHistory";
import { ServiceRequest } from "./ServiceRequest";
import { CustomerProfile } from "./CustomerProfile";
import { OperatorMap } from "./OperatorMap";

export const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/customer">
          <Redirect to="/" />
        </Route>
        <Route path="/customer/services" component={ServiceSelection} />
        <Route path="/customer/operators" component={OperatorMap} />
        <Route path="/customer/operator-map" component={OperatorMap} />
        <Route path="/customer/service-request" component={ServiceRequest} />
        <Route path="/customer/tracking" component={JobTracking} />
        <Route path="/customer/history" component={JobHistory} />
        <Route path="/customer/profile" component={CustomerProfile} />
      </Switch>
    </div>
  );
};
