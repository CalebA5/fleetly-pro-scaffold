import { Route, Redirect, useLocation } from "wouter";
import { ServiceSelection } from "./ServiceSelection";
import { JobTracking } from "./JobTracking";
import { JobHistory } from "./JobHistory";
import { ServiceRequest } from "./ServiceRequest";
import { CreateServiceRequest } from "./CreateServiceRequest";
import { CustomerProfile } from "./CustomerProfile";
import { OperatorMap } from "./OperatorMap";
import { OperatorProfile } from "./OperatorProfile";
import { AIAssist } from "./AIAssist";
import { Favorites } from "./Favorites";
import { Requests } from "./Requests";
import { useEffect } from "react";

export const CustomerDashboard = () => {
  const [location, setLocation] = useLocation();
  
  // Redirect /customer to homepage (exact match only)
  useEffect(() => {
    if (location === "/customer") {
      setLocation("/");
    }
  }, [location, setLocation]);
  
  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
};
