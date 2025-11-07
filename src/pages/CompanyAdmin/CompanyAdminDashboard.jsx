import React, { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CompanyOnboardingModal from "./CompanyOnboardingModal";

export default function CompanyAdminDashboard() {
  const [user, setUser] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState(null);

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ---------- Top Navigation Bar ---------- */}
      <div className="flex justify-between items-center bg-white shadow px-6 py-3">
        <h1 className="text-xl font-semibold text-gray-800">
          {companyData?.companyName || "Company Dashboard"}
        </h1>

        <div className="flex items-center gap-6 text-sm font-medium">
          {/* ✅ Profile button now checks if company exists */}
          <button
            onClick={() => {
              if (!companyData) {
                // No company yet → show onboarding modal
                setShowOnboarding(true);
              } else {
                // Company exists → go to profile page
                navigate("/company-admin/profile");
              }
            }}
            className="hover:text-blue-600"
          >
            Profile
          </button>

          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ---------- Dashboard Body ---------- */}
      <div className="flex-1 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500">Recruiters</p>
            <h3 className="text-2xl font-bold text-gray-800">--</h3>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500">Jobs Posted</p>
            <h3 className="text-2xl font-bold text-gray-800">--</h3>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500">Bench Candidates</p>
            <h3 className="text-2xl font-bold text-gray-800">--</h3>
          </div>

          <div className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500">Credits</p>
            <h3 className="text-2xl font-bold text-green-600">
              {companyData?.credits ?? "--"}
            </h3>
          </div>
        </div>
      </div>

      {/* ---------- Company Onboarding Modal ---------- */}
      {showOnboarding && user && (
        <CompanyOnboardingModal
          userId={user.uid}
          userCountry={userData?.country}
          onClose={async () => {
            setShowOnboarding(false);

            // ✅ Re-fetch data after saving company info
            setTimeout(async () => {
              const userRef = doc(db, "users", user.uid);
              const updatedSnap = await getDoc(userRef);
              if (updatedSnap.exists()) {
                const updatedUser = updatedSnap.data();
                setUserData(updatedUser);

                if (updatedUser.companyId) {
                  await fetchCompanyData(updatedUser.companyId);
                }
              }
            }, 1000);
          }}
        />
      )}
    </div>
  );
}
