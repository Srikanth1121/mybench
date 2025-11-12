import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";////////

const RecruiterAllCandidates = () => {
  const auth = getAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recruiterCountry, setRecruiterCountry] = useState(null);

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 10;

  // ✅ Step 1: Fetch recruiter’s country
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchRecruiterCountry = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const c = snap.data().country || "India";
        setRecruiterCountry(c);
      } else {
        setRecruiterCountry("India");
      }
    };
    fetchRecruiterCountry();
  }, [auth]);

  // ✅ Step 2: Fetch candidates only from recruiter’s country
  useEffect(() => {
    if (!recruiterCountry) return;

    const q = query(
  collection(db, "candidates"),
  where("country", "==", recruiterCountry),
  where("status", "==", "Active"), // ✅ only show available candidates
  orderBy("createdAt", "desc")
);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Get recruiter name
        let recruiterName = "Independent Candidate";
        if (data.recruiterId) {
          const recruiterRef = doc(db, "users", data.recruiterId);
          const recruiterSnap = await getDoc(recruiterRef);
          if (recruiterSnap.exists()) {
            const r = recruiterSnap.data();
            recruiterName = r.fullName || r.name || "Recruiter";
          }
        }

        list.push({
          id: docSnap.id,
          ...data,
          recruiterName,
        });
      }

      setCandidates(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recruiterCountry]);

  // ✅ Pagination logic
  const indexOfLast = currentPage * candidatesPerPage;
  const indexOfFirst = indexOfLast - candidatesPerPage;
  const currentCandidates = candidates.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(candidates.length / candidatesPerPage);

  if (loading) return <p className="text-gray-500 text-center py-6">Loading candidates...</p>;

  return (
    <div className="py-6">
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-3 py-1">
        <h1 className="text-xl font-semibold">
          All Candidates ({recruiterCountry})
        </h1>
      </div>

      {/* Candidate Table */}
      {currentCandidates.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No candidates found for {recruiterCountry}.
        </p>
      ) : (
        <table className="w-full border border-gray-300 text-[13px]">
          {/* Header */}
          <thead className="bg-gray-100 text-gray-800 border-b border-gray-300 text-xs">
            <tr>
              <th className="px-3 py-1 border border-gray-300">Sl.No</th>
              <th className="px-3 py-1 border border-gray-300">Full Name</th>
              <th className="px-3 py-1 border border-gray-300">Email</th>
              <th className="px-3 py-1 border border-gray-300">Mobile</th>
              <th className="px-3 py-1 border border-gray-300">Experience</th>
              <th className="px-3 py-1 border border-gray-300">Job Title</th>
              <th className="px-3 py-1 border border-gray-300">City</th>
              <th className="px-3 py-1 border border-gray-300">State</th>
              {recruiterCountry === "USA" && (
                <th className="px-3 py-1 border border-gray-300">Visa Type</th>
              )}
              <th className="px-3 py-1 border border-gray-300">Recruiter</th>
              <th className="px-3 py-1 border border-gray-300">Created At</th>
              <th className="px-3 py-1 border border-gray-300 text-center">
                View
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="text-xs">
            {currentCandidates.map((cand, index) => (
              <tr key={cand.id} className="hover:bg-gray-50">
                <td className="px-3 py-1 border border-gray-300 text-center">
                  {(currentPage - 1) * candidatesPerPage + index + 1}
                </td>
                <td className="px-3 py-1 border border-gray-300 font-medium">
                  {cand.fullName || cand.name || "-"}
                </td>
                <td className="px-3 py-1 border border-gray-300 whitespace-nowrap">
                  {maskEmail(cand.email)}
                </td>
                <td className="px-3 py-1 border border-gray-300 whitespace-nowrap">
                  {maskPhone(cand.mobile)}
                </td>
                <td className="px-3 py-1 border border-gray-300">
                  {cand.experience || "-"}
                </td>
                <td className="px-3 py-1 border border-gray-300">
                  {cand.jobTitle || "-"}
                </td>
                <td className="px-3 py-1 border border-gray-300">
                  {cand.city || "-"}
                </td>
                <td className="px-3 py-1 border border-gray-300">
                  {cand.state || "-"}
                </td>
                {recruiterCountry === "USA" && (
                  <td className="px-3 py-1 border border-gray-300">
                    {cand.visaType || "-"}
                  </td>
                )}
                <td className="px-3 py-1 border border-gray-300">
                  {cand.recruiterName || "Independent Candidate"}
                </td>
                <td className="px-3 py-1 border border-gray-300">
                  {cand.createdAt?.toDate?.()?.toLocaleDateString?.() || "-"}
                </td>
                <td className="px-3 py-1 border border-gray-300 text-center">
                  <button
                    className="text-blue-600 hover:underline text-[13px]"
                    onClick={() => alert("View details (credits flow later)")}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ Pagination Controls */}
      {candidates.length > 10 && (
        <div className="flex items-center justify-center gap-3 mt-6 py-4 border-t border-gray-200">
          {/* Prev Button */}
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

          {/* Page numbers */}
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
      )}
    </div>
  );
};

// Mask helpers for privacy
const maskEmail = (email = "") => {
  const [local, domain] = String(email).split("@");
  if (!domain) return "-";
  return `${local.charAt(0)}***@${domain}`;
};

const maskPhone = (phone = "") => {
  const p = String(phone);
  if (!p || p.length < 4) return "***";
  return `${"*".repeat(p.length - 3)}${p.slice(-3)}`;
};

export default RecruiterAllCandidates;
