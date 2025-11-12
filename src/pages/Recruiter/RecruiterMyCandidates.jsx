import React, { useState, useEffect } from "react";
import RecruiterAddCandidateModal from "./RecruiterAddCandidateModal";
import { db } from "../../firebase/config";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Pencil, Trash2 } from "lucide-react";
import { indiaStates, usaStates, visaOptions } from "../../constants/Data";//////

const RecruiterMyCandidates = () => {
  const [showModal, setShowModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  // ✅ Pagination
const [currentPage, setCurrentPage] = useState(1);
const candidatesPerPage = 10;
  // ✅ Country-based separation and toggle
  const [activeTab, setActiveTab] = useState("India");
  const [indiaCandidates, setIndiaCandidates] = useState([]);
  const [usaCandidates, setUsaCandidates] = useState([]);

  // 🔹 Advanced Filter States
  const [minExp, setMinExp] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [visaQuery, setVisaQuery] = useState("");
  const [jobTitleQuery, setJobTitleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
const [recruiterCountry, setRecruiterCountry] = useState(null);
// 🔹 Derived filters
  const filteredStates = (recruiterCountry === "USA" ? usaStates : indiaStates).filter((s) =>
    s.toLowerCase().includes(stateQuery.toLowerCase())
  );

  const filteredVisas = visaOptions.filter((v) =>
    v.toLowerCase().includes(visaQuery.toLowerCase())
  );
// ✅ Filter Action Handlers
const handleApplyFilters = () => {
  setCurrentPage(1); // reset pagination to first page
};

const handleResetFilters = () => {
  setMinExp("");
  setMaxExp("");
  setStateQuery("");
  setVisaQuery("");
  setJobTitleQuery("");
  setCurrentPage(1);
};



  // ✅ Delete confirmation modal state
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedCandidate, setSelectedCandidate] = useState(null);
const [editingCandidate, setEditingCandidate] = useState(null);

  const auth = getAuth();


useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const fetchRecruiterCountry = async () => {
    try {
      const recruiterRef = doc(db, "users", user.uid); // ✅ from users collection
      const recruiterSnap = await getDoc(recruiterRef);
     if (recruiterSnap.exists()) {
  const recruiterData = recruiterSnap.data();
  setRecruiterCountry(recruiterData.country || "India");
} else {
  setRecruiterCountry("India");
}

    } catch (error) {
      console.error("Error fetching recruiter country:", error);
    }
  };

  fetchRecruiterCountry();
}, [auth]);


  // ✅ Real-time fetch recruiter’s candidates from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

  // ✅ Wait until recruiterCountry is loaded before querying
if (!recruiterCountry) return;

const q = query(
  collection(db, "candidates"),
  where("recruiterId", "==", user.uid),
  where("country", "==", recruiterCountry),
  orderBy("createdAt", "desc")
);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCandidates(list);
setLoading(false);

// ✅ Split candidates by country
setIndiaCandidates(list.filter((c) => c.country === "India"));
setUsaCandidates(list.filter((c) => c.country === "USA"));

    });

    return () => unsubscribe();
  }, [auth, showModal, recruiterCountry]);


  // ✅ Edit handler
  const handleEdit = (candidate) => {
    console.log("Edit clicked:", candidate.fullName);
    setShowModal(true);
    // Later: Pass candidate to modal for editing (prefill logic)
  };
// ✅ Delete handler function
const handleDelete = async (id, name) => {
  if (window.confirm(`Are you sure you want to delete candidate "${name}"?`)) {
    try {
      await deleteDoc(doc(db, "candidates", id));
      alert("✅ Candidate deleted successfully!");
    } catch (error) {
      console.error("Error deleting candidate:", error);
      alert("❌ Failed to delete candidate. Please try again.");
    }
  }
};
// ✅ Update candidate availability (Active / Inactive)
const handleStatusChange = async (candidateId, newStatus) => {
  const confirmChange = window.confirm(
    `Are you sure you want to mark this candidate as "${newStatus}"?`
  );
  if (!confirmChange) return;

  try {
    const candidateRef = doc(db, "candidates", candidateId);
    await updateDoc(candidateRef, { status: newStatus });
    // ✅ Removed success alert
  } catch (error) {
    console.error("Error updating status:", error);
    alert("❌ Failed to update status. Please try again.");
  }
};


// ✅ Pagination Logic (show 10 candidates per page)
// ✅ Apply Advanced Filters (client-side before pagination)
const filteredCandidates = candidates.filter((cand) => {
  // Experience Filter
  const expNumber = parseInt(cand.experience?.replace(/\D/g, "")) || 0;

  const min = minExp ? parseInt(minExp) : 0;
  const max = maxExp ? parseInt(maxExp) : 100;
  const matchExp = expNumber >= min && expNumber <= max;

  // State Filter
  const matchState = stateQuery
    ? cand.state?.toLowerCase().includes(stateQuery.toLowerCase())
    : true;

  // Visa Filter (only if USA recruiter)
  const matchVisa =
    recruiterCountry === "USA"
      ? visaQuery
        ? cand.visaType?.toLowerCase().includes(visaQuery.toLowerCase())
        : true
      : true;

  // Job Title Filter
  const matchJob = jobTitleQuery
    ? cand.jobTitle?.toLowerCase().includes(jobTitleQuery.toLowerCase())
    : true;
const matchStatus =
  statusFilter === "All" ? true : cand.status === statusFilter;

  return matchExp && matchState && matchVisa && matchJob && matchStatus;
});
const indexOfLastCandidate = currentPage * candidatesPerPage;
const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);

// ✅ Calculate total number of pages (after filters)
const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);

  return (
    <div className="py-6">
      {/* Page Heading (Compact) */}
      <div className="flex items-center justify-between mb-3 py-1">
        <h1 className="text-xl font-semibold">My Candidates</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
        >
          + Add Candidate
        </button>
      </div>

      {/* Candidate List */}
      
      {/* ================= Advanced Filters (Country-Aware + Searchable) ================= */}
<div className="flex flex-wrap items-end gap-3 mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
  {/* Experience Range */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-600 mb-1">Experience (Years)</label>
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="Min"
        value={minExp}
        onChange={(e) => setMinExp(e.target.value)}
        className="w-20 border border-gray-300 rounded-lg p-2 text-sm"
      />
      <span className="self-center text-gray-500">to</span>
      <input
        type="number"
        placeholder="Max"
        value={maxExp}
        onChange={(e) => setMaxExp(e.target.value)}
        className="w-20 border border-gray-300 rounded-lg p-2 text-sm"
      />
    </div>
  </div>

  {/* State */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-600 mb-1">State</label>
    <input
      type="text"
      placeholder="Type or select state"
      value={stateQuery}
      onChange={(e) => setStateQuery(e.target.value)}
      list="stateList"
      className="w-40 border border-gray-300 rounded-lg p-2 text-sm"
    />
    <datalist id="stateList">
      {filteredStates.slice(0, 15).map((s) => (
        <option key={s} value={s} />
      ))}
    </datalist>
  </div>

  {/* Visa Type */}
  {recruiterCountry === "USA" && (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-600 mb-1">Visa Type</label>
      <input
        type="text"
        placeholder="Type or select visa"
        value={visaQuery}
        onChange={(e) => setVisaQuery(e.target.value)}
        list="visaList"
        className="w-36 border border-gray-300 rounded-lg p-2 text-sm"
      />
      <datalist id="visaList">
        {filteredVisas.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  )}

  {/* Job Title */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-600 mb-1">Job Title</label>
    <input
      type="text"
      placeholder="Search by Job Title"
      value={jobTitleQuery}
      onChange={(e) => setJobTitleQuery(e.target.value)}
      className="w-48 border border-gray-300 rounded-lg p-2 text-sm"
    />
  </div>
{/* Availability Filter */}
<div className="flex flex-col">
  <label className="text-sm font-medium text-gray-600 mb-1">Availability</label>
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-36 border border-gray-300 rounded-lg p-2 text-sm"
  >
    <option value="All">All</option>
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>
</div>

  {/* Buttons */}
  <div className="flex gap-2 ml-auto">
    <button
      onClick={handleApplyFilters}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
    >
      Apply
    </button>
    <button
      onClick={handleResetFilters}
      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
    >
      Reset
    </button>
  </div>
</div>
{/* ================= End Filters ================= */}

        {loading ? (
          <p className="text-gray-500 text-center">Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p className="text-gray-500 text-center">No candidates added yet.</p>
        ) : (
            
          <table className="w-full border border-gray-300 text-[13px]">
            
            {/* ✅ Table Header */}
           <thead className="bg-gray-100 text-gray-800 border-b border-gray-300 text-xs">
  <tr>
    <th className="px-3 py-1 border border-gray-300">Sl.No</th>
    <th className="px-3 py-1 border border-gray-300">Full Name</th>
    <th className="px-3 py-1 border border-gray-300">Email</th>
    <th className="px-3 py-1 border border-gray-300">Mobile</th>
    <th className="px-3 py-1 border border-gray-300">Experience</th>
    <th className="px-3 py-1 border border-gray-300">Job Title</th>
    <th className="px-3 py-1 border border-gray-300">State</th>
{/* ✅ Visa Type column visible only for USA recruiters */}
    {recruiterCountry === "USA" && (
      <th className="px-3 py-1 border border-gray-300">Visa Type</th>
    )}
    <th className="px-3 py-1 border border-gray-300 text-center">LinkedIn</th>
    <th className="px-3 py-1 border border-gray-300 text-center">Availability</th>

    <th className="px-3 py-1 border border-gray-300 text-center">Edit / Delete</th>
  </tr>
</thead>


            {/* ✅ Table Body */}
            <tbody className="text-xs">
              {currentCandidates.map((candidate, index) => (

                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1 border border-gray-300 text-center">
  {(currentPage - 1) * candidatesPerPage + index + 1}
</td>
<td className="px-3 py-1 border border-gray-300 font-medium">{candidate.fullName}</td>
                  <td className="px-3 py-1 border border-gray-300 whitespace-nowrap">{candidate.email}</td>
                  <td className="px-3 py-1 border border-gray-300 whitespace-nowrap">{candidate.mobile}</td>
                  <td className="px-3 py-1 border border-gray-300">{candidate.experience}</td>
                  <td className="px-3 py-1 border border-gray-300">{candidate.jobTitle}</td>
                  <td className="px-3 py-1 border border-gray-300">{candidate.state}</td>
                  {/* 👇 Visa Type only for USA recruiters */}
{recruiterCountry === "USA" && (
  <td className="px-3 py-1 border border-gray-300">
    {candidate.visaType || "-"}
  </td>
)}
                  {/* ✅ LinkedIn Column (Clickable Icon) */}
                  {/* ✅ LinkedIn Column (Text Link instead of Icon) */}
<td className="px-3 py-1 border border-gray-300 text-center">
  {candidate.linkedin ? (
    <a
      href={candidate.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline text-[13px]"
    >
      View Profile
    </a>
  ) : (
    "-"
  )}
</td>
{/* ✅ Availability Dropdown */}
<td className="px-3 py-1 border border-gray-300 text-center">
  <select
    value={candidate.status || "Active"}
    onChange={(e) =>
      handleStatusChange(candidate.id, e.target.value)
    }
    className={`border rounded-md px-2 py-1 text-sm ${
      candidate.status === "Active"
        ? "bg-green-200 text-green-700 border-green-900"
        : "bg-gray-200 text-gray-600 border-gray-300"
    }`}
  >
    <option value="Active">Active</option>
    <option value="Inactive">Inactive</option>
  </select>
</td>


                  {/* ✅ Edit Column (Icon) */}
                  {/* ✅ Edit/Delete Actions */}
<td className="px-3 py-1 border border-gray-300 text-center flex items-center justify-center gap-3">

  {/* Edit Button */}
  <button
  onClick={() => {
    setEditingCandidate(candidate); // ✅ store selected candidate
    setShowModal(true);             // ✅ open modal
  }}
  className="text-gray-700 hover:text-blue-700 inline-flex items-center justify-center"
  title="Edit Candidate"
>
  <Pencil size={15} strokeWidth={1.8} />
</button>


  {/* Delete Button */}
  <button
    onClick={() => {
  setSelectedCandidate(candidate);
  setShowDeleteModal(true);
}}
className="text-gray-700 hover:text-red-600 inline-flex items-center justify-center"
    title="Delete Candidate"
  >
    <Trash2 size={15} strokeWidth={1.8} />
  </button>
</td>

                </tr>
              ))}
            </tbody>
          </table>
          
        )}
        {/* ✅ Pagination Controls */}
{/* ✅ Corporate-Style Pagination Controls */}
<div className="flex items-center justify-center gap-3 mt-6 py-4 border-t border-gray-200">
  {/* Previous Button */}
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${
      currentPage === 1
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
    }`}
  >
    ← Previous
  </button>

  {/* Page Numbers */}
  <div className="flex items-center gap-1">
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1.5 rounded-lg font-medium border text-sm transition-all duration-200 ${
          currentPage === i + 1
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
        }`}
      >
        {i + 1}
      </button>
    ))}
  </div>

  {/* Next Button */}
  <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className={`px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${
      currentPage === totalPages
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
    }`}
  >
    Next →
  </button>
</div>

      {/* ✅ Add Candidate Modal */}
      <RecruiterAddCandidateModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCandidate(null); // reset after closing
        }}
        editingCandidate={editingCandidate}
      />

      {/* ✅ Delete Confirmation Modal */}
      {showDeleteModal && selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold mb-3">Delete Candidate</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {selectedCandidate.fullName}
              </span>
              ?
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, "candidates", selectedCandidate.id));
                    setShowDeleteModal(false);
                    alert("✅ Candidate deleted successfully!");
                  } catch (error) {
                    console.error("Error deleting candidate:", error);
                    alert("❌ Failed to delete candidate.");
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
           )}
        </div>
  ); // closes the main container
};


export default RecruiterMyCandidates;
