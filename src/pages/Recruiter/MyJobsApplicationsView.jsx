import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useParams, Link } from "react-router-dom";

export default function MyJobsApplicationsView() {

  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");

  /* --------------------------
      FETCH JOB DETAILS
  --------------------------- */
  useEffect(() => {
    if (!jobId) return;
    const ref = doc(db, "jobs", jobId);

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
        else setJob(null);
      })
      .catch(() => setJob(null));
  }, [jobId]);

  /* --------------------------
      FETCH APPLICATIONS
  --------------------------- */
  useEffect(() => {
    if (!jobId) return;

    const q = query(
      collection(db, "applications"),
      where("jobDocId", "==", jobId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = [];

      for (const d of snap.docs) {
        const app = { id: d.id, ...d.data() };

        let c = null;

        // 1. Direct Signup Users
        if (app.candidateId) {
          const userSnap = await getDoc(doc(db, "users", app.candidateId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            c = {
              name: u.name,
              email: u.email,
              phone: u.mobile,
              experience: u.experience || "",
              title: u.jobTitle || "",
              resumeUrl: u.resumeUrl || "",
            };
          }
        }

        // 2. Bench Candidates
        if (!c && app.candidateId) {
          const benchSnap = await getDoc(doc(db, "candidates", app.candidateId));
          if (benchSnap.exists()) {
            const b = benchSnap.data();
           c = {
  name: b.fullName,
  email: b.email,
  phone: b.mobile,
  experience: b.experience,
  title: b.jobTitle,
  resumeUrl: b.resumeUrl,

  // recruiter details come from the application (app)
  recruiterEmail: app.recruiterEmail || "",
  recruiterPhone: app.recruiterPhone || "",
  recruiterCompany: app.recruiterCompany || "",
};

          }
        }

        list.push({
          ...app,
          candidate: c,
        });
      }

      setApplications(list);
    });

    return () => unsub();
  }, [jobId]);

  if (job === null) return <div className="p-6">Job not found.</div>;
  if (!job) return <div className="p-6">Loading job...</div>;

  /* --------------------------
      FILTERS
  --------------------------- */
  const benchApps = applications.filter((a) => a.appliedByRecruiter);
  const directApps = applications.filter((a) => !a.appliedByRecruiter);
// Time ago formatter
const timeAgo = (ts) => {
  if (!ts) return "—";

  // If ts has toDate() (Firestore Timestamp)
  let d;
  if (typeof ts.toDate === "function") {
    d = ts.toDate();
  } 
  // If ts is {seconds, nanoseconds}
  else if (ts.seconds) {
    d = new Date(ts.seconds * 1000);
  } 
  // If ts is already a JS Date
  else if (ts instanceof Date) {
    d = ts;
  } 
  else {
    return "—";
  }

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;

  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? "" : "s"} ago`;
};


  /* TABLE COMPONENT (Corporate Style) */
  const ApplicationsTable = ({ data }) => (
    <table className="w-full table-auto text-sm border rounded-lg overflow-hidden">
      <thead className="bg-indigo-600 text-white">
        <tr>
          <th className="px-4 py-2 text-left w-1/4">Candidate</th>
          <th className="px-4 py-2 text-left w-1/4">Email</th>
          <th className="px-4 py-2 text-left w-24">Phone</th>
          <th className="px-4 py-2 text-left w-16">Exp</th>
          <th className="px-4 py-2 text-left w-24">Source</th>
          <th className="px-4 py-2 text-left w-20">Resume</th>
          <th className="px-4 py-2 text-left w-32">Submitted</th>

        </tr>
      </thead>

      <tbody>
        {data.map((app, i) => (
          <tr
            key={app.id}
            className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
          >
            <td className="px-4 py-3">
              <div className="font-medium">{app.candidate?.name || "—"}</div>
              <div className="text-xs text-slate-500">
                {app.candidate?.title || ""}
              </div>
            </td>

            <td className="px-4 py-3">{app.candidate?.email || "—"}</td>

            <td className="px-4 py-3">{app.candidate?.phone || "—"}</td>

            <td className="px-4 py-3">
              {app.candidate?.experience
                ? `${app.candidate.experience} yrs`
                : "—"}
            </td>

            <td className="px-4 py-3">
 {app.appliedByRecruiter ? (
  <div>
    <div className="font-medium text-slate-800">{app.recruiterEmail || "—"}</div>
    <div className="text-xs text-slate-500">{app.recruiterPhone || ""}</div>
    <div className="text-xs text-slate-500">{app.recruiterCompany || ""}</div>
  </div>
) : (
  "Direct"
)}

</td>


            <td className="px-4 py-3">
              {app.candidate?.resumeUrl ? (
                <a
                  href={app.candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline"
                >
                  View
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">
  {app.createdAt
    ? timeAgo(app.createdAt.toDate())
    : "—"}
</td>

          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {job.jobTitle}
          </h1>
          <div className="text-sm text-slate-600 mt-1">
            {job.hideCompany ? "Confidential" : job.company} •{" "}
            {job.jobLocation}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Job ID: {job.jobId}</div>
          <Link
            to="/recruiter/dashboard/my-jobs"
            className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
          >
            ← Back to My Jobs
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b mt-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600"
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("bench")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ml-4 ${
            activeTab === "bench"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600"
          }`}
        >
          Bench Submissions ({benchApps.length})
        </button>

        <button
          onClick={() => setActiveTab("direct")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ml-4 ${
            activeTab === "direct"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600"
          }`}
        >
          Direct Candidates ({directApps.length})
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-700">Job Type</h3>
              <p className="mt-1 text-sm">{job.jobType}</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700">Work Mode</h3>
              <p className="mt-1 text-sm">{job.workMode}</p>
            </div>

            {job.salaryAmount && (
              <div>
                <h3 className="font-semibold text-slate-700">Salary / Pay</h3>
                <p className="mt-1 text-sm">
                  {job.salaryAmount} {job.salaryType}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-700">Experience</h3>
              <p className="mt-1 text-sm">{job.experience}</p>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-slate-700">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Array.isArray(job.skills)
                  ? job.skills
                  : job.skills.split(",")
                ).map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-100 rounded text-xs"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-slate-700">
                Job Description
              </h3>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {job.jobDescription}
              </p>
            </div>
          </div>
        )}

        {/* BENCH TABLE */}
        {activeTab === "bench" && (
          <div>
            {benchApps.length === 0 ? (
              <div className="text-sm text-slate-500">
                No bench submissions.
              </div>
            ) : (
              <ApplicationsTable data={benchApps} />
            )}
          </div>
        )}

        {/* DIRECT TABLE */}
        {activeTab === "direct" && (
          <div>
            {directApps.length === 0 ? (
              <div className="text-sm text-slate-500">
                No direct candidates yet.
              </div>
            ) : (
              <ApplicationsTable data={directApps} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
