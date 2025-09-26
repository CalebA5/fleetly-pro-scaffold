import React from "react";
import { Routes, Route } from "react-router-dom";
import { OperatorHome } from "./OperatorHome";
import { OperatorOnboarding } from "./OperatorOnboarding";
import { JobManagement } from "./JobManagement";

export const OperatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<OperatorHome />} />
        <Route path="/onboarding" element={<OperatorOnboarding />} />
        <Route path="/jobs" element={<JobManagement />} />
      </Routes>
    </div>
  );
};