import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminPage";
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin"; // 👈 Add this

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HomePage (for Recruiter, Candidate, Company Admin login dropdown) */}
        <Route path="/" element={<HomePage />} />

        {/* Super Admin dedicated login */}
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />

        {/* Super Admin protected route */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRole="superadmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Temporarily keep Unauthorized route (for now) */}
        {/* Once final testing done, we will delete this */}
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
