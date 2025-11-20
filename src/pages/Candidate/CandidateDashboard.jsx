// src/pages/Candidate/CandidateDashboard.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // cleaned
import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function CandidateDashboard() {
  // metrics
  const [metrics, setMetrics] = useState({
    applications: 0,
    shortlisted: 0,
    interviews: 0,
    profileCompletion: 0,
  });

  const [user, setUser] = useState({
    displayName: "Candidate",
    initials: "C",
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // time ago helper
  const timeAgo = (ts) => {
    if (!ts) return "";
    const ms = ts.toMillis ? ts.toMillis() : ts instanceof Date ? ts.getTime() : 0;
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  useEffect(() => {
    let unsubNotifications = null;
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      const current = auth.currentUser;

      if (!current) {
        setUser({ displayName: "Candidate", initials: "C" });
        setMetrics((p) => ({ ...p, applications: 0 }));
        setRecentActivity([]);
        setLoading(false);
        return;
      }

      try {
        // Load user doc
        const userDocSnap = await getDoc(doc(db, "users", current.uid));
        let userData = {};

        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          const displayName = userData.name || current.email.split("@")[0];
          const initials =
            (userData.name &&
              userData.name.split(" ").map((p) => p[0]).slice(0, 2).join("")) ||
            current.email.slice(0, 1).toUpperCase();

          if (mounted) setUser({ displayName, initials });
        } else {
          if (mounted)
            setUser({
              displayName: current.email.split("@")[0],
              initials: current.email.slice(0, 1).toUpperCase(),
            });
        }

        // Profile completion
        const fields = [
          userData.name,
          userData.mobile,
          userData.resumeText || userData.resumeUrl,
          userData.skills &&
            (Array.isArray(userData.skills)
              ? userData.skills.length > 0
              : userData.skills?.length > 0),
          userData.experience,
        ];

        const filled = fields.filter(Boolean).length;
        const completion = Math.round((filled / fields.length) * 100) || 0;

        if (mounted) setMetrics((p) => ({ ...p, profileCompletion: completion }));

        // Applications
        const appsQ = query(
          collection(db, "applications"),
          where("candidateId", "==", current.uid),
          orderBy("createdAt", "desc")
        );

        const appsSnap = await getDocs(appsQ);
        const appsDocs = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (mounted)
          setMetrics((p) => ({ ...p, applications: appsDocs.length }));

        // Recent activity
        const recent = appsDocs.slice(0, 5);
        const joined = await Promise.all(
          recent.map(async (a) => {
            let jobTitle = "Unknown Job";
            let jobLocation = "";

            try {
              if (a.jobDocId) {
                const jSnap = await getDoc(doc(db, "jobs", a.jobDocId));
                if (jSnap.exists()) {
                  const jd = jSnap.data();
                  jobTitle = jd.jobTitle || jd.title || "Job";
                  jobLocation = jd.jobLocation || jd.location || "";
                }
              }
            } catch (e) {}

            return { ...a, jobTitle, jobLocation };
          })
        );

        if (mounted) setRecentActivity(joined);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* MAIN CONTENT BELOW FIXED NAVBAR */}
      <main className="pt-24 px-8">

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
            <div className="text-sm text-slate-500">Applications Submitted</div>
            <div className="mt-3 text-2xl font-semibold">{metrics.applications}</div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
            <div className="text-sm text-slate-500">Shortlisted</div>
            <div className="mt-3 text-2xl font-semibold">{metrics.shortlisted}</div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
            <div className="text-sm text-slate-500">Interviews Scheduled</div>
            <div className="mt-3 text-2xl font-semibold">{metrics.interviews}</div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
            <div className="text-sm text-slate-500">Profile Completion</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-2xl font-semibold">
                {metrics.profileCompletion}%
              </div>
              <div className="w-24">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.profileCompletion}%` }}
                    className="h-2 bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Welcome */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">
              Welcome back, {user.displayName}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              You have {metrics.applications} active applications.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/candidate/jobs"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
              >
                Search Jobs
              </Link>
              <Link
                to="/candidate/applied"
                className="px-4 py-2 border border-slate-200 rounded-md text-sm hover:bg-slate-50"
              >
                View Applied Jobs
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
            <h4 className="text-md font-semibold mb-3">Recent Activity</h4>

            {recentActivity.length === 0 ? (
              <div className="text-sm text-slate-500">No recent activity yet.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {recentActivity.map((r) => (
                  <li key={r.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                    <div className="flex-1">
                      <div className="font-medium">{r.jobTitle}</div>
                      <div className="text-xs text-slate-500">{r.jobLocation}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Applied • {timeAgo(r.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.jobId ? `#${r.jobId}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
