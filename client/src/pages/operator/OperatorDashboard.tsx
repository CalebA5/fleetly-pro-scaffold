import { Route, Switch } from "wouter";
import { OperatorHome } from "./OperatorHome";
import { OperatorOnboarding } from "./OperatorOnboarding";
import { JobManagement } from "./JobManagement";

export const OperatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/operator" component={OperatorHome} />
        <Route path="/operator/onboarding" component={OperatorOnboarding} />
        <Route path="/operator/jobs" component={JobManagement} />
      </Switch>
    </div>
  );
};
