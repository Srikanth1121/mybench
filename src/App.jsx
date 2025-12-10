import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/config";

import HomePage from "./pages/Home/HomePage";
import ProtectedRoute from "./routes/ProtectedRoute";

import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminPage";
import SuperAdminLogin from "./pages/SuperAdmin/SuperAdminLogin";

import SignupPage from "./pages/Signup/SignupPage";

import CompanyAdminProfile from "./pages/CompanyAdmin/CompanyAdminProfile";
import CompanyAdminDashboard from "./pages/CompanyAdmin/CompanyAdminDashboard";

import RecruiterDashboard from "./pages/Recruiter/RecruiterDashboard";
import RecruiterMyCandidates from "./pages/Recruiter/RecruiterMyCandidates";
import RecruiterAllCandidates from "./pages/Recruiter/RecruiterAllCandidates";

import RecruiterMyJobs from "./pages/Recruiter/RecruiterMyJobs";
import RecruiterAllJobsUSA from "./pages/Recruiter/RecruiterAllJobsUSA";
import RecruiterAllJobsIndia from "./pages/Recruiter/RecruiterAllJobsIndia";
import RecruiterProfile from "./pages/Recruiter/RecruiterProfile";
import MyJobsApplicationsView from "./pages/Recruiter/MyJobsApplicationsView";
import Alljobdetailsview from "./pages/Recruiter/Alljobdetailsview";

import CandidateDashboard from "./pages/Candidate/CandidateDashboard";
import JobSearch from "./pages/Candidate/JobSearch";
import AppliedJobs from "./pages/Candidate/AppliedJobs";
import CandidateProfile from "./pages/Candidate/CandidateProfile";
import JobDetails from "./pages/Candidate/JobDetails";
import ApplicationDetails from "./pages/Candidate/ApplicationDetails";
import CandidateNavbar from "./pages/Candidate/CandidateNavbar";

import PublicAllCandidates from "./pages/Public/PublicAllCandidates";
import CandidateSearch from "./pages/CandidateSearch/CandidateSearch";


function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  // ⭐ Inline redirect helper (NO extra page needed)
  function DashboardCountryRedirect() {
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
      async function check() {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          if (data.country === "USA") {
            navigate("all-jobs", { replace: true });
          } else {
            navigate("all-jobs-india", { replace: true });
          }
        }
      }

      check();
    }, []);

    return null;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Public Bench Candidates */}
      <Route path="/candidates" element={<PublicAllCandidates />} />

      {/* Super Admin */}
      <Route path="/superadmin-login" element={<SuperAdminLogin />} />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRole="superadmin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Company Admin */}
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

      {/* Recruiter Routes */}
      <Route
        path="/recruiter/dashboard/*"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardCountryRedirect />} />

        <Route path="my-candidates" element={<RecruiterMyCandidates />} />
        <Route path="all-candidates" element={<RecruiterAllCandidates />} />
        <Route path="my-jobs" element={<RecruiterMyJobs />} />

        <Route
          path="all-jobs"
          element={<RecruiterAllJobsUSA key={location.pathname} />}
        />

        <Route
          path="all-jobs-india"
          element={<RecruiterAllJobsIndia key={location.pathname} />}
        />

        <Route path="candidate-search" element={<CandidateSearch />} />

        <Route path="profile" element={<RecruiterProfile />} />
        <Route path="job/:jobId" element={<MyJobsApplicationsView />} />
      </Route>

      {/* Recruiter Job Details */}
      <Route
        path="/recruiter/job/:jobId"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <Alljobdetailsview />
          </ProtectedRoute>
        }
      />

      {/* Candidate Routes */}
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
    </Routes>
  );
}

export default App;
