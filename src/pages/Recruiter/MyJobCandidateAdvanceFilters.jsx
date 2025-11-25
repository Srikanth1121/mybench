import React, { useEffect, useState } from "react";
import { visaOptions } from "../../constants/Data";
import { indiaStates, usaStates } from "../../constants/Data";
export default function MyJobCandidateAdvanceFilters({
  onApply = () => {},
  jobCountry = "IN",
}) {
  // Filter state (renamed resumeSearch -> skillsSearch)
  const [skillsSearch, setSkillsSearch] = useState("");
  const [expMin, setExpMin] = useState("");
  const [expMax, setExpMax] = useState("");
  const [notice, setNotice] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [expectedCtcType, setExpectedCtcType] = useState("");
const [visa, setVisa] = useState("");
  const [stateFilter, setStateFilter] = useState("");
// --- Smart Experience Logic ---
const handleExpMin = (value) => {
  // Allow empty
  if (value === "") {
    setExpMin("");
    return;
  }

  // Block negative or decimals
  const num = Number(value);
  if (num < 0) return;

  setExpMin(num);

  // Auto-correct expMax if smaller
  if (expMax !== "" && num > Number(expMax)) {
    setExpMax(num);
  }
};

const handleExpMax = (value) => {
  // Allow empty
  if (value === "") {
    setExpMax("");
    return;
  }

  const num = Number(value);
  if (num < 0) return;

  // Auto-correct expMin if needed
  if (expMin !== "" && num < Number(expMin)) {
    setExpMin(num);
  }

  setExpMax(num);
};

// ---- Format CTC/Rate (same as submit modal) ----
const formatNumber = (value, isUSA) => {
  if (!value) return "";
  let num = value.replace(/,/g, "").replace(/\D/g, "");

  if (!num) return "";

  if (isUSA) {
    // International format 123,456,789
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Indian format 12,34,567
  const last3 = num.slice(-3);
  const other = num.slice(0, -3);
  return other
    ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3
    : last3;
};
// Convert formatted number ("5,00,000" or "120,000") → plain number
const parseFormattedNumber = (value) => {
  if (!value) return null;
  return Number(value.replace(/,/g, ""));
};

  // build filters and send to parent
  const handleApply = () => {
  if (expMin !== "" && expMax !== "" && Number(expMin) > Number(expMax)) {
    setExpMax(expMin);
  }
const filters = {
      skillsSearch: skillsSearch.trim(),
      expMin: expMin === "" ? null : Number(expMin),
expMax: expMax === "" ? null : Number(expMax),
notice: notice || null,
      expectedCtc: expectedCtc ? parseFormattedNumber(expectedCtc) : null,
      expectedCtcType: expectedCtcType || null,
visa: jobCountry === "USA" ? (visa || null) : null,
stateFilter: stateFilter || null,
};
    onApply(filters);
  };

  const handleClear = () => {
    setSkillsSearch("");
    setExpMin("");
    setExpMax("");
    setNotice("");
   setExpectedCtc("");
   setExpectedCtcType("");
    setVisa("");
    setStateFilter("");
    onApply({}); // clear parent filters
  };

  // Sidebar markup (static)
  return (
     <div className="w-72 flex-shrink-0 bg-white border-r border-slate-100 h-screen overflow-y-auto p-4">



      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
  Filters
  {/** Blue indicator when filters exist */}
  {Object.keys(onApply).length > 0 && (
    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
  )}
</h2>

        <p className="text-xs text-slate-500 mt-1">Narrow down bench & direct candidates</p>
      </div>

      {/* Skills Search */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600">Skills Search</label>
        <input
          type="text"
          value={skillsSearch}
          onChange={(e) => setSkillsSearch(e.target.value)}
          placeholder="e.g. React, Node, AWS"
          className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <p className="text-xs text-slate-400 mt-1">Multi-keyword, case-insensitive.</p>
      </div>

{/* State (Auto India/USA based) */}
<div className="mb-4">
  <label className="text-xs font-medium text-slate-600">State</label>
  <select
    value={stateFilter}
    onChange={(e) => setStateFilter(e.target.value)}
    className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
  >
    <option value="">Any</option>

    {(jobCountry === "USA" ? usaStates : indiaStates).map((st) => (
      <option key={st} value={st}>{st}</option>
    ))}
  </select>
</div>

      {/* Experience */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600">Experience (years)</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
         <input
  type="number"
  min="0"
  value={expMin}
  onChange={(e) => handleExpMin(e.target.value)}
  placeholder="Min"
  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
/>

<input
  type="number"
  min="0"
  value={expMax}
  onChange={(e) => handleExpMax(e.target.value)}
  placeholder="Max"
  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
/>

        </div>
      </div>

      {/* Notice Period */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600">Notice period</label>
        <select
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Any</option>
        <option value="Immediate">Immediate</option>
<option value="0-15 Days">0–15 Days</option>
<option value="15-30 Days">15–30 Days</option>
<option value="30-60 Days">30–60 Days</option>
<option value="60-90 Days">60–90 Days</option>
<option value="90+ Days">90+ Days</option>

        </select>
      </div>
{/* Expected CTC / Rate (single field) */}
<div className="mb-4">
  <label className="text-xs font-medium text-slate-600">
    {jobCountry === "USA" ? "Expected Rate ($)" : "Expected CTC (₹)"}
  </label>

  <input
    type="text"
    value={expectedCtc}
    onChange={(e) =>
      setExpectedCtc(formatNumber(e.target.value, jobCountry === "USA"))
    }
    placeholder={jobCountry === "USA" ? "e.g. 70 or 120,000" : "e.g. 5,00,000"}
    className="mt-1 block w-full px-3 py-2 border rounded-md text-sm 
      focus:outline-none focus:ring-2 focus:ring-indigo-300"
  />
  {/* Expected CTC Type */}
<select
  value={expectedCtcType}
  onChange={(e) => setExpectedCtcType(e.target.value)}
  className="mt-2 block w-full px-3 py-2 border rounded-md text-sm
    focus:outline-none focus:ring-2 focus:ring-indigo-300"
>
  {jobCountry === "USA" ? (
    <>
      <option value="">Any Type</option>
      <option value="Per Hour">Per Hour</option>
      <option value="Per Annum">Per Annum</option>
    </>
  ) : (
    <>
      <option value="">Any Type</option>
      <option value="Per Month">Per Month</option>
      <option value="Per Annum">Per Annum</option>
    </>
  )}
</select>

</div>
{/* Visa (only for USA) */}
      {jobCountry === "USA" && (
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600">Visa</label>
          <select
            value={visa}
            onChange={(e) => setVisa(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {visaOptions.map((v) => (
  <option key={v} value={v}>{v}</option>
))}

          </select>
        </div>
      )}

      {/* Footer buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-2 border rounded-md text-sm text-slate-700 bg-white hover:bg-gray-50"
        >
          Reset
        </button>

        <button
          onClick={handleApply}
          className="flex-1 px-3 py-2 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Apply
        </button>
      </div>
     </div>
  );
}
