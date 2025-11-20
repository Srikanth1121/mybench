import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
export default function CandidateNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
const profileRef = useRef(null);

  const [user, setUser] = useState({
    displayName: "Candidate",
    initials: "C",
  });

  const [notificationsCount, setNotificationsCount] = useState(0);

  // 🔵 LOAD USER INFO + NOTIFICATIONS HERE
  useEffect(() => {
    const current = auth.currentUser;
    if (!current) return;

    // USER DETAILS
    getDoc(doc(db, "users", current.uid)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      const initials =
        data.name
          ? data.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
          : current.email.slice(0, 1).toUpperCase();

      setUser({
        displayName: data.name || current.email.split("@")[0],
        initials,
      });
    });

    // NOTIFICATIONS (LIVE)
    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("candidateId", "==", current.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotificationsCount(snap.size);
    });

    return unsubscribe;
  }, []);
useEffect(() => {
  function handleClickOutside(e) {
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      setShowProfileMenu(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const active = (path) =>
    location.pathname === path
      ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
      : "text-slate-600 hover:text-indigo-600";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {/* FIXED TOP NAVBAR */}
      <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6">
        
        {/* LEFT — LOGO */}
        <div className="text-xl font-semibold text-indigo-600">MyBench</div>

        {/* CENTER — NAV LINKS */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm font-medium">
          <Link to="/candidate/dashboard" className={active("/candidate/dashboard")}>
            Dashboard
          </Link>
          <Link to="/candidate/jobs" className={active("/candidate/jobs")}>
            Job Search
          </Link>
          <Link to="/candidate/applied" className={active("/candidate/applied")}>
            Applied Jobs
          </Link>
          <Link to="/candidate/profile" className={active("/candidate/profile")}>
            Profile
          </Link>
        </nav>

        {/* RIGHT — NOTIFICATIONS + AVATAR */}
        <div className="flex items-center gap-4">

          {/* NOTIFICATIONS */}
          <button className="relative p-2 hover:bg-slate-100 rounded">
            <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24">
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* AVATAR + MENU */}
          <div className="relative" ref={profileRef}>
<button
              onClick={() => setShowProfileMenu((s) => !s)}
              className="flex items-center gap-3 px-3 py-1 hover:bg-slate-50 rounded"
            >
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                {user.initials}
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-700">{user.displayName}</div>
                <div className="text-xs text-slate-500">Candidate</div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-md rounded-md py-2 z-50">
                <Link to="/candidate/profile" className="block px-4 py-2 text-sm hover:bg-slate-50">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="pt-24 px-6">
        <Outlet />
      </main>
    </>
  );
}
