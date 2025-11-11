import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config"; // adjust path if needed

export default function RecruiterNavBar() {
  const [recruiterName, setRecruiterName] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  // Fetch recruiter info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid); // change to "recruiters" if that’s your collection
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRecruiterName(data.name || data.fullName || user.email.split("@")[0]);
          } else {
            setRecruiterName(user.email.split("@")[0]);
          }
        } catch (error) {
          console.error("Error fetching recruiter info:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const linkClass =
    "relative px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200";
  const activeLink =
    "relative px-3 py-2 text-sm font-semibold text-blue-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-blue-600";

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* --- Left: Welcome text --- */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
            {recruiterName ? recruiterName[0].toUpperCase() : "R"}
          </div>
          <div>
            <h1 className="text-sm text-gray-500 leading-tight">Welcome</h1>
            <h2 className="text-base font-semibold text-gray-800">
              {recruiterName || "Recruiter"}
            </h2>
          </div>
        </div>

        {/* --- Center: Navigation Links --- */}
        <nav className="flex gap-6">
          <NavLink
            to="/recruiter/dashboard/all-candidates"
            className={({ isActive }) => (isActive ? activeLink : linkClass)}
          >
            All Candidates
          </NavLink>
          <NavLink
            to="/recruiter/dashboard/my-candidates"
            className={({ isActive }) => (isActive ? activeLink : linkClass)}
          >
            My Candidates
          </NavLink>
          <NavLink
            to="/recruiter/dashboard/all-jobs"
            className={({ isActive }) => (isActive ? activeLink : linkClass)}
          >
            All Jobs
          </NavLink>
          <NavLink
            to="/recruiter/dashboard/my-jobs"
            className={({ isActive }) => (isActive ? activeLink : linkClass)}
          >
            My Jobs
          </NavLink>
          <NavLink
            to="/recruiter/dashboard/profile"
            className={({ isActive }) => (isActive ? activeLink : linkClass)}
          >
            Profile
          </NavLink>
        </nav>

        {/* --- Right: Logout Button --- */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-all duration-200 shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
