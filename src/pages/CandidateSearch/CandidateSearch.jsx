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

  // ---- Actions ----

  async function runSearch() {
  setLoading(true);

  const results = await runCandidateSearch(searchQuery, filters);

  setCandidates(results);
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
const [unlocked, setUnlocked] = useState(false);
// Check if candidate is already unlocked by this recruiter
React.useEffect(() => {
  async function checkUnlockStatus() {
    if (!selectedCandidate) return;

    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unlockRef = doc(db, "users", uid, "unlockedCandidates", selectedCandidate.id);
    const snap = await getDoc(unlockRef);

    if (snap.exists()) {
      setUnlocked(true);
    } else {
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

  await setDoc(unlockRef, {
    unlockedAt: new Date(),
    candidateId: selectedCandidate.id
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
          <CandidateList
  candidates={candidates}
  onView={(candidate) => {
    setSelectedCandidate(candidate);
    setDrawerOpen(true);
  }}
  onUnlock={(candidate) => console.log("Unlocking:", candidate)}
/>

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
  {unlocked ? (
  <span>{selectedCandidate.mobile || "Not Provided"}</span>
) : (
  <span className="blur-sm select-none">**********</span>
)}

</p>


  {/* Email */}
  <p className="text-sm text-gray-700 mt-1">
  <strong>Email:</strong>{" "}
  {unlocked ? (
    <span>{selectedCandidate.email || "Not Provided"}</span>
  ) : (
    <span className="blur-sm select-none">********@*******.com</span>
  )}
</p>

{/* --- Resume Section (Locked/Unlocked) --- */}
<div className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume</h3>

  {unlocked ? (
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
  onClick={!unlocked ? handleUnlock : null}
  disabled={unlocked}
  className={`mt-4 px-4 py-2 rounded-lg text-sm transition
    ${unlocked ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}
  `}
>
  {unlocked ? "Contact Unlocked" : "Unlock Contact (10 Credits)"}
</button>


</div>


    </div>
  </div>
)}

    </div>
    
  );
}
