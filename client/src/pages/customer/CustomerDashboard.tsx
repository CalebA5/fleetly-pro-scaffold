import { Route, Switch } from "wouter";
import { CustomerHome } from "./CustomerHome";
import { ServiceSelection } from "./ServiceSelection";
import { JobTracking } from "./JobTracking";
import { JobHistory } from "./JobHistory";
import { OperatorBrowsing } from "./OperatorBrowsing";
import { ServiceRequest } from "./ServiceRequest";
import { CustomerProfile } from "./CustomerProfile";
import { OperatorMapSimple } from "./OperatorMapSimple";

export const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/customer" component={CustomerHome} />
        <Route path="/customer/services" component={ServiceSelection} />
        <Route path="/customer/operators" component={OperatorBrowsing} />
        <Route path="/customer/operator-map" component={OperatorMapSimple} />
        <Route path="/customer/service-request" component={ServiceRequest} />
        <Route path="/customer/tracking" component={JobTracking} />
        <Route path="/customer/history" component={JobHistory} />
        <Route path="/customer/profile" component={CustomerProfile} />
      </Switch>
    </div>
  );
};
