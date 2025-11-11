// src/pages/Recruiter/RecruiterDashboard.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import RecruiterNavBar from "./RecruiterNavBar";

export default function RecruiterDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruiterNavBar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
