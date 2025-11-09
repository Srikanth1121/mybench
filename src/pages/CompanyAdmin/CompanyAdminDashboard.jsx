import React, { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import CompanyOnboardingModal from "./CompanyOnboardingModal";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
// Step 6 — Lucide icons for Dashboard cards
import { Users, Briefcase, UserCheck, Wallet } from "lucide-react";
import RecruiterManagement from "./RecruiterManagement";





export default function CompanyAdminDashboard() {
  const [user, setUser] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState("Dashboard");
const [showEditProfile, setShowEditProfile] = useState(false);
// Dashboard summary stats
const [recruiterCount, setRecruiterCount] = useState(0);
const [jobCount, setJobCount] = useState(0);
const [candidateCount, setCandidateCount] = useState(0);
const [creditBalance, setCreditBalance] = useState(0);
const [loadingStats, setLoadingStats] = useState(true);





  const navigate = useNavigate();
  const auth = getAuth();

  // ✅ Helper to fetch company data from Firestore
  const fetchCompanyData = async (companyId) => {
    if (!companyId) return;
   

    try {
      const companyRef = doc(db, "companies", companyId);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        setCompanyData(companySnap.data());
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
     

    }
  };
// ✅ Fetch company-level dashboard stats
const fetchDashboardStats = async (companyId) => {
  try {
    if (!companyId) return;
    setLoadingStats(true);


    

    // 🔹 Fetch recruiters count from subcollection
    const recruitersRef = collection(db, "companies", companyId, "recruiters");
    const recruitersSnap = await getDocs(recruitersRef);
    console.log("✅ Recruiters fetched:", recruitersSnap.size);
    setRecruiterCount(recruitersSnap.size);

    // 🔹 Fetch jobs count
    const jobsRef = collection(db, "jobs");
    const jobsSnap = await getDocs(
      query(jobsRef, where("companyId", "==", companyId))
    );
    setJobCount(jobsSnap.size);

    // 🔹 Fetch candidates count
    const candidatesRef = collection(db, "candidates");
    const candidatesSnap = await getDocs(
      query(candidatesRef, where("companyId", "==", companyId))
    );
    setCandidateCount(candidatesSnap.size);

    // 🔹 Fetch credits (from company document)
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    if (companySnap.exists()) {
      const data = companySnap.data();
      setCreditBalance(data.credits || 0);
    }

  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
  } finally {
    setLoadingStats(false);
  }
};


  // ✅ Detect logged-in user and get Firestore user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);

          // Show onboarding if company not created yet
          if (data.role === "companyadmin" && !data.companyId) {
            setShowOnboarding(true);
          }

          // Fetch company data if companyId exists
          if (data.companyId) {
            await fetchCompanyData(data.companyId);
            await fetchDashboardStats(data.companyId);

          }
          
        }
      } else {
        navigate("/"); // redirect to login if not logged in
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Logout function
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

 return (
  <div className="flex min-h-screen bg-background">

    {/* Sidebar */}
    <Sidebar
  isOpen={sidebarOpen}
  setIsOpen={setSidebarOpen}
  activeSection={activeSection}
  setActiveSection={setActiveSection}
/>



    {/* Main Content Area */}
    <div className="flex-1 flex flex-col">
      {/* Topbar */}
      <Topbar
  companyName={companyData?.companyName || "Company Dashboard"}
  onLogout={handleLogout}
  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
/>


      {/* Dynamic Content */}
      <main className="flex-1 p-8 bg-background">
{activeSection === "Dashboard" && (
  <div className="p-4">
    <h1 className="text-2xl font-semibold text-textPrimary mb-6">
      📊 Company Overview
    </h1>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Summary Cards — we’ll populate these in next step */}
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
  <div className="flex justify-center mb-3">
    <Users className="w-8 h-8 text-blue-600" />
  </div>
  <p className="text-textSecondary text-sm">Recruiters</p>
  <h2 className="text-3xl font-bold mt-2">
    {loadingStats ? "…" : recruiterCount}
  </h2>
</div>


<div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
  <div className="flex justify-center mb-3">
    <Briefcase className="w-8 h-8 text-green-600" />
  </div>
  <p className="text-textSecondary text-sm">Jobs</p>
  <h2 className="text-3xl font-bold mt-2">
    {loadingStats ? "…" : jobCount}
  </h2>
</div>

<div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
  <div className="flex justify-center mb-3">
    <UserCheck className="w-8 h-8 text-purple-600" />
  </div>
  <p className="text-textSecondary text-sm">Candidates</p>
  <h2 className="text-3xl font-bold mt-2">
    {loadingStats ? "…" : candidateCount}
  </h2>
</div>

<div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition">
  <div className="flex justify-center mb-3">
    <Wallet className="w-8 h-8 text-orange-500" />
  </div>
  <p className="text-textSecondary text-sm">Credits</p>
  <h2 className="text-3xl font-bold mt-2">
    {loadingStats ? "…" : creditBalance}
  </h2>
</div>
 </div>
  </div>
)}

  {activeSection === "Profile" && (
  <div className="bg-card border border-border rounded-2xl shadow-sm p-8 max-w-3xl mx-auto">
    {/* Header with Edit button */}
    <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">
          {companyData?.companyName || "Company Name"}
        </h1>
        <p className="text-sm text-textSecondary mt-1">
          {companyData?.size ? `${companyData.size} Employees` : "Company Size: N/A"}
        </p>
      </div>

      {/* Edit Button */}
      <button
        onClick={() => setShowEditProfile(true)}
        className="text-sm font-medium text-primary border border-primary px-4 py-1.5 rounded-md hover:bg-primary hover:text-white transition"
      >
        Edit
      </button>
    </div>

    {/* Details Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10 text-sm">
      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          Address
        </p>
        <p className="text-textPrimary font-medium">
          {companyData?.address || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          Website
        </p>
        {companyData?.website ? (
          <a
            href={companyData.website}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {companyData.website}
          </a>
        ) : (
          <p className="text-textPrimary font-medium">N/A</p>
        )}
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          City
        </p>
        <p className="text-textPrimary font-medium">
          {companyData?.city || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          State
        </p>
        <p className="text-textPrimary font-medium">
          {companyData?.state || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          Country
        </p>
        <p className="text-textPrimary font-medium">
          {companyData?.country || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          LinkedIn
        </p>
        {companyData?.linkedin ? (
          <a
            href={companyData.linkedin}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {companyData.linkedin}
          </a>
        ) : (
          <p className="text-textPrimary font-medium">N/A</p>
        )}
      </div>
    </div>

    {/* About Section */}
    <div className="mt-10 border-t border-border pt-6">
      <h2 className="text-base font-semibold text-textPrimary mb-2">
        About Company
      </h2>
      <p className="text-textSecondary leading-relaxed text-sm">
        {companyData?.about || "No description available."}
      </p>
    </div>

    {/* Contact Section */}
    <div className="mt-10 border-t border-border pt-6 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10">
      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          Admin Email
        </p>
        <p className="text-textPrimary font-medium">
          {userData?.email || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-textSecondary text-xs uppercase tracking-wide mb-1">
          Created On
        </p>
        <p className="text-textPrimary font-medium">
          {companyData?.createdAt
            ? new Date(companyData.createdAt.seconds * 1000).toLocaleDateString()
            : "N/A"}
        </p>
      </div>
    </div>

    {/* Edit Profile Modal */}
    {showEditProfile && (
      <CompanyOnboardingModal
        userId={user?.uid}
        userCountry={userData?.country}
        onClose={async () => {
          setShowEditProfile(false);
          const updatedRef = doc(db, "companies", userData?.companyId);
          const updatedSnap = await getDoc(updatedRef);
          if (updatedSnap.exists()) {
            setCompanyData(updatedSnap.data());
          }
        }}
        existingData={companyData}
      />
    )}
  </div>
)}



  {activeSection === "Recruiters" && (
  <RecruiterManagement companyId={userData?.companyId} />
)}


  {activeSection === "Candidates" && (
    <h1 className="text-xl font-semibold text-textPrimary tracking-tight">

      🧑‍💻 Manage Candidates (coming soon)
    </h1>
  )}

  {activeSection === "Jobs" && (
    <h1 className="text-xl font-semibold text-textPrimary tracking-tight">

      💼 Manage Jobs (coming soon)
    </h1>
  )}

  {activeSection === "Job Tracker" && (
    <h1 className="text-xl font-semibold text-textPrimary tracking-tight">

      📍 Job Tracker (coming soon)
    </h1>
  )}
</main>

    </div>

    {/* Company Onboarding Modal */}
    {showOnboarding && user && (
      <CompanyOnboardingModal
        userId={user.uid}
        userCountry={userData?.country}
        onClose={async () => {
          setShowOnboarding(false);
          const userRef = doc(db, "users", user.uid);
          const updatedSnap = await getDoc(userRef);
          if (updatedSnap.exists()) {
            const updatedUser = updatedSnap.data();
            setUserData(updatedUser);
            if (updatedUser.companyId) {
              await fetchCompanyData(updatedUser.companyId);
              setShowOnboarding(false);
            }
          }
        }}
      />
    )}
  </div>
);

}
