import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const RecruiterAllJobsUSA = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const jobsPerPage = 10;

  /* ------------------------------------------------------------
     STEP 1: Fetch USA Jobs in Real-Time
  -------------------------------------------------------------*/
  useEffect(() => {
    let q;

    if (selectedStatus === "All") {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "USA"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "USA"),
        where("status", "==", selectedStatus),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(list);
    });

    return () => unsubscribe();
  }, [selectedStatus]);

  /* ------------------------------------------------------------
     STEP 2: Search Filter
  -------------------------------------------------------------*/
  useEffect(() => {
    const text = searchText.toLowerCase();

    const result = jobs.filter((job) => {
      if (!text.trim()) return true;

      return (
        job.jobTitle?.toLowerCase().includes(text) ||
        job.jobLocation?.toLowerCase().includes(text) ||
        job.jobType?.toLowerCase().includes(text) ||
        job.visa?.toLowerCase().includes(text) ||
        job.experience?.toLowerCase().includes(text) ||
        job.workMode?.toLowerCase().includes(text) ||
        (job.referralFee ? "yes" : "no").includes(text)
      );
    });

    setFilteredJobs(result);
    setCurrentPage(1);
  }, [jobs, searchText]);

  /* ------------------------------------------------------------
     STEP 3: Pagination Logic
  -------------------------------------------------------------*/
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

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
          STATUS BUTTONS LEFT + SEARCH CENTER (NO GAP)
      ---------------------------------------------- */}
      <div
        className="
          flex items-center justify-between
          bg-white z-20
          sticky top-[64px]   /* adjust if navbar height differs */
          py-0
          my-0
        "
      >

        {/* LEFT – STATUS BUTTONS */}
        <div className="flex gap-2">
          {["Active", "Closed", "All"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedStatus(type)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition
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

        {/* CENTER – SEARCH BAR */}
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
          TABLE (TOUCHES HEADER ROW)
      ---------------------------------------------- */}
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white mt-0">

        {/* HEADER */}
        <div
          className="
            grid grid-cols-[50px,2.5fr,1fr,1fr,1fr,1fr,1fr,1fr,1.2fr]
            bg-blue-700 text-white text-sm font-medium px-4 py-3
          "
        >
          <div></div>
          <div>Title</div>
          <div>Location</div>
          <div>Work Type</div>
          <div>Visa Type</div>
          <div>Experience</div>
          <div>Work Mode</div>
          <div>Referral</div>
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
                grid grid-cols-[50px,2.5fr,1fr,1fr,1fr,1fr,1fr,1fr,1.2fr]
                px-4 py-3 text-sm border-b border-gray-100
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                hover:bg-blue-50 transition
              `}
            >
              <div className="flex items-center">
                <input type="checkbox" className="w-4 h-4" />
              </div>

              <div
                className="text-blue-700 font-medium cursor-pointer hover:underline truncate"
                onClick={() => console.log("View Job:", job.id)}
              >
                {job.jobTitle}
              </div>

              <div>{job.jobLocation || "—"}</div>
              <div>{job.jobType || "—"}</div>
              <div>{job.visa || job.visaType || "—"}</div>
              <div>{job.experience || "—"}</div>
              <div>{job.workMode || "—"}</div>
              <div>{job.referralFee ? "Yes" : "No"}</div>
              <div>{formatDate(job.updatedAt || job.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      {/* ----------------------------------------------
          PAGINATION
      ---------------------------------------------- */}
      {filteredJobs.length > jobsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`
              px-4 py-1.5 text-sm rounded
              ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }
            `}
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`
              px-4 py-1.5 text-sm rounded
              ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }
            `}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RecruiterAllJobsUSA;
