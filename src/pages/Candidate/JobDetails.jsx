// src/pages/Candidate/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../../firebase/config";
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

/**
 * Job details and apply feature (saves to /applications)
 * - prevents duplicate apply (checks applications collection)
 * - writes notification to /notifications for recruiter
 */

export default function JobDetails() {
  const { jobDocId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "jobs", jobDocId));
        if (!snap.exists()) { if (mounted) setJob(null); return; }
        const j = { id: snap.id, ...snap.data() };
        if (Array.isArray(j.skills)) j.skills = j.skills;
        else if (typeof j.skills === "string") j.skills = j.skills.split(",").map(s => s.trim()).filter(Boolean);
        else j.skills = [];
        if (mounted) setJob(j);
      } catch (err) {
        console.error("Load job error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [jobDocId]);

  useEffect(() => {
    const checkApplied = async () => {
      try {
        if (!auth.currentUser) { setAlreadyApplied(false); return; }
        const appsRef = collection(db, "applications");
        const q = query(appsRef, where("jobDocId", "==", jobDocId), where("candidateId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        setAlreadyApplied(!snap.empty);
      } catch (err) {
        console.error("Check applied error:", err);
      }
    };
    checkApplied();
  }, [jobDocId]);

  const handleApply = async () => {
    if (!auth.currentUser) {
      alert("Please login to apply.");
      return;
    }
    if (alreadyApplied) {
      alert("You've already applied for this job.");
      return;
    }

    setApplying(true);
    try {
      const payload = {
        jobDocId: job.id,
        jobId: job.jobId || null,
        candidateId: auth.currentUser.uid,
        recruiterId: job.recruiterId || null,
        status: "Applied",
        country: job.country || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "applications"), payload);

      // write notification for recruiter
      if (job.recruiterId) {
        await addDoc(collection(db, "notifications"), {
          type: "candidateApplied",
          jobDocId: job.id,
          jobId: job.jobId || null,
          candidateId: auth.currentUser.uid,
          recruiterId: job.recruiterId,
          createdAt: serverTimestamp(),
          read: false,
        });
      }

      alert("Application submitted successfully.");
      setAlreadyApplied(true);
    } catch (err) {
      console.error("Apply failed:", err);
      alert("Failed to apply. Try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{job.jobTitle}</h1>
              <div className="text-sm text-slate-500 mt-1">{job.hideCompany ? "Company hidden" : (job.company || "—")} • {job.jobLocation || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Job ID: {job.jobId}</div>
              <div className="mt-3">
                <button disabled={alreadyApplied || applying} onClick={handleApply} className="px-4 py-2 rounded bg-indigo-600 text-white">
                  {alreadyApplied ? "Applied" : (applying ? "Applying..." : "Apply")}
                </button>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Job Description</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.jobDescription}</p>

              <div className="mt-4">
                <h4 className="text-sm font-medium">Skills</h4>
                <div className="flex gap-2 flex-wrap mt-2">
                  {job.skills.map((s, i) => <span key={i} className="text-xs px-2 py-1 rounded bg-slate-100">{s}</span>)}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Experience</div>
              <div className="text-sm font-medium text-slate-800">{job.experience || "—"}</div>

              <div className="mt-3 text-sm text-slate-600">Work Mode</div>
              <div className="text-sm font-medium text-slate-800">{job.workMode || "—"}</div>

              {job.country === "USA" && job.workAuth && (
                <>
                  <div className="mt-3 text-sm text-slate-600">Work Auth</div>
                  <div className="text-sm font-medium text-slate-800">{job.workAuth}</div>
                </>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link to="/candidate/jobs" className="text-indigo-600">← Back to search</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
