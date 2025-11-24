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
import RecruiterAllJobsUSA from "./pages/Recruiter/RecruiterAllJobsUSA";
import RecruiterAllJobsIndia from "./pages/Recruiter/RecruiterAllJobsIndia";
import RecruiterProfile from "./pages/Recruiter/RecruiterProfile";
import CandidateDashboard from "./pages/Candidate/CandidateDashboard";
import JobSearch from "./pages/Candidate/JobSearch";
import AppliedJobs from "./pages/Candidate/AppliedJobs";
import CandidateProfile from "./pages/Candidate/CandidateProfile";
import JobDetails from "./pages/Candidate/JobDetails";
import ApplicationDetails from "./pages/Candidate/ApplicationDetails";
import CandidateNavbar from "./pages/Candidate/CandidateNavbar";
import MyJobsApplicationsView from "./pages/Recruiter/MyJobsApplicationsView";
import Alljobdetailsview from "./pages/Recruiter/Alljobdetailsview";



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
{/* RECRUITER DASHBOARD ROUTES */}
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
  <Route path="my-jobs" element={<RecruiterMyJobs />} />
  <Route path="all-jobs" element={<RecruiterAllJobsUSA />} />
  <Route path="all-jobs-india" element={<RecruiterAllJobsIndia />} />

  {/* ✅ NESTED PROFILE ROUTE */}
  <Route path="profile" element={<RecruiterProfile />} />
   <Route path="job/:jobId" element={<MyJobsApplicationsView />} />

</Route>
<Route
  path="/recruiter/job/:jobId"
  element={
    <ProtectedRoute allowedRole="recruiter">
      <Alljobdetailsview />
    </ProtectedRoute>
  }
/>

{/* CANDIDATE ROUTES (with fixed top navbar layout) */}
<Route
  path="/candidate"
  element={
    <ProtectedRoute allowedRole="candidate">
      <CandidateNavbar />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<CandidateDashboard />} />
  <Route path="jobs" element={<JobSearch />} />
  <Route path="applied" element={<AppliedJobs />} />
  <Route path="profile" element={<CandidateProfile />} />
  <Route path="job/:jobDocId" element={<JobDetails />} />
  <Route path="application/:appId" element={<ApplicationDetails />} />
</Route>



{/* Temporarily keep Unauthorized route (for now) */}
        {/* Once final testing done, we will delete this */}
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
