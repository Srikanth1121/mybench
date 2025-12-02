import React, { useState } from "react";

// Components
import SidebarFiltersIN from "./SidebarFiltersIN";
import SearchBar from "./SearchBar";
import CandidateList from "./CandidateList";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import { parseBooleanQuery } from "./booleanParser";
import { runCandidateSearch } from "./candidateSearchService";

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
            onView={(candidate) => console.log("Viewing:", candidate)}
            onUnlock={(candidate) => console.log("Unlocking:", candidate)}
          />
        )}
      </div>
    </div>
  );
}
