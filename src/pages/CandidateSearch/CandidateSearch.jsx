import React, { useState } from "react";

// Components
import SidebarFiltersIN from "./SidebarFiltersIN";
import SearchBar from "./SearchBar";
import CandidateList from "./CandidateList";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import { parseBooleanQuery } from "./booleanParser";
import { runCandidateSearch } from "./candidateSearchService";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getAuth } from "firebase/auth";
import CandidateTable from "./CandidateTable";
import { serverTimestamp } from "firebase/firestore";

export default function CandidateSearch() {
  // Boolean Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Filters (India)
  const [filters, setFilters] = useState({
  country: "India",
  state: "",
  minExp: "",
  maxExp: "",
  workMode: "",
  availability: "",
  gender: "",
  source: "all",   // ⭐ NEW
});


  // Loading state & results
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 10; // fixed page size
// Pagination Logic
const indexOfLast = currentPage * candidatesPerPage;
const indexOfFirst = indexOfLast - candidatesPerPage;
const paginatedCandidates = candidates.slice(indexOfFirst, indexOfLast);


  // ---- Actions ----

  async function runSearch() {
  setLoading(true);

  const results = await runCandidateSearch(searchQuery, filters);

  setCandidates(results);
  console.log("SEARCH RESULTS >>>", results);

setCurrentPage(1); // reset to page 1 on each new search

  setLoading(false);
}


  function clearAll() {
    setSearchQuery("");
    setFilters({
      country: "India",
      state: "",
      minExp: "",
      maxExp: "",
      workMode: "",
      availability: "",
      gender: "",
      source: "all",
    });
    setCandidates([]);
  }
const [unlocked, setUnlocked] = useState(null); // null = loading state

// Check if candidate is already unlocked by this recruiter
React.useEffect(() => {
  async function checkUnlockStatus() {
    if (!selectedCandidate) {
      setUnlocked(false);
      return;
    }

    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setUnlocked(false);
      return;
    }

    try {
      const unlockRef = doc(db, "users", uid, "unlockedCandidates", selectedCandidate.id);
      const snap = await getDoc(unlockRef);

      if (!snap.exists()) {
        setUnlocked(false);
        return;
      }

      const data = snap.data() || {};
      // unlockedAt might be a Firestore Timestamp, a Date, or a string/number
      let unlockedAt = data.unlockedAt;

      if (!unlockedAt) {
        // defensive: treat missing timestamp as expired
        setUnlocked(false);
        return;
      }

      // convert Firestore Timestamp to JS Date if needed
      if (typeof unlockedAt.toDate === "function") {
        unlockedAt = unlockedAt.toDate();
      } else if (typeof unlockedAt === "number" || typeof unlockedAt === "string") {
        unlockedAt = new Date(unlockedAt);
      } else if (!(unlockedAt instanceof Date)) {
        // fallback — consider as expired
        setUnlocked(false);
        return;
      }

      const now = new Date();
      const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (now - unlockedAt > ONE_MONTH_MS) {
        // EXPIRED
        setUnlocked(false);

        // OPTIONAL: mark or remove expired record to keep DB tidy
        // await updateDoc(unlockRef, { expired: true });
        // OR to delete:
        // await deleteDoc(unlockRef);
        return;
      }

      // STILL VALID
      setUnlocked(true);
    } catch (err) {
      console.error("checkUnlockStatus error:", err);
      setUnlocked(false);
    }
  }

  checkUnlockStatus();
}, [selectedCandidate]);

async function handleUnlock() {
  if (unlocked) return;  // 🚫 STOP double credit deduction

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) return;

  // Recruiter document
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  const credits = userSnap.data().credits || 0;

  if (credits < 10) {
    alert("Not enough credits to unlock contact.");
    return;
  }

  // Deduct credits
  await updateDoc(userRef, {
    credits: credits - 10
  });

  // Save unlocked candidate
  const unlockRef = doc(db, "users", uid, "unlockedCandidates", selectedCandidate.id);

  const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);

await setDoc(unlockRef, {
  unlockedAt: serverTimestamp(),
  expiresAt,
  candidateId: selectedCandidate.id,
});


  setUnlocked(true);
}

  return (
    <div className="flex gap-6 p-4">
      
      {/* LEFT: Sidebar Filters */}
      <div className="w-72 shrink-0">
        <SidebarFiltersIN 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      </div>

      {/* RIGHT: Search + Results */}
      <div className="flex-1">

       <SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={runSearch}
  onClear={clearAll}
  filters={filters}
  onFiltersChange={setFilters}
/>


        {/* Show Loading → Empty → Results */}
        {loading ? (
          <LoadingSkeleton />
        ) : candidates.length === 0 ? (
          <EmptyState onClear={clearAll} />
    ) : (
  <>
    {/* Pagination */}
    <div className="flex justify-end items-center mb-3 gap-3 pr-4">

      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm text-gray-700">
        Page {currentPage} of {Math.ceil(candidates.length / candidatesPerPage)}
      </span>

      <button
        onClick={() =>
          setCurrentPage((p) =>
            Math.min(Math.ceil(candidates.length / candidatesPerPage), p + 1)
          )
        }
        disabled={currentPage === Math.ceil(candidates.length / candidatesPerPage)}
        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
      >
        Next
      </button>

    </div>

    <CandidateTable candidates={paginatedCandidates} />
  </>
)}

      </div>
      {/* Candidate Profile Drawer */}
{drawerOpen && selectedCandidate && (
  <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-end z-50">

    {/* Drawer Panel */}
    <div className="w-[450px] bg-white h-full shadow-xl p-6 overflow-y-auto">
      
      {/* Close Button */}
      <button
        onClick={() => setDrawerOpen(false)}
        className="text-gray-500 hover:text-black text-sm mb-4"
      >
        Close ✕
      </button>

      {/* Candidate Name */}
      <h2 className="text-2xl font-semibold text-gray-900">
        {selectedCandidate.fullName}
      </h2>

      {/* Job / Experience / Location placeholders */}
      <p className="text-sm text-gray-600 mt-1">
        {selectedCandidate.experience} yrs experience
      </p>

      <p className="text-sm text-gray-600">
        {selectedCandidate.city}, {selectedCandidate.state}
      </p>

      <hr className="my-4" />

    {/* --- Skills Section --- */}
<div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>

  {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {selectedCandidate.skills.map((skill, i) => (
        <span
          key={i}
          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
        >
          {skill}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-gray-500">No skills provided</p>
  )}
</div>


{/* --- Employment Details --- */}
<div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Employment Details</h3>

  <p className="text-sm text-gray-700">
    <strong>Current CTC:</strong> ₹{selectedCandidate.currentCTC}
  </p>

  <p className="text-sm text-gray-700">
    <strong>CTC Type:</strong> {selectedCandidate.currentCTCType}
  </p>

  <p className="text-sm text-gray-700">
    <strong>Notice Period:</strong> {selectedCandidate.noticePeriod || "Not provided"}
  </p>
</div>


{/* --- Contact Details (LOCKED) --- */}
<div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Details</h3>

  {/* Phone */}
 <p className="text-sm text-gray-700">
  <strong>Phone:</strong>{" "}
 {unlocked === null ? (
  <span className="text-gray-400 text-xs">Checking access...</span>
) : unlocked === true ? (
  <span>{selectedCandidate.mobile || "Not Provided"}</span>
) : (
  <span className="blur-sm select-none">**********</span>
)}


</p>


  {/* Email */}
  <p className="text-sm text-gray-700 mt-1">
  <strong>Email:</strong>{" "}
  {unlocked === null ? (
  <span className="text-gray-400 text-xs">Checking...</span>
) : unlocked === true ? (
  <span>{selectedCandidate.email || "Not Provided"}</span>
) : (
  <span className="blur-sm select-none">********@*******.com</span>
)}

</p>

{/* --- Resume Section (Locked/Unlocked) --- */}
<div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume</h3>

  {unlocked === null ? (
  <p className="text-gray-400 text-xs">Checking access...</p>
) : unlocked === true ? (
  <a
    href={selectedCandidate.resumeURL}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
  >
    Download Resume
  </a>
) : (
  <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
    <p className="text-sm text-gray-500 blur-sm select-none">
      Resume is locked. Unlock to view/download.
    </p>
    <button
      onClick={handleUnlock}
      className="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
    >
      Unlock Contact & Resume (10 Credits)
    </button>
  </div>
)}

</div>

  {/* Unlock Button */}
 <button
  onClick={unlocked === false ? handleUnlock : null}
  disabled={unlocked !== false}
  className={`mt-4 px-4 py-2 rounded-lg text-sm transition
    ${
      unlocked === true
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : unlocked === null
        ? "bg-gray-200 text-gray-500 cursor-wait"
        : "bg-indigo-600 text-white hover:bg-indigo-700"
    }
  `}
>
  {unlocked === true
    ? "Contact Unlocked"
    : unlocked === null
    ? "Checking..."
    : "Unlock Contact (10 Credits)"}
</button>



</div>


    </div>
  </div>
)}

    </div>
    
  );
}
