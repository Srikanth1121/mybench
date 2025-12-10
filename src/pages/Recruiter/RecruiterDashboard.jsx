// src/pages/Recruiter/RecruiterDashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import RecruiterNavBar from "./RecruiterNavBar";
import RecruiterInfoModal from "./RecruiterInfoModal"; // ✅ import modal
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { RecruiterContext } from "../../context/RecruiterContext";



export default function RecruiterDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [recruiterData, setRecruiterData] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();
const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid); // 🔁 change to "recruiters" if that’s your collection
          const userSnap = await getDoc(userRef);

       if (userSnap.exists()) {
  const data = userSnap.data();

  // ⭐ Save recruiter data (including uid) into state
  setRecruiterData({
    ...data,
    id: user.uid, // add recruiter UID
  });
 
// ⭐ Redirect only when user is exactly on /recruiter/dashboard
if (location.pathname === "/recruiter/dashboard") {
  const target =
    data.country === "India"
      ? "/recruiter/dashboard/all-jobs-india"
      : "/recruiter/dashboard/all-jobs";

  navigate(target, { replace: true });
}


  // Check incomplete profile
  if (!data.profileComplete || !data.state || !data.linkedin) {
    setShowModal(true);
  }
}

        } catch (error) {
          console.error("Error fetching recruiter profile:", error);
        }
      }
      setLoadingProfile(false);
    });

    return () => unsubscribe();
}, [auth, location.pathname, navigate]);


  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading dashboard...
      </div>
    );
  }
console.log("RECRUITER:", recruiterData);
return (
  <RecruiterContext.Provider value={recruiterData}>
    <div className="min-h-screen bg-gray-50">

      <RecruiterNavBar />

      {/* Main content */}
    <main className="w-full px-4 md:px-2 py-3">


        <Outlet />
      </main>

      {/* Info Modal appears if profile incomplete */}
      <RecruiterInfoModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
     </RecruiterContext.Provider>
  );
}
