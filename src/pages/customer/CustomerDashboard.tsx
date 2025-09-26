import React from "react";
import { Routes, Route } from "react-router-dom";
import { CustomerHome } from "./CustomerHome";
import { ServiceSelection } from "./ServiceSelection";
import { JobTracking } from "./JobTracking";
import { JobHistory } from "./JobHistory";

export const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/services" element={<ServiceSelection />} />
        <Route path="/tracking" element={<JobTracking />} />
        <Route path="/history" element={<JobHistory />} />
      </Routes>
    </div>
  );
};