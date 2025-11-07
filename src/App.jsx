import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminPage";
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin"; // 👈 Add this
import SignupPage from "./pages/Signup/SignupPage";
import CompanyAdminProfile from "./pages/CompanyAdmin/CompanyAdminProfile";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HomePage (for Recruiter, Candidate, Company Admin login dropdown) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />


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
   <Route
  path="/company-admin/profile"
  element={
    <ProtectedRoute allowedRole="companyadmin">
      <CompanyAdminProfile />
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
