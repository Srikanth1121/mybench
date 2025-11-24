// src/pages/Recruiter/Alljobdetailsview.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import RecruiterNavBar from "./RecruiterNavBar";

/**
 * Alljobdetailsview.jsx
 *
 * Job Details page + Submit Bench Candidate modal
 *
 * Behavior:
 * - Loads job by :jobId
 * - Shows job overview
 * - Shows "Submit Bench Candidate" button (hidden when job.postedBy === currentUser.uid)
 * - Modal lists current recruiter's candidates (from 'candidates' collection)
 * - Submit creates a doc in 'applications' collection with:
 *     { jobDocId, candidateId, appliedByRecruiter: true, recruiterId, createdAt }
 * - Prevents duplicate candidate submission for same job
 */

export default function Alljobdetailsview() {
  // ⭐ COPY FUNCTION — Put this right after function start
// ⭐ Copy Job Details in Side-by-Side 2-Column Format
const copyJobDetails = () => {
  if (!job) return;

  // Column widths for side-by-side layout
  const pad = (text, width = 40) =>
    (text + " ".repeat(width)).slice(0, width);

  const left1  = pad(`JOB TITLE: ${job.jobTitle}`);
  const right1 = `WORK TYPE: ${job.workAuth}`;

  const left2  = pad(`JOB LOCATION: ${job.jobLocation}`);
  const right2 = `VISA TYPE: ${job.visaType}`;

  const left3  = pad(`EXPERIENCE: ${job.experience}`);
  const right3 = `WORK MODE: ${job.workMode}`;

  const referral = job.referralFee
    ? `REFERRAL REWARD: ${job.referralDetails || "Yes"}`
    : "";

  const skills = Array.isArray(job.skills)
    ? job.skills.join(", ")
    : job.skills || "";

  const finalText = `
${left1}${right1}
${left2}${right2}
${left3}${right3}

${referral}

MANDATORY SKILLS:
${skills}

JOB DESCRIPTION:
${job.jobDescription}
`.trim();

  navigator.clipboard.writeText(finalText);
  alert("Copied!");
};

  const { jobId } = useParams();
  const auth = getAuth();

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [myCandidates, setMyCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidateSearch, setCandidateSearch] = useState("");

  // simple submit-in-progress flag
  const [submittingId, setSubmittingId] = useState(null);
// track candidate IDs already submitted for this job
const [alreadySubmitted, setAlreadySubmitted] = useState([]);

  /* --------------------------
     FETCH JOB DETAILS
  --------------------------- */
  useEffect(() => {
    if (!jobId) return;
    setLoadingJob(true);
    const ref = doc(db, "jobs", jobId);
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
        else setJob(null);
      })
      .catch((err) => {
        console.error("Error fetching job:", err);
        setJob(null);
      })
      .finally(() => setLoadingJob(false));
  }, [jobId]);
// Load all already-submitted candidates for this job
useEffect(() => {
  if (!jobId) return;

  const q = query(
    collection(db, "applications"),
    where("jobDocId", "==", jobId)
  );

  const unsub = onSnapshot(q, (snap) => {
    const submitted = snap.docs.map((d) => d.data().candidateId);
    setAlreadySubmitted(submitted);
  });

  return () => unsub();
}, [jobId]);

  /* --------------------------
     Fetch recruiter's own candidates (for modal)
     - realtime listener; loaded only when modal opens and user present
  --------------------------- */
  useEffect(() => {
    if (!showSubmitModal) return;
    const user = auth.currentUser;
    if (!user) return;

    setCandidatesLoading(true);

   const q = query(
  collection(db, "candidates"),
  where("recruiterId", "==", user.uid),
  orderBy("createdAt", "desc")
);


    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMyCandidates(arr);
        setCandidatesLoading(false);
      },
      (err) => {
        console.error("Error loading my candidates:", err);
        setCandidatesLoading(false);
      }
    );

    return () => unsub();
  }, [showSubmitModal, auth]);

  if (loadingJob) return <div className="p-6">Loading job...</div>;
  if (job === null) return <div className="p-6">Job not found.</div>;

  // Whether current user is allowed to submit (if job.postedBy exists, disallow poster)
  const user = auth.currentUser;
  const isPoster =
    user && job.postedBy ? job.postedBy === user.uid : false; // if postedBy not set -> allow
  const canSubmit = user && !isPoster;

  /* --------------------------
     Candidate list filtering (client-side)
  --------------------------- */
  const filteredCandidates = myCandidates.filter((c) => {
    if (!candidateSearch.trim()) return true;
    const s = candidateSearch.toLowerCase();
    return (
      (c.fullName || c.name || "").toLowerCase().includes(s) ||
      (c.jobTitle || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.mobile || "").toLowerCase().includes(s)
    );
  });

  /* --------------------------
     SUBMIT CANDIDATE
     - Prevent duplicate: check if an application already exists for (jobId, candidate.id)
  --------------------------- */
  const submitCandidate = async (candidate) => {
    if (!user) {
      alert("Please sign in to submit candidates.");
      return;
    }
    if (!jobId || !candidate?.id) {
      alert("Invalid job or candidate.");
      return;
    }

    const confirm = window.confirm(
      `Submit ${candidate.fullName || candidate.name} to "${job.jobTitle}"?`
    );
    if (!confirm) return;

    setSubmittingId(candidate.id);

    try {
      // check duplicates
      // 1️⃣ Fetch recruiter profile
const recruiterRef = doc(db, "users", user.uid);
const recruiterSnap = await getDoc(recruiterRef);
const recruiter = recruiterSnap.exists() ? recruiterSnap.data() : {};

      const dupQ = query(
        collection(db, "applications"),
        where("jobDocId", "==", jobId),
        where("candidateId", "==", candidate.id)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        alert("This candidate was already submitted for this job.");
        setSubmittingId(null);
        return;
      }

      // create application
     await addDoc(collection(db, "applications"), {
  jobDocId: jobId,
  candidateId: candidate.id,
  appliedByRecruiter: true,

  // recruiter details
  recruiterId: user.uid,
  recruiterEmail: recruiter.email || user.email || "",
  recruiterPhone: recruiter.mobile || "",
  recruiterCompany: recruiter.company || "",

  createdAt: serverTimestamp(),
});


      alert("✅ Candidate submitted successfully!");
      // Optionally close modal or keep open to submit more - here we keep open
      // setShowSubmitModal(false);
    } catch (err) {
      console.error("Error submitting candidate:", err);
      alert("❌ Failed to submit candidate. Try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  /* --------------------------
     Small UI helpers
  --------------------------- */
  const renderSkills = (skills) => {
    if (!skills) return null;
    const arr = Array.isArray(skills) ? skills : String(skills).split(",");
    return (
      <div className="mt-2 flex flex-wrap gap-2">
               {arr.map((s, i) => (
          <span
            key={i}
            className="px-3 py-1 border border-slate-400 bg-slate-50 text-xs text-slate-800"
          >
            {String(s).trim()}
          </span>
        ))}

      </div>//////////////
    );
  };

    return (
  <div className="min-h-screen bg-slate-50">
    <RecruiterNavBar />

    <div className="max-w-6xl mx-auto px-6 py-8"></div>
    <div className="max-w-6xl mx-auto px-6 pt-0 pb-6">

           {/* Page Title Bar (Oracle style) */}
      <div className="bg-indigo-600 text-white px-5 py-4 rounded-lg mb-4 flex items-center justify-between">


      <div>
  {/* Title label */}
  <div className="text-xs font-bold tracking-wide uppercase text-white">
    Job Details
  </div>

  {/* Job Title */}
  <div className="text-xl font-bold text-white mt-1">
    {job.jobTitle}
  </div>

  {/* Company + Location */}
  <div className="text-xs font-bold text-white mt-1">
    {job.hideCompany ? "Confidential" : job.company} • {job.jobLocation}
  </div>
</div>

<div className="text-right text-xs font-bold text-white">
  Job ID
  <div className="font-bold mt-1 text-white">
    {job.jobId || job.id}
  </div>
</div>

      </div>

      {/* Actions (right aligned, Oracle style) */}
      <div className="flex items-center justify-end gap-3 mb-6">
        {canSubmit ? (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Submit Bench Candidate
          </button>
        ) : (
          <div className="text-xs text-slate-600">
            {user
              ? "You posted this job — you cannot submit to your own job."
              : "Sign in to submit candidates."}
          </div>
        )}

        <button
          onClick={() => window.print()}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
        >
          Print
        </button>
      </div>
<button
  onClick={copyJobDetails}
  className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-100 flex items-center gap-2"
>
  <span>📋</span> Copy
</button>


       {/* Job Details (India-first, 2-column responsive layout) */}
<div className="bg-white border border-slate-300 rounded-md">

  {/* Header */}
  <div className="px-4 py-2 bg-slate-100 border-b border-slate-300">
    <h2 className="text-sm font-semibold text-slate-800">Job Details</h2>
  </div>

  {/* India-first logic */}
  {job?.country === "India" ? (
    <div className="grid grid-cols-1 md:grid-cols-2">

      {/* LEFT COLUMN — India */}
      <div className="border-r border-slate-200">

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Title:</div>
          <div className="text-slate-800">{job.jobTitle || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Location:</div>
          <div className="text-slate-800">{job.jobLocation || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Experience:</div>
          <div className="text-slate-800">{job.experience || "—"}</div>
        </div>

        {job.salaryAmount ? (
          <div className="flex px-4 py-2 border-b border-slate-200">
            <div className="w-40 font-semibold text-slate-700">Salary:</div>
            <div className="text-slate-800">
              {job.salaryAmount} {job.salaryType ? `/ ${job.salaryType}` : ""}
            </div>
          </div>
        ) : null}

        <div className="flex px-4 py-2">
          <div className="w-40 font-semibold text-slate-700">Qualification:</div>
          <div className="text-slate-800">{job.qualification || "—"}</div>
        </div>

      </div>

      {/* RIGHT COLUMN — India */}
      <div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Work Mode:</div>
          <div className="text-slate-800">{job.workMode || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Job Type:</div>
          <div className="text-slate-800">{job.jobType || "—"}</div>
        </div>

        {job.genderPreference && job.genderPreference !== "Any" && (
          <div className="flex px-4 py-2 border-b border-slate-200">
            <div className="w-40 font-semibold text-slate-700">Gender Preference:</div>
            <div className="text-slate-800">{job.genderPreference}</div>
          </div>
        )}

        {job.jobType === "Contract" && (
          <div className="flex px-4 py-2 border-b border-slate-200">
            <div className="w-40 font-semibold text-slate-700">C2C Allowed:</div>
            <div className="text-slate-800">{job.c2cAllowed ? "Yes" : "No"}</div>
          </div>
        )}

        {job.referralFee && (
          <div className="flex px-4 py-2">
            <div className="w-40 font-semibold text-slate-700">Referral Reward:</div>
            <div className="text-slate-800">{job.referralDetails || "Yes"}</div>
          </div>
        )}

      </div>

    </div>
  ) : (
    /* USA Layout */
    <div className="grid grid-cols-1 md:grid-cols-2">

      {/* LEFT COLUMN — USA */}
      <div className="border-r border-slate-200">

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Title:</div>
          <div className="text-slate-800">{job.jobTitle || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Location:</div>
          <div className="text-slate-800">{job.jobLocation || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Experience:</div>
          <div className="text-slate-800">{job.experience || "—"}</div>
        </div>

        {job.payRate && (
          <div className="flex px-4 py-2">
            <div className="w-40 font-semibold text-slate-700">Pay Rate:</div>
            <div className="text-slate-800">
              {job.payRate} {job.payType ? `/ ${job.payType}` : ""}
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN — USA */}
      <div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Work Type:</div>
          <div className="text-slate-800">
            {job.workAuth || job.workType || "—"}
          </div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Visa Type:</div>
          <div className="text-slate-800">{job.visaType || "—"}</div>
        </div>

        <div className="flex px-4 py-2 border-b border-slate-200">
          <div className="w-40 font-semibold text-slate-700">Work Mode:</div>
          <div className="text-slate-800">{job.workMode || "—"}</div>
        </div>

        {job.referralFee && (
          <div className="flex px-4 py-2">
            <div className="w-40 font-semibold text-slate-700">Referral Reward:</div>
            <div className="text-slate-800">{job.referralDetails || "Yes"}</div>
          </div>
        )}

      </div>

    </div>
  )}

</div>


{/* Mandatory Skills + Job Description (Combined Block) */}
<div className="bg-white border border-slate-300 rounded-md mt-4">

  {/* Mandatory Skills Header */}
  <div className="px-4 py-2 bg-slate-100 border-b border-slate-300">
    <h2 className="text-sm font-semibold text-slate-800">Mandatory Skills</h2>
  </div>

  {/* Mandatory Skills Content */}
  <div className="px-4 py-3">
    {job.skills && job.skills.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(job.skills) ? job.skills : job.skills.split(",")).map(
          (skill, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs text-slate-800"
            >
              {skill.trim()}
            </span>
          )
        )}
      </div>
    ) : (
      <div className="text-slate-500 text-sm">No skills specified</div>
    )}
  </div>

  {/* Job Description Header */}
  <div className="px-4 py-2 bg-slate-100 border-y border-slate-300 mt-2">
    <h2 className="text-sm font-semibold text-slate-800">Job Description</h2>
  </div>

  {/* Job Description Content */}
  <div className="px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
    {job.jobDescription || "—"}
  </div>

</div>


</div>
      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSubmitModal(false)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h2 className="text-lg font-semibold">Submit Bench Candidate</h2>
                <div className="text-xs text-slate-500">Choose from your candidates</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-slate-600 px-3 py-1 rounded hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* Search */}
              <div className="mb-3">
                <input
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search by name, title, email or phone"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              {candidatesLoading ? (
                <div className="text-center text-sm text-slate-500 py-6">Loading your bench candidates...</div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-6">
                  No candidates found in your bench.
                  <div className="mt-3">
                    <Link to="/recruiter/candidates" className="text-indigo-600 underline">Add candidate</Link>
                  </div>
                </div>
             ) : (
  <div className="border border-slate-400 rounded-md overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50">
        <tr className="text-left text-xs font-semibold text-slate-600">
          <th className="px-3 py-2">Candidate</th>
          <th className="px-3 py-2">Experience</th>
          <th className="px-3 py-2">Contact</th>
          <th className="px-3 py-2">Resume</th>
          <th className="px-3 py-2 text-right">Action</th>
        </tr>
      </thead>

      <tbody>
        {filteredCandidates.map((c) => (
          <tr
            key={c.id}
            className="border-t border-slate-400 hover:bg-slate-50"
          >
            <td className="px-3 py-2 align-top">
              <div className="font-medium text-slate-800">
                {c.fullName || c.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.jobTitle || ""}
              </div>
            </td>

            <td className="px-3 py-2 align-top text-xs text-slate-700">
              {c.experience ? `${c.experience} yrs` : "—"}
            </td>

            <td className="px-3 py-2 align-top text-xs text-slate-700">
              {c.email || c.mobile || "—"}
            </td>

            <td className="px-3 py-2 align-top text-xs">
              {c.resumeUrl ? (
                <a
                  href={c.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View Resume
                </a>
              ) : (
                <span className="text-slate-400">No resume</span>
              )}
            </td>

            <td className="px-3 py-2 align-top">
              <div className="flex justify-end">
                {alreadySubmitted.includes(c.id) ? (
                  <div className="px-3 py-1.5 rounded-full text-xs bg-slate-200 text-slate-600">
                    Submitted
                  </div>
                ) : (
                  <button
                    disabled={submittingId === c.id}
                    onClick={() => submitCandidate(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      submittingId === c.id
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {submittingId === c.id ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
