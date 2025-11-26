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
import { useParams } from "react-router-dom";
import MyJobCandidateAdvanceFilters from "./MyJobCandidateAdvanceFilters";

export default function MyJobsApplicationsView() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [filterValues, setFilterValues] = useState({});
 const [activeTab, setActiveTab] = useState("overview");
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
  setApplicationsLoading(true);
    const q = query(
      collection(db, "applications"),
      where("jobDocId", "==", jobId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      // Load base application rows immediately (without candidate details)
      const baseRows = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        candidate: null,          // placeholder
        _loadingCandidate: true   // UI can use this
      }));

      setApplications(baseRows); // smooth immediate rendering

      // Load candidate details in parallel (fast + smooth)
      const fullRows = await Promise.all(
        baseRows.map(async (app) => {
          let candidate = null;

          try {
            // Direct user candidate
            const userRef = doc(db, "users", app.candidateId || "");
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const u = userSnap.data();
              candidate = {
                name: u.name,
                email: u.email,
                phone: u.mobile,
                experience: u.experience || "",
                title: u.jobTitle || "",
                resumeUrl: u.resumeUrl || "",
                country: u.country || "",
                city: u.city || "",
                state: u.state || ""
              };
            } else {
              // Bench candidate
              const benchRef = doc(db, "candidates", app.candidateId || "");
              const benchSnap = await getDoc(benchRef);

              if (benchSnap.exists()) {
                const b = benchSnap.data();
                candidate = {
                  name: b.fullName,
                  email: b.email,
                  phone: b.mobile,
                  experience: b.experience,
                  title: b.jobTitle,
                  resumeUrl: b.resumeUrl,
                  country: b.country || "",
                  city: b.city || "",
                  state: b.state || ""
                };
              }
            }
          } catch (e) {
            console.error("Error loading candidate", e);
          }

          return {
            ...app,
            candidate,
            _loadingCandidate: false
          };
        })
      );

      // Update filled-in data
      setApplications(fullRows);
      setApplicationsLoading(false);

    });

    return () => unsub();
  }, [jobId]);


  /* --------------------------
      FILTERS
  --------------------------- */
  let benchApps = applications.filter((a) => a.appliedByRecruiter);
  let directApps = applications.filter((a) => !a.appliedByRecruiter);
// Convert formatted CTC ("5,00,000" or "120,000") into plain number
const parseFormattedNumber = (value) => {
  if (!value) return 0;
  return Number(String(value).replace(/,/g, ""));
};

  // APPLY FILTERS (only if filters exist)
  const applyFilters = (list) => {
    return list.filter((app) => {
      const c = app.candidate;
      if (!c) return false;

      // Skills search (renamed field)
      if (filterValues.skillsSearch) {
        const search = filterValues.skillsSearch.toLowerCase();
        // try resume text if available else candidate title/skills fields
        const resume = (app.resumeText || "").toLowerCase();
        const title = (c.title || "").toLowerCase();
        const combined = `${resume} ${title}`;
        if (!combined.includes(search)) return false;
      }
 // Experience range
      if (filterValues.expMin != null && filterValues.expMin !== "") {
        if (Number(c.experience) < Number(filterValues.expMin)) return false;
      }
      if (filterValues.expMax != null && filterValues.expMax !== "") {
        if (Number(c.experience) > Number(filterValues.expMax)) return false;
      }

      // Notice period
      if (filterValues.notice && app.candidateNoticePeriod) {
        if (
          !app.candidateNoticePeriod
            .toLowerCase()
            .includes(filterValues.notice.toLowerCase())
        ) {
          return false;
        }
      }

// SINGLE Expected CTC filter (show all <= value)
// Expected CTC filter WITH TYPE
if (filterValues.expectedCtc != null && filterValues.expectedCtc !== "") {
  const expectedNumeric = parseFormattedNumber(app.expectedCTC);
  const userGiven = Number(filterValues.expectedCtc);

  // Type must match (Per Month / Per Annum / Per Hour)
  if (
    filterValues.expectedCtcType &&
    app.expectedCTCType &&
    app.expectedCTCType !== filterValues.expectedCtcType
  ) {
    return false;
  }

  // numeric filter: show all <= given
  if (expectedNumeric > userGiven) return false;
}


      // Visa (only USA)
      if (filterValues.visa && c.country === "USA") {
        if ((c.visa || "").toLowerCase() !== filterValues.visa.toLowerCase()) {
          return false;
        }
      }
  return true;
    });
  };
 
// ⭐ FIX: MOVE useMemo HERE BEFORE ANY RETURNS ⭐
const filteredBenchApps = React.useMemo(
  () => applyFilters(benchApps),
  [benchApps, filterValues]
);

const filteredDirectApps = React.useMemo(
  () => applyFilters(directApps),
  [directApps, filterValues]
);

// NOW IT'S SAFE TO RETURN
if (job === null) return <div className="p-6">Job not found.</div>;
if (!job) return <div className="p-6">Loading job...</div>;

  // Time ago formatter (unchanged)
  const timeAgo = (ts) => {
    if (!ts) return "—";

    // If ts has toDate() (Firestore Timestamp)
    let d;
    if (ts && typeof ts.toDate === "function") {
      d = ts.toDate();
    } 
    // If ts is {seconds, nanoseconds}
    else if (ts && ts.seconds) {
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

  /* TABLE COMPONENT (kept intact, small tweak: use timeAgo properly) */
  const ApplicationsTable = ({ data }) => {
    const rowsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      setCurrentPage(1);
    }, [data]);

    const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
    const startIdx = (currentPage - 1) * rowsPerPage;
    const pageData = data.slice(startIdx, startIdx + rowsPerPage);

    const showBenchExtras =
      data.length > 0 && data[0].appliedByRecruiter === true;

    const goToPage = (p) => {
      const page = Math.min(Math.max(1, p), totalPages);
      setCurrentPage(page);
    };

    const renderPageButtons = () => {
      const maxButtons = 7;
      if (totalPages <= maxButtons) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      const pages = [];
      const half = Math.floor(maxButtons / 2);
      let start = Math.max(1, currentPage - half);
      let end = start + maxButtons - 1;
      if (end > totalPages) {
        end = totalPages;
        start = end - maxButtons + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    };
// ⭐ Skeleton rows when loading
const SkeletonRows = () => {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-3 border-r">
            <div className="h-3 bg-slate-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </td>
          <td className="px-3 py-3 border-r">
            <div className="h-3 bg-slate-200 rounded w-32"></div>
          </td>
          <td className="px-3 py-3 border-r">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </td>
          <td className="px-3 py-3 border-r">
            <div className="h-3 bg-slate-200 rounded w-10"></div>
          </td>
          <td className="px-3 py-3">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

    return (
     <div className="w-full bg-white border border-slate-200 rounded-lg shadow-sm">

        <div className="w-full overflow-x-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="font-semibold text-left uppercase tracking-wide" style={{ backgroundColor: "#e7f0ff", color: "#2d3e50", borderBottom: "1px solid #d8dce3" }}>
                <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Candidate</th>
                <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Email</th>
                <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Phone</th>
                <th className="px-3 py-2 whitespace-nowrap border-r text-right" style={{ borderColor: "#d8dce3" }}>Exp</th>
                {showBenchExtras && (
                  <>
                    <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Notice Period</th>
                    <th className="px-3 py-2 whitespace-nowrap border-r text-right" style={{ borderColor: "#d8dce3" }}>Expected CTC / Rate</th>
                  </>
                )}
                <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Recruiter</th>
                <th className="px-3 py-2 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>Resume</th>
                <th className="px-3 py-2 whitespace-nowrap">Submitted</th>
              </tr>
            </thead>

            <tbody>
  {/* If still loading candidate details → show skeleton */}
  {data.some((a) => a._loadingCandidate) ? (
    <SkeletonRows />
  ) : pageData.length === 0 ? (
    <tr>
      <td colSpan={showBenchExtras ? 9 : 7} className="px-3 py-4 text-center text-slate-500">
        No applications to show.
      </td>
    </tr>
  ) : (
    pageData.map((app, idx) => {

                  const globalIndex = startIdx + idx;
                  const isOdd = globalIndex % 2 === 1;
                  return (
                    <tr key={app.id} style={{ borderBottom: "1px solid #d8dce3", height: "38px", backgroundColor: isOdd ? "#f3f4f6" : "#ffffff", transition: "background-color 0.15s ease" }} className="hover:bg-indigo-50/40 transition-colors"
>
                      <td className="px-3 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>
                        <div className="font-medium text-slate-800 truncate max-w-[240px]">{app.candidate?.name || "—"}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[240px]">{app.candidate?.title || ""}</div>
                      </td>
                      <td className="px-3 whitespace-nowrap border-r truncate max-w-[200px]" style={{ borderColor: "#d8dce3" }}>{app.candidate?.email || "—"}</td>
                      <td className="px-3 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>{app.candidate?.phone || "—"}</td>
                      <td className="px-3 whitespace-nowrap border-r text-right" style={{ borderColor: "#d8dce3" }}>{app.candidate?.experience ? `${app.candidate.experience} yrs` : "—"}</td>

                      {showBenchExtras && (
                        <>
                          <td className="px-3 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>{app.candidateNoticePeriod || "—"}</td>
                          <td className="px-3 whitespace-nowrap border-r text-right" style={{ borderColor: "#d8dce3" }}>{app.expectedCTC ? `${app.candidate?.country === "USA" ? "$" : "₹"}${app.expectedCTC} / ${app.expectedCTCType}` : "—"}</td>
                        </>
                      )}

                      <td className="px-3 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>
                        {app.appliedByRecruiter ? (
                          <div className="text-xs leading-tight">
                            <div className="font-medium">{app.recruiterEmail || "—"}</div>
                            <div>{app.recruiterPhone || ""}</div>
                            <div>{app.recruiterCompany || ""}</div>
                          </div>
                        ) : ("Direct")}
                      </td>

                      <td className="px-3 whitespace-nowrap border-r" style={{ borderColor: "#d8dce3" }}>
                        {app.candidate?.resumeUrl ? (
                          <a href={app.candidate.resumeUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: "#1a63d5" }}>View</a>
                        ) : ("—")}
                      </td>

                      <td className="px-3 whitespace-nowrap text-slate-600">{app.createdAt ? timeAgo(app.createdAt) : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-center gap-3 mt-4 py-3 border-t" style={{ borderColor: "#e8e8ef" }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${currentPage === 1 ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-700 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"}`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {renderPageButtons().map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`px-3 py-1.5 rounded-lg font-medium border text-sm transition-all duration-200 ${currentPage === p ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${currentPage === totalPages ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-700 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"}`}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // The previous helper functions used in ApplicationsTable (goToPage, currentPage etc.)
  // are inside that component's scope. But we used goToPage/currentPage/totalPages above.
  // To avoid referencing undefined names here, ensure the table component is self-contained (done).

  // MAIN RETURN – layout with left sidebar (280px) + right content
  // MAIN RETURN – fixed-left sidebar + centered right content
return (
  <div className="flex w-full h-screen overflow-hidden">

    {/* LEFT: Fixed Filters (prevent shrinking) */}
    <div className="flex-shrink-0">
  {job && (
  <MyJobCandidateAdvanceFilters
    onApply={(filters) => setFilterValues(filters || {})}
    jobCountry={
      ["USA", "US", "United States", "U.S.", "America"].includes(
        (job.country || "").trim()
      )
        ? "USA"
        : "IN"
    }
  />
)}


    </div>

    {/* RIGHT: Main content */}
    <div className="flex-1 overflow-y-auto p-4">


{/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{job.jobTitle}</h1>
          <div className="text-sm text-slate-600 mt-1">
            {job.hideCompany ? "Confidential" : job.company} • {job.jobLocation}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Job ID: {job.jobId}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b mt-8 mb-4 gap-1">

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
          Bench Submissions ({filteredBenchApps.length})

        </button>

        <button
          onClick={() => setActiveTab("direct")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ml-4 ${
            activeTab === "direct"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600"
          }`}
        >
          Direct Candidates ({filteredDirectApps.length})

        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6">
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
                  : (job.skills || "").split(",")
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
              <h3 className="font-semibold text-slate-700">Job Description</h3>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {job.jobDescription}
              </p>
            </div>
          </div>
        )}

        {activeTab === "bench" && (
          <div>
            {benchApps.length === 0 ? (
              <div className="text-sm text-slate-500">
                No bench submissions.
              </div>
            ) : (
              <ApplicationsTable data={filteredBenchApps} />

            )}
          </div>
        )}

        {activeTab === "direct" && (
          <div>
            {directApps.length === 0 ? (
              <div className="text-sm text-slate-500">
                No direct candidates yet.
              </div>
            ) : (
              <ApplicationsTable data={filteredDirectApps} />

            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

}
