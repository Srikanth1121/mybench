import React, { useEffect, useState, useContext } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import RecruiterAddJobModal from "./RecruiterAddJobModal";
import RecruiterAddJobUSAModal from "./RecruiterAddJobUSAModal";
import { RecruiterContext } from "../../context/RecruiterContext";
import { doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

const JobCard = ({ job, isRecruiter, onEdit, onDelete, onToggleStatus, onView }) => {
  const {
    jobTitle,
    jobLocation,
    company,
    hideCompany,
    experience,
    qualification,
    salaryAmount,
    salaryType,
    skills,
    workMode,
    jobType,
    c2cAllowed,
    referralFee,
    referralDetails,
  } = job;

  const skillList = Array.isArray(skills)
    ? skills
    : skills?.split(",").map((s) => s.trim());

  const borderColor =
    job.status === "Active" ? "border-gray-300" : "border-gray-200";

  return (
    <div
      className={`bg-white border ${borderColor} rounded-lg px-5 py-4 mb-4 hover:shadow-sm transition-all`}
    >
      {/* TOP ROW — Title + Job Code */}
      <div className="flex justify-between items-start mb-1">
        <Link 
 to={`/recruiter/dashboard/job/${job.id}`}

  className="text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
>
  {jobTitle}
</Link>


        <div className="text-xs text-gray-700">
  #{job.jobId}
</div>

      </div>

      {/* COMPANY + LOCATION */}
      <div className="text-sm text-gray-900 mb-2">
       {(hideCompany && !isRecruiter)
  ? "Confidential"
  : company || job.clientName || "—"}

        {" "}•{" "}
        {jobLocation || "Location N/A"}
      </div>

      {/* METADATA ROW */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-900 mb-3">
        {experience && <span>Experience: {experience}</span>}
        {qualification && <span>Qualification: {qualification}</span>}
        {workMode && <span>Mode: {workMode}</span>}
        {jobType && <span>Type: {jobType}</span>}
      </div>

      {/* SKILLS */}
      {skillList?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skillList.map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-900 text-xs rounded"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* REFERRAL */}
      {referralFee && (
        <div className="text-xs text-green-700 mb-4">
          Referral: {referralDetails || "Available"}
        </div>
      )}

      <div className="h-px bg-gray-200 my-3"></div>

      {/* ACTION ROW */}
      <div className="flex justify-between items-center">

        {/* LEFT: Edit & Delete */}
        <div className="flex gap-4">
          <button
            onClick={() => onEdit(job)}
            className="text-sm text-gray-700 hover:text-blue-700"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(job)}
            className="text-sm text-gray-700 hover:text-red-600"
          >
            Delete
          </button>
        </div>

        {/* RIGHT: Status Toggle */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {job.status === "Active" ? "Active" : "Closed"}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={job.status === "Active"}
              onChange={() => onToggleStatus(job)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-all"></div>
            <div className="absolute left-1 top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
      MAIN PAGE COMPONENT — Recruiter My Jobs
-------------------------------------------------------------------*/
const RecruiterMyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null); // ⭐ Stores job for editing
  const [viewJob, setViewJob] = useState(null); // ⭐ Stores job for viewing
const [selectedType, setSelectedType] = useState("Active");//////////
const [searchText, setSearchText] = useState("");
const [sortOrder, setSortOrder] = useState("newest");
const [currentPage, setCurrentPage] = useState(1);
const jobsPerPage = 5; // or 10 if you want bigger pages



  const recruiter = useContext(RecruiterContext);

  if (!recruiter) {
    return <div className="p-6">Loading recruiter data...</div>;
  }

  const recruiterId = recruiter.id;
  const recruiterCountry = recruiter.country;

  /* FETCH JOBS */
  useEffect(() => {
    if (!recruiterId) return;

   const q = query(
  collection(db, "jobs"),
  where("recruiterId", "==", recruiterId),
  where("country", "==", recruiterCountry),
  where("status", "==", selectedType),
  orderBy("createdAt", "desc")
);
const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(fetched);
    });

    return () => unsubscribe();
  }, [recruiterId, recruiterCountry, selectedType]);
/* DELETE HANDLER */
const onDeleteJob = async (job) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this job?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "jobs", job.id));
    alert("Job deleted successfully.");
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete job.");
  }
};
/* STATUS TOGGLE HANDLER */
const onToggleStatus = async (job) => {
  const newStatus = job.status === "Active" ? "Closed" : "Active";

  try {
    await updateDoc(doc(db, "jobs", job.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Status update failed:", err);
    alert("Failed to update job status.");
  }
};
/* ⭐ VIEW HANDLER */
const onViewJob = (job) => {
  setViewJob(job);   // Open view modal
};

  /* ⭐ EDIT HANDLER */
  const onEditJob = (job) => {
    setEditJob(job);        // Set existing job data for modal
    setShowModal(true);     // Open modal
  };

  /* ⭐ ADD HANDLER */
  const onAddJob = () => {
    setEditJob(null);       // When adding, clear previous edit data
    setShowModal(true);
  };
// UNIVERSAL SEARCH FILTER
const filteredJobs = jobs.filter((job) => {
  if (!searchText.trim()) return true;

  const text = searchText.toLowerCase();

  return (
    job.jobTitle?.toLowerCase().includes(text) ||
    job.jobType?.toLowerCase().includes(text) ||
    job.company?.toLowerCase().includes(text) ||
    job.clientName?.toLowerCase().includes(text) ||
    job.jobLocation?.toLowerCase().includes(text) ||
    job.workMode?.toLowerCase().includes(text) ||
    job.skills?.toString().toLowerCase().includes(text) ||
    job.experience?.toLowerCase().includes(text)
  );
});
// APPLY SORTING (Newest ↔ Oldest)
const sortedJobs = [...filteredJobs].sort((a, b) => {
  if (sortOrder === "newest") {
    return b.createdAt?.seconds - a.createdAt?.seconds;
  } else {
    return a.createdAt?.seconds - b.createdAt?.seconds;
  }
});
// PAGINATION CALCULATION
const indexOfLastJob = currentPage * jobsPerPage;
const indexOfFirstJob = indexOfLastJob - jobsPerPage;
const currentJobs = sortedJobs.slice(indexOfFirstJob, indexOfLastJob);
const totalJobs = sortedJobs.length;
const showingFrom = totalJobs === 0 ? 0 : indexOfFirstJob + 1;
const showingTo = Math.min(indexOfLastJob, totalJobs);


  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
  
  {/* Left side: Title */}
  <h2 className="text-xl font-semibold">My Jobs</h2>

  {/* Middle: Search bar */}
  <div className="flex-1 flex justify-center px-4">
    <input
      type="text"
      placeholder="Search Jobs"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="w-1/3 min-w-[180px] px-3 py-1.5 border rounded text-sm"
    />
  </div>

  {/* Right side: Add Job button */}
  <button
    onClick={onAddJob}
    className="px-4 py-2 bg-blue-600 text-white rounded"
  >
    + Add Job ({recruiterCountry})
  </button>

</div>


{/* 👇 INSERT BUTTONS RIGHT HERE */}
<div className="flex items-center justify-between mb-4">

  {/* Left: Active / Closed Buttons */}
  <div className="flex gap-3">
    <button
      onClick={() => setSelectedType("Active")}
      className={`px-3 py-1.5 rounded border text-sm
        ${selectedType === "Active"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 border-gray-300"}`}
    >
      Active
    </button>

    <button
      onClick={() => setSelectedType("Closed")}
      className={`px-3 py-1.5 rounded border text-sm
        ${selectedType === "Closed"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 border-gray-300"}`}
    >
      Closed
    </button>
  </div>

  {/* Right: Sort Dropdown */}
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="border px-3 py-1.5 rounded text-sm"
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
  </select>

</div>




      {/* Job List */}
     <div className="animate-fade">
  {jobs.length === 0 ? (
    <p>No jobs posted yet.</p>
  ) : filteredJobs.length === 0 ? (
    <p>No matching jobs found.</p>
  ) : (
  currentJobs.map((job) => (
  <JobCard
    key={job.id}
    job={job}
    isRecruiter={true}
    onEdit={onEditJob}
    onDelete={onDeleteJob}
    onToggleStatus={onToggleStatus}
    onView={onViewJob}
  />
))
 )}
</div>
{/* SHOWING RANGE */}
{totalJobs > 0 && (
  <div className="text-center text-sm text-gray-600 mt-2">
    Showing {showingFrom}–{showingTo} of {totalJobs} jobs
  </div>
)}

{/* PAGINATION BUTTONS */}
{sortedJobs.length > jobsPerPage && (
  <div className="flex justify-center gap-4 mt-4">

    {/* Previous */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(currentPage - 1)}
      className={`px-4 py-1.5 text-sm rounded 
        ${currentPage === 1 
          ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
          : "bg-blue-600 text-white hover:bg-blue-700"}`}
    >
      Previous
    </button>

    {/* Page Indicator */}
    <span className="text-sm text-gray-600 flex items-center">
      Page {currentPage} of {Math.ceil(sortedJobs.length / jobsPerPage)}
    </span>

    {/* Next */}
    <button
      disabled={currentPage === Math.ceil(sortedJobs.length / jobsPerPage)}
      onClick={() => setCurrentPage(currentPage + 1)}
      className={`px-4 py-1.5 text-sm rounded 
        ${currentPage === Math.ceil(sortedJobs.length / jobsPerPage)
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"}`}
    >
      Next
    </button>

  </div>
)}



{/* ADD or EDIT Modal — India or USA */}
      {showModal && (
        <>
          {recruiterCountry === "India" && (
            <RecruiterAddJobModal
              recruiterId={recruiterId}
              recruiterCountry={recruiterCountry}
              existingData={editJob}     // ⭐ Prefill data if editing
              onClose={() => setShowModal(false)}
            />
          )}

          {recruiterCountry === "USA" && (
            <RecruiterAddJobUSAModal
              recruiterId={recruiterId}
              recruiterCountry={recruiterCountry}
              existingData={editJob}     // ⭐ Prefill data if editing
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterMyJobs;
