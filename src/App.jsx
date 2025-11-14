import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminPage";
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin"; // 👈 Add this
import SignupPage from "./pages/Signup/SignupPage";
import CompanyAdminProfile from "./pages/CompanyAdmin/CompanyAdminProfile";
import CompanyAdminDashboard from "./pages/CompanyAdmin/CompanyAdminDashboard";
import RecruiterDashboard from "./pages/Recruiter/RecruiterDashboard"; // 👈 Add this import at the top
import RecruiterMyCandidates from "./pages/Recruiter/RecruiterMyCandidates";
import RecruiterAllCandidates from "./pages/Recruiter/RecruiterAllCandidates";
import RecruiterMyJobs from "./pages/Recruiter/RecruiterMyJobs";




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
<Route
  path="/company-admin/dashboard"
  element={
    <ProtectedRoute allowedRole="companyadmin">
      <CompanyAdminDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/recruiter/dashboard/*"
  element={
    <ProtectedRoute allowedRole="recruiter">
      <RecruiterDashboard />
    </ProtectedRoute>
  }
>
  <Route path="my-candidates" element={<RecruiterMyCandidates />} />
  <Route path="all-candidates" element={<RecruiterAllCandidates />} />
  <Route path="my-jobs" element={<RecruiterMyJobs />} />     {/* ✅ NEW ROUTE */}
</Route>

{/* Temporarily keep Unauthorized route (for now) */}
        {/* Once final testing done, we will delete this */}
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
