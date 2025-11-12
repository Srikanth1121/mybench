import React, { useEffect, useState, useRef } from "react";

import { db } from "../../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
// 🎞 Smooth counter animation hook (no external libs)
function useAnimatedNumber(targetValue, duration = 600) {
  const [animatedValue, setAnimatedValue] = useState(targetValue);
  const frameRef = useRef();

  useEffect(() => {
    let startValue = animatedValue;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const newValue = Math.floor(
        startValue + (targetValue - startValue) * progress
      );
      setAnimatedValue(newValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue, duration]);

  return animatedValue;
}

// 🔒 Mask candidate name for public privacy
const maskName = (name = "") => {
  if (!name) return "-";

  // Split first + last names
  const parts = name.split(" ");
  return parts
    .map((part) => {
      if (part.length <= 2) return part; // skip very short names
      // Replace middle characters with *
      return part
        .split("")
        .map((ch, idx) =>
          idx === 0 || idx === part.length - 1 ? ch : idx % 2 === 0 ? "*" : ch
        )
        .join("");
    })
    .join(" ");
};

const PublicAllCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  // animated counter for the total count
const animatedCount = useAnimatedNumber(candidates.length, 600);


  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 10;

  // ✅ Step 1: Fetch all candidates (active + inactive)
  useEffect(() => {
    const q = query(collection(db, "candidates"), orderBy("createdAt", "desc"));

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
  }, []);

  // ✅ Pagination logic
  const indexOfLast = currentPage * candidatesPerPage;
  const indexOfFirst = indexOfLast - candidatesPerPage;
  const currentCandidates = candidates.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(candidates.length / candidatesPerPage);

  if (loading)
    return (
      <p className="text-gray-500 text-center py-6">Loading candidates...</p>
    );

  return (
  <div className="min-h-screen bg-[#f9fafc] py-10 px-10">
    {/* Header */}
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-semibold text-[#1b3a65] tracking-tight">
        MyBench Global Talent Directory
      </h1>
      <p className="text-sm text-[#5c6b80] mt-1">
        Discover verified candidates across India & USA — updated in real time.
      </p>

      <div className="mt-5 inline-flex items-center justify-center bg-[#eef4ff] border border-[#c8d7f0] rounded-full px-6 py-2 shadow-sm">
      <span className="text-[#1b3a65] font-medium text-base flex items-center justify-center gap-1">
  Total Candidates:
  <span className="relative h-[24px] w-[60px] overflow-hidden ml-2">
    <span
      key={animatedCount}
      className="absolute inset-0 flex items-center justify-center text-[#1b3a65] font-semibold text-lg transition-all duration-500 ease-out transform animate-slideUp"
    >
      {animatedCount.toLocaleString()}
    </span>
  </span>
</span>


      </div>
    </div>

    {/* Table */}
    <div className="w-full bg-white border border-[#dfe4ea] rounded-lg overflow-hidden shadow-sm">
      {currentCandidates.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-base">
          No candidates available.
        </div>
      ) : (
        <table className="w-full text-[14px] border-collapse">
          <thead className="bg-[#eef4ff] text-[#1b3a65]">
            <tr>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">#</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Full Name</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Status</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Experience</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Job Title</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">City</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">State</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Country</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Visa Type</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Recruiter</th>
              <th className="px-4 py-3 border-b border-[#dfe4ea] text-left font-semibold">Created At</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf1f4] text-[#2e3a4f]">
            {currentCandidates.map((cand, index) => (
              <tr
                key={cand.id}
                className="hover:bg-[#f3f8ff] transition-colors duration-150"
              >
                <td className="px-4 py-2 border-b border-[#edf1f4] text-[#6b7280]">
                  {(currentPage - 1) * candidatesPerPage + index + 1}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4] font-medium">
                  {maskName(cand.fullName || cand.name)}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  <span
                    className={`px-2 py-1 text-xs rounded-md font-semibold ${
                      cand.status === "Active"
                        ? "bg-[#e6f4ea] text-[#1e8449]"
                        : "bg-[#f5f5f5] text-[#777]"
                    }`}
                  >
                    {cand.status || "—"}
                  </span>
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.experience || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.jobTitle || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.city || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.state || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.country || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.visaType || "—"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4]">
                  {cand.recruiterName || "Independent Candidate"}
                </td>
                <td className="px-4 py-2 border-b border-[#edf1f4] text-[#666]">
                  {cand.createdAt?.toDate?.()?.toLocaleDateString?.() || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* Pagination */}
    {candidates.length > candidatesPerPage && (
      <div className="flex items-center justify-center gap-2 mt-10">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md border font-medium text-sm transition ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-[#1b3a65] border-gray-300 hover:bg-[#eef4ff]"
          }`}
        >
          ← Prev
        </button>

        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition ${
                currentPage === i + 1
                  ? "bg-[#1a73e8] text-white border-[#1a73e8]"
                  : "bg-white text-[#1b3a65] border-gray-300 hover:bg-[#eef4ff]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md border font-medium text-sm transition ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-[#1b3a65] border-gray-300 hover:bg-[#eef4ff]"
          }`}
        >
          Next →
        </button>
      </div>
    )}
  </div>
);

};

export default PublicAllCandidates;
