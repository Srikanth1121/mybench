// src/pages/Candidate/AppliedJobs.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AppliedJobs() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (!auth.currentUser) { if (mounted) setApps([]); setLoading(false); return; }

        const appsRef = collection(db, "applications");
        const q = query(appsRef, where("candidateId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);

        const data = await Promise.all(snap.docs.map(async d => {
          const a = { id: d.id, ...d.data() };
          let job = null;
          if (a.jobDocId) {
            const jSnap = await getDoc(doc(db, "jobs", a.jobDocId));
            if (jSnap.exists()) job = { id: jSnap.id, ...jSnap.data() };
            if (Array.isArray(job?.skills)) job.skills = job.skills;
            else if (job?.skills && typeof job.skills === "string") job.skills = job.skills.split(",").map(s => s.trim()).filter(Boolean);
            else job = job;
          }
          return { ...a, job };
        }));

        if (mounted) setApps(data);
      } catch (err) {
        console.error("Load apps error:", err);
        if (mounted) setApps([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  if (!auth.currentUser) return <div className="p-6">Please log in to view your applications.</div>;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Applied Jobs</h2>

        {apps.length === 0 ? (
          <div className="bg-white p-6 rounded shadow-sm">You have no applications yet.</div>
        ) : apps.map(a => (
          <div key={a.id} className="bg-white rounded-lg border p-4 mb-4 shadow-sm flex justify-between">
            <div>
              <h3 className="text-lg font-medium">{a.job?.jobTitle || "Job removed"}</h3>
              <div className="text-sm text-slate-500">{a.job?.company || ""} • {a.job?.jobLocation || ""}</div>
              <div className="text-sm text-slate-600 mt-2">Status: {a.status}</div>
              <div className="text-xs text-slate-400 mt-1">Applied: {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : "—"}</div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button onClick={() => navigate(`/candidate/application/${a.id}`)} className="px-4 py-2 bg-indigo-600 text-white rounded">Open</button>
              <div className="text-xs text-slate-400">{a.job?.jobId ? `Job ID: ${a.job.jobId}` : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
