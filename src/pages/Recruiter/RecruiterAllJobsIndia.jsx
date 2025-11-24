import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
const auth = getAuth();


const RecruiterAllJobsIndia = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const navigate = useNavigate();

  const jobsPerPage = 10;

  /* ----------------------------------------------
     FETCH INDIA JOBS BASED ON STATUS
  ------------------------------------------------*/
  useEffect(() => {
    let q;

    if (selectedStatus === "All") {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "India"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "India"),
        where("status", "==", selectedStatus),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
     const user = auth.currentUser;

const list = snapshot.docs
  .map((doc) => ({ id: doc.id, ...doc.data() }))
.filter((job) => !(job.recruiterId && job.recruiterId === user?.uid));



setJobs(list);

    });

    return () => unsubscribe();
  }, [selectedStatus]);

  /* ----------------------------------------------
     SEARCH FILTER
  ------------------------------------------------*/
  useEffect(() => {
    const text = searchText.toLowerCase();

    const result = jobs.filter((job) => {
      if (!text.trim()) return true;

      return (
        job.jobTitle?.toLowerCase().includes(text) ||
        job.jobLocation?.toLowerCase().includes(text) ||
        job.experience?.toLowerCase().includes(text) ||
        job.workMode?.toLowerCase().includes(text) ||
        job.jobType?.toLowerCase().includes(text) ||
        (job.referralFee ? "yes" : "no").includes(text) ||
        (job.c2cAllowed ? "yes" : "no").includes(text)
      );
    });

    setFilteredJobs(result);
    setCurrentPage(1);
  }, [jobs, searchText]);

  /* ----------------------------------------------
     PAGINATION LOGIC
  ------------------------------------------------*/
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  /* ----------------------------------------------
     DATE FORMATTER
  ------------------------------------------------*/
  const formatDate = (ts) => {
    if (!ts) return "—";

    const d = ts.toDate();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    const year = String(d.getFullYear()).slice(2);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="px-6 py-0">


  {/* ----------------------------------------------
  {/* ----------------------------------------------
      STATUS BUTTONS (LEFT) + SEARCH (CENTER)
      ZERO TOP/BOTTOM SPACE (TOUCH NAVBAR)
---------------------------------------------- */}
<div
  className="
    flex items-center justify-between
    bg-white z-20
    sticky top-[64px]   /* adjust based on navbar height */
    py-0
    my-0
  "
>

  {/* LEFT – ACTIVE / CLOSED / ALL BUTTONS */}
  <div className="flex gap-2">
    {["Active", "Closed", "All"].map((type) => (
      <button
        key={type}
        onClick={() => setSelectedStatus(type)}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium transition-all
          ${
            selectedStatus === type
              ? "bg-blue-700 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }
        `}
      >
        {type}
      </button>
    ))}
  </div>

  {/* CENTER – SEARCH */}
  <div className="flex justify-center flex-1">
    <input
      type="text"
      placeholder="Search jobs..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="
        px-4 py-2 w-72 rounded-lg border border-gray-300
        shadow-sm focus:ring-2 focus:ring-blue-600 focus:outline-none
        text-sm bg-white
      "
    />
  </div>

  {/* RIGHT SPACER */}
  <div className="w-24"></div>

</div>

  {/* ----------------------------------------------
      TABLE — MOVED UP (LESS GAP)
  ---------------------------------------------- */}
  <div className="border rounded-xl overflow-hidden shadow-sm bg-white mt-2">

    {/* HEADER */}
    <div
      className="
        grid grid-cols-[50px,2.5fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr]
        bg-blue-700 text-white text-sm font-semibold px-4 py-3
      "
    >
      <div></div>
      <div>Title</div>
      <div>Location</div>
      <div>Experience</div>
      <div>Mode</div>
      <div>Type</div>
      <div>Referral</div>
      <div>C2C</div>
      <div>Updated</div>
    </div>

    {/* ROWS */}
    {currentJobs.length === 0 ? (
      <div className="text-center py-6 text-gray-500 text-sm">
        No matching jobs found.
      </div>
    ) : (
      currentJobs.map((job, index) => (
        <div
          key={job.id}
          className={`
            grid grid-cols-[50px,2.5fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr]
            px-4 py-3 text-sm border-b border-gray-100
            ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            hover:bg-blue-50 transition
          `}
        >
          <div className="flex items-center">
            <input type="checkbox" className="w-4 h-4" />
          </div>

          <div
            className="font-medium text-blue-700 hover:underline cursor-pointer truncate"
            onClick={() => navigate(`/recruiter/job/${job.id}`)}

          >
            {job.jobTitle}
          </div>

          <div>{job.jobLocation || "—"}</div>
          <div>{job.experience || "—"}</div>
          <div>{job.workMode || "—"}</div>
          <div>{job.jobType || "—"}</div>
          <div>{job.referralFee ? "Yes" : "No"}</div>
          <div>{job.c2cAllowed ? "Yes" : "No"}</div>
          <div>{formatDate(job.updatedAt || job.createdAt)}</div>
        </div>
      ))
    )}
  </div>

      {/* ----------------------------------------------
          PAGINATION
      ---------------------------------------------- */}
      {filteredJobs.length > jobsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-6">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${currentPage === 1
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-700 text-white hover:bg-blue-800"}
            `}
          >
            Previous
          </button>

          <span className="text-gray-700 text-sm">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${currentPage === totalPages
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-700 text-white hover:bg-blue-800"}
            `}
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default RecruiterAllJobsIndia;
