import React, { useState, useEffect } from "react";
import RecruiterAddCandidateModal from "./RecruiterAddCandidateModal";
import { db } from "../../firebase/config";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Pencil, Trash2 } from "lucide-react";



const RecruiterMyCandidates = () => {
  const [showModal, setShowModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  // ✅ Pagination
const [currentPage, setCurrentPage] = useState(1);
const candidatesPerPage = 10;

  // ✅ Delete confirmation modal state
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedCandidate, setSelectedCandidate] = useState(null);

  const auth = getAuth();

  // ✅ Real-time fetch recruiter’s candidates from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "candidates"),
      where("recruiterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCandidates(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, showModal]); // refetch after modal closes (new candidate added)

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
// ✅ Pagination Logic (show 10 candidates per page)
const indexOfLastCandidate = currentPage * candidatesPerPage;
const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
const currentCandidates = candidates.slice(indexOfFirstCandidate, indexOfLastCandidate);

// ✅ Calculate total number of pages
const totalPages = Math.ceil(candidates.length / candidatesPerPage);

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
      <div className="bg-white rounded-lg shadow p-0 w-full">
        {loading ? (
          <p className="text-gray-500 text-center">Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p className="text-gray-500 text-center">No candidates added yet.</p>
        ) : (
            
          <table className="w-full border border-gray-300 text-[13px]">
            
            {/* ✅ Table Header */}
            <thead className="bg-gray-100 text-gray-800 border-b border-gray-300 text-xs">
              <tr>
                <th className="px-3 py-1 text-left border border-gray-300 w-[50px]">Sl.No</th>
                <th className="px-3 py-1 text-left border border-gray-300">Full Name</th>
                <th className="px-3 py-1 text-left border border-gray-300">Email</th>
                <th className="px-3 py-1 text-left border border-gray-300">Mobile</th>
                <th className="px-3 py-1 text-left border border-gray-300">Experience</th>
                <th className="px-3 py-1 text-left border border-gray-300">Job Title</th>
                <th className="px-3 py-1 text-left border border-gray-300">City</th>
                <th className="px-3 py-1 text-left border border-gray-300">State</th>
                <th className="px-3 py-1 text-left border border-gray-300">Qualification</th>
                <th className="px-3 py-1 text-left border border-gray-300">Gender</th>
                <th className="px-3 py-1 text-center border border-gray-300">LinkedIn</th>
                <th className="px-3 py-1 text-center border border-gray-300 w-[80px]">Edit / Delete</th>
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
                  <td className="px-3 py-1 border border-gray-300">{candidate.city}</td>
                  <td className="px-3 py-1 border border-gray-300">{candidate.state}</td>
                  <td className="px-3 py-1 border border-gray-300">{candidate.qualification}</td>
                  <td className="px-3 py-1 border border-gray-300 capitalize">{candidate.gender}</td>

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


                  {/* ✅ Edit Column (Icon) */}
                  {/* ✅ Edit/Delete Actions */}
<td className="px-3 py-1 border border-gray-300 text-center flex items-center justify-center gap-3">

  {/* Edit Button */}
  <button
    onClick={() => handleEdit(candidate)}
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


      </div>

      {/* Add Candidate Modal */}
      <RecruiterAddCandidateModal
        show={showModal}
        onClose={() => setShowModal(false)}
      />
      {/* ✅ Delete Confirmation Modal */}
{showDeleteModal && selectedCandidate && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
      <h2 className="text-lg font-semibold mb-3">
        Delete Candidate
      </h2>
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
          className="bg-blue-900 text-white px-1 py-1 rounded-lg hover:bg-blue-500"
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
          className="bg-blue-900 text-white px-1 py-1 rounded-lg hover:bg-blue-500"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default RecruiterMyCandidates;
