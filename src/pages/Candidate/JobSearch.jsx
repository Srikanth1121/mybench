// src/pages/Candidate/JobSearch.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function JobSearch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);

  // UI filters
  const [countryTab, setCountryTab] = useState("India");
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("");
  const [postedWithin, setPostedWithin] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 15;

  useEffect(() => {
    let mounted = true;
    const loadJobs = async () => {
      setLoading(true);
      try {
        const jobsRef = collection(db, "jobs");
        const q = query(jobsRef, where("status", "==", "Active"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(j => j.visibility !== "recruiters");

        const normalized = docs.map(j => {
          let skills = [];
          if (Array.isArray(j.skills)) skills = j.skills;
          else if (typeof j.skills === "string") skills = j.skills.split(",").map(s => s.trim());

          return { 
            ...j, 
            skills: skills.map(s => s.toLowerCase()) 
          };
        });

        if (mounted) setJobs(normalized);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadJobs();
    return () => (mounted = false);
  }, []);

  // FILTERING
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    const cutoff = (() => {
      if (!postedWithin) return null;
      const now = Date.now();

      if (postedWithin === "24h") return now - 24 * 60 * 60 * 1000;
      if (postedWithin === "7d") return now - 7 * 24 * 60 * 60 * 1000;
      if (postedWithin === "30d") return now - 30 * 24 * 60 * 60 * 1000;
      return null;
    })();

    return jobs.filter(job => {
      if (job.country && job.country !== countryTab) return false;

      if (q) {
        const inTitle = job.jobTitle?.toLowerCase().includes(q);
        const inCompany = job.company?.toLowerCase().includes(q);
        const inDesc = job.jobDescription?.toLowerCase().includes(q);
        const inLoc = job.jobLocation?.toLowerCase().includes(q);
        const inSkills = job.skills && job.skills.some(s => s.includes(q));
        if (!(inTitle || inCompany || inDesc || inLoc || inSkills)) return false;
      }

      if (locationFilter && job.jobLocation) {
        if (!job.jobLocation.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }

      if (jobTypeFilter && job.jobType !== jobTypeFilter) return false;
      if (workModeFilter && job.workMode !== workModeFilter) return false;

      if (cutoff && job.createdAt?.toMillis) {
        if (job.createdAt.toMillis() < cutoff) return false;
      }

      return true;
    });
  }, [jobs, keyword, locationFilter, jobTypeFilter, workModeFilter, postedWithin, countryTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">

        {/* PAGE TITLE + TABS */}
        <div className="flex items-center gap-6 mt-6 mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Job Search</h2>

          <div className="inline-flex bg-white border rounded-md shadow-sm">
            <button
              onClick={() => { setCountryTab("India"); setPage(1); }}
              className={`px-4 py-1.5 rounded-l-md text-sm ${
                countryTab === "India" ? "bg-indigo-600 text-white" : "text-slate-700"
              }`}
            >
              India
            </button>
            <button
              onClick={() => { setCountryTab("USA"); setPage(1); }}
              className={`px-4 py-1.5 rounded-r-md text-sm ${
                countryTab === "USA" ? "bg-indigo-600 text-white" : "text-slate-700"
              }`}
            >
              USA
            </button>
          </div>

          {/* SEARCH BAR */}
          <input
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            placeholder="Search title, company, skill, location..."
            className="px-4 py-2 border rounded-lg bg-white w-96"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg border p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Location"
              value={locationFilter}
              onChange={e => { setLocationFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded"
            />

            <select
              value={jobTypeFilter}
              onChange={e => { setJobTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded"
            >
              <option value="">All types</option>
              <option>FullTime</option>
              <option>Contract</option>
              <option>Freelance</option>
            </select>

            <select
              value={workModeFilter}
              onChange={e => { setWorkModeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded"
            >
              <option value="">All modes</option>
              <option>Remote</option>
              <option>Onsite</option>
              <option>Hybrid</option>
            </select>

            <select
              value={postedWithin}
              onChange={e => { setPostedWithin(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded"
            >
              <option value="">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* JOB TABLE */}
        <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Experience</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Mode</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Posted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-slate-500">Loading jobs...</td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-slate-500">No jobs found.</td>
                </tr>
              ) : (
                pageData.map(job => (
                  <tr key={job.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{job.jobTitle}</div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {job.jobDescription?.slice(0, 120)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {job.hideCompany ? "Hidden" : job.company || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{job.jobLocation || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{job.experience || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{job.jobType || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{job.workMode || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/candidate/job/${job.id}`)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600">
            Showing {pageData.length} of {filtered.length} jobs
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded bg-white disabled:opacity-40"
            >
              Prev
            </button>

            <div className="px-3 text-sm">{page} / {totalPages}</div>

            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
